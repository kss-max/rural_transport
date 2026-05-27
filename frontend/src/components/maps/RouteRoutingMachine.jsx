import { useEffect, useState, useRef } from 'react';
import { useMap, Polyline } from 'react-leaflet';
import L from 'leaflet';

import 'leaflet-routing-machine';
import 'leaflet-routing-machine/dist/leaflet-routing-machine.css';

// Track failed attempts globally to avoid repeated OSRM calls when rate-limited
let osrmFailedRecently = false;
let osrmFailedTimestamp = 0;
const OSRM_RETRY_DELAY = 60000; // Wait 60 seconds before retrying OSRM

function RouteRoutingPolyline({ positions, pathOptions }) {
  const [useFallback, setUseFallback] = useState(false);
  const [routePositions, setRoutePositions] = useState(null);
  const map = useMap();
  const controlRef = useRef(null);

  if (!positions || positions.length < 2) {
    return null;
  }

  // Normalize positions to [lat, lng] format
  const normalizedPositions = positions.map(p => {
    if (Array.isArray(p)) return [p[0], p[1]];
    return [p.latitude, p.longitude];
  });

  useEffect(() => {
    if (!map) return;
    if (!positions || positions.length < 2) return;

    // Check if OSRM failed recently - use fallback immediately
    if (osrmFailedRecently && (Date.now() - osrmFailedTimestamp) < OSRM_RETRY_DELAY) {
      setUseFallback(true);
      return;
    }

    // Convert to waypoints for OSRM
    const waypoints = normalizedPositions.map(p => L.latLng(p[0], p[1]));

    // Remove existing control if present
    if (controlRef.current) {
      try { map.removeControl(controlRef.current); } catch (e) {}
      controlRef.current = null;
    }

    const styles = [{ color: pathOptions?.color || 'blue', weight: pathOptions?.weight || 4 }];

    try {
      const routingControl = L.Routing.control({
        waypoints,
        router: L.Routing.osrmv1({
          serviceUrl: 'https://router.project-osrm.org/route/v1',
          timeout: 5000 // 5 second timeout
        }),
        lineOptions: {
          styles
        },
        addWaypoints: false,
        draggableWaypoints: false,
        fitSelectedRoutes: false,
        show: false,
        routeWhileDragging: false
      });

      // Handle routing success
      routingControl.on('routesfound', (e) => {
        if (e.routes && e.routes[0]) {
          const coords = e.routes[0].coordinates;
          setRoutePositions(coords.map(c => [c.lat, c.lng]));
          setUseFallback(false);
          // Reset failure tracking on success
          osrmFailedRecently = false;
        }
      });

      // Handle routing errors - fallback to simple polyline
      routingControl.on('routingerror', (e) => {
        console.warn('OSRM routing failed, using straight-line fallback');
        osrmFailedRecently = true;
        osrmFailedTimestamp = Date.now();
        setUseFallback(true);
        // Remove the broken control
        if (controlRef.current) {
          try { map.removeControl(controlRef.current); } catch (err) {}
          controlRef.current = null;
        }
      });

      routingControl.addTo(map);
      controlRef.current = routingControl;
    } catch (e) {
      console.warn('Failed to create routing control:', e);
      setUseFallback(true);
    }

    return () => {
      if (controlRef.current) {
        try { map.removeControl(controlRef.current); } catch (e) {}
        controlRef.current = null;
      }
    };
  }, [map, JSON.stringify(normalizedPositions), pathOptions?.color, pathOptions?.weight]);

  // Use routed positions if available, otherwise use straight line
  const displayPositions = useFallback ? normalizedPositions : (routePositions || normalizedPositions);

  // Always render a polyline (either OSRM route or straight-line fallback)
  return (
    <Polyline
      positions={displayPositions}
      pathOptions={{
        color: pathOptions?.color || 'blue',
        weight: pathOptions?.weight || 4,
        opacity: pathOptions?.opacity || 0.8,
        dashArray: useFallback ? '10, 10' : undefined // Dashed line for fallback
      }}
    />
  );
}

export default RouteRoutingPolyline;
  