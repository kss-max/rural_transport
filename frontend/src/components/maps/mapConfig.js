// Map layer configurations for rural transport
// Includes street, satellite, hybrid, and terrain options

export const MAP_LAYERS = {
  // Standard street map (default) - OpenStreetMap
  street: {
    id: 'street',
    name: 'Street Map',
    icon: '🗺️',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    maxZoom: 19,
    description: 'Standard street map with roads and labels'
  },

  // Satellite view - Esri World Imagery (FREE, no API key needed)
  satellite: {
    id: 'satellite',
    name: 'Satellite',
    icon: '🛰️',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; <a href="https://www.esri.com/">Esri</a>, Maxar, Earthstar Geographics',
    maxZoom: 18,
    description: 'Satellite imagery - great for rural areas'
  },

  // Hybrid - Satellite with labels overlay
  hybrid: {
    id: 'hybrid',
    name: 'Hybrid',
    icon: '🔀',
    // Base satellite layer
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    // Labels overlay
    labelsUrl: 'https://stamen-tiles.a.ssl.fastly.net/toner-labels/{z}/{x}/{y}.png',
    attribution: '&copy; Esri, Stamen Design',
    maxZoom: 18,
    description: 'Satellite with road labels'
  },

  // Terrain/Topographic view - good for elevation
  terrain: {
    id: 'terrain',
    name: 'Terrain',
    icon: '🏔️',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '&copy; <a href="https://opentopomap.org">OpenTopoMap</a> (CC-BY-SA)',
    maxZoom: 17,
    description: 'Topographic map showing elevation'
  }
};

// Default map settings
export const MAP_DEFAULTS = {
  // Center on Karnataka/Mangalore region (adjust based on your routes)
  center: [12.8, 75.3],
  zoom: 13,
  minZoom: 8,
  maxZoom: 18,
  // Default layer
  defaultLayer: 'street'
};

// Marker icons configuration
export const MARKER_ICONS = {
  bus: {
    html: '<div class="bus-marker-icon">🚌</div>',
    className: 'bus-marker',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
  },
  busMoving: {
    html: '<div class="bus-marker-icon bus-marker-moving">🚌</div>',
    className: 'bus-marker',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
  },
  passenger: {
    html: '<div class="passenger-marker"></div>',
    className: 'passenger-marker-wrapper',
    iconSize: [20, 20],
    iconAnchor: [10, 10]
  },
  stopCompleted: {
    className: 'stop-marker completed',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  },
  stopCurrent: {
    className: 'stop-marker current',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  },
  stopUpcoming: {
    className: 'stop-marker upcoming',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  }
};

// Route polyline styling
export const ROUTE_STYLES = {
  default: {
    color: '#14b8a6',
    weight: 4,
    opacity: 0.8,
    lineCap: 'round',
    lineJoin: 'round'
  },
  active: {
    color: '#0d9488',
    weight: 5,
    opacity: 1,
    lineCap: 'round',
    lineJoin: 'round'
  },
  breadcrumb: {
    color: '#8b5cf6',
    weight: 3,
    opacity: 0.7,
    dashArray: '5, 10',
    lineCap: 'round'
  }
};

// Zoom levels for tile caching
export const CACHE_ZOOM_LEVELS = [12, 13, 14, 15, 16];

// Cache storage keys
export const CACHE_KEYS = {
  tiles: 'map_tiles_cache',
  routes: 'cached_routes',
  lastSync: 'last_cache_sync',
  pendingLocations: 'pending_location_updates'
};

export default MAP_LAYERS;
