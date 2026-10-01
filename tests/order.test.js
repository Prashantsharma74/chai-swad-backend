const request = require('supertest')
const app = require('../src/server')
const MenuItem = require('../src/models/MenuItem')
const Order = require('../src/models/Order')
const { MENU_ITEMS } = require('../src/seed/menuSeed')
const { orderBody, objectId } = require('./helpers')

describe('Order calculation', () => {
  let masala

  beforeEach(async () => {
    await MenuItem.insertMany(MENU_ITEMS)
    masala = await MenuItem.findOne({ slug: 'masala-sandwich' })
  })

  test('prices a valid order from the database and ignores client prices', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        ...orderBody(masala._id),
        items: [{ menuItemId: String(masala._id), quantity: 2, price: 1 }]
      })

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.order.items[0]).toEqual(
      expect.objectContaining({
        name: 'Masala Sandwich',
        quantity: 2,
        price: 60,
        total: 120
      })
    )
    expect(response.body.data.order.subtotal).toBe(120)
    expect(response.body.data.order.tax).toBe(0)
    expect(response.body.data.order.total).toBe(120)
    expect(response.body.data.order.payment.status).toBe('UNPAID')
    expect(await Order.countDocuments()).toBe(0)
  })

  test('rejects an empty cart', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({ ...orderBody(masala._id), items: [] })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Your cart is empty.')
  })

  test('rejects an invalid item', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(orderBody(objectId()))

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('One or more items are invalid')
  })

  test('rejects an unavailable item', async () => {
    const hidden = await MenuItem.create({
      name: 'Hidden Sandwich',
      slug: 'hidden-sandwich',
      category: 'Sandwich',
      price: 55,
      available: false,
      sortOrder: 99
    })

    const response = await request(app).post('/api/orders').send(orderBody(hidden._id))

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Hidden Sandwich is currently unavailable')
  })

  test('rejects an invalid quantity', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send({
        ...orderBody(masala._id),
        items: [{ menuItemId: String(masala._id), quantity: 1.5 }]
      })

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Quantity must be a whole number of at least 1')
  })

  test('rejects an invalid phone number', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(orderBody(masala._id, { customer: { name: 'Rahul Sharma', phone: '12345', address: 'Vijay Nagar, Indore' } }))

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Please enter a valid 10-digit mobile number.')
  })

  test('rejects a missing name', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(orderBody(masala._id, { customer: { name: '   ', phone: '9876543210', address: 'Vijay Nagar, Indore' } }))

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Please enter your name.')
  })

  test('rejects a missing address', async () => {
    const response = await request(app)
      .post('/api/orders')
      .send(orderBody(masala._id, { customer: { name: 'Rahul Sharma', phone: '9876543210', address: '' } }))

    expect(response.status).toBe(400)
    expect(response.body.message).toBe('Please enter your address.')
  })
})
