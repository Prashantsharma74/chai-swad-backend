const mongoose = require('mongoose')
const MenuItem = require('../models/MenuItem')
const Order = require('../models/Order')
const AppError = require('../utils/appError')
const logger = require('../utils/logger')
const { toMoney, getTaxPercent } = require('../utils/money')
const { assertWithinDeliveryRadius } = require('./deliveryService')

function mergeItems(items) {
  const merged = new Map()

  for (const item of items) {
    const key = String(item.menuItemId)
    merged.set(key, (merged.get(key) || 0) + item.quantity)
  }

  return [...merged.entries()].map(([menuItemId, quantity]) => ({ menuItemId, quantity }))
}

function toPublicOrderItem(item) {
  return {
    menuItemId: String(item.menuItemId),
    name: item.name,
    quantity: item.quantity,
    price: item.price,
    total: item.total
  }
}

function toPublicOrder(order) {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    customer: {
      name: order.customer.name,
      phone: order.customer.phone,
      address: order.customer.address
    },
    tableNumber: order.tableNumber ?? null,
    items: order.items.map(toPublicOrderItem),
    subtotal: order.subtotal,
    tax: order.tax,
    total: order.total,
    payment: {
      provider: order.payment.provider,
      status: order.payment.status
    },
    orderStatus: order.orderStatus,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  }
}

function toOrderSummary(order) {
  return {
    id: String(order._id),
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({
      name: item.name,
      quantity: item.quantity
    })),
    total: order.total,
    paymentStatus: order.payment.status,
    orderStatus: order.orderStatus,
    createdAt: order.createdAt
  }
}

async function calculateCart(rawItems) {
  const items = mergeItems(rawItems)

  for (const item of items) {
    if (item.quantity > 20) {
      throw new AppError('Quantity cannot exceed 20', 400)
    }
  }

  const menuItems = await MenuItem.find({
    _id: { $in: items.map((item) => item.menuItemId) }
  })
  const byId = new Map(menuItems.map((item) => [String(item._id), item]))
  const priced = []

  for (const item of items) {
    const menuItem = byId.get(String(item.menuItemId))

    if (!menuItem) {
      throw new AppError('One or more items are invalid', 400)
    }

    if (!menuItem.available) {
      throw new AppError(`${menuItem.name} is currently unavailable`, 400)
    }

    const price = menuItem.price
    priced.push({
      menuItemId: menuItem._id,
      name: menuItem.name,
      quantity: item.quantity,
      price,
      total: toMoney(price * item.quantity)
    })
  }

  const subtotal = toMoney(priced.reduce((sum, item) => sum + item.total, 0))
  const taxPercent = getTaxPercent()
  const tax = toMoney((subtotal * taxPercent) / 100)
  const total = toMoney(subtotal + tax)

  return { items: priced, subtotal, tax, total, taxPercent }
}

async function quoteOrder(input) {
  logger.info('Order creation started', { itemCount: input.items.length })
  await assertWithinDeliveryRadius(input.customer.address, input.location)
  const priced = await calculateCart(input.items)

  return {
    customer: {
      name: input.customer.name,
      phone: input.customer.phone,
      address: input.customer.address
    },
    tableNumber: input.tableNumber ?? null,
    items: priced.items.map(toPublicOrderItem),
    subtotal: priced.subtotal,
    tax: priced.tax,
    total: priced.total,
    taxPercent: priced.taxPercent,
    payment: { status: 'UNPAID' }
  }
}

async function getPublicOrder(orderId) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError('Order not found', 404)
  }

  const order = await Order.findOne({ _id: orderId, 'payment.status': 'PAID' })
  if (!order) {
    throw new AppError('Order not found', 404)
  }

  return toPublicOrder(order)
}

async function getOrdersByPhone(phone) {
  const orders = await Order.find({
    'customer.phone': phone,
    'payment.status': 'PAID'
  })
    .sort({ createdAt: -1 })
    .limit(50)

  return orders.map(toOrderSummary)
}

async function updateStatus(orderId, orderStatus) {
  if (!mongoose.isValidObjectId(orderId)) {
    throw new AppError('Order not found', 404)
  }

  const order = await Order.findById(orderId)
  if (!order || order.payment.status !== 'PAID') {
    throw new AppError('Order not found', 404)
  }

  order.orderStatus = orderStatus
  await order.save()
  logger.info('Order status updated', { orderNumber: order.orderNumber, orderStatus })
  return toPublicOrder(order)
}

module.exports = {
  calculateCart,
  quoteOrder,
  getPublicOrder,
  getOrdersByPhone,
  updateStatus,
  toPublicOrder
}
