const cors = require('cors')
const AppError = require('../utils/appError')

function buildCors() {
  const frontendUrl = process.env.FRONTEND_URL
  const isProduction = process.env.NODE_ENV === 'production'
  const allowed = new Set(
    [
      frontendUrl,
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:5174',
      'http://127.0.0.1:5174'
    ].filter(Boolean)
  )

  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true)
        return
      }

      if (isProduction) {
        if (frontendUrl && origin === frontendUrl) {
          callback(null, true)
          return
        }
        callback(new AppError('Not allowed by CORS', 403))
        return
      }

      if (allowed.has(origin)) {
        callback(null, true)
        return
      }

      callback(new AppError('Not allowed by CORS', 403))
    },
    methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'x-staff-key']
  })
}

module.exports = { buildCors }
