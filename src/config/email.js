function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase()
}

function getEmailConfig() {
  return {
    resendApiKey: process.env.RESEND_API_KEY || '',
    from: (process.env.RESEND_FROM || 'onboarding@resend.dev').trim(),
    notifyTo: normalizeEmail(process.env.ORDER_NOTIFY_EMAIL || process.env.CAFE_EMAIL || '')
  }
}

function getCafeNotifyEmail(config = getEmailConfig()) {
  return config.notifyTo
}

function isEmailConfigured(config = getEmailConfig()) {
  return Boolean(config.resendApiKey && config.from && getCafeNotifyEmail(config))
}

function isResendReady(config = getEmailConfig()) {
  return Boolean(config.resendApiKey && config.from)
}

function getEmailStatus() {
  const config = getEmailConfig()
  return {
    resendReady: isResendReady(config),
    cafeNotifyConfigured: Boolean(getCafeNotifyEmail(config)),
    cafeNotifyEmail: getCafeNotifyEmail(config) ? maskEmail(getCafeNotifyEmail(config)) : ''
  }
}

function maskEmail(email) {
  const [local, domain] = String(email).split('@')
  if (!domain) return '(invalid)'
  if (local.length <= 2) return `**@${domain}`
  return `${local.slice(0, 2)}***@${domain}`
}

module.exports = {
  getEmailConfig,
  getCafeNotifyEmail,
  isEmailConfigured,
  isResendReady,
  getEmailStatus,
  normalizeEmail
}
