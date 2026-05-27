import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { BUS_ROUTES, getAllPlaces, getActiveRoutes } from '../../data/BusRoutes';
import { MapContainer, RoutePolyline } from '../../components/maps';
import { cacheRouteArea } from '../../services/tileCache';

function BusRouteSelection() {
    const navigate = useNavigate();
    const { user, loading: authLoading } = useAuth();
    const [fromPlace, setFromPlace] = useState('');
    const [toPlace, setToPlace] = useState('');
    const [availableRoutes, setAvailableRoutes] = useState([]);
    const [selectedRoute, setSelectedRoute] = useState(null);
    const [caching, setCaching] = useState(false);
    const [cacheProgress, setCacheProgress] = useState(0);

    const allPlaces = getAllPlaces();
    const activeRoutes = getActiveRoutes();

    // Calculate map bounds for selected route
    const mapBounds = useMemo(() => {
        if (!selectedRoute || !selectedRoute.stops || selectedRoute.stops.length === 0) {
            return null;
        }
        const lats = selectedRoute.stops.map(s => s.latitude).filter(Boolean);
        const lngs = selectedRoute.stops.map(s => s.longitude).filter(Boolean);
        if (lats.length === 0 || lngs.length === 0) return null;

        return [
            [Math.min(...lats) - 0.01, Math.min(...lngs) - 0.01],
            [Math.max(...lats) + 0.01, Math.max(...lngs) + 0.01]
        ];
    }, [selectedRoute]);

    // Redirect if not logged in
    useEffect(() => {
        if (!authLoading && !user) {
            navigate('/bus/passenger-login');
        }
    }, [user, authLoading, navigate]);

    // Filter routes based on from/to selection
    useEffect(() => {
        let filtered = activeRoutes;

        if (fromPlace) {
            filtered = filtered.filter(route => route.fromPlace === fromPlace);
        }
        if (toPlace) {
            filtered = filtered.filter(route => route.toPlace === toPlace);
        }

        setAvailableRoutes(filtered);
        setSelectedRoute(null);
    }, [fromPlace, toPlace]);

    // Get available "to" places based on selected "from" place
    const getAvailableToPlaces = () => {
        if (!fromPlace) return allPlaces;
        const routes = activeRoutes.filter(r => r.fromPlace === fromPlace);
        return [...new Set(routes.map(r => r.toPlace))].sort();
    };

    const handleTrackBuses = async () => {
        if (selectedRoute) {
            // Cache route tiles for offline use
            setCaching(true);
            try {
                await cacheRouteArea(selectedRoute, 'street', (progress) => {
                    setCacheProgress(progress.percent);
                });
            } catch (err) {
                console.warn('Failed to cache route tiles:', err);
            }
            setCaching(false);

            // Navigate with selected route
            navigate('/bus/track', { state: { selectedRoute } });
        }
    };

    const handleSelectRoute = (route) => {
        setSelectedRoute(route);
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin"></div>
            </div>
        );
    }

    const selectClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-150 bg-white";

    return (
        <div className="max-w-2xl mx-auto py-4">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">🚌 Select Your Route</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Choose where you want to travel</p>
                </div>
                <button
                    onClick={() => navigate('/bus')}
                    className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-all duration-150"
                >
                    ← Back
                </button>
            </div>

            {/* User Info */}
            {user && (
                <div className="bg-emerald-50 rounded-xl p-3 mb-6 text-sm text-emerald-700">
                    👤 Logged in as: <strong>{user.email}</strong>
                </div>
            )}

            {/* Route Selection Form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                <h2 className="text-base font-semibold text-gray-900 mb-4">Where are you traveling?</h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">From</label>
                        <select
                            value={fromPlace}
                            onChange={(e) => {
                                setFromPlace(e.target.value);
                                setToPlace('');
                            }}
                            className={selectClass}
                        >
                            <option value="">Select starting point</option>
                            {allPlaces.map(place => (
                                <option key={place} value={place}>{place}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">To</label>
                        <select
                            value={toPlace}
                            onChange={(e) => setToPlace(e.target.value)}
                            className={selectClass}
                            disabled={!fromPlace}
                        >
                            <option value="">Select destination</option>
                            {getAvailableToPlaces().map(place => (
                                <option key={place} value={place}>{place}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {(fromPlace || toPlace) && (
                    <button
                        onClick={() => {
                            setFromPlace('');
                            setToPlace('');
                            setSelectedRoute(null);
                        }}
                        className="text-sm text-gray-400 hover:text-gray-600 transition-all duration-150"
                    >
                        Clear selection
                    </button>
                )}
            </div>

            {/* Available Routes */}
            {availableRoutes.length > 0 && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-4">
                        Available Routes ({availableRoutes.length})
                    </h2>

                    <div className="space-y-3">
                        {availableRoutes.map(route => (
                            <div
                                key={route.routeId}
                                onClick={() => handleSelectRoute(route)}
                                className={`border rounded-xl p-4 cursor-pointer transition-all duration-150 ${selectedRoute?.routeId === route.routeId
                                    ? 'border-emerald-300 bg-emerald-50 ring-1 ring-emerald-200'
                                    : 'border-gray-200 hover:border-emerald-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 text-sm">
                                            {route.routeName}
                                        </h3>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            {route.stops.length} stops • {route.routeType}
                                        </p>
                                    </div>
                                    {selectedRoute?.routeId === route.routeId && (
                                        <span className="bg-emerald-600 text-white text-xs px-2 py-1 rounded-lg font-medium">
                                            ✓ Selected
                                        </span>
                                    )}
                                </div>

                                <div className="mt-2 flex items-center gap-1 flex-wrap">
                                    {route.stops.map((stop, idx) => (
                                        <span key={stop.stopId} className="flex items-center">
                                            <span className="text-xs text-gray-400">{stop.stopName}</span>
                                            {idx < route.stops.length - 1 && (
                                                <span className="text-gray-300 mx-1">→</span>
                                            )}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* No Routes Found */}
            {fromPlace && toPlace && availableRoutes.length === 0 && (
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 text-center mb-6">
                    <p className="text-amber-700 text-sm">
                        🚫 No direct routes found from {fromPlace} to {toPlace}
                    </p>
                    <p className="text-xs text-amber-500 mt-1">
                        Try selecting different locations
                    </p>
                </div>
            )}

            {/* Route Map Preview */}
            {selectedRoute && (
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 mb-6">
                    <h2 className="text-base font-semibold text-gray-900 mb-3">
                        🗺️ Route Preview
                    </h2>
                    <div className="h-64 rounded-xl overflow-hidden border border-gray-100">
                        <MapContainer
                            bounds={mapBounds}
                            showLayerSwitcher={true}
                            showOfflineIndicator={false}
                            style={{ height: '100%', width: '100%' }}
                        >
                            <RoutePolyline
                                stops={selectedRoute.stops}
                                currentStopIndex={0}
                                showStops={true}
                            />
                        </MapContainer>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                        📍 {selectedRoute.stops.length} stops • Switch to Satellite view for rural landmarks
                    </p>
                </div>
            )}

            {/* Track Buses Button */}
            <button
                onClick={handleTrackBuses}
                disabled={!selectedRoute || caching}
                className={`w-full py-4 px-6 rounded-2xl font-semibold text-base transition-all ${selectedRoute && !caching
                    ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] shadow-sm hover:shadow-md'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
            >
                {caching ? (
                    <span className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        Preparing offline maps... {cacheProgress}%
                    </span>
                ) : selectedRoute ? (
                    `🔍 Track Buses on ${selectedRoute.routeName}`
                ) : (
                    '🔍 Select a route to track buses'
                )}
            </button>

            {/* Info */}
            <div className="mt-6 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <h3 className="font-semibold text-gray-900 text-sm mb-3">ℹ️ How it works</h3>
                <ul className="text-sm text-gray-500 space-y-1.5">
                    <li>1. Select your starting point and destination</li>
                    <li>2. Choose from available routes</li>
                    <li>3. Track only buses running on your selected route</li>
                    <li>4. Get real-time ETA based on your location</li>
                </ul>
            </div>
        </div>
    );
}

export default BusRouteSelection;
