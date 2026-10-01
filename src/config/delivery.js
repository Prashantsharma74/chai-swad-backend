const { parseCoordinate, parseMapsCoordinates } = require('../utils/geo')

function getDeliveryRadiusMeters() {
  const value = Number(process.env.CAFE_DELIVERY_RADIUS_M ?? 500)
  if (!Number.isFinite(value) || value < 50 || value > 5000) return 500
  return Math.round(value)
}

function getCafeCoordinates() {
  const lat = parseCoordinate(process.env.CAFE_LAT)
  const lng = parseCoordinate(process.env.CAFE_LNG)
  if (lat !== null && lng !== null && Math.abs(lat) <= 90 && Math.abs(lng) <= 180) {
    return { lat, lng }
  }

  return parseMapsCoordinates(process.env.CAFE_GOOGLE_MAPS_URL)
}

module.exports = { getDeliveryRadiusMeters, getCafeCoordinates }
