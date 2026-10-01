class AppError extends Error {
  constructor(message, statusCode = 500, publicError = null) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
    this.publicError = publicError
    this.isOperational = true
  }
}

module.exports = AppError
