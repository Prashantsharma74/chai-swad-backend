/** Twilio Try WhatsApp demo — API sends static text; variables are ignored. */
const TWILIO_DEMO_APPOINTMENT_CONTENT_SID = 'HXfe5ab5f00277942d4d4200328b4d403c'

function getWhatsAppConfig() {
  const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID || ''
  const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN || ''
  const useTwilio = Boolean(twilioAccountSid && twilioAuthToken)

  const twilioOrderContentSid = process.env.TWILIO_WHATSAPP_ORDER_CONTENT_SID || ''
  const twilioContentSid = process.env.TWILIO_WHATSAPP_CONTENT_SID || ''
  const twilioTemplate =
    process.env.TWILIO_WHATSAPP_TEMPLATE || (twilioOrderContentSid ? 'order' : 'appointment')

  const activeContentSid = twilioOrderContentSid || twilioContentSid

  return {
    provider: useTwilio ? 'twilio' : 'meta',
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    businessNumber: process.env.WHATSAPP_BUSINESS_NUMBER || '',
    apiVersion: process.env.WHATSAPP_API_VERSION || 'v21.0',
    twilioAccountSid,
    twilioAuthToken,
    twilioFrom: process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886',
    twilioContentSid: activeContentSid,
    twilioOrderContentSid,
    twilioTemplate,
    twilioUsesDemoAppointmentTemplate:
      !twilioOrderContentSid && activeContentSid === TWILIO_DEMO_APPOINTMENT_CONTENT_SID
  }
}

function isWhatsAppConfigured(config = getWhatsAppConfig()) {
  if (!config.businessNumber) return false
  if (config.provider === 'twilio') {
    return Boolean(config.twilioAccountSid && config.twilioAuthToken && config.twilioFrom)
  }
  return Boolean(config.accessToken && config.phoneNumberId)
}

module.exports = {
  getWhatsAppConfig,
  isWhatsAppConfigured,
  TWILIO_DEMO_APPOINTMENT_CONTENT_SID
}
