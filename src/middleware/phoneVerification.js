const AppError = require('../utils/appError')

// Phone history is open for the MVP. When OTP is ready, set
// REQUIRE_ORDER_HISTORY_OTP=true and replace this middleware with
// verification of a short-lived phone token before returning orders.
function preparePhoneVerification(req, res, next) {
  if (process.env.REQUIRE_ORDER_HISTORY_OTP === 'true') {
    next(new AppError('Phone verification is required before viewing order history', 401))
    return
  }

  next()
}

module.exports = { preparePhoneVerification }
