import { Marker, Popup, Circle } from 'react-leaflet';
import L from 'leaflet';

// Create custom passenger icon
const passengerIcon = L.divIcon({
  html: '<div class="passenger-marker"></div>',
  className: 'passenger-marker-wrapper',
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

function PassengerMarker({ 
  position, 
  accuracy = null,
  showAccuracyCircle = true,
  label = 'You are here'
}) {
  if (!position || !position.latitude || !position.longitude) {
    return null;
  }

  const latLng = [position.latitude, position.longitude];

  return (
    <>
      {/* Accuracy circle */}
      {showAccuracyCircle && accuracy && accuracy > 10 && (
        <Circle
          center={latLng}
          radius={accuracy}
          pathOptions={{
            fillColor: '#3b82f6',
            fillOpacity: 0.15,
            color: '#3b82f6',
            opacity: 0.5,
            weight: 2
          }}
        />
      )}
      
      {/* Passenger marker */}
      <Marker
        position={latLng}
        icon={passengerIcon}
      >
        <Popup>
          <div className="p-2">
            <div className="font-semibold">📍 {label}</div>
            <div className="text-xs text-gray-500 mt-1">
              {position.latitude.toFixed(6)}, {position.longitude.toFixed(6)}
            </div>
            {accuracy && (
              <div className="text-xs text-gray-500">
                Accuracy: ±{accuracy < 1000 ? `${Math.round(accuracy)}m` : `${(accuracy/1000).toFixed(1)}km`}
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
}

export default PassengerMarker;
