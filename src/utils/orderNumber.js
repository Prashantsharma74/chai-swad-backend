const crypto = require('crypto')
const Order = require('../models/Order')
const AppError = require('./appError')

function todayKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(date)

  return parts.replace(/-/g, '')
}

async function generateOrderNumber() {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const suffix = crypto.randomInt(1000, 10000)
    const orderNumber = `CS-${todayKey()}-${suffix}`
    const exists = await Order.exists({ orderNumber })
    if (!exists) return orderNumber
  }

  throw new AppError('Unable to generate order number', 500)
}

module.exports = { generateOrderNumber, todayKey }
