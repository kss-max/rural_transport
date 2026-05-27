import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getAllActiveTrips } from '../../services/busService';
import { BUS_ROUTES } from '../../data/BusRoutes';
import { MapContainer, RoutePolyline, BusMarker, PassengerMarker } from '../../components/maps';
import useGeolocation from '../../hooks/useGeolocation';
import { calculateDistancesBatch } from '../../utils/distanceService';

function BusPassenger() {
    const [activeTrips, setActiveTrips] = useState([]);
    const [filteredTrips, setFilteredTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [sortedBuses, setSortedBuses] = useState([]);
    const [showMap, setShowMap] = useState(true);
    const [selectedBus, setSelectedBus] = useState(null);

    const navigate = useNavigate();
    const location = useLocation();
    const { user, loading: authLoading } = useAuth();

    // Get selected route from navigation state
    const selectedRoute = location.state?.selectedRoute;

    // Use geolocation hook
    const {
        location: passengerLocation,
        accuracy,
        loading: gettingLocation,
        error: locationError,
        getCurrentPosition,
        formattedAccuracy
    } = useGeolocation({ enableHighAccuracy: true });

    // Redirect if not logged in or no route selected
    useEffect(() => {
        if (!authLoading) {
            if (!user) {
                navigate('/bus/passenger-login');
            } else if (!selectedRoute) {
                navigate('/bus/select-route');
            }
        }
    }, [user, authLoading, selectedRoute, navigate]);

    // Get all unique stops from routes for reference
    const allStops = BUS_ROUTES.flatMap(route => route.stops);

    // Calculate map bounds
    const mapBounds = useMemo(() => {
        if (!selectedRoute?.stops?.length) return null;

        const allPoints = [...selectedRoute.stops];

        // Add passenger location
        if (passengerLocation) {
            allPoints.push(passengerLocation);
        }

        // Add bus locations
        filteredTrips.forEach(trip => {
            if (trip.currentLocation?.latitude) {
                allPoints.push(trip.currentLocation);
            }
        });

        const lats = allPoints.map(p => p.latitude).filter(Boolean);
        const lngs = allPoints.map(p => p.longitude).filter(Boolean);

        if (lats.length === 0) return null;

        return [
            [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
            [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01]
        ];
    }, [selectedRoute, passengerLocation, filteredTrips]);

    useEffect(() => {
        if (user && selectedRoute) {
            loadActiveTrips();
            // Refresh every 15 seconds
            const interval = setInterval(loadActiveTrips, 15000);
            return () => clearInterval(interval);
        }
    }, [user, selectedRoute]);

    // Recalculate distances when trips or passenger location changes
    useEffect(() => {
        if (passengerLocation && filteredTrips.length > 0) {
            calculateDistancesAndSort();
        }
    }, [passengerLocation, filteredTrips]);

    // Filter trips by selected route
    useEffect(() => {
        if (selectedRoute && activeTrips.length > 0) {
            const filtered = activeTrips.filter(trip =>
                trip.routeId === selectedRoute.routeId ||
                trip.routeName === selectedRoute.routeName ||
                (trip.fromPlace === selectedRoute.fromPlace && trip.toPlace === selectedRoute.toPlace)
            );
            setFilteredTrips(filtered);
        } else {
            setFilteredTrips([]);
        }
    }, [activeTrips, selectedRoute]);

    const loadActiveTrips = async () => {
        try {
            setLoading(true);
            const trips = await getAllActiveTrips();
            setActiveTrips(trips || []);
            setError(null);
        } catch (err) {
            console.error('Failed to load active trips:', err);
            setError('Unable to load active buses');
        } finally {
            setLoading(false);
        }
    };

    // Distance calculation – uses OSRM (road distance) when online,
    // Haversine (straight-line) when offline.  Imported from distanceService.

    // Calculate ETA based on distance and speed
    const calculateETA = (distanceKm, speedKmh) => {
        const speed = speedKmh || 25; // Default 25 km/h for rural areas
        const timeInHours = distanceKm / speed;
        const timeInMinutes = Math.round(timeInHours * 60);

        if (timeInMinutes < 1) return { text: 'Arriving now!', minutes: 0, arrivalTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };

        const arrivalTime = new Date(Date.now() + timeInMinutes * 60 * 1000);
        const arrivalTimeStr = arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        if (timeInMinutes < 60) {
            return {
                text: `~${timeInMinutes} min`,
                minutes: timeInMinutes,
                arrivalTime: arrivalTimeStr
            };
        }

        const hours = Math.floor(timeInMinutes / 60);
        const mins = timeInMinutes % 60;
        return {
            text: `~${hours}h ${mins}min`,
            minutes: timeInMinutes,
            arrivalTime: arrivalTimeStr
        };
    };

    // Calculate distances and sort buses by nearest (async – uses OSRM when online)
    const calculateDistancesAndSort = async () => {
        if (!passengerLocation) return;

        const tripsWithLocation = filteredTrips
            .filter(trip => trip.currentLocation?.latitude && trip.currentLocation?.longitude);

        // Build destinations array for batch calculation
        const destinations = tripsWithLocation.map(trip => ({
            lat: trip.currentLocation.latitude,
            lng: trip.currentLocation.longitude,
        }));

        // Single batch request when online, Haversine when offline
        const distances = await calculateDistancesBatch(
            passengerLocation.latitude,
            passengerLocation.longitude,
            destinations
        );

        const busesWithDistance = tripsWithLocation
            .map((trip, idx) => {
                const distance = distances[idx];
                const eta = calculateETA(distance, trip.averageSpeed);
                return {
                    ...trip,
                    distanceToPassenger: distance,
                    eta
                };
            })
            .sort((a, b) => a.distanceToPassenger - b.distanceToPassenger);

        setSortedBuses(busesWithDistance);
    };

    // Get buses to display (sorted if location available, otherwise filtered)
    const displayBuses = passengerLocation ? sortedBuses : filteredTrips;

    // Show loading while auth is checking
    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-200 border-t-emerald-600"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col overflow-hidden">
            {/* Header */}
            <div className="bg-white shadow-sm border-b border-gray-100 px-4 py-3 flex justify-between items-center">
                <div>
                    <h1 className="text-lg font-bold text-gray-900">🚌 Live Bus Tracker</h1>
                    <p className="text-xs text-gray-600">{selectedRoute?.routeName}</p>
                </div>
                <button
                    onClick={() => navigate('/bus/select-route')}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-medium transition-colors duration-200"
                >
                    ← Change Route
                </button>
            </div>

            {/* Map/List Toggle */}
            <div className="bg-white border-b border-gray-100 px-4 py-2 flex gap-2">
                <button
                    onClick={() => setShowMap(true)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${showMap ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    🗺️ Map View
                </button>
                <button
                    onClick={() => setShowMap(false)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${!showMap ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                        }`}
                >
                    📋 List View
                </button>
            </div>

            {/* Find My Location Button */}
            <div className="bg-white border-b border-gray-100 px-4 py-3">
                <button
                    onClick={getCurrentPosition}
                    disabled={gettingLocation}
                    className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold flex items-center justify-center gap-2 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:from-gray-200 disabled:to-gray-200"
                >
                    {gettingLocation ? (
                        <>
                            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
                            Getting Location...
                        </>
                    ) : (
                        <>📍 Find Nearest Bus</>
                    )}
                </button>
                {passengerLocation && (
                    <p className="text-xs text-emerald-600 mt-2 text-center">
                        ✅ Location found ({formattedAccuracy} accuracy)
                    </p>
                )}
                {locationError && (
                    <p className="text-xs text-red-600 mt-2 text-center">⚠️ {locationError}</p>
                )}
            </div>

            {/* Main Content */}
            <div className="flex-1 relative" style={{ minHeight: 0 }}>
                {showMap ? (
                    /* Map View */
                    <div style={{ height: '100%', minHeight: '400px' }}>
                        <MapContainer
                            bounds={mapBounds}
                            showLayerSwitcher={true}
                            showOfflineIndicator={true}
                            style={{ height: '100%', width: '100%' }}
                        >
                            {/* Route polyline and stops */}
                            {selectedRoute && (
                                <RoutePolyline
                                    stops={selectedRoute.stops}
                                    currentStopIndex={0}
                                    showStops={true}
                                />
                            )}

                            {/* Passenger location */}
                            {passengerLocation && (
                                <PassengerMarker
                                    position={passengerLocation}
                                    accuracy={accuracy}
                                    showAccuracyCircle={true}
                                />
                            )}

                            {/* Bus markers */}
                            {displayBuses.map((trip, index) => (
                                trip.currentLocation && (
                                    <BusMarker
                                        key={trip.id || index}
                                        position={trip.currentLocation}
                                        trip={trip}
                                        isMoving={trip.averageSpeed > 5}
                                        distance={trip.distanceToPassenger}
                                        eta={trip.eta}
                                        onClick={() => setSelectedBus(trip)}
                                    />
                                )
                            ))}
                        </MapContainer>

                        {/* Bus count overlay */}
                        <div className="absolute bottom-4 left-4 bg-white rounded-xl shadow-lg px-4 py-2.5 z-[500] border border-gray-100">
                            <p className="text-sm font-medium">
                                {displayBuses.length} bus{displayBuses.length !== 1 ? 'es' : ''} on route
                            </p>
                        </div>

                        {/* Loading overlay */}
                        {loading && (
                            <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-[500]">
                                <div className="text-center">
                                    <div className="animate-spin rounded-full h-10 w-10 border-4 border-emerald-200 border-t-emerald-600 mx-auto"></div>
                                    <p className="mt-2 text-sm text-gray-600">Loading buses...</p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    /* List View */
                    <div className="p-4 space-y-4 overflow-auto" style={{ maxHeight: 'calc(100vh - 220px)' }}>
                        {loading && (
                            <div className="text-center py-8">
                                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600 mx-auto"></div>
                                <p className="mt-3 text-gray-600">Loading buses...</p>
                            </div>
                        )}

                        {error && (
                            <div className="bg-red-50 border border-red-100 text-red-600 rounded-xl p-4 text-sm">
                                {error}
                                <button onClick={loadActiveTrips} className="ml-2 underline">Retry</button>
                            </div>
                        )}

                        {!loading && displayBuses.length === 0 && (
                            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center">
                                <p className="text-amber-800 text-lg">🚫 No active buses on this route</p>
                                <p className="text-amber-600 text-sm mt-2">Check back later</p>
                                <button
                                    onClick={() => navigate('/bus/select-route')}
                                    className="mt-4 bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-200"
                                >
                                    Try Different Route
                                </button>
                            </div>
                        )}

                        {displayBuses.map((trip, index) => (
                            <div
                                key={trip.id || index}
                                className={`bg-white rounded-2xl shadow-sm p-4 border transition-all duration-200 hover:shadow-md ${index === 0 && passengerLocation
                                    ? 'border-emerald-200 ring-2 ring-emerald-100'
                                    : 'border-gray-100'
                                    }`}
                            >
                                {/* Nearest badge */}
                                {index === 0 && passengerLocation && (
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-bold px-3 py-1 rounded-full mb-3 inline-block">
                                        🏆 NEAREST BUS
                                    </span>
                                )}

                                {/* Route info */}
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900">
                                            {trip.routeName || `${trip.fromPlace} → ${trip.toPlace}`}
                                        </h3>
                                        <p className="text-sm text-gray-600">🚐 {trip.vehicleNumber}</p>
                                    </div>
                                    <span className="bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs font-semibold px-2.5 py-1 rounded-full animate-pulse">
                                        🔴 LIVE
                                    </span>
                                </div>

                                {/* Distance & ETA */}
                                {trip.distanceToPassenger !== undefined && (
                                    <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-4 mb-3 border border-emerald-100">
                                        <div className="grid grid-cols-3 gap-4 text-center">
                                            <div>
                                                <p className="text-xs text-gray-500">Distance</p>
                                                <p className="font-bold text-xl text-emerald-700">
                                                    {trip.distanceToPassenger.toFixed(1)} km
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">ETA</p>
                                                <p className="font-bold text-xl text-teal-700">
                                                    {trip.eta?.text || 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-xs text-gray-500">Arrives</p>
                                                <p className="font-bold text-xl text-purple-700">
                                                    {trip.eta?.arrivalTime || 'N/A'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Speed & Next Stop */}
                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                                        <p className="text-xs text-gray-500">Speed</p>
                                        <p className="font-semibold">
                                            {trip.averageSpeed ? `${Math.round(trip.averageSpeed)} km/h` : 'N/A'}
                                        </p>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-2.5 border border-gray-100">
                                        <p className="text-xs text-gray-500">Next Stop</p>
                                        <p className="font-semibold truncate">
                                            {trip.stops?.[trip.currentStopIndex]?.stopName || 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                {/* Driver contact */}
                                {trip.driverId?.phoneNumber && (
                                    <a
                                        href={`tel:${trip.driverId.phoneNumber}`}
                                        className="block bg-emerald-50 rounded-xl p-3 text-center text-emerald-700 font-medium border border-emerald-100 hover:bg-emerald-100 transition-colors duration-200"
                                    >
                                        📞 Call Driver: {trip.driverId.phoneNumber}
                                    </a>
                                )}

                                {/* Progress bar */}
                                <div className="mt-3">
                                    <p className="text-xs text-gray-500 mb-1">
                                        Progress: {trip.currentStopIndex || 0}/{trip.stops?.length || 0} stops
                                    </p>
                                    <div className="flex gap-1">
                                        {trip.stops?.map((_, idx) => (
                                            <div
                                                key={idx}
                                                className={`h-2 flex-1 rounded-full ${idx < (trip.currentStopIndex || 0)
                                                    ? 'bg-emerald-500'
                                                    : idx === trip.currentStopIndex
                                                        ? 'bg-amber-500 animate-pulse'
                                                        : 'bg-gray-200'
                                                    }`}
                                            />
                                        ))}
                                    </div>
                                </div>

                                <p className="text-xs text-gray-400 mt-2">
                                    📡 Updated: {trip.lastLocationUpdate
                                        ? new Date(trip.lastLocationUpdate).toLocaleTimeString()
                                        : 'N/A'}
                                </p>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Auto-refresh indicator */}
            <div className="bg-white border-t border-gray-100 px-4 py-2 text-center text-xs text-gray-400">
                🔄 Auto-refreshes every 15 seconds
            </div>
        </div>
    );
}

export default BusPassenger;
