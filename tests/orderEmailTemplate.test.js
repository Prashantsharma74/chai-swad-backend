const { buildOrderEmailHtml } = require('../src/services/orderEmailTemplate')

describe('buildOrderEmailHtml', () => {
  const order = {
    orderNumber: 'CS-TEST-001',
    createdAt: new Date('2026-10-03T10:30:00.000Z'),
    customer: {
      name: 'Prashant Sharma',
      phone: '7470734508',
      address: '203'
    },
    tableNumber: 5,
    items: [{ quantity: 10, name: 'Masala Sandwich', price: 60, total: 600 }],
    subtotal: 600,
    tax: 0,
    total: 600
  }

  it('includes order number and customer in HTML', () => {
    const html = buildOrderEmailHtml(order, 'Chai Swad')
    expect(html).toContain('CS-TEST-001')
    expect(html).toContain('Prashant Sharma')
    expect(html).toContain('Masala Sandwich')
    expect(html).toContain('New order received')
    expect(html).not.toContain('<script')
  })

  it('escapes HTML in customer fields', () => {
    const html = buildOrderEmailHtml(
      {
        ...order,
        customer: { ...order.customer, name: '<b>Evil</b>' }
      },
      'Chai Swad'
    )
    expect(html).toContain('&lt;b&gt;Evil&lt;/b&gt;')
    expect(html).not.toContain('<b>Evil</b>')
  })
})
