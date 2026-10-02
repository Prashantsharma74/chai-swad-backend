require('dotenv').config()
const { getEmailConfig, getCafeNotifyEmail, isEmailConfigured, isResendReady } = require('../src/config/email')
const { sendOrderEmail, sendCustomerOrderEmail } = require('../src/services/emailService')

const mockOrder = {
  orderNumber: 'TEST-EMAIL',
  customer: {
    name: 'Test Customer',
    phone: '9876543210',
    email: 'customer-test@example.com',
    address: 'Sky Corporate, Indore'
  },
  tableNumber: '',
  items: [{ quantity: 2, name: 'Masala Chai', price: 20, total: 40 }],
  subtotal: 40,
  tax: 0,
  total: 40
}

async function main() {
  const config = getEmailConfig()
  const cafeTo = getCafeNotifyEmail(config)

  console.log('Resend ready:', isResendReady(config))
  console.log('Cafe alerts configured:', isEmailConfigured(config))
  console.log('Cafe notify (ORDER_NOTIFY_EMAIL):', cafeTo || '(missing — set in .env or Render)')
  console.log('Test customer email:', mockOrder.customer.email)

  if (!isResendReady(config)) {
    throw new Error('Set RESEND_API_KEY and RESEND_FROM in .env')
  }
  if (!cafeTo) {
    throw new Error('Set ORDER_NOTIFY_EMAIL=prashantsharma7470@gmail.com in .env or Render')
  }

  console.log('\n1/2 Sending cafe order alert to', cafeTo)
  await sendOrderEmail(mockOrder)

  const customerInbox = process.argv[2] || mockOrder.customer.email
  mockOrder.customer.email = customerInbox
  console.log('\n2/2 Sending customer confirmation to', customerInbox)
  await sendCustomerOrderEmail(mockOrder)

  console.log('\nOK — check both inboxes (cafe + customer).')
}

main().catch((err) => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
