const { Resend } = require('resend')
const { getEmailConfig, isEmailConfigured } = require('../config/email')
const { buildOrderMessage } = require('./orderNotificationMessage')
const { buildOrderEmailHtml } = require('./orderEmailTemplate')
const logger = require('../utils/logger')

async function sendOrderEmail(order) {
  const config = getEmailConfig()

  logger.info('sendOrderEmail', {
    orderNumber: order.orderNumber,
    configured: isEmailConfigured(config),
    provider: 'resend',
    notifyTo: config.notifyTo || '',
    from: config.from || ''
  })

  if (!isEmailConfigured(config)) {
    throw new Error(
      'Email is not configured. Set RESEND_API_KEY, RESEND_FROM, and ORDER_NOTIFY_EMAIL (or CAFE_EMAIL).'
    )
  }

  const cafeName = process.env.CAFE_NAME || 'Chai Swad'
  const text = buildOrderMessage(order, cafeName)
  const html = buildOrderEmailHtml(order, cafeName)
  const resend = new Resend(config.resendApiKey)

  try {
    const { error } = await resend.emails.send({
      from: config.from,
      to: [config.notifyTo],
      subject: `New order #${order.orderNumber} — ${cafeName}`,
      text,
      html
    })

    if (error) {
      throw new Error(error.message || 'Resend rejected the email')
    }
  } catch (err) {
    throw new Error(err.message || 'Email send failed')
  }

  logger.info('sendOrderEmail: message sent', { orderNumber: order.orderNumber })
}

module.exports = { sendOrderEmail, buildOrderMessage }
