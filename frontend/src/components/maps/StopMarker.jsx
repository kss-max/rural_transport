import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

// Create stop icon based on status
const createStopIcon = (status, index) => {
  const colors = {
    completed: '#10b981',  // green
    current: '#f59e0b',    // yellow/orange
    upcoming: '#6b7280'    // gray
  };

  const color = colors[status] || colors.upcoming;
  const pulseClass = status === 'current' ? 'stop-pulse' : '';

  return L.divIcon({
    html: `
      <div class="stop-marker ${status}" style="background-color: ${color}">
        ${index !== undefined ? index + 1 : ''}
      </div>
    `,
    className: `stop-marker-wrapper ${pulseClass}`,
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12]
  });
};

function StopMarker({ 
  stop, 
  index,
  status = 'upcoming', // 'completed', 'current', 'upcoming'
  onClick = null,
  showPopup = true
}) {
  if (!stop || !stop.latitude || !stop.longitude) {
    return null;
  }

  const icon = createStopIcon(status, index);

  const statusLabels = {
    completed: '✅ Completed',
    current: '🟡 Current Stop',
    upcoming: '⏳ Upcoming'
  };

  return (
    <Marker
      position={[stop.latitude, stop.longitude]}
      icon={icon}
      eventHandlers={{
        click: () => onClick && onClick(stop, index)
      }}
    >
      {showPopup && (
        <Popup>
          <div className="p-2">
            <div className="font-semibold text-gray-800">
              {stop.stopName}
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Stop #{index !== undefined ? index + 1 : '?'}
            </div>
            <div className={`text-xs mt-1 ${
              status === 'completed' ? 'text-green-600' :
              status === 'current' ? 'text-yellow-600' :
              'text-gray-500'
            }`}>
              {statusLabels[status]}
            </div>
          </div>
        </Popup>
      )}
    </Marker>
  );
}

export default StopMarker;
