const asyncHandler = require('../utils/asyncHandler')
const { sendSuccess } = require('../utils/response')
const orderService = require('../services/orderService')

const calculate = asyncHandler(async (req, res) => {
  const order = await orderService.quoteOrder(req.body)
  sendSuccess(res, 'Order calculated successfully', { order })
})

const getById = asyncHandler(async (req, res) => {
  const order = await orderService.getPublicOrder(req.params.orderId)
  sendSuccess(res, 'Order fetched successfully', { order })
})

const byPhone = asyncHandler(async (req, res) => {
  const orders = await orderService.getOrdersByPhone(req.validatedQuery.phone)
  sendSuccess(res, 'Orders fetched successfully', { orders })
})

const updateStatus = asyncHandler(async (req, res) => {
  const order = await orderService.updateStatus(req.params.orderId, req.body.orderStatus)
  sendSuccess(res, 'Order status updated', { order })
})

module.exports = { calculate, getById, byPhone, updateStatus }
