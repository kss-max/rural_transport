import localforage from 'localforage';
import { MAP_LAYERS, CACHE_KEYS, CACHE_ZOOM_LEVELS } from '../components/maps/mapConfig';

// Initialize localforage instances
const tileStore = localforage.createInstance({
  name: 'rural_transport_maps',
  storeName: 'tiles'
});

const dataStore = localforage.createInstance({
  name: 'rural_transport_maps',
  storeName: 'data'
});

// Calculate tile coordinates for a given lat/lng and zoom
function latLngToTile(lat, lng, zoom) {
  const n = Math.pow(2, zoom);
  const x = Math.floor((lng + 180) / 360 * n);
  const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
  return { x, y, z: zoom };
}

// Get all tiles within bounds at a given zoom level
function getTilesInBounds(bounds, zoom) {
  const tiles = [];
  const nw = latLngToTile(bounds.north, bounds.west, zoom);
  const se = latLngToTile(bounds.south, bounds.east, zoom);

  for (let x = nw.x; x <= se.x; x++) {
    for (let y = nw.y; y <= se.y; y++) {
      tiles.push({ x, y, z: zoom });
    }
  }
  return tiles;
}

// Calculate bounds from an array of stops/coordinates
export function calculateBounds(coordinates) {
  if (!coordinates || coordinates.length === 0) return null;

  let north = -Infinity, south = Infinity, east = -Infinity, west = Infinity;

  coordinates.forEach(coord => {
    const lat = coord.latitude || coord.lat;
    const lng = coord.longitude || coord.lng;
    if (lat > north) north = lat;
    if (lat < south) south = lat;
    if (lng > east) east = lng;
    if (lng < west) west = lng;
  });

  // Add padding (about 1km buffer)
  const padding = 0.01;
  return {
    north: north + padding,
    south: south - padding,
    east: east + padding,
    west: west - padding
  };
}

// Fetch and cache a single tile
async function cacheTile(tile, layerId = 'street') {
  const layer = MAP_LAYERS[layerId];
  if (!layer) return false;

  const key = `${layerId}_${tile.z}_${tile.x}_${tile.y}`;
  
  // Check if already cached
  const existing = await tileStore.getItem(key);
  if (existing) return true;

  try {
    // Build tile URL
    let url = layer.url
      .replace('{z}', tile.z)
      .replace('{x}', tile.x)
      .replace('{y}', tile.y)
      .replace('{s}', 'a'); // Use subdomain 'a' for caching

    const response = await fetch(url);
    if (!response.ok) return false;

    const blob = await response.blob();
    await tileStore.setItem(key, blob);
    return true;
  } catch (error) {
    console.warn(`Failed to cache tile ${key}:`, error);
    return false;
  }
}

// Cache tiles for a route
export async function cacheRouteArea(route, layerId = 'street', onProgress = null) {
  if (!route || !route.stops || route.stops.length === 0) {
    console.warn('No stops in route to cache');
    return { success: false, cached: 0, total: 0 };
  }

  const bounds = calculateBounds(route.stops);
  if (!bounds) return { success: false, cached: 0, total: 0 };

  // Get all tiles to cache
  const allTiles = [];
  CACHE_ZOOM_LEVELS.forEach(zoom => {
    const tiles = getTilesInBounds(bounds, zoom);
    allTiles.push(...tiles);
  });

  let cached = 0;
  const total = allTiles.length;

  // Cache tiles in batches
  const batchSize = 10;
  for (let i = 0; i < allTiles.length; i += batchSize) {
    const batch = allTiles.slice(i, i + batchSize);
    const results = await Promise.all(batch.map(tile => cacheTile(tile, layerId)));
    cached += results.filter(r => r).length;

    if (onProgress) {
      onProgress({ cached, total, percent: Math.round((i + batch.length) / total * 100) });
    }
  }

  // Store route data
  await dataStore.setItem(`route_${route.routeId}`, {
    ...route,
    cachedAt: Date.now(),
    layerId
  });

  // Update last sync time
  await dataStore.setItem(CACHE_KEYS.lastSync, Date.now());

  return { success: true, cached, total };
}

// Get cached tile as data URL
export async function getCachedTile(tile, layerId = 'street') {
  const key = `${layerId}_${tile.z}_${tile.x}_${tile.y}`;
  const blob = await tileStore.getItem(key);
  
  if (!blob) return null;
  
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result);
    reader.readAsDataURL(blob);
  });
}

// Check if route is cached
export async function isRouteCached(routeId) {
  const route = await dataStore.getItem(`route_${routeId}`);
  return route !== null;
}

// Get cached route data
export async function getCachedRoute(routeId) {
  return await dataStore.getItem(`route_${routeId}`);
}

// Get all cached routes
export async function getAllCachedRoutes() {
  const routes = [];
  await dataStore.iterate((value, key) => {
    if (key.startsWith('route_')) {
      routes.push(value);
    }
  });
  return routes;
}

// Get cache statistics
export async function getCacheStats() {
  let tileCount = 0;
  let totalSize = 0;

  await tileStore.iterate((value) => {
    tileCount++;
    if (value && value.size) {
      totalSize += value.size;
    }
  });

  const lastSync = await dataStore.getItem(CACHE_KEYS.lastSync);
  const routes = await getAllCachedRoutes();

  return {
    tileCount,
    totalSizeMB: (totalSize / (1024 * 1024)).toFixed(2),
    routeCount: routes.length,
    lastSync
  };
}

// Clear all cached tiles
export async function clearTileCache() {
  await tileStore.clear();
  console.log('Tile cache cleared');
}

// Clear specific route cache
export async function clearRouteCache(routeId) {
  await dataStore.removeItem(`route_${routeId}`);
  console.log(`Route ${routeId} cache cleared`);
}

// Clear all cache
export async function clearAllCache() {
  await tileStore.clear();
  await dataStore.clear();
  console.log('All cache cleared');
}

// Location queue for offline driver updates
export const locationQueue = {
  async add(tripId, location) {
    const queue = await dataStore.getItem(CACHE_KEYS.pendingLocations) || [];
    queue.push({
      tripId,
      location,
      timestamp: Date.now()
    });
    await dataStore.setItem(CACHE_KEYS.pendingLocations, queue);
    return queue.length;
  },

  async getAll() {
    return await dataStore.getItem(CACHE_KEYS.pendingLocations) || [];
  },

  async clear() {
    await dataStore.removeItem(CACHE_KEYS.pendingLocations);
  },

  async remove(index) {
    const queue = await this.getAll();
    queue.splice(index, 1);
    await dataStore.setItem(CACHE_KEYS.pendingLocations, queue);
  },

  async count() {
    const queue = await this.getAll();
    return queue.length;
  }
};

export default {
  cacheRouteArea,
  getCachedTile,
  isRouteCached,
  getCachedRoute,
  getAllCachedRoutes,
  getCacheStats,
  clearTileCache,
  clearRouteCache,
  clearAllCache,
  calculateBounds,
  locationQueue
};
