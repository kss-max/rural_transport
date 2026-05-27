const express = require('express');
const router = express.Router();
const busService = require('../services/Busservice');
const { requireAuth, requireDriver } = require('../middleware/auth');

// Register a new driver
router.post('/register', requireAuth, async (req, res) => {
  try {
    const { email, vehicleNumber, licenseNumber, phoneNumber } = req.body;
    
    // Create driver with userId from authenticated user
    const driver = await busService.registerDriver({
      userId: req.user.id,
      email,
      vehicleNumber,
      licenseNumber,
      phoneNumber
    });

    res.status(201).json({
      message: 'Driver registered successfully',
      driver
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get driver profile
router.get('/profile', requireAuth, requireDriver, async (req, res) => {
  try {
    const driver = await busService.getDriverByUserId(req.user.id);
    res.json(driver);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
});

// Start a new trip
router.post('/trip/start', requireAuth, requireDriver, async (req, res) => {
  try {
    const { routeId, routeName, fromPlace, toPlace, stops } = req.body;
    
    // Get driver by userId
    const driver = await busService.getDriverByUserId(req.user.id);
    
    const trip = await busService.startTrip(driver._id, {
      routeId,
      routeName,
      fromPlace,
      toPlace,
      stops
    });

    res.status(201).json({
      message: 'Trip started successfully',
      trip
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update trip location (with speed calculation)
router.put('/trip/:tripId/location', requireAuth, requireDriver, async (req, res) => {
  try {
    const { tripId } = req.params;
    const { latitude, longitude, timestamp } = req.body;
    
    // Log incoming location updates
    console.log(`📍 Location Update - Trip: ${tripId}, Lat: ${latitude}, Lng: ${longitude}, Time: ${new Date(timestamp).toLocaleTimeString()}`);
    
    const trip = await busService.updateTripLocation(tripId, { latitude, longitude, timestamp });
    
    res.json({
      message: 'Location updated successfully',
      trip: {
        _id: trip._id,
        currentLocation: trip.currentLocation,
        averageSpeed: trip.averageSpeed,
        lastLocationUpdate: trip.lastLocationUpdate
      }
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Complete a stop
router.put('/trip/:tripId/stop/:stopIndex/complete', requireAuth, requireDriver, async (req, res) => {
  try {
    const { tripId, stopIndex } = req.params;
    
    const trip = await busService.completeStop(tripId, parseInt(stopIndex));
    
    res.json({
      message: 'Stop completed successfully',
      trip
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// End a trip
router.put('/trip/:tripId/end', requireAuth, requireDriver, async (req, res) => {
  try {
    const { tripId } = req.params;
    
    const trip = await busService.endTrip(tripId);
    
    res.json({
      message: 'Trip ended successfully',
      trip
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get active trip for logged-in driver
router.get('/trip/active', requireAuth, requireDriver, async (req, res) => {
  try {
    const driver = await busService.getDriverByUserId(req.user.id);
    const trip = await busService.getActiveTrip(driver._id);
    
    if (!trip) {
      return res.json({ message: 'No active trip', trip: null });
    }
    
    res.json({ trip });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get driver's trip history
router.get('/trips', requireAuth, requireDriver, async (req, res) => {
  try {
    const driver = await busService.getDriverByUserId(req.user.id);
    const limit = parseInt(req.query.limit) || 10;
    
    const trips = await busService.getDriverTrips(driver._id, limit);
    
    res.json(trips);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get all active trips (public - for passengers)
router.get('/trips/active/all', async (req, res) => {
  try {
    const trips = await busService.getAllActiveTrips();
    res.json(trips);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// ============================================
// NEAREST BUS ENDPOINT - For Passengers
// ============================================
// GET /api/bus/nearest?stopId=S101&lat=12.8234&lng=75.1234
router.get('/nearest', async (req, res) => {
  try {
    const { stopId, lat, lng } = req.query;

    if (!stopId || !lat || !lng) {
      return res.status(400).json({ 
        error: 'Missing required parameters: stopId, lat, lng' 
      });
    }

    const stopLat = parseFloat(lat);
    const stopLng = parseFloat(lng);

    if (isNaN(stopLat) || isNaN(stopLng)) {
      return res.status(400).json({ 
        error: 'Invalid coordinates: lat and lng must be numbers' 
      });
    }

    const buses = await busService.getNearestBuses(stopId, stopLat, stopLng);

    res.json({
      stopId,
      stopLocation: { latitude: stopLat, longitude: stopLng },
      totalBuses: buses.length,
      buses
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
