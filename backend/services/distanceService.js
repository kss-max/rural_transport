// ============================================
// DISTANCE SERVICE (Backend)
// ============================================
// Uses OSRM API when available, Haversine formula as fallback.
// ============================================

const OSRM_BASE_URL = 'https://router.project-osrm.org/route/v1/driving';

/**
 * Haversine formula – synchronous, no network required.
 * Returns straight-line distance in kilometres.
 */
const haversineDistance = (lat1, lng1, lat2, lng2) => {
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
};

/**
 * Fetch road-network distance from the public OSRM API.
 * Returns distance in kilometres.
 * Throws on network / API errors.
 */
const osrmDistance = async (lat1, lng1, lat2, lng2) => {
  // OSRM expects coordinates as lng,lat
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
};

/**
 * Smart distance calculator (async).
 * Tries OSRM first for real road distance; falls back to Haversine on failure.
 * Returns distance in kilometres.
 */
const calculateDistance = async (lat1, lng1, lat2, lng2) => {
  try {
    return await osrmDistance(lat1, lng1, lat2, lng2);
  } catch (err) {
    console.warn('OSRM failed, falling back to Haversine:', err.message);
    return haversineDistance(lat1, lng1, lat2, lng2);
  }
};

module.exports = {
  haversineDistance,
  osrmDistance,
  calculateDistance,
};
