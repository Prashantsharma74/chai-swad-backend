const crypto = require('crypto')
const AppError = require('../utils/appError')

function hashesMatch(left, right) {
  const leftHash = crypto.createHash('sha256').update(String(left)).digest()
  const rightHash = crypto.createHash('sha256').update(String(right)).digest()
  return crypto.timingSafeEqual(leftHash, rightHash)
}

function staffAuth(req, res, next) {
  const configured = process.env.STAFF_API_KEY

  if (!configured) {
    next(new AppError('Order status updates are not enabled', 403))
    return
  }

  const provided = req.get('x-staff-key') || ''
  if (!provided || !hashesMatch(provided, configured)) {
    next(new AppError('Not authorized to update order status', 401))
    return
  }

  next()
}

module.exports = { staffAuth }
