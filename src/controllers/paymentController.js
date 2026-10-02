const asyncHandler = require('../utils/asyncHandler')
const logger = require('../utils/logger')
const { sendSuccess } = require('../utils/response')
const paymentService = require('../services/paymentService')

const create = asyncHandler(async (req, res) => {
  const payment = await paymentService.createPaymentOrder(req.body)
  sendSuccess(res, 'Payment order created', payment, 201)
})

const verify = asyncHandler(async (req, res) => {
  logger.info('POST /api/payment/verify started', {
    razorpayOrderId: req.body?.razorpay_order_id || '',
    hasPaymentId: Boolean(req.body?.razorpay_payment_id),
    hasSignature: Boolean(req.body?.razorpay_signature)
  })

  const order = await paymentService.verifyPayment(req.body)

  logger.info('POST /api/payment/verify completed', {
    orderNumber: order.orderNumber,
    orderId: order.id,
    paymentStatus: order.payment?.status
  })

  sendSuccess(res, 'Order confirmed successfully', { order })
})

module.exports = { create, verify }
