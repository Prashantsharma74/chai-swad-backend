jest.mock('../src/services/emailService', () => ({
  sendOrderEmail: jest.fn().mockResolvedValue(undefined),
  sendCustomerOrderEmail: jest.fn().mockResolvedValue(undefined)
}))

jest.mock('razorpay', () => {
  const create = jest.fn()
  function Razorpay() {
    return { orders: { create } }
  }
  Razorpay.__create = create
  return Razorpay
})

const request = require('supertest')
const Razorpay = require('razorpay')
const { sendOrderEmail, sendCustomerOrderEmail } = require('../src/services/emailService')
const app = require('../src/server')
const MenuItem = require('../src/models/MenuItem')
const Order = require('../src/models/Order')
const { MENU_ITEMS } = require('../src/seed/menuSeed')
const { orderBody, signPayment } = require('./helpers')
const { todayKey } = require('../src/utils/orderNumber')

describe('Payments, email alerts, and confirmed orders', () => {
  let masala
  let coffee

  beforeEach(async () => {
    await MenuItem.insertMany(MENU_ITEMS)
    masala = await MenuItem.findOne({ slug: 'masala-sandwich' })
    coffee = await MenuItem.findOne({ slug: 'cold-coffee' })
    sendOrderEmail.mockClear()
    sendOrderEmail.mockResolvedValue(undefined)
    sendCustomerOrderEmail.mockClear()
    sendCustomerOrderEmail.mockResolvedValue(undefined)
    Razorpay.__create.mockImplementation(async (options) => ({
      id: `order_${options.receipt}`,
      amount: options.amount,
      currency: 'INR'
    }))
  })

  function payload(extraItems) {
    return {
      ...orderBody(masala._id),
      items: extraItems || [{ menuItemId: String(masala._id), quantity: 2, price: 1 }]
    }
  }

  test('creates a Razorpay order from database prices', async () => {
    const response = await request(app).post('/api/payment/create').send(payload())

    expect(response.status).toBe(201)
    expect(response.body.data).toEqual({
      razorpayOrderId: expect.stringMatching(/^order_/),
      amount: 12000,
      currency: 'INR',
      keyId: process.env.RAZORPAY_KEY_ID
    })
    expect(JSON.stringify(response.body)).not.toContain(process.env.RAZORPAY_KEY_SECRET)
    expect(Razorpay.__create).toHaveBeenCalledWith(
      expect.objectContaining({ amount: 12000, currency: 'INR' })
    )

    const pending = await Order.findOne({ 'payment.razorpayOrderId': response.body.data.razorpayOrderId })
    expect(pending.payment.status).toBe('PENDING')
    expect(pending.orderNumber).toBeUndefined()
    expect(pending.items[0].price).toBe(60)
  })

  test('returns a safe error when Razorpay order creation fails', async () => {
    Razorpay.__create.mockRejectedValue(new Error('gateway down'))

    const response = await request(app).post('/api/payment/create').send(payload())

    expect(response.status).toBe(502)
    expect(response.body).toEqual({
      success: false,
      message: 'Unable to create payment order',
      error: null
    })
    expect(await Order.countDocuments()).toBe(0)
    expect(sendOrderEmail).not.toHaveBeenCalled()
  })

  test('verifies a valid signature, confirms the order, and sends email once', async () => {
    const created = await request(app).post('/api/payment/create').send({
      ...payload(),
      items: [
        { menuItemId: String(masala._id), quantity: 2 },
        { menuItemId: String(coffee._id), quantity: 1 }
      ]
    })
    const razorpayOrderId = created.body.data.razorpayOrderId
    const paymentId = 'pay_success_1'

    const response = await request(app).post('/api/payment/verify').send({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signPayment(razorpayOrderId, paymentId)
    })

    expect(response.status).toBe(200)
    expect(response.body.data.order.orderStatus).toBe('RECEIVED')
    expect(response.body.data.order.payment.status).toBe('PAID')
    expect(response.body.data.order.orderNumber).toMatch(new RegExp(`^CS-${todayKey()}-\\d{4}$`))
    expect(response.body.data.order.subtotal).toBe(190)
    expect(response.body.data.order.tax).toBe(0)
    expect(response.body.data.order.total).toBe(190)
    expect(response.body.data.order.tableNumber).toBe(5)
    expect(JSON.stringify(response.body)).not.toContain(process.env.RAZORPAY_KEY_SECRET)
    expect(JSON.stringify(response.body)).not.toContain(process.env.RESEND_API_KEY)

    const saved = await Order.findById(response.body.data.order.id)
    expect(saved.emailNotification.sent).toBe(true)
    expect(saved.customerEmailNotification.sent).toBe(true)
    expect(sendOrderEmail).toHaveBeenCalledTimes(1)
    expect(sendCustomerOrderEmail).toHaveBeenCalledTimes(1)

    const [orderArg] = sendOrderEmail.mock.calls[0]
    expect(orderArg.orderNumber).toBe(saved.orderNumber)
    expect(orderArg.customer.name).toBe('Rahul Sharma')
    expect(orderArg.customer.email).toBe('rahul@example.com')
    expect(response.body.data.order.customer.email).toBe('rahul@example.com')
    expect(JSON.stringify(saved.emailNotification)).not.toContain(process.env.RESEND_API_KEY)
  })

  test('rejects an invalid signature and does not confirm the order', async () => {
    const created = await request(app).post('/api/payment/create').send(payload())
    const razorpayOrderId = created.body.data.razorpayOrderId

    const response = await request(app).post('/api/payment/verify').send({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: 'pay_invalid',
      razorpay_signature: 'a'.repeat(64)
    })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Payment verification failed')

    const saved = await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId })
    expect(saved.payment.status).toBe('FAILED')
    expect(saved.orderStatus).toBeUndefined()
    expect(sendOrderEmail).not.toHaveBeenCalled()
  })

  test('keeps a paid order when email fails', async () => {
    sendOrderEmail.mockRejectedValue(new Error('Resend unavailable'))
    const created = await request(app).post('/api/payment/create').send(payload())
    const razorpayOrderId = created.body.data.razorpayOrderId
    const paymentId = 'pay_email_fail'

    const response = await request(app).post('/api/payment/verify').send({
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signPayment(razorpayOrderId, paymentId)
    })

    expect(response.status).toBe(200)
    expect(response.body.data.order.payment.status).toBe('PAID')
    expect(response.body.data.order.orderStatus).toBe('RECEIVED')

    const saved = await Order.findById(response.body.data.order.id)
    expect(saved.emailNotification.sent).toBe(false)
    expect(saved.emailNotification.error).toContain('Resend unavailable')
  })

  test('returns the existing order for a duplicate verification without a second notification', async () => {
    const created = await request(app).post('/api/payment/create').send(payload())
    const razorpayOrderId = created.body.data.razorpayOrderId
    const paymentId = 'pay_duplicate'
    const body = {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signPayment(razorpayOrderId, paymentId)
    }

    const first = await request(app).post('/api/payment/verify').send(body)
    const second = await request(app).post('/api/payment/verify').send(body)

    expect(second.status).toBe(200)
    expect(second.body.data.order.orderNumber).toBe(first.body.data.order.orderNumber)
    expect(await Order.countDocuments({ 'payment.status': 'PAID' })).toBe(1)
    expect(sendOrderEmail).toHaveBeenCalledTimes(1)
    expect(sendCustomerOrderEmail).toHaveBeenCalledTimes(1)
  })

  test('does not send a second email when the first attempt failed', async () => {
    sendOrderEmail.mockRejectedValue(new Error('Resend unavailable'))
    const created = await request(app).post('/api/payment/create').send(payload())
    const razorpayOrderId = created.body.data.razorpayOrderId
    const body = {
      razorpay_order_id: razorpayOrderId,
      razorpay_payment_id: 'pay_once',
      razorpay_signature: signPayment(razorpayOrderId, 'pay_once')
    }

    await request(app).post('/api/payment/verify').send(body)
    await request(app).post('/api/payment/verify').send(body)

    expect(sendOrderEmail).toHaveBeenCalledTimes(1)
  })

  test('gets a confirmed order and lists phone history newest first', async () => {
    const firstCreated = await request(app).post('/api/payment/create').send(payload())
    const firstPayment = 'pay_hist_1'
    const first = await request(app).post('/api/payment/verify').send({
      razorpay_order_id: firstCreated.body.data.razorpayOrderId,
      razorpay_payment_id: firstPayment,
      razorpay_signature: signPayment(firstCreated.body.data.razorpayOrderId, firstPayment)
    })

    const secondCreated = await request(app).post('/api/payment/create').send(payload())
    const secondPayment = 'pay_hist_2'
    const second = await request(app).post('/api/payment/verify').send({
      razorpay_order_id: secondCreated.body.data.razorpayOrderId,
      razorpay_payment_id: secondPayment,
      razorpay_signature: signPayment(secondCreated.body.data.razorpayOrderId, secondPayment)
    })

    await Order.collection.updateOne(
      { _id: first.body.data.order.id },
      { $set: { createdAt: new Date('2026-01-01T00:00:00.000Z') } }
    )

    const fetched = await request(app).get(`/api/orders/${second.body.data.order.id}`)
    expect(fetched.status).toBe(200)
    expect(fetched.body.data.order).toEqual(
      expect.objectContaining({
        orderNumber: second.body.data.order.orderNumber,
        orderStatus: 'RECEIVED',
        tableNumber: 5
      })
    )
    expect(fetched.body.data.order.customer.phone).toBe('9876543210')
    expect(fetched.body.data.order.payment).toEqual({ provider: 'razorpay', status: 'PAID' })
    expect(fetched.body.data.order.emailNotification).toBeUndefined()

    const pending = await request(app).post('/api/payment/create').send(payload())
    const history = await request(app).get('/api/orders/by-phone').query({ phone: '9876543210' })

    expect(history.status).toBe(200)
    expect(history.body.data.orders.map((order) => order.id)).toEqual([
      second.body.data.order.id,
      first.body.data.order.id
    ])
    expect(history.body.data.orders[0].address).toBeUndefined()
    expect(history.body.data.orders.some((order) => order.id === pending.body)).toBe(false)
  })

  test('hides unpaid orders and prepares phone history for OTP', async () => {
    const created = await request(app).post('/api/payment/create').send(payload())
    const hidden = await request(app).get(`/api/orders/${created.body.data.razorpayOrderId}`)
    expect(hidden.status).toBe(404)

    process.env.REQUIRE_ORDER_HISTORY_OTP = 'true'
    const blocked = await request(app).get('/api/orders/by-phone').query({ phone: '9876543210' })
    process.env.REQUIRE_ORDER_HISTORY_OTP = 'false'

    expect(blocked.status).toBe(401)
    expect(blocked.body.message).toBe('Phone verification is required before viewing order history')
  })

  test('updates order status only for a staff key', async () => {
    const created = await request(app).post('/api/payment/create').send(payload())
    const paymentId = 'pay_status'
    const verified = await request(app).post('/api/payment/verify').send({
      razorpay_order_id: created.body.data.razorpayOrderId,
      razorpay_payment_id: paymentId,
      razorpay_signature: signPayment(created.body.data.razorpayOrderId, paymentId)
    })
    const orderId = verified.body.data.order.id

    const missing = await request(app).patch(`/api/orders/${orderId}/status`).send({ orderStatus: 'PREPARING' })
    expect(missing.status).toBe(401)

    const updated = await request(app)
      .patch(`/api/orders/${orderId}/status`)
      .set('x-staff-key', process.env.STAFF_API_KEY)
      .send({ orderStatus: 'PREPARING' })

    expect(updated.status).toBe(200)
    expect(updated.body.data.order.orderStatus).toBe('PREPARING')

    const fetched = await request(app).get(`/api/orders/${orderId}`)
    expect(fetched.body.data.order.orderStatus).toBe('PREPARING')
  })
})
