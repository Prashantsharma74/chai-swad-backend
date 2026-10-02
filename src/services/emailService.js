const { Resend } = require('resend')
const {
  getEmailConfig,
  getCafeNotifyEmail,
  isEmailConfigured,
  isResendReady,
  normalizeEmail
} = require('../config/email')
const {
  buildCustomerOrderEmailHtml,
  buildCustomerOrderEmailText
} = require('./customerOrderEmailTemplate')
const { buildOrderMessage } = require('./orderNotificationMessage')
const { buildOrderEmailHtml } = require('./orderEmailTemplate')
const logger = require('../utils/logger')

async function deliverViaResend(config, payload) {
  const resend = new Resend(config.resendApiKey)
  const { data, error } = await resend.emails.send({
    from: config.from,
    ...payload
  })

  if (error) {
    const message = error.message || JSON.stringify(error)
    throw new Error(message)
  }

  return data
}

async function sendOrderEmail(order) {
  const config = getEmailConfig()
  const notifyTo = getCafeNotifyEmail(config)

  logger.info('sendOrderEmail', {
    orderNumber: order.orderNumber,
    configured: isEmailConfigured(config),
    provider: 'resend',
    notifyTo: notifyTo || '',
    from: config.from || ''
  })

  if (!isResendReady(config)) {
    throw new Error('Email is not configured. Set RESEND_API_KEY and RESEND_FROM.')
  }

  if (!notifyTo) {
    throw new Error(
      'Cafe notify email is not configured. Set ORDER_NOTIFY_EMAIL (e.g. prashantsharma7470@gmail.com) on the server.'
    )
  }

  const cafeName = process.env.CAFE_NAME || 'Chai Swad'
  const text = buildOrderMessage(order, cafeName)
  const html = buildOrderEmailHtml(order, cafeName)

  await deliverViaResend(config, {
    to: [notifyTo],
    subject: `New order #${order.orderNumber} — ${cafeName}`,
    text,
    html
  })

  logger.info('sendOrderEmail: message sent', { orderNumber: order.orderNumber, notifyTo })
}

async function sendCustomerOrderEmail(order) {
  const config = getEmailConfig()
  const to = normalizeEmail(order.customer?.email)
  const cafeTo = getCafeNotifyEmail(config)

  logger.info('sendCustomerOrderEmail', {
    orderNumber: order.orderNumber,
    configured: isResendReady(config),
    hasRecipient: Boolean(to)
  })

  if (!to) {
    throw new Error('Customer email is missing on this order')
  }

  if (!isResendReady(config)) {
    throw new Error('Email is not configured. Set RESEND_API_KEY and RESEND_FROM.')
  }

  const cafeName = process.env.CAFE_NAME || 'Chai Swad'
  const cc =
    cafeTo && cafeTo !== to ? [cafeTo] : undefined

  await deliverViaResend(config, {
    to: [to],
    ...(cc ? { cc } : {}),
    subject: `Order received #${order.orderNumber} — ${cafeName}`,
    text: buildCustomerOrderEmailText(order, cafeName),
    html: buildCustomerOrderEmailHtml(order, cafeName)
  })

  logger.info('sendCustomerOrderEmail: message sent', {
    orderNumber: order.orderNumber,
    to,
    ccCafe: Boolean(cc)
  })
}

module.exports = { sendOrderEmail, sendCustomerOrderEmail, buildOrderMessage }
