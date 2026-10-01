const axios = require('axios')
const twilio = require('twilio')
const { getWhatsAppConfig, isWhatsAppConfigured } = require('../config/whatsapp')
const { formatInr } = require('../utils/money')

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

function toWhatsAppAddress(number) {
  const raw = String(number).trim()
  if (raw.startsWith('whatsapp:')) return raw
  const digits = raw.replace(/\D/g, '')
  if (!digits) return ''
  return `whatsapp:+${digits}`
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

async function sendViaTwilio(config, body) {
  const client = twilio(config.twilioAccountSid, config.twilioAuthToken)
  const to = toWhatsAppAddress(config.businessNumber)

  if (!to) {
    throw new Error('WhatsApp business number is not configured')
  }

  try {
    await client.messages.create({
      from: config.twilioFrom,
      to,
      body
    })
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
    await sendViaTwilio(config, body)
    return
  }

  await sendViaMeta(config, body)
}

module.exports = { sendOrderNotification, buildOrderMessage }
