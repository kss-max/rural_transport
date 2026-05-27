import { ROUTE_STYLES } from './mapConfig';
import StopMarker from './StopMarker';
import RouteRoutingPolyline from './RouteRoutingMachine';
function RoutePolyline({ 
  stops, 
  currentStopIndex = 0,
  showStops = true,
  routeStyle = 'default',
  onStopClick = null
}) {
  if (!stops || stops.length === 0) {
    return null;
  }

  // Convert stops to polyline positions
  const positions = stops
    .filter(stop => stop.latitude && stop.longitude)
    .map(stop => [stop.latitude, stop.longitude]);

  if (positions.length < 2) {
    return null;
  }

  const style = ROUTE_STYLES[routeStyle] || ROUTE_STYLES.default;

  // Determine stop status
  const getStopStatus = (index) => {
    if (index < currentStopIndex) return 'completed';
    if (index === currentStopIndex) return 'current';
    return 'upcoming';
  };

  return (
    <>
      {/* Route line */}
      <RouteRoutingPolyline
        positions={positions}
        pathOptions={style}
      />

      {/* Stop markers */}
      {showStops && stops.map((stop, index) => (
        <StopMarker
          key={stop.stopId || index}
          stop={stop}
          index={index}
          status={getStopStatus(index)}
          onClick={onStopClick}
        />
      ))}
    </>
  );
}

export default RoutePolyline;
