function getWhatsAppConfig() {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || ''
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || ''
  const useTwilio = Boolean(twilioAccountSid && twilioAuthToken)

  return {
    provider: useTwilio ? 'twilio' : 'meta',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    twilioAccountSid,
    twilioAuthToken,
    twilioFrom: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'
  }
}

function isWhatsAppConfigured(config = getWhatsAppConfig()) {
  if (!config.businessNumber) return false
  if (config.provider === 'twilio') {
    return Boolean(config.twilioAccountSid && config.twilioAuthToken && config.twilioFrom)
  }
  return Boolean(config.accessToken && config.phoneNumberId)
}

module.exports = { getWhatsAppConfig, isWhatsAppConfigured }
