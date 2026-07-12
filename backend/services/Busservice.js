const Driver = require('../models/Driver');
const BusTrip = require('../models/BusTrip');
const User = require('../models/User');
const { calculateDistance, haversineDistance } = require('./distanceService');

// ============================================
// DISTANCE CALCULATION
// ============================================
// Uses OSRM API (real road distance) when the server can reach
// the internet, and falls back to the Haversine formula otherwise.
// Imported from services/distanceService.js

// Default speed for rural areas (km/h) - used when no speed data available
const DEFAULT_RURAL_SPEED = 25;

// Register a new driver
const registerDriver = async (driverData) => {
  try {
    const { userId, email, vehicleNumber, licenseNumber, phoneNumber } = driverData;

    // Check if driver already exists
    const existingDriver = await Driver.findOne({ 
      $or: [{ email }, { vehicleNumber }, { licenseNumber }] 
    });
    
    if (existingDriver) {
      throw new Error('Driver with this email, vehicle number, or license number already exists');
    }

    // Create new driver
    const driver = new Driver({
      userId,
      email,
      vehicleNumber,
      licenseNumber,
      phoneNumber,
      isActive: true
    });

    await driver.save();

    // Update user role to DRIVER
    await User.findByIdAndUpdate(userId, { role: 'DRIVER' });

    return driver;
  } catch (error) {
    throw new Error(`Driver registration failed: ${error.message}`);
  }
};

// Get driver by userId
const getDriverByUserId = async (userId) => {
  try {
    const driver = await Driver.findOne({ userId }).populate('userId', 'email role');
    if (!driver) {
      throw new Error('Driver not found');
    }
    return driver;
  } catch (error) {
    throw new Error(`Failed to fetch driver: ${error.message}`);
  }
};

// Start a new bus trip
const startTrip = async (driverId, tripData) => {
  try {
    const { routeId, routeName, fromPlace, toPlace, stops } = tripData;

    // Get driver info
    const driver = await Driver.findById(driverId);
    if (!driver) {
      throw new Error('Driver not found');
    }

    // Check if driver already has an active trip
    if (driver.currentTripId) {
      throw new Error('Driver already has an active trip');
    }

    // Format stops with initial status
    const formattedStops = stops.map(stop => ({
      stopId: stop.stopId,
      stopName: stop.stopName,
      latitude: stop.latitude,
      longitude: stop.longitude,
      isCompleted: false
    }));

    // Create new bus trip
    const busTrip = new BusTrip({
      driverId,
      routeId,
      routeName,
      fromPlace,
      toPlace,
      vehicleNumber: driver.vehicleNumber,
      status: 'STARTED',
      startTime: new Date(),
      stops: formattedStops,
      currentStopIndex: 0,
      totalPassengers: 0,
      totalFare: 0
    });

    await busTrip.save();

    // Update driver's current trip
    driver.currentTripId = busTrip._id;
    await driver.save();

    return busTrip;
  } catch (error) {
    throw new Error(`Failed to start trip: ${error.message}`);
  }
};

// Update trip location with speed calculation
const updateTripLocation = async (tripId, location) => {
  try {
    const trip = await BusTrip.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.status === 'COMPLETED' || trip.status === 'CANCELLED') {
      throw new Error('Cannot update location for completed or cancelled trip');
    }

    const { latitude, longitude, timestamp } = location;
    const newTimestamp = timestamp ? new Date(timestamp) : new Date();

    // Calculate speed if previous location exists
    if (trip.currentLocation.latitude && trip.currentLocation.longitude && trip.lastLocationUpdate) {
      const distance = await calculateDistance(
        trip.currentLocation.latitude,
        trip.currentLocation.longitude,
        latitude,
        longitude
      );
      
      const timeDiff = (newTimestamp.getTime() - trip.lastLocationUpdate.getTime()) / 1000 / 3600; // hours
      
      // Prevent division by zero
      if (timeDiff > 0) {
        const speed = distance / timeDiff; // km/h
        
        // Filter out unrealistic speeds (> 120 km/h for rural buses)
        if (speed < 120) {
          // Store speed in array (last 10 updates)
          if (!trip.speeds) trip.speeds = [];
          trip.speeds.push(speed);
          if (trip.speeds.length > 10) trip.speeds.shift();
          
          // Calculate rolling average
          trip.averageSpeed = trip.speeds.reduce((a, b) => a + b, 0) / trip.speeds.length;
        }
      }
    }

    trip.currentLocation = { latitude, longitude };
    trip.lastLocationUpdate = newTimestamp;

    await trip.save();
    return trip;
  } catch (error) {
    throw new Error(`Failed to update trip location: ${error.message}`);
  }
};

