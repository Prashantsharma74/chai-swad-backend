const axios = require('axios')
const twilio = require('twilio')
const {
  getWhatsAppConfig,
  isWhatsAppConfigured,
  TWILIO_DEMO_APPOINTMENT_CONTENT_SID
} = require('../config/whatsapp')
const { formatInr } = require('../utils/money')
const logger = require('../utils/logger')

function buildOrderMessage(order) {
  const itemLines = order.items.map(
    (item) => `${item.quantity} × ${item.name}  ₹${formatInr(item.total)}`
  )
  const table = order.tableNumber ? String(order.tableNumber) : '—'

  return [
    '🔔 NEW ORDER — CHAI SWAD',
    '',
    `Order No: #${order.orderNumber}`,
    '',
    'Customer:',
    order.customer.name,
    '',
    'Phone:',
    order.customer.phone,
    '',
    'Address:',
    order.customer.address,
    '',
    'Table:',
    table,
    '',
    'ORDER DETAILS',
    '-------------------------',
    ...itemLines,
    '-------------------------',
    '',
    `Subtotal: ₹${formatInr(order.subtotal)}`,
    ...(order.tax > 0 ? [`Tax: ₹${formatInr(order.tax)}`, ''] : ['']),
    `TOTAL PAID: ₹${formatInr(order.total)}`,
    '',
    'Payment: ONLINE ✓',
    '',
    'Status: ORDER RECEIVED'
  ].join('\n')
}

function compactItems(order) {
  return order.items.map((item) => `${item.quantity}x ${item.name}`).join(', ')
}

function sanitizeTemplateValue(value, maxLen = 120) {
  return String(value || '')
    .replace(/[\n\r\t]+/g, ' ')
    .replace(/ {2,}/g, ' ')
    .trim()
    .slice(0, maxLen)
}

/**
 * Twilio sandbox "Order Notifications" template:
 * Your {{1}} order of {{2}} has shipped and should be delivered on {{3}}. Details: {{4}}
 */
function buildOrderTemplateVariables(order) {
  const details = [
    `#${order.orderNumber}`,
    order.customer.name,
    order.customer.phone,
    `₹${formatInr(order.total)}`,
    sanitizeTemplateValue(order.customer.address, 60)
  ].join(' | ')

  return {
    1: sanitizeTemplateValue('Chai Swad', 40),
    2: sanitizeTemplateValue(compactItems(order), 80),
    3: sanitizeTemplateValue('ASAP', 40),
    4: sanitizeTemplateValue(details, 120)
  }
}

/** Twilio "Verification" style: Your {{1}} code is {{2}} */
function buildVerificationTemplateVariables(order) {
  return {
    1: sanitizeTemplateValue('Chai Swad order', 40),
    2: sanitizeTemplateValue(
      `#${order.orderNumber} ${compactItems(order)} ₹${formatInr(order.total)} ${order.customer.name} ${order.customer.phone}`,
      120
    )
  }
}

/** Legacy 2-slot mapping (appointment-shaped templates). */
function buildAppointmentSlotVariables(order) {
  const slot1 = [
    `NEW ORDER #${order.orderNumber}`,
    order.customer.name,
    order.customer.phone
  ].join(' | ')

  const slot2 = [
    compactItems(order),
    `Total ₹${formatInr(order.total)}`,
    sanitizeTemplateValue(order.customer.address, 80)
  ]
    .filter(Boolean)
    .join(' | ')

  return {
    1: sanitizeTemplateValue(slot1, 160),
    2: sanitizeTemplateValue(slot2, 160)
  }
}

function buildTwilioContentVariables(order, templateKind) {
  switch (templateKind) {
    case 'order':
      return buildOrderTemplateVariables(order)
    case 'verification':
      return buildVerificationTemplateVariables(order)
    case 'appointment':
    default:
      return buildAppointmentSlotVariables(order)
  }
}

function toWhatsAppAddress(number) {
  const raw = String(number).trim()
  if (raw.startsWith('whatsapp:')) return raw
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return `whatsapp:+${digits}`
}

function assertTwilioTemplateConfig(config) {
  if (!config.twilioContentSid) {
    throw new Error(
      'Set TWILIO_WHATSAPP_ORDER_CONTENT_SID from Twilio Console → Try WhatsApp → Order notification (copy ContentSid from the API snippet).'
    )
  }

  if (config.twilioUsesDemoAppointmentTemplate) {
    throw new Error(
      'TWILIO_WHATSAPP_CONTENT_SID is the Twilio demo appointment template (HXfe5ab5…). It always sends "Reminder: Appt Tue Oct 29…". Use TWILIO_WHATSAPP_ORDER_CONTENT_SID from Order notification instead.'
    )
  }
}

async function sendViaMeta(config, body) {
  const to = String(config.businessNumber).replace(/\D/g, '')
  const url = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}/messages`

  try {
    await axios.post(
      url,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to,
        type: 'text',
        text: {
          preview_url: false,
          body
        }
      },
      {
        headers: {
          Authorization: `Bearer ${config.accessToken}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )
  } catch (err) {
    const apiMessage = err.response?.data?.error?.message
    throw new Error(apiMessage || err.message || 'WhatsApp request failed')
  }
}

async function sendViaTwilio(config, order, body) {
  assertTwilioTemplateConfig(config)

  const client = twilio(config.twilioAccountSid, config.twilioAuthToken)
  const to = toWhatsAppAddress(config.businessNumber)

  if (!to) {
    throw new Error('WhatsApp business number is not configured')
  }

  const templateKind = config.twilioOrderContentSid ? 'order' : config.twilioTemplate
  const contentVariables = buildTwilioContentVariables(order, templateKind)

  const payload = {
    from: config.twilioFrom,
    to,
    contentSid: config.twilioContentSid,
    contentVariables: JSON.stringify(contentVariables)
  }

  logger.info('Twilio WhatsApp send', {
    template: templateKind,
    contentSid: config.twilioContentSid,
    variables: contentVariables
  })

  try {
    await client.messages.create(payload)
  } catch (err) {
    throw new Error(err.message || 'Twilio WhatsApp request failed')
  }
}

async function sendOrderNotification(order) {
  const config = getWhatsAppConfig()

  if (!isWhatsAppConfigured(config)) {
    throw new Error('WhatsApp is not configured')
  }

  const body = buildOrderMessage(order)

  if (config.provider === 'twilio') {
    await sendViaTwilio(config, order, body)
    return
  }

  await sendViaMeta(config, body)
}

module.exports = {
  sendOrderNotification,
  buildOrderMessage,
  buildTwilioContentVariables,
  buildOrderTemplateVariables,
  TWILIO_DEMO_APPOINTMENT_CONTENT_SID
}
