import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BUS_ROUTES, getActiveRoutes } from '../../data/BusRoutes';
import { calculateDistance as getDistance, haversineDistance } from '../../utils/distanceService';
import {
  startTrip,
  endTrip,
  getActiveTrip,
  updateTripLocation,
  completeStop
} from '../../services/busService';
import { MapContainer, RoutePolyline, StopMarker, BusMarker, BreadcrumbTrail } from '../../components/maps';
import { MAP_DEFAULTS } from '../../components/maps/mapConfig';
import { locationQueue } from '../../services/tileCache';

function DriverDashboard() {
  // ============================================
  // STATE MANAGEMENT
  // ============================================
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [activeTrip, setActiveTrip] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [tripStats, setTripStats] = useState({
    speed: 0,
    nextStop: null,
    stopsCompleted: 0,
    totalStops: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);

  // Map-related state
  const [viewMode, setViewMode] = useState('stats'); // 'stats' or 'map'
  const [breadcrumbs, setBreadcrumbs] = useState([]); // Location history for trail
  const [showRoutePreview, setShowRoutePreview] = useState(false);
  const [completedStopIndices, setCompletedStopIndices] = useState([]); // Track which stops have been marked completed

  const watchIdRef = useRef(null);
  const proximityThresholdRef = useRef(0.5); // 500 meters
  const activeTripRef = useRef(null); // Ref to avoid stale closure in GPS watcher
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Keep activeTripRef in sync with activeTrip state
  useEffect(() => {
    activeTripRef.current = activeTrip;
  }, [activeTrip]);

  // ============================================
  // CHECK AUTH & LOAD ACTIVE TRIP
  // ============================================
  useEffect(() => {
    if (!user) {
      navigate('/bus-login');
      return;
    }

    // Debug: Check user role
    console.log('[DriverDashboard] User:', user.email, 'Role:', user.role);

    // If user is not a driver, redirect to login
    if (user.role !== 'DRIVER') {
      console.error('[DriverDashboard] User is not a DRIVER, redirecting...');
      setError('You need to be registered as a driver. Please register first.');
      // Clear old token and redirect
      localStorage.removeItem('authToken');
      setTimeout(() => navigate('/bus-login'), 2000);
      return;
    }

    loadActiveTrip();

    // Cleanup GPS tracking on unmount
    return () => {
      if (watchIdRef.current) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, [user, navigate]);

  const loadActiveTrip = async () => {
    try {
      setLoading(true);
      const response = await getActiveTrip();
      const trip = response?.trip || response;
      if (trip && trip.id) {
        setActiveTrip(trip);
        setTripStats({
          speed: trip.averageSpeed || 0,
          nextStop: trip.stops[trip.currentStopIndex]?.stopName || 'N/A',
          stopsCompleted: trip.currentStopIndex,
          totalStops: trip.stops.length
        });
        // Resume GPS tracking if trip was active
        startGPSTracking(trip.id);
      }
    } catch (err) {
      console.log('No active trip found');
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // GPS TRACKING LOGIC
  // ============================================
  // Distance calculation:
  //   - OSRM (road distance) when online
  //   - Haversine (straight-line) when offline
  // Imported from distanceService.
  //
  // For quick proximity checks we still use the sync haversineDistance
  // to avoid async overhead on every GPS tick. The async getDistance is
  // used wherever we need an accurate road-network distance.
  const calculateDistance = useCallback(async (lat1, lng1, lat2, lng2) => {
    return await getDistance(lat1, lng1, lat2, lng2);
  }, []);

  // Auto-detect if driver reached next stop and mark it complete
  const checkAndCompleteStops = useCallback(async (currentLat, currentLng, tripId, currentStopIdx, stops) => {
    // Skip if no trip or all stops completed
    if (!tripId || !stops || currentStopIdx >= stops.length) {
      return;
    }

    // Check next stop proximity
    const nextStop = stops[currentStopIdx];
    if (!nextStop || !nextStop.latitude || !nextStop.longitude) {
      return;
    }

    // Use sync Haversine for proximity check (fast, no network overhead)
    const distanceToNextStop = haversineDistance(
      currentLat,
      currentLng,
      nextStop.latitude,
      nextStop.longitude
    );

    // If within threshold and not already marked, complete the stop
    if (distanceToNextStop <= proximityThresholdRef.current &&
      !completedStopIndices.includes(currentStopIdx)) {

      console.log(`📍 Driver reached "${nextStop.stopName}" (${(distanceToNextStop * 1000).toFixed(0)}m away). Marking as completed...`);

      try {
        await completeStop(tripId, currentStopIdx);

        // Update completed stops list
        setCompletedStopIndices(prev => [...prev, currentStopIdx]);

        // Update trip stats
        setTripStats(prev => ({
          ...prev,
          stopsCompleted: currentStopIdx + 1,
          nextStop: stops[currentStopIdx + 1]?.stopName || 'Final Stop'
        }));

        // Show notification
        console.log(`✅ Stop ${currentStopIdx + 1}/${stops.length} completed!`);
      } catch (err) {
        console.error('Failed to mark stop as completed:', err);
      }
    }
  }, [completedStopIndices]);

  const startGPSTracking = useCallback((tripId) => {
    // Guard against undefined tripId
    if (!tripId) {
      console.error('Cannot start GPS tracking: tripId is undefined');
      setGpsError('Cannot track location: Trip ID missing');
      return;
    }

    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    setGpsError(null);

    let hasReceivedPosition = false;

    const positionCallback = async (position) => {
      hasReceivedPosition = true;
      const { latitude, longitude } = position.coords;
      const timestamp = position.timestamp;

      setCurrentLocation({ latitude, longitude });

      // Add to breadcrumbs for trail display (limit to last 100 points)
      setBreadcrumbs(prev => {
        const newBreadcrumbs = [...prev, [latitude, longitude]];
        return newBreadcrumbs.slice(-100);
      });

      try {
        // Send location update to backend
        const response = await updateTripLocation(tripId, {
          latitude,
          longitude,
          timestamp
        });

        // Update stats from backend response
        if (response && response.trip) {
          setTripStats(prev => ({
            ...prev,
            speed: response.trip.averageSpeed || prev.speed
          }));
        }

        // ✅ AUTO-DETECT STOP COMPLETION BASED ON GPS PROXIMITY
        const currentTrip = activeTripRef.current;
        if (currentTrip && currentTrip.stops) {
          await checkAndCompleteStops(
            latitude,
            longitude,
            tripId,
            currentTrip.currentStopIndex,
            currentTrip.stops
          );
        }
      } catch (err) {
        console.error('Failed to update location online, queuing locally:', err);
        try {
          const queueLength = await locationQueue.add(tripId, {
            latitude,
            longitude,
            timestamp
          });
          console.log(`[Offline GPS Queue] Queued location update (queue size: ${queueLength})`);
        } catch (queueErr) {
          console.error('[Offline GPS Queue] Failed to queue location:', queueErr);
        }
      }
    };

    const errorCallback = (error) => {
      console.error('GPS Error:', error);
      // Fallback: if TIMEOUT with high accuracy and no position yet,
      // restart watcher with low accuracy
      if (error.code === error.TIMEOUT && !hasReceivedPosition) {
        console.log('[DriverDashboard] High-accuracy GPS timed out, falling back to low accuracy…');
        if (watchIdRef.current) {
          navigator.geolocation.clearWatch(watchIdRef.current);
        }
        watchIdRef.current = navigator.geolocation.watchPosition(
          positionCallback,
          (fallbackError) => {
            console.error('GPS Fallback Error:', fallbackError);
            switch (fallbackError.code) {
              case fallbackError.PERMISSION_DENIED:
                setGpsError('Location permission denied. Please enable GPS.');
                break;
              case fallbackError.POSITION_UNAVAILABLE:
                setGpsError('Location information unavailable.');
                break;
              case fallbackError.TIMEOUT:
                setGpsError('Location request timed out.');
                break;
              default:
                setGpsError('An unknown GPS error occurred.');
            }
          },
          {
            enableHighAccuracy: false,
            maximumAge: 30000,
            timeout: 30000
          }
        );
        return;
      }

      switch (error.code) {
        case error.PERMISSION_DENIED:
          setGpsError('Location permission denied. Please enable GPS.');
          break;
        case error.POSITION_UNAVAILABLE:
          setGpsError('Location information unavailable.');
          break;
        case error.TIMEOUT:
          setGpsError('Location request timed out.');
          break;
        default:
          setGpsError('An unknown GPS error occurred.');
      }
    };

    const watchId = navigator.geolocation.watchPosition(
      positionCallback,
      errorCallback,
      {
        enableHighAccuracy: true,
        maximumAge: 10000,
        timeout: 20000
      }
    );

    watchIdRef.current = watchId;
  }, []);

  const stopGPSTracking = useCallback(() => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
  }, []);

  // ============================================
  // TRIP ACTIONS
  // ============================================
  const handleStartTrip = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const route = BUS_ROUTES.find(r => r.routeId === selectedRouteId);
      if (!route) {
        throw new Error('Please select a valid route');
      }

      const response = await startTrip({
        routeId: route.routeId,
        routeName: route.routeName,
        fromPlace: route.fromPlace,
        toPlace: route.toPlace,
        stops: route.stops
      });

      const trip = response.trip;

      // Validate trip was created successfully
      if (!trip || !trip.id) {
        throw new Error('Failed to create trip - no trip ID returned');
      }

      setActiveTrip(trip);
      setTripStats({
        speed: 0,
        nextStop: trip.stops[0]?.stopName || 'N/A',
        stopsCompleted: 0,
        totalStops: trip.stops.length
      });

      // Start GPS tracking with validated tripId
      startGPSTracking(trip.id);

    } catch (err) {
      setError(err.message || 'Failed to start trip');
    } finally {
      setLoading(false);
    }
  };

  const handleStopTrip = async () => {
    if (!activeTrip || !activeTrip.id) {
      setError('No active trip to end');
      return;
    }

    const confirmStop = window.confirm(
      'Are you sure you want to end this trip? This action cannot be undone.'
    );

    if (!confirmStop) return;

    setLoading(true);
    setError(null);

    // Store tripId before stopping tracking
    const tripId = activeTrip.id;

    try {
      // Stop GPS tracking first
      stopGPSTracking();

      // End trip on backend
      await endTrip(tripId);

      // Reset state
      setActiveTrip(null);
      setSelectedRouteId('');
      setCurrentLocation(null);
      setBreadcrumbs([]); // Clear breadcrumb trail
      setViewMode('stats'); // Reset view mode
      setCompletedStopIndices([]); // Reset completed stops tracking
      setTripStats({
        speed: 0,
        nextStop: null,
        stopsCompleted: 0,
        totalStops: 0
      });

      alert('Trip completed successfully!');
    } catch (err) {
      console.error('End trip error:', err);
      setError(err.message || 'Failed to end trip');
      // Restart tracking if stop failed
      if (tripId) {
        startGPSTracking(tripId);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    // End any active trip before logging out
    if (activeTrip) {
      const confirmEnd = window.confirm(
        'You have an active trip. Do you want to end it before logging out?'
      );

      if (confirmEnd) {
        try {
          stopGPSTracking();
          await endTrip(activeTrip.id);
          setActiveTrip(null);
          setCompletedStopIndices([]); // Reset stops when trip ends
        } catch (err) {
          console.error('Failed to end trip on logout:', err);
          // Still allow logout even if trip end fails
        }
      } else {
        // User chose not to end trip - it will remain active
        // They can resume it on next login
        stopGPSTracking();
      }
    }

    await logout();
    navigate('/bus');
  };

  // ============================================
  // COMPUTED VALUES FOR MAPS
  // ============================================
  const selectedRoute = useMemo(() => {
    if (!selectedRouteId) return null;
    return BUS_ROUTES.find(r => r.routeId === selectedRouteId) || null;
  }, [selectedRouteId]);

  const activeRoute = useMemo(() => {
    if (!activeTrip?.routeId) return null;
    return BUS_ROUTES.find(r => r.routeId === activeTrip.routeId) || null;
  }, [activeTrip?.routeId]);

  // Calculate map center based on stops
  const getMapCenter = useCallback((route) => {
    if (!route || !route.stops || route.stops.length === 0) {
      return MAP_DEFAULTS.center;
    }

    // BusRoutes uses latitude/longitude, not lat/lng
    const validStops = route.stops.filter(s => s.latitude && s.longitude);
    if (validStops.length === 0) return MAP_DEFAULTS.center;

    const avgLat = validStops.reduce((sum, s) => sum + s.latitude, 0) / validStops.length;
    const avgLng = validStops.reduce((sum, s) => sum + s.longitude, 0) / validStops.length;
    return [avgLat, avgLng];
  }, []);

  // Get stop completion status
  const getStopStatus = useCallback((stopIndex) => {
    if (tripStats.stopsCompleted >= stopIndex + 1) return 'completed';
    if (tripStats.stopsCompleted === stopIndex) return 'current';
    return 'upcoming';
  }, [tripStats.stopsCompleted]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Driver Dashboard</h1>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-sm text-gray-500 hover:text-red-600 font-medium px-4 py-2 rounded-xl border border-gray-200 hover:border-red-200 transition-all duration-200"
          >
            Logout
          </button>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* GPS Error Display */}
        {gpsError && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-100 text-amber-700 rounded-xl text-sm">
            ⚠️ {gpsError}
          </div>
        )}

        <div className="bg-white shadow-sm border border-gray-100 rounded-2xl overflow-hidden">
          {/* ============================================ */}
          {/* NO ACTIVE TRIP - Show Route Selection */}
          {/* ============================================ */}
          {!activeTrip && (
            <form onSubmit={handleStartTrip} className="p-6 space-y-4">
              <div>
                <label htmlFor="route" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Route
                </label>
                <select
                  id="route"
                  value={selectedRouteId}
                  onChange={(e) => setSelectedRouteId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm transition-all duration-200"
                  disabled={loading}
                >
                  <option value="">-- Select a Route --</option>
                  {getActiveRoutes().map(route => (
                    <option key={route.routeId} value={route.routeId}>
                      {route.routeName} ({route.routeType})
                    </option>
                  ))}
                </select>
              </div>

              {/* Route Preview */}
              {selectedRoute && (
                <div className="space-y-3">
                  {/* Route Info Card */}
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-semibold text-emerald-900">Route Details:</p>
                      <button
                        type="button"
                        onClick={() => setShowRoutePreview(!showRoutePreview)}
                        className="text-sm text-emerald-600 hover:text-emerald-800 font-medium flex items-center gap-1 transition-colors duration-200"
                      >
                        🗺️ {showRoutePreview ? 'Hide Map' : 'Show Map'}
                      </button>
                    </div>
                    <p className="text-emerald-800">
                      📍 {selectedRoute.fromPlace} → {selectedRoute.toPlace}
                    </p>
                    <p className="text-emerald-700 text-sm mt-1">
                      🚏 {selectedRoute.stops.length} stops
                    </p>
                    <div className="mt-2 text-xs text-emerald-600">
                      {selectedRoute.stops.map((stop, idx) => (
                        <span key={stop.stopId}>
                          {stop.stopName}
                          {idx < selectedRoute.stops.length - 1 && ' → '}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Route Preview Map */}
                  {showRoutePreview && (
                    <div className="rounded-xl overflow-hidden border border-gray-200">
                      <div className="h-64">
                        <MapContainer
                          center={getMapCenter(selectedRoute)}
                          zoom={12}
                          className="h-full w-full"
                        >
                          {/* Route line */}
                          <RoutePolyline stops={selectedRoute.stops} />

                          {/* Stop markers */}
                          {selectedRoute.stops.map((stop, index) => (
                            <StopMarker
                              key={stop.stopId}
                              stop={stop}
                              index={index}
                              status="upcoming"
                            />
                          ))}
                        </MapContainer>
                      </div>
                      <div className="bg-gray-50 px-3 py-2 text-xs text-gray-500 text-center">
                        Preview of your route - GPS tracking starts when trip begins
                      </div>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !selectedRouteId}
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-4 px-4 rounded-xl hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-200 font-semibold text-lg disabled:bg-gray-200 disabled:text-gray-400 disabled:from-gray-200 disabled:to-gray-200 disabled:cursor-not-allowed"
              >
                {loading ? 'Starting Trip...' : '🚌 Start Trip'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/bus')}
                className="w-full bg-white text-gray-600 py-3 px-4 rounded-xl border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all duration-200 font-medium"
              >
                ← Back
              </button>
            </form>
          )}

          {/* ============================================ */}
          {/* ACTIVE TRIP - Show Trip Dashboard */}
          {/* ============================================ */}
          {activeTrip && (
            <div className="p-6 space-y-4">
              {/* Status Badge & View Toggle */}
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                  🟢 Trip Active
                </span>
                <div className="flex items-center gap-2">
                  {isTracking && (
                    <span className="text-xs text-gray-500 animate-pulse">
                      📡 GPS
                    </span>
                  )}
                  {/* View Toggle */}
                  <div className="flex rounded-xl overflow-hidden border border-gray-200">
                    <button
                      type="button"
                      onClick={() => setViewMode('stats')}
                      className={`px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${viewMode === 'stats'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      📊 Stats
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('map')}
                      className={`px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${viewMode === 'map'
                        ? 'bg-emerald-600 text-white'
                        : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                    >
                      🗺️ Map
                    </button>
                  </div>
                </div>
              </div>

              {/* Trip Info Card */}
              <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 text-white rounded-2xl p-5">
                <h3 className="font-bold text-lg">{activeTrip.routeName}</h3>
                <p className="text-emerald-100 text-sm mt-1">
                  {activeTrip.fromPlace} → {activeTrip.toPlace}
                </p>
                <p className="text-emerald-100 text-sm mt-2">
                  🚌 {activeTrip.vehicleNumber}
                </p>
              </div>

              {/* ============================================ */}
              {/* STATS VIEW */}
              {/* ============================================ */}
              {viewMode === 'stats' && (
                <>
                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                      <p className="text-2xl font-bold text-gray-900">
                        {tripStats.speed.toFixed(1)}
                      </p>
                      <p className="text-xs text-gray-500">km/h (avg speed)</p>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100">
                      <p className="text-2xl font-bold text-gray-900">
                        {tripStats.stopsCompleted}/{tripStats.totalStops}
                      </p>
                      <p className="text-xs text-gray-500">stops completed</p>
                    </div>
                  </div>

                  {/* Current Location */}
                  {currentLocation && (
                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                      <p className="text-xs text-gray-500 mb-1">Current GPS Location</p>
                      <p className="text-sm font-mono text-gray-700">
                        {currentLocation.latitude.toFixed(6)}, {currentLocation.longitude.toFixed(6)}
                      </p>
                    </div>
                  )}

                  {/* Next Stop */}
                  <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
                    <p className="text-sm text-amber-700 font-medium">Next Stop:</p>
                    <p className="text-lg font-bold text-amber-900">
                      📍 {tripStats.nextStop || 'N/A'}
                    </p>
                  </div>

                  {/* Trip Start Time */}
                  <div className="text-sm text-gray-500 text-center">
                    Started: {new Date(activeTrip.startTime).toLocaleString()}
                  </div>
                </>
              )}

              {/* ============================================ */}
              {/* MAP VIEW */}
              {/* ============================================ */}
              {viewMode === 'map' && activeRoute && (
                <div className="rounded-xl overflow-hidden border border-gray-200">
                  <div className="h-80 relative">
                    <MapContainer
                      center={currentLocation
                        ? [currentLocation.latitude, currentLocation.longitude]
                        : getMapCenter(activeRoute)
                      }
                      zoom={14}
                      className="h-full w-full"
                    >
                      {/* Route polyline */}
                      <RoutePolyline stops={activeRoute.stops} />

                      {/* Stop markers with completion status */}
                      {activeRoute.stops.map((stop, index) => (
                        <StopMarker
                          key={stop.stopId}
                          stop={stop}
                          index={index}
                          status={getStopStatus(index)}
                        />
                      ))}

                      {/* Driver's breadcrumb trail */}
                      {breadcrumbs.length > 1 && (
                        <BreadcrumbTrail positions={breadcrumbs} />
                      )}

                      {/* Driver's current position (bus marker) */}
                      {currentLocation && (
                        <BusMarker
                          position={currentLocation}
                          trip={activeTrip}
                          isMoving={tripStats.speed > 5}
                        />
                      )}
                    </MapContainer>

                    {/* Stats overlay on map */}
                    <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-lg px-3 py-2 shadow-md z-[1000]">
                      <div className="flex items-center gap-4 text-sm">
                        <span className="font-medium">
                          🚏 {tripStats.stopsCompleted}/{tripStats.totalStops}
                        </span>
                        <span className="text-gray-600">
                          ⚡ {tripStats.speed.toFixed(0)} km/h
                        </span>
                      </div>
                    </div>

                    {/* Breadcrumb count */}
                    {breadcrumbs.length > 0 && (
                      <div className="absolute top-2 right-2 bg-emerald-600/90 text-white rounded-lg px-2 py-1 text-xs z-[1000]">
                        📍 {breadcrumbs.length} points tracked
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Stop Trip Button */}
              <button
                onClick={handleStopTrip}
                disabled={loading}
                className="w-full bg-red-600 text-white py-4 px-4 rounded-xl hover:bg-red-700 active:scale-[0.98] transition-all duration-200 font-semibold text-lg disabled:bg-gray-200 disabled:text-gray-400"
              >
                {loading ? 'Ending Trip...' : '🛑 End Trip'}
              </button>

              <button
                type="button"
                onClick={() => navigate('/bus')}
                className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                ← Back to Bus Page
              </button>
            </div>
          )}
        </div>

        {/* Footer Info */}
        <p className="mt-4 text-center text-xs text-gray-400">
          GPS updates are sent every few seconds while trip is active.
        </p>
      </div>
    </div>
  );
}

export default DriverDashboard;
