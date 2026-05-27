// ============================================
// DISTANCE SERVICE
// ============================================
// Uses OSRM API when online, Haversine formula when offline
//
// OSRM (Open Source Routing Machine) provides real road-network
// distances via the public demo server.
// Haversine gives straight-line ("as the crow flies") distances
// and serves as the offline / fallback calculation.
// ============================================

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Haversine formula – synchronous, works offline.
 * Returns straight-line distance in **kilometres**.
 */
export function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // km
}

/**
 * Fetch road-network distance from the public OSRM API.
 * Returns distance in **kilometres**.
 * Throws on network / API errors so the caller can fall back.
 */
export async function osrmDistance(lat1, lng1, lat2, lng2) {
  // OSRM expects coordinates as lng,lat (not lat,lng)
  const url = `${OSRM_BASE_URL}/${lng1},${lat1};${lng2},${lat2}?overview=false`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`OSRM request failed: ${response.status}`);
  }

  const data = await response.json();

  if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
    throw new Error('OSRM returned no valid route');
  }

  // OSRM returns distance in metres → convert to km
  return data.routes[0].distance / 1000;
}

/**
 * Smart distance calculator.
 * - Online → tries OSRM (real road distance), falls back to Haversine on error.
 * - Offline → uses Haversine directly.
 *
 * Always returns distance in **kilometres**.
 * This function is **async**.
 */
export async function calculateDistance(lat1, lng1, lat2, lng2) {
  if (navigator.onLine) {
    try {
      return await osrmDistance(lat1, lng1, lat2, lng2);
    } catch (err) {
      console.warn('OSRM failed, falling back to Haversine:', err.message);
      return haversineDistance(lat1, lng1, lat2, lng2);
    }
  }
  return haversineDistance(lat1, lng1, lat2, lng2);
}

/**
 * Batch distance calculation for multiple destination points from
 * a single origin. Useful for sorting buses by distance.
 *
 * @param {number} originLat
 * @param {number} originLng
 * @param {{ lat: number, lng: number }[]} destinations
 * @returns {Promise<number[]>} distances in km, one per destination
 */
export async function calculateDistancesBatch(originLat, originLng, destinations) {
  if (!navigator.onLine || destinations.length === 0) {
    // Offline or empty → Haversine for all
    return destinations.map(d => haversineDistance(originLat, originLng, d.lat, d.lng));
  }

  try {
    // Build a single OSRM table request: origin → all destinations
    const coords = [
      `${originLng},${originLat}`,
      ...destinations.map(d => `${d.lng},${d.lat}`),
    ].join(';');

    const url = `https://router.project-osrm.org/table/v1/driving/${coords}?sources=0&annotations=distance`;
    const response = await fetch(url);

    if (!response.ok) throw new Error(`OSRM table request failed: ${response.status}`);

    const data = await response.json();
    if (data.code !== 'Ok' || !data.distances) throw new Error('Invalid OSRM table response');

    // distances[0] contains the row from source 0 to all destinations
    // First element is origin→origin (0), rest are the distances in metres
    return data.distances[0].slice(1).map(d => (d ?? Infinity) / 1000);
  } catch (err) {
    console.warn('OSRM batch failed, falling back to Haversine:', err.message);
    return destinations.map(d => haversineDistance(originLat, originLng, d.lat, d.lng));
  }
}

export default calculateDistance;
