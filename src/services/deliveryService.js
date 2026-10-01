const axios = require('axios')
const AppError = require('../utils/appError')
const logger = require('../utils/logger')
const { distanceMeters } = require('../utils/geo')
const { getCafeCoordinates, getDeliveryRadiusMeters } = require('../config/delivery')

let cachedCafeFromAddress = null

async function geocodeAddress(address) {
  const query = String(address || '').trim()
  if (query.length < 6) return null

  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/search', {
      params: {
        format: 'json',
        limit: 1,
        countrycodes: 'in',
        q: query
      },
      headers: {
        'User-Agent': 'ChaiSwad/1.0 (cafe-ordering)'
      },
      timeout: 8000
    })

    const result = response.data?.[0]
    const lat = Number(result?.lat)
    const lng = Number(result?.lon)
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null
    return { lat, lng }
  } catch (err) {
    logger.error('Address lookup failed', { message: err.message })
    return null
  }
}

async function resolveCafeCoordinates() {
  const configured = getCafeCoordinates()
  if (configured) return configured

  if (cachedCafeFromAddress) return cachedCafeFromAddress

  const cafeAddress = process.env.CAFE_ADDRESS
  if (!cafeAddress) return null

  cachedCafeFromAddress = await geocodeAddress(cafeAddress)
  return cachedCafeFromAddress
}

async function assertWithinDeliveryRadius(address, location) {
  const cafe = await resolveCafeCoordinates()
  if (!cafe) {
    logger.error('Cafe location is not configured for delivery checks')
    return null
  }

  const customer =
    location && Number.isFinite(location.lat) && Number.isFinite(location.lng)
      ? { lat: location.lat, lng: location.lng }
      : await geocodeAddress(address)

  if (!customer) {
    throw new AppError('Please enter a complete address near Chai Swad, or use your current location.', 400)
  }

  const radius = getDeliveryRadiusMeters()
  const meters = distanceMeters(cafe, customer)

  if (meters > radius) {
    throw new AppError(`Sorry, Chai Swad only delivers within ${radius} meters of the cafe.`, 400)
  }

  return { cafe, customer, meters, radius }
}

module.exports = { assertWithinDeliveryRadius, resolveCafeCoordinates }
