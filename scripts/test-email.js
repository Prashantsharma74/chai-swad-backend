require('dotenv').config()
const { getEmailConfig, isEmailConfigured } = require('../src/config/email')
const { sendOrderEmail } = require('../src/services/emailService')

const mockOrder = {
  orderNumber: 'TEST-EMAIL',
  customer: {
    name: 'Test Customer',
    phone: '9876543210',
    address: 'Sky Corporate, Indore'
  },
  tableNumber: '',
  items: [{ quantity: 2, name: 'Masala Chai', total: 40 }],
  subtotal: 40,
  tax: 0,
  total: 40
}

async function main() {
  const config = getEmailConfig()
  console.log('Resend configured:', isEmailConfigured(config))
  console.log('Notify to:', config.notifyTo || '(missing)')

  await sendOrderEmail(mockOrder)
  console.log('OK — check inbox for', config.notifyTo)
}

main().catch((err) => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
