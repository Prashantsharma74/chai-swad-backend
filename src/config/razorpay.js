const Razorpay = require('razorpay')
const AppError = require('../utils/appError')

function getRazorpay() {
  const keyId = process.env.RAZORPAY_KEY_ID
  const keySecret = process.env.RAZORPAY_KEY_SECRET

  if (!keyId || !keySecret) {
    throw new AppError('Payment service is not configured', 503)
  }

  return new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  })
}

module.exports = { getRazorpay }
