import request from './api';

// Register driver
export function registerDriver(driverData) {
  return request('/bus/register', {
    method: 'POST',
    body: driverData
  });
}

// Get driver profile
export function getDriverProfile() {
  return request('/bus/profile');
}

// Start a new trip
export function startTrip(tripData) {
  return request('/bus/trip/start', {
    method: 'POST',
    body: tripData
  });
}

// Update trip location
export function updateTripLocation(tripId, location) {
  return request(`/bus/trip/${tripId}/location`, {
    method: 'PUT',
    body: location
  });
}

// Complete a stop
export function completeStop(tripId, stopIndex) {
  return request(`/bus/trip/${tripId}/stop/${stopIndex}/complete`, {
    method: 'PUT'
  });
}

// End a trip
export function endTrip(tripId) {
  return request(`/bus/trip/${tripId}/end`, {
    method: 'PUT'
  });
}

// Get active trip for driver
export function getActiveTrip() {
  return request('/bus/trip/active');
}

// Get driver's trip history
export function getDriverTrips(limit = 10) {
  return request(`/bus/trips?limit=${limit}`);
}

// Get all active trips (for passengers)
export function getAllActiveTrips() {
  return request('/bus/trips/active/all');
}

// Get nearest buses to a stop (for passengers)
export function getNearestBuses(stopId, lat, lng) {
  return request(`/bus/nearest?stopId=${stopId}&lat=${lat}&lng=${lng}`);
}

export default {
  registerDriver,
  getDriverProfile,
  startTrip,
  updateTripLocation,
  completeStop,
  endTrip,
  getActiveTrip,
  getDriverTrips,
  getAllActiveTrips,
  getNearestBuses
};