// Mark stop as completed
const completeStop = async (tripId, stopIndex) => {
  try {
    const trip = await BusTrip.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (stopIndex < 0 || stopIndex >= trip.stops.length) {
      throw new Error('Invalid stop index');
    }

    trip.stops[stopIndex].isCompleted = true;
    trip.stops[stopIndex].arrivedAt = new Date();
    trip.currentStopIndex = stopIndex + 1;

    await trip.save();
    return trip;
  } catch (error) {
    throw new Error(`Failed to complete stop: ${error.message}`);
  }
};

// End/Complete a trip
const endTrip = async (tripId) => {
  try {
    const trip = await BusTrip.findById(tripId);
    if (!trip) {
      throw new Error('Trip not found');
    }

    if (trip.status === 'COMPLETED') {
      throw new Error('Trip already completed');
    }

    trip.status = 'COMPLETED';
    trip.endTime = new Date();

    await trip.save();

    // Update driver's status
    const driver = await Driver.findById(trip.driverId);
    if (driver) {
      driver.currentTripId = null;
      driver.totalTripsCompleted += 1;
      await driver.save();
    }

    return trip;
  } catch (error) {
    throw new Error(`Failed to end trip: ${error.message}`);
  }
};

// Get active trip for a driver
const getActiveTrip = async (driverId) => {
  try {
    const trip = await BusTrip.findOne({ 
      driverId, 
      status: 'STARTED'
    });
    return trip;
  } catch (error) {
    throw new Error(`Failed to fetch active trip: ${error.message}`);
  }
};

// Get all trips for a driver
const getDriverTrips = async (driverId, limit = 10) => {
  try {
    const trips = await BusTrip.find({ driverId })
      .sort({ startTime: -1 })
      .limit(limit);
    return trips;
  } catch (error) {
    throw new Error(`Failed to fetch driver trips: ${error.message}`);
  }
};
 
// Get all active trips (for passengers to see available buses)
const getAllActiveTrips = async () => {
  try {
    const trips = await BusTrip.find({ 
      status: 'STARTED'
    })
    .populate('driverId', 'email phoneNumber rating')
    .sort({ startTime: -1 });
    return trips;
  } catch (error) {
    throw new Error(`Failed to fetch active trips: ${error.message}`);
  }
};

// ============================================
// NEAREST BUS - For Passengers
// ============================================
// Find nearest active buses to a specific stop
const getNearestBuses = async (stopId, stopLat, stopLng) => {
  try {
    // Get all active trips
    const activeTrips = await BusTrip.find({ 
      status: 'STARTED',
      'currentLocation.latitude': { $exists: true, $ne: null },
      'currentLocation.longitude': { $exists: true, $ne: null }
    }).populate('driverId', 'phoneNumber rating vehicleNumber');

    // Calculate distance and ETA for each bus
    const busesWithDistance = (await Promise.all(activeTrips.map(async (trip) => {
      // Check if bus has this stop in its route
      const stopIndex = trip.stops.findIndex(s => s.stopId === stopId);
      if (stopIndex === -1) return null; // Bus doesn't go to this stop

      // Calculate distance from bus to stop (road distance via OSRM when available)
      const distance = await calculateDistance(
        trip.currentLocation.latitude,
        trip.currentLocation.longitude,
        stopLat,
        stopLng
      );

      // Use averageSpeed or default rural speed (25 km/h)
      const speed = trip.averageSpeed > 0 ? trip.averageSpeed : DEFAULT_RURAL_SPEED;
      
      // Calculate ETA in minutes
      const etaMinutes = Math.round((distance / speed) * 60);

      // Find next stop
      const nextStopIndex = trip.currentStopIndex;
      const nextStop = trip.stops[nextStopIndex] || trip.stops[trip.stops.length - 1];

      return {
        tripId: trip._id,
        busNumber: trip.vehicleNumber,
        routeId: trip.routeId,
        routeName: trip.routeName,
        fromPlace: trip.fromPlace,
        toPlace: trip.toPlace,
        currentLocation: trip.currentLocation,
        nextStop: nextStop ? nextStop.stopName : 'N/A',
        distanceFromStop: Math.round(distance * 100) / 100, // 2 decimal places
        eta: etaMinutes,
        speed: Math.round(speed * 10) / 10,
        driverPhone: trip.driverId?.phoneNumber || 'N/A',
        driverRating: trip.driverId?.rating || 5,
        totalPassengers: trip.totalPassengers,
        stopsRemaining: trip.stops.length - trip.currentStopIndex
      };
    }))).filter(bus => bus !== null);

    // Sort by distance (nearest first)
    busesWithDistance.sort((a, b) => a.distanceFromStop - b.distanceFromStop);

    return busesWithDistance;
  } catch (error) {
    throw new Error(`Failed to get nearest buses: ${error.message}`);
  }
};

module.exports = {
  registerDriver,
  getDriverByUserId,
  startTrip,
  updateTripLocation,
  completeStop,
  endTrip,
  getActiveTrip,
  getDriverTrips,
  getAllActiveTrips,
  getNearestBuses,
  DEFAULT_RURAL_SPEED
};
