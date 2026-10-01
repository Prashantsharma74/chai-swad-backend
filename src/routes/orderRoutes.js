const express = require('express')
const orderController = require('../controllers/orderController')
const { validate, orderSchema, phoneQuerySchema, statusSchema } = require('../middleware/validation')
const { orderLimiter, phoneLimiter } = require('../middleware/rateLimiter')
const { staffAuth } = require('../middleware/staffAuth')
const { preparePhoneVerification } = require('../middleware/phoneVerification')

const router = express.Router()

router.post('/', orderLimiter, validate(orderSchema), orderController.calculate)
router.get(
  '/by-phone',
  phoneLimiter,
  preparePhoneVerification,
  validate(phoneQuerySchema, 'query'),
  orderController.byPhone
)
router.get('/:orderId', orderController.getById)
router.patch('/:orderId/status', staffAuth, validate(statusSchema), orderController.updateStatus)

module.exports = router
