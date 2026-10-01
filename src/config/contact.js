const { getCafeCoordinates, getDeliveryRadiusMeters } = require('./delivery')

function getContactInfo() {
  const cafe = getCafeCoordinates()
  return {
    name: process.env.CAFE_NAME || 'Chai Swad',
    phone: process.env.CAFE_PHONE || '',
    whatsapp: process.env.CAFE_WHATSAPP || '',
    email: process.env.CAFE_EMAIL || '',
    address: process.env.CAFE_ADDRESS || '',
    instagram: process.env.CAFE_INSTAGRAM || '',
    googleMapsUrl: process.env.CAFE_GOOGLE_MAPS_URL || '',
    openingHours: process.env.CAFE_OPENING_HOURS || '',
    latitude: cafe?.lat ?? null,
    longitude: cafe?.lng ?? null,
    deliveryRadiusMeters: getDeliveryRadiusMeters()
  }
}

module.exports = { getContactInfo }
