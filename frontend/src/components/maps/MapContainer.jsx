import { useState, useEffect, useRef } from 'react';
import { MapContainer as LeafletMapContainer, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { MAP_LAYERS, MAP_DEFAULTS } from './mapConfig';
import LayerSwitcher from './LayerSwitcher';
import OfflineIndicator from './OfflineIndicator';
import useOffline from '../../hooks/useOffline';

// Fix for default marker icon issue in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Component to handle map view changes
function MapViewController({ center, zoom, bounds }) {
  const map = useMap();

  useEffect(() => {
    if (bounds) {
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, bounds, map]);

  return null;
}

// Component to expose map instance
function MapInstanceHandler({ onMapReady }) {
  const map = useMap();
  
  useEffect(() => {
    if (onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);

  return null;
}

function MapContainer({
  children,
  center = MAP_DEFAULTS.center,
  zoom = MAP_DEFAULTS.zoom,
  bounds = null,
  className = '',
  fullscreen = false,
  showLayerSwitcher = true,
  showOfflineIndicator = true,
  defaultLayer = MAP_DEFAULTS.defaultLayer,
  onMapReady = null,
  onLayerChange = null,
  style = {}
}) {
  const [activeLayer, setActiveLayer] = useState(defaultLayer);
  const isOffline = useOffline();
  const isOnline = !isOffline;
  const [showLabels, setShowLabels] = useState(true);
  const mapRef = useRef(null);

  // Handle layer change
  const handleLayerChange = (layerId) => {
    setActiveLayer(layerId);
    if (onLayerChange) {
      onLayerChange(layerId);
    }
  };

  // Get current layer config
  const currentLayer = MAP_LAYERS[activeLayer] || MAP_LAYERS.street;

  // Container class
  const containerClass = `map-container ${fullscreen ? 'map-container-fullscreen' : ''} ${className}`;

  return (
    <div className={containerClass} style={{ position: 'relative', ...style }}>
      <LeafletMapContainer
        center={center}
        zoom={zoom}
        minZoom={MAP_DEFAULTS.minZoom}
        maxZoom={currentLayer.maxZoom || MAP_DEFAULTS.maxZoom}
        style={{ width: '100%', height: '100%' }}
        ref={mapRef}
        zoomControl={true}
      >
        {/* Base tile layer */}
        <TileLayer
          key={activeLayer}
          url={currentLayer.url}
          attribution={currentLayer.attribution}
          maxZoom={currentLayer.maxZoom}
        />

        {/* Labels overlay for hybrid mode */}
        {activeLayer === 'hybrid' && showLabels && currentLayer.labelsUrl && (
          <TileLayer
            url={currentLayer.labelsUrl}
            attribution=""
            maxZoom={currentLayer.maxZoom}
            opacity={0.8}
          />
        )}

        {/* Map view controller */}
        <MapViewController center={center} zoom={zoom} bounds={bounds} />

        {/* Expose map instance */}
        <MapInstanceHandler onMapReady={onMapReady} />

        {/* Children (markers, polylines, etc.) */}
        {children}
      </LeafletMapContainer>

      {/* Layer switcher */}
      {showLayerSwitcher && (
        <LayerSwitcher
          activeLayer={activeLayer}
          onLayerChange={handleLayerChange}
          layers={MAP_LAYERS}
        />
      )}

      {/* Offline indicator */}
      {showOfflineIndicator && (
        <OfflineIndicator isOnline={isOnline} />
      )}
    </div>
  );
}

export default MapContainer;
