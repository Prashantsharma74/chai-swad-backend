const express = require('express')
const helmet = require('helmet')
const morgan = require('morgan')
const mongoSanitize = require('express-mongo-sanitize')
require('dotenv').config()

const { buildCors } = require('./config/cors')
const { apiLimiter } = require('./middleware/rateLimiter')
const { notFound, errorHandler } = require('./middleware/errorHandler')
const menuRoutes = require('./routes/menuRoutes')
const orderRoutes = require('./routes/orderRoutes')
const paymentRoutes = require('./routes/paymentRoutes')
const contactRoutes = require('./routes/contactRoutes')
const logger = require('./utils/logger')
const { getEmailStatus, isResendReady } = require('./config/email')

const app = express()

app.disable('x-powered-by')
app.set('trust proxy', 1)
app.use(helmet())
app.use(buildCors())
app.use(express.json({ limit: '100kb' }))
app.use(mongoSanitize())

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'))
}

app.use('/api', apiLimiter)

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Chai Swad API is running',
    notifications: getEmailStatus()
  })
})

if (process.env.NODE_ENV !== 'test' && isResendReady() && !getEmailStatus().cafeNotifyConfigured) {
  logger.warn(
    'ORDER_NOTIFY_EMAIL is not set — you will not receive cafe order alerts. Set ORDER_NOTIFY_EMAIL=prashantsharma7470@gmail.com on Render.'
  )
}

app.use('/api/menu', menuRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payment', paymentRoutes)
app.use('/api/contact', contactRoutes)

app.use(notFound)
app.use(errorHandler)

module.exports = app

if (require.main === module) {
  const { connectDB } = require('./config/database')
  const logger = require('./utils/logger')
  const port = Number(process.env.PORT) || 5000

  connectDB()
    .then(() => {
      app.listen(port, () => {
        logger.info('Chai Swad API started', { port })
      })
    })
    .catch((err) => {
      logger.error('Database connection failed', { message: err.message })
      process.exit(1)
    })
}
