const request = require('supertest')
const app = require('../src/server')
const MenuItem = require('../src/models/MenuItem')
const { MENU_ITEMS } = require('../src/seed/menuSeed')

async function seedMenu() {
  return MenuItem.insertMany(MENU_ITEMS)
}

describe('Menu API', () => {
  beforeEach(async () => {
    await seedMenu()
  })

  test('fetches only available menu items', async () => {
    await MenuItem.create({
      name: 'Hidden Sandwich',
      slug: 'hidden-sandwich',
      category: 'Sandwich',
      description: 'Not for sale',
      price: 55,
      available: false,
      sortOrder: 99
    })

    const response = await request(app).get('/api/menu')

    expect(response.status).toBe(200)
    expect(response.body.success).toBe(true)
    expect(response.body.data.items).toHaveLength(MENU_ITEMS.length)
    expect(response.body.data.items.some((item) => item.name === 'Hidden Sandwich')).toBe(false)
    expect(response.body.data.categories).toEqual(['Sandwich', 'Beverages', 'Fries'])
    expect(response.body.data.items[0]).toEqual(
      expect.objectContaining({
        name: 'Masala Sandwich',
        price: 60,
        category: 'Sandwich',
        available: true
      })
    )
  })

  test('fetches one available product', async () => {
    const masala = await MenuItem.findOne({ slug: 'masala-sandwich' })
    const response = await request(app).get(`/api/menu/${masala._id}`)

    expect(response.status).toBe(200)
    expect(response.body.data.item).toEqual(
      expect.objectContaining({
        id: String(masala._id),
        name: 'Masala Sandwich',
        price: 60
      })
    )
  })

  test('filters menu by category without case sensitivity', async () => {
    const response = await request(app).get('/api/menu').query({ category: 'sandwich' })

    expect(response.status).toBe(200)
    expect(response.body.data.items).toHaveLength(7)
    expect(response.body.data.items.every((item) => item.category === 'Sandwich')).toBe(true)
  })

  test('supports the Fries category without invented items', async () => {
    const response = await request(app).get('/api/menu').query({ category: 'Fries' })

    expect(response.status).toBe(200)
    expect(response.body.data.items).toEqual([])
  })

  test('does not return an unavailable product', async () => {
    const hidden = await MenuItem.create({
      name: 'Hidden Sandwich',
      slug: 'hidden-sandwich',
      category: 'Sandwich',
      price: 55,
      available: false,
      sortOrder: 99
    })

    const response = await request(app).get(`/api/menu/${hidden._id}`)
    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
  })
})

describe('Health and contact', () => {
  test('health check', async () => {
    const response = await request(app).get('/api/health')
    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      success: true,
      message: 'Chai Swad API is running'
    })
  })

  test('returns configurable contact details', async () => {
    const response = await request(app).get('/api/contact')
    expect(response.status).toBe(200)
    expect(response.body.data.contact).toEqual({
      name: 'Chai Swad',
      phone: '9826000000',
      whatsapp: '919826000000',
      email: 'hello@chaiswad.test',
      address: 'Vijay Nagar, Indore',
      instagram: 'https://instagram.com/chaiswad',
      googleMapsUrl: 'https://maps.google.com/?q=Chai+Swad',
      openingHours: '8:00 AM – 10:00 PM'
    })
  })
})
