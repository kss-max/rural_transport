import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Create custom bus icon
const createBusIcon = (isMoving = false) => {
  return L.divIcon({
    html: `<div class="bus-marker-icon ${isMoving ? 'bus-marker-moving' : ''}">🚌</div>`,
    className: 'bus-marker',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
  });
};

function BusMarker({ 
  position, 
  trip, 
  isMoving = false,
  distance = null,
  eta = null,
  onClick = null 
}) {
  if (!position || !position.latitude || !position.longitude) {
    return null;
  }

  const icon = createBusIcon(isMoving);

  return (
    <Marker
      position={[position.latitude, position.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onClick && onClick(trip)
      }}
    >
      <Popup>
        <div className="bus-popup">
          <div className="bus-popup-header">
            🚌 {trip?.routeName || 'Bus'}
          </div>
          <div className="bus-popup-info">
            {trip?.vehicleNumber && (
              <span>🚐 {trip.vehicleNumber}</span>
            )}
            {trip?.driverId?.phoneNumber && (
              <span>📞 {trip.driverId.phoneNumber}</span>
            )}
            {trip?.averageSpeed && (
              <span>🏃 {Math.round(trip.averageSpeed)} km/h</span>
            )}
            {distance !== null && (
              <span>📍 {distance.toFixed(1)} km away</span>
            )}
          </div>
          {eta && (
            <div className="bus-popup-eta">
              <div className="text-xs text-gray-500">ETA</div>
              <div className="bus-popup-eta-time">{eta.text}</div>
              <div className="text-xs text-gray-500">Arrives at {eta.arrivalTime}</div>
            </div>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

export default BusMarker;
