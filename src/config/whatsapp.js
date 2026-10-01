function getWhatsAppConfig() {
  return {
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0'
  }
}

module.exports = { getWhatsAppConfig }
