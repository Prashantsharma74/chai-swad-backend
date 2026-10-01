function toMoney(value) {
  return Math.round((Number(value) + Number.EPSILON) * 100) / 100
}

function toPaise(amount) {
  return Math.round(toMoney(amount) * 100)
}

function formatInr(amount) {
  const money = toMoney(amount)
  return money.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1')
}

function getTaxPercent() {
  const value = Number(process.env.TAX_PERCENT ?? 0)
  if (!Number.isFinite(value) || value < 0 || value > 28) return 0
  return value
}

module.exports = { toMoney, toPaise, formatInr, getTaxPercent }
