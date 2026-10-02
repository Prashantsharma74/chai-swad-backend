function getEmailConfig() {
  return {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: process.env.RESEND_FROM || 'onboarding@resend.dev',
    notifyTo: process.env.ORDER_NOTIFY_EMAIL || process.env.CAFE_EMAIL || ''
  }
}

function isEmailConfigured(config = getEmailConfig()) {
  return Boolean(config.resendApiKey && config.from && config.notifyTo)
}

module.exports = { getEmailConfig, isEmailConfigured }
