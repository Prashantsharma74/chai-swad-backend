const rateLimit = require('express-rate-limit')

function createLimiter({ windowMs, max }) {
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next()
  }

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests. Please try again later.',
      error: null
    }
  })
}

const apiLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 300 })
const orderLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 40 })
const paymentLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 20 })
const phoneLimiter = createLimiter({ windowMs: 15 * 60 * 1000, max: 15 })

module.exports = { apiLimiter, orderLimiter, paymentLimiter, phoneLimiter }
