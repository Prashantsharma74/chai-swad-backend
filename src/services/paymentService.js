const crypto = require('crypto')
const Order = require('../models/Order')
const AppError = require('../utils/appError')
const logger = require('../utils/logger')
const { toPaise } = require('../utils/money')
const { generateOrderNumber } = require('../utils/orderNumber')
const { getRazorpay } = require('../config/razorpay')
const { calculateCart, toPublicOrder } = require('./orderService')
const { assertWithinDeliveryRadius } = require('./deliveryService')
const { sendOrderNotification } = require('./whatsappService')

function verifyRazorpaySignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) return false

  const expected = crypto
    .createHmac('sha256', secret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  const expectedBuffer = Buffer.from(expected, 'utf8')
  const providedBuffer = Buffer.from(String(razorpaySignature), 'utf8')

  if (expectedBuffer.length !== providedBuffer.length) return false
  return crypto.timingSafeEqual(expectedBuffer, providedBuffer)
}

async function createPaymentOrder(input) {
  logger.info('Order creation started', { itemCount: input.items.length })
  await assertWithinDeliveryRadius(input.customer.address, input.location)
  const priced = await calculateCart(input.items)

  if (priced.total <= 0) {
    throw new AppError('Unable to create payment order', 400)
  }

  const razorpay = getRazorpay()
  let razorpayOrder

  try {
    razorpayOrder = await razorpay.orders.create({
      amount: toPaise(priced.total),
      currency: 'INR',
      receipt: `cs${Date.now()}`.slice(0, 40),
      payment_capture: 1,
      notes: {
        cafe: 'Chai Swad',
        table: input.tableNumber ? String(input.tableNumber) : ''
      }
    })
  } catch (err) {
    logger.error('Razorpay order creation failed', { message: err.message })
    throw new AppError('Unable to create payment order', 502)
  }

  if (!razorpayOrder?.id) {
    throw new AppError('Unable to create payment order', 502)
  }

  await Order.create({
    customer: {
      name: input.customer.name,
      phone: input.customer.phone,
      address: input.customer.address
    },
    tableNumber: input.tableNumber,
    items: priced.items,
    subtotal: priced.subtotal,
    tax: priced.tax,
    total: priced.total,
    payment: {
      provider: 'razorpay',
      razorpayOrderId: razorpayOrder.id,
      status: 'PENDING'
    },
    whatsappNotification: { sent: false, error: '' }
  })

  logger.info('Payment order created', {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount
  })

  return {
    razorpayOrderId: razorpayOrder.id,
    amount: razorpayOrder.amount,
    currency: razorpayOrder.currency || 'INR',
    keyId: process.env.RAZORPAY_KEY_ID
  }
}

async function notifyCafe(order) {
  try {
    await sendOrderNotification(order)
    order.whatsappNotification = {
      sent: true,
      sentAt: new Date(),
      error: ''
    }
    logger.info('WhatsApp notification sent', { orderNumber: order.orderNumber })
  } catch (err) {
    const safeMessage = String(err.message || 'WhatsApp notification failed').slice(0, 300)
    order.whatsappNotification = {
      sent: false,
      error: safeMessage
    }
    logger.error('WhatsApp notification failed', {
      orderNumber: order.orderNumber,
      error: safeMessage
    })
  }

  await order.save()
}

async function confirmPendingOrder(razorpayOrderId, razorpayPaymentId) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const orderNumber = await generateOrderNumber()

    try {
      const confirmed = await Order.findOneAndUpdate(
        { 'payment.razorpayOrderId': razorpayOrderId, 'payment.status': 'PENDING' },
        {
          $set: {
            orderNumber,
            orderStatus: 'RECEIVED',
            'payment.status': 'PAID',
            'payment.razorpayPaymentId': razorpayPaymentId,
            'payment.provider': 'razorpay'
          }
        },
        { new: true }
      )

      return confirmed
    } catch (err) {
      if (err.code === 11000 && String(err.message).includes('orderNumber')) {
        continue
      }
      throw err
    }
  }

  throw new AppError('Unable to confirm order', 500)
}

async function verifyPayment(payload) {
  const razorpayOrderId = payload.razorpay_order_id
  const razorpayPaymentId = payload.razorpay_payment_id
  const signatureIsValid = verifyRazorpaySignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: payload.razorpay_signature
  })

  if (!signatureIsValid) {
    await Order.updateOne(
      { 'payment.razorpayOrderId': razorpayOrderId, 'payment.status': 'PENDING' },
      { $set: { 'payment.status': 'FAILED' } }
    )
    throw new AppError('Payment verification failed', 400)
  }

  const alreadyPaid = await Order.findOne({
    'payment.razorpayOrderId': razorpayOrderId,
    'payment.status': 'PAID'
  })

  if (alreadyPaid) {
    logger.info('Payment verification successful', {
      orderNumber: alreadyPaid.orderNumber,
      duplicate: true
    })
    return toPublicOrder(alreadyPaid)
  }

  const confirmed = await confirmPendingOrder(razorpayOrderId, razorpayPaymentId)

  if (!confirmed) {
    const paidNow = await Order.findOne({
      'payment.razorpayOrderId': razorpayOrderId,
      'payment.status': 'PAID'
    })

    if (paidNow) {
      logger.info('Payment verification successful', {
        orderNumber: paidNow.orderNumber,
        duplicate: true
      })
      return toPublicOrder(paidNow)
    }

    throw new AppError('Payment order not found', 404)
  }

  logger.info('Payment verification successful', { orderNumber: confirmed.orderNumber })
  logger.info('Order confirmed', { orderNumber: confirmed.orderNumber })
  await notifyCafe(confirmed)
  return toPublicOrder(confirmed)
}

module.exports = { createPaymentOrder, verifyPayment, verifyRazorpaySignature }
