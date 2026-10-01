const AppError = require('../utils/appError')
const logger = require('../utils/logger')

function notFound(req, res, next) {
  next(new AppError('Route not found', 404))
}

function containsSecret(text) {
  return /mongodb(\+srv)?:\/\//i.test(text)
    || /RAZORPAY_KEY_SECRET/i.test(text)
    || /WHATSAPP_ACCESS_TOKEN/i.test(text)
    || /access_token/i.test(text)
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    next(err)
    return
  }

  let statusCode = err.statusCode || err.status || 500
  let message = err.message || 'Something went wrong'
  let publicError = err.publicError ?? null

  if (err.type === 'entity.parse.failed') {
    statusCode = 400
    message = 'Invalid JSON body'
    publicError = null
  } else if (err.name === 'CastError') {
    statusCode = 400
    message = 'Invalid request'
    publicError = null
  } else if (err.name === 'ValidationError') {
    statusCode = 400
    message = 'Please check the submitted details'
    publicError = null
  } else if (err.code === 11000) {
    statusCode = 409
    message = 'Duplicate request'
    publicError = null
  }

  if (statusCode >= 500) {
    if (!err.isOperational) {
      logger.error('Unexpected server error', { message: err.message })
    }
    if (process.env.NODE_ENV === 'production' || containsSecret(message)) {
      message = 'Something went wrong'
    }
    publicError = null
  }

  res.status(statusCode).json({
    success: false,
    message,
    error: publicError
  })
}

module.exports = { notFound, errorHandler }
