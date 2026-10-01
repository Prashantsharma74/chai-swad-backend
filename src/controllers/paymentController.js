const asyncHandler = require('../utils/asyncHandler')
const { sendSuccess } = require('../utils/response')
const paymentService = require('../services/paymentService')

const create = asyncHandler(async (req, res) => {
  const payment = await paymentService.createPaymentOrder(req.body)
  sendSuccess(res, 'Payment order created', payment, 201)
})

const verify = asyncHandler(async (req, res) => {
  const order = await paymentService.verifyPayment(req.body)
  sendSuccess(res, 'Order confirmed successfully', { order })
})

module.exports = { create, verify }
