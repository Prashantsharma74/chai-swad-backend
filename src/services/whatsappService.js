const axios = require('axios')
const { getWhatsAppConfig } = require('../config/whatsapp')
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

async function sendOrderNotification(order) {
  const config = getWhatsAppConfig()

  if (!config.accessToken || !config.phoneNumberId || !config.businessNumber) {
    throw new Error('WhatsApp is not configured')
  }

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
          body: buildOrderMessage(order)
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

module.exports = { sendOrderNotification, buildOrderMessage }
