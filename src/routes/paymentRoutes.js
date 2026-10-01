const express = require('express')
const paymentController = require('../controllers/paymentController')
const { validate, orderSchema, verifyPaymentSchema } = require('../middleware/validation')
const { paymentLimiter } = require('../middleware/rateLimiter')

const router = express.Router()

router.post('/create', paymentLimiter, validate(orderSchema), paymentController.create)
router.post('/verify', paymentLimiter, validate(verifyPaymentSchema), paymentController.verify)

module.exports = router
