import { Polyline } from 'react-leaflet';
import { ROUTE_STYLES } from './mapConfig';

function BreadcrumbTrail({ 
  positions = [], // Array of { latitude, longitude, timestamp }
  maxPoints = 100,
  style = 'breadcrumb'
}) {
  if (!positions || positions.length < 2) {
    return null;
  }

  // Limit to last N points
  const recentPositions = positions.slice(-maxPoints);

  // Convert to polyline format
  const polylinePositions = recentPositions
    .filter(pos => pos.latitude && pos.longitude)
    .map(pos => [pos.latitude, pos.longitude]);

  if (polylinePositions.length < 2) {
    return null;
  }

  const lineStyle = ROUTE_STYLES[style] || ROUTE_STYLES.breadcrumb;

  return (
    <Polyline
      positions={polylinePositions}
      pathOptions={lineStyle}
    />
  );
}

export default BreadcrumbTrail;
