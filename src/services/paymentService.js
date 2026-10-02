const crypto = require('crypto')
const Order = require('../models/Order')
const AppError = require('../utils/appError')
const logger = require('../utils/logger')
const { toPaise } = require('../utils/money')
const { generateOrderNumber } = require('../utils/orderNumber')
const { getRazorpay } = require('../config/razorpay')
const { calculateCart, toPublicOrder } = require('./orderService')
const { assertWithinDeliveryRadius } = require('./deliveryService')
const { sendOrderEmail, sendCustomerOrderEmail } = require('./emailService')
const { getEmailConfig, isEmailConfigured } = require('../config/email')

function emailConfigForLogs() {
  const config = getEmailConfig()
  return {
    configured: isEmailConfigured(config),
    channel: 'resend',
    notifyTo: config.notifyTo || '',
    from: config.from || ''
  }
}

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
      email: input.customer.email,
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
    whatsappNotification: { sent: false, error: '' },
    emailNotification: { sent: false, error: '' },
    customerEmailNotification: { sent: false, error: '' }
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
  logger.info('notifyCafe started', {
    orderNumber: order.orderNumber,
    orderId: String(order._id),
    ...emailConfigForLogs()
  })

  try {
    await sendOrderEmail(order)
    order.emailNotification = {
      sent: true,
      sentAt: new Date(),
      error: ''
    }
    logger.info('Email notification sent', { orderNumber: order.orderNumber })
  } catch (err) {
    const safeMessage = String(err.message || 'Email notification failed').slice(0, 300)
    order.emailNotification = {
      sent: false,
      error: safeMessage
    }
    logger.error('Email notification failed', {
      orderNumber: order.orderNumber,
      error: safeMessage
    })
  }

  try {
    await sendCustomerOrderEmail(order)
    order.customerEmailNotification = {
      sent: true,
      sentAt: new Date(),
      error: ''
    }
    logger.info('Customer order email sent', { orderNumber: order.orderNumber })
  } catch (err) {
    const safeMessage = String(err.message || 'Customer email failed').slice(0, 300)
    order.customerEmailNotification = {
      sent: false,
      error: safeMessage
    }
    logger.error('Customer order email failed', {
      orderNumber: order.orderNumber,
      error: safeMessage
    })
  }

  await order.save()

  logger.info('notifyCafe finished', {
    orderNumber: order.orderNumber,
    cafeEmailSent: Boolean(order.emailNotification?.sent),
    cafeEmailError: order.emailNotification?.error || '',
    customerEmailSent: Boolean(order.customerEmailNotification?.sent),
    customerEmailError: order.customerEmailNotification?.error || ''
  })
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

  logger.info('verifyPayment: checking Razorpay signature', { razorpayOrderId })

  const signatureIsValid = verifyRazorpaySignature({
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature: payload.razorpay_signature
  })

  if (!signatureIsValid) {
    logger.error('verifyPayment: invalid Razorpay signature', {
      razorpayOrderId,
      hasPaymentId: Boolean(razorpayPaymentId),
      hasSignature: Boolean(payload.razorpay_signature)
    })
    await Order.updateOne(
      { 'payment.razorpayOrderId': razorpayOrderId, 'payment.status': 'PENDING' },
      { $set: { 'payment.status': 'FAILED' } }
    )
    throw new AppError('Payment verification failed', 400)
  }

  logger.info('verifyPayment: signature valid', { razorpayOrderId })

  const alreadyPaid = await Order.findOne({
    'payment.razorpayOrderId': razorpayOrderId,
    'payment.status': 'PAID'
  })

  if (alreadyPaid) {
    logger.info('Payment verification successful', {
      orderNumber: alreadyPaid.orderNumber,
      duplicate: true,
      emailSkipped: true,
      priorEmailSent: Boolean(alreadyPaid.emailNotification?.sent),
      priorEmailError: alreadyPaid.emailNotification?.error || ''
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
        duplicate: true,
        emailSkipped: true
      })
      return toPublicOrder(paidNow)
    }

    logger.error('verifyPayment: pending order not found after confirm', { razorpayOrderId })
    throw new AppError('Payment order not found', 404)
  }

  logger.info('Payment verification successful', { orderNumber: confirmed.orderNumber })
  logger.info('Order confirmed', { orderNumber: confirmed.orderNumber })
  logger.info('verifyPayment: starting notifyCafe (email)', {
    orderNumber: confirmed.orderNumber,
    ...emailConfigForLogs()
  })
  await notifyCafe(confirmed)
  return toPublicOrder(confirmed)
}

module.exports = { createPaymentOrder, verifyPayment, verifyRazorpaySignature }
