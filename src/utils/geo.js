function toRadians(value) {
  return (value * Math.PI) / 180
}

function distanceMeters(from, to) {
  const earthRadius = 6371000
  const dLat = toRadians(to.lat - from.lat)
  const dLng = toRadians(to.lng - from.lng)
  const lat1 = toRadians(from.lat)
  const lat2 = toRadians(to.lat)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2

  return Math.round(earthRadius * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

function parseCoordinate(value) {
  const number = Number(value)
  return Number.isFinite(number) ? number : null
}

function parseMapsCoordinates(url) {
  const text = String(url || '')
  const atMatch = text.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (atMatch) {
    return { lat: Number(atMatch[1]), lng: Number(atMatch[2]) }
  }

  const queryMatch = text.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/)
  if (queryMatch) {
    return { lat: Number(queryMatch[1]), lng: Number(queryMatch[2]) }
  }

  return null
}

module.exports = { distanceMeters, parseCoordinate, parseMapsCoordinates }
