require('dotenv').config()
const { getWhatsAppConfig } = require('../src/config/whatsapp')
const { sendOrderNotification } = require('../src/services/whatsappService')

const mockOrder = {
  orderNumber: 'TEST-WA',
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
  const config = getWhatsAppConfig()
  console.log('Twilio configured:', Boolean(config.twilioAccountSid && config.twilioAuthToken))
  console.log('Content SID:', config.twilioContentSid || '(missing)')
  console.log('Template:', config.twilioTemplate)
  console.log('Uses demo appointment SID:', config.twilioUsesDemoAppointmentTemplate)

  await sendOrderNotification(mockOrder)
  console.log('OK — check WhatsApp on', config.businessNumber)
}

main().catch((err) => {
  console.error('FAILED:', err.message)
  process.exit(1)
})
