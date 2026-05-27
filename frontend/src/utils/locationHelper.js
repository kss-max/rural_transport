import { calculateDistance, haversineDistance } from './distanceService'

export function formatLocation(village, district, state) {
  return [village, district, state].filter(Boolean).join(', ')
}

/**
 * Calculate distance in km between two points.
 * Uses OSRM (road distance) when online, Haversine when offline.
 * Returns a Promise<number>.
 *
 * For a synchronous fallback pass { sync: true }.
 */
export async function calculateDistanceKm(from, to, { sync = false } = {}) {
  if (!from || !to) return 0
  if (sync) {
    return haversineDistance(from.lat, from.lng, to.lat, to.lng)
  }
  return await calculateDistance(from.lat, from.lng, to.lat, to.lng)
}
