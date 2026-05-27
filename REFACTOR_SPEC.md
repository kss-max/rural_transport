# 🚌 Driver Dashboard Refactor Specification
## Implementation-Ready Handoff Document

**Current Status**: Project analysis complete  
**Date**: Jan 28, 2026  
**Stack**: React 19 + Vite | Express + MongoDB

---

## 📋 Project Analysis Summary

### ✅ Current Architecture
- **Backend**: Express REST API with Passport JWT auth
- **Frontend**: React Router v7, Tailwind CSS, Vite
- **Models**: BusTrip, Driver, User, Vehicle, Booking schemas exist
- **Routes**: Predefined BUS_ROUTES with GPS coordinates for all stops
- **Service Layer**: `Busservice.js` has `startTrip()`, `updateTripLocation()`, `completeStop()`, `endTrip()`
- **Frontend Services**: `busService.js` already has API calls for start/end trip

### ⚠️ Current Issue (Buslogin.jsx)
**File**: [frontend/src/pages/bus/Buslogin.jsx](frontend/src/pages/bus/Buslogin.jsx)  
**Problem**: Single component doing 4 things:
1. Login form
2. Registration form  
3. Trip selection/start
4. Active trip dashboard

**Result**: Bloated ~410 line component, hard to maintain

---

## 🎯 Phase 1: Frontend Refactor (CRITICAL FIRST STEP)

### 1.1 Keep in Buslogin.jsx
- Login form → calls `login()` from AuthContext
- Registration form → calls `registerDriver()` from busService
- **Only navigation logic**: After successful login/register → redirect to `/bus/driver-dashboard`

### 1.2 Create NEW: DriverDashboard.jsx
**Location**: `/frontend/src/pages/bus/DriverDashboard.jsx`  
**Purpose**: Full driver trip management interface

#### State Management
```javascript
const [selectedRouteId, setSelectedRouteId] = useState('');
const [activeTrip, setActiveTrip] = useState(null);
const [isTracking, setIsTracking] = useState(false);
const [watchId, setWatchId] = useState(null);
const [tripStats, setTripStats] = useState({
  distance: 0,
  speed: 0,
  nextStop: null
});
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
```

#### UI Components
1. **Route Selection Panel**
   - Dropdown using `getActiveRoutes()` from BUS_ROUTES
   - Shows route details (from, to, number of stops)
   - Only active when no trip running

2. **Start Trip Button**
   - Disabled if no route selected
   - Calls backend: `POST /api/bus/trip/start`
   - On success: saves tripId, starts GPS tracking

3. **Active Trip Card** (when activeTrip exists)
   - Route name + vehicle number
   - Status badge (🟢 ACTIVE / 🔴 INACTIVE)
   - Current location (lat/lng)
   - Next stop info
   - Stop ETA
   - Stop Trip button

4. **Trip Stats Panel**
   - Distance traveled (km)
   - Average speed (km/h)
   - Current stop index / total stops

#### GPS Tracking Logic (Frontend)
```javascript
// When driver clicks "Start Trip"
const handleStartTrip = async () => {
  setLoading(true);
  try {
    const trip = await startTrip({
      routeId: selectedRouteId,
      // ... route data from BUS_ROUTES
    });
    setActiveTrip(trip);
    setIsTracking(true);
    startGPSTracking(trip._id); // ← New function
  } catch (err) {
    setError(err.message);
  }
};

// GPS Tracking - AUTOMATIC (runs every ~5 seconds)
const startGPSTracking = (tripId) => {
  const id = navigator.geolocation.watchPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      const timestamp = position.timestamp; // ← Correct: from position, not position.coords
      
      // Send to backend
      await updateTripLocation(tripId, {
        lat: latitude,
        lng: longitude,
        timestamp
      });
    },
    (error) => console.error('GPS Error:', error),
    {
      enableHighAccuracy: true,
      maximumAge: 0,
      timeout: 5000
    }
  );
  
  setWatchId(id);
};

// When driver clicks "Stop Trip"
const handleStopTrip = async () => {
  navigator.geolocation.clearWatch(watchId); // ← Stop GPS
  await endTrip(activeTrip._id);
  setActiveTrip(null);
  setIsTracking(false);
  setSelectedRouteId('');
};
```

#### Error Handling
- GPS permission denied → show user-friendly message
- Network error during location update → retry with exponential backoff
- Trip already active → prevent duplicate start

---

### 1.3 Update Routes (routes.jsx)
```javascript
// Add new route
{ path: '/bus/driver-dashboard', element: <DriverDashboard /> }

// Buslogin redirect logic
// After login success → navigate('/bus/driver-dashboard')
```

### 1.4 Update Buslogin.jsx Navigation
```javascript
// In handleLogin success callback
navigate('/bus/driver-dashboard');

// In handleRegisterDriver success callback
navigate('/bus/driver-dashboard');
```

---

## 🔧 Phase 2: Backend API Updates

### 2.1 Update Trip Start API
**Endpoint**: `PUT /api/bus/trip/start` (exists but verify request format)

**Current**: ✅ Mostly correct  
**Needed Fix**: Ensure response includes `tripId`

```json
{
  "statusCode": 201,
  "message": "Trip started",
  "trip": {
    "_id": "T456_ObjectId",      // ← tripId for frontend
    "status": "STARTED",
    "startTime": "2026-01-28T10:30:00Z",
    "routeId": "R101",
    "currentLocation": {
      "latitude": null,
      "longitude": null
    }
  }
}
```

### 2.2 NEW API: Update Trip Location
**Endpoint**: `POST /api/bus/trip/:tripId/location`  
**Currently exists**: ✅ Yes in routes/bus.js as `PUT /api/bus/trip/:tripId/location`

**Expected behavior**:
```javascript
// Frontend sends (every ~5 seconds)
{
  "latitude": 12.8345,
  "longitude": 75.1345,
  "timestamp": 1704012600000
}

// Backend does:
// 1. Update BusTrip.currentLocation
// 2. Calculate distance from previous location (Haversine formula)
// 3. Calculate speed (distance / time difference)
// 4. Update BusTrip.speeds array with rolling average
// 5. Return updated trip object

// Backend response
{
  "statusCode": 200,
  "message": "Location updated",
  "trip": {
    "_id": "T456",
    "currentLocation": {
      "latitude": 12.8345,
      "longitude": 75.1345
    },
    "speed": 25.4,  // km/h - CALCULATED
    "lastLocationUpdate": "2026-01-28T10:30:05Z"
  }
}
```

### 2.3 Update Busservice.js → Add Distance/Speed Calculation

**New function**: `calculateDistance(lat1, lng1, lat2, lng2)`
```javascript
// Haversine Formula - returns distance in km
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // distance in km
};
```

**Updated function**: `updateTripLocation(tripId, { lat, lng, timestamp })`
```javascript
const updateTripLocation = async (tripId, locationData) => {
  try {
    const trip = await BusTrip.findById(tripId);
    if (!trip) throw new Error('Trip not found');

    const { latitude, longitude, timestamp } = locationData;
    
    // Calculate distance if previous location exists
    if (trip.currentLocation.latitude && trip.lastLocationUpdate) {
      const distance = calculateDistance(
        trip.currentLocation.latitude,
        trip.currentLocation.longitude,
        latitude,
        longitude
      );
      
      const timeDiff = (timestamp - trip.lastLocationUpdate.getTime()) / 1000 / 3600; // hours
      
      // Prevent division by zero ← IMPORTANT for edge cases
      if (timeDiff > 0) {
        const speed = distance / timeDiff; // km/h
        
        // Store speed in array (last 10 updates)
        if (!trip.speeds) trip.speeds = [];
        trip.speeds.push(speed);
        if (trip.speeds.length > 10) trip.speeds.shift();
        
        // Calculate rolling average
        trip.averageSpeed = trip.speeds.reduce((a, b) => a + b, 0) / trip.speeds.length;
      }
    }
    
    trip.currentLocation = { latitude, longitude };
    trip.lastLocationUpdate = new Date(timestamp);
    
    await trip.save();
    return trip;
  } catch (error) {
    throw new Error(`Location update failed: ${error.message}`);
  }
};
```

### 2.4 Add to BusTrip Schema
```javascript
// Add these fields:
speeds: [{ type: Number }],  // Array of speeds (km/h)
averageSpeed: { type: Number, default: 0 },
lastLocationUpdate: { type: Date }
```

### 2.5 NEW API: Get Nearest Bus (For Passengers)
**Endpoint**: `GET /api/bus/nearest?stopId=S901&passengerId=P123`

**Logic**:
1. Query all trips where `status === 'STARTED'` (isActive = true)
2. For each trip, calculate distance from stop to bus location
3. Calculate ETA using: `remainingDistance / (averageSpeed || 25)` ← Fallback to 25 km/h for rural areas
4. Return sorted by distance (nearest first)

```javascript
// Frontend (passenger) gets:
{
  statusCode: 200,
  buses: [
    {
      tripId: "T456",
      busNumber: "KA-01-AB-1234",
      routeName: "Pakalakkunja → Vitla",
      currentLocation: { latitude: 12.834, longitude: 75.134 },
      nextStop: "Manila Center",
      distanceFromStop: 2.3,  // km (calculated via Haversine)
      eta: 8,  // minutes (calculated from distance + speed or default 25 km/h)
      speed: 25.4,  // current speed (or default if not available)
      occupancy: "3/45"  // passengers/capacity
    }
  ]
}
```

---

## 📐 Distance Calculation Details (For Your Question)

### Haversine Formula Explained
**What**: Math formula to find distance between two GPS points on Earth

**Two approaches**:

#### Approach A: Stop-Based Distance (✅ RECOMMENDED)
- **Passenger stop GPS**: `(stopLat, stopLng)` — from BUS_ROUTES (stable)
- **Bus current GPS**: `(busLat, busLng)` — from driver's phone in real-time
- **Why better**: Stop location doesn't change, reduces GPS noise

#### Approach B: Passenger Phone GPS
- **Passenger GPS**: `(passengerLat, passengerLng)` — real-time from phone (noisy)
- **Bus GPS**: `(busLat, busLng)` — from driver (noisy)
- **Why worse**: Both points change → less consistent ETA

### Implementation Location
**Recommended**: Backend  
**Why**:
- Consistent for all passengers viewing same bus
- Secure (passenger can't manipulate)
- Single source of truth

**Code Location**: `backend/services/Busservice.js`

### Formula Pseudocode
```
distance = haversine(
  busLat, busLng,        // Current bus location
  stopLat, stopLng       // Passenger's stop (from route)
)

// Use default speed if averageSpeed is 0 (rural fallback)
speed = averageSpeed || 25  // km/h (default for rural areas)
ETA = (distance / speed) * 60  // Convert hours to minutes
```

### Example Real-World
```
Bus at: 12.8345, 75.1345
Stop at: 12.8567, 75.1567
Distance = 2.8 km

Bus speed = 25 km/h
ETA = (2.8 / 25) * 60 = 6.7 minutes ≈ 7 minutes
```

---

## 📊 Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     DRIVER SIDE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  DriverDashboard.jsx                                        │
│  ├─ Select Route (from BUS_ROUTES)                          │
│  ├─ Start Trip → Backend POST /trip/start                  │
│  │  └─ Get tripId                                           │
│  ├─ Start GPS: navigator.geolocation.watchPosition()       │
│  │  └─ Every ~5s: POST /trip/:tripId/location              │
│  ├─ Display:                                                │
│  │  ├─ Current location                                     │
│  │  ├─ Speed (from backend)                                │
│  │  ├─ Next stop                                            │
│  │  └─ Distance to next stop                               │
│  └─ Stop Trip → Clear GPS + POST /trip/:tripId/end         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓ (API calls)
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND                                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  busService.js                                              │
│  ├─ startTrip()                                             │
│  │  └─ Create BusTrip with status=STARTED                  │
│  ├─ updateTripLocation()                                    │
│  │  ├─ Calculate distance (Haversine)                       │
│  │  ├─ Calculate speed                                      │
│  │  └─ Update BusTrip.averageSpeed                         │
│  └─ endTrip()                                               │
│     └─ Set status=COMPLETED                                 │
│                                                              │
│  BusTrip Collection (MongoDB)                               │
│  ├─ _id (tripId)                                            │
│  ├─ driverId                                                │
│  ├─ routeId, routeName, stops[]                             │
│  ├─ currentLocation { lat, lng }                            │
│  ├─ averageSpeed (calculated, fallback 25 km/h)            │
│  ├─ speeds[] (rolling array, only if timeDiff > 0)         │
│  └─ status (STARTED → COMPLETED only)                       │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                          ↓ (Polling)
┌─────────────────────────────────────────────────────────────┐
│                  PASSENGER SIDE                              │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Polls: GET /api/nearest-bus?stopId=S901                   │
│  ├─ Backend finds active trips                             │
│  ├─ Calculates distance to each bus                        │
│  ├─ Calculates ETA                                          │
│  └─ Returns sorted list                                     │
│                                                              │
│  Passenger sees:                                            │
│  ├─ Nearest bus                                             │
│  ├─ Distance (calculated)                                   │
│  └─ ETA (calculated from speed + distance)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 📝 BusTrip Schema (Updated)

```javascript
{
  // Existing fields
  _id: ObjectId,
  driverId: ObjectId (ref: Driver),
  routeId: String,
  routeName: String,
  vehicleNumber: String,
  status: String (enum: STARTED, COMPLETED),  // ← Simplified: STARTED → COMPLETED (no IN_PROGRESS)
  startTime: Date,
  endTime: Date,
  
  // STOPS (from route)
  stops: [{
    stopId: String,
    stopName: String,
    latitude: Number,
    longitude: Number,
    arrivedAt: Date,
    isCompleted: Boolean
  }],
  
  // LOCATION TRACKING (NEW)
  currentLocation: {
    latitude: Number,
    longitude: Number
  },
  lastLocationUpdate: Date,
  
  // SPEED CALCULATION (NEW)
  speeds: [Number],          // Array of last 10 speeds
  averageSpeed: Number,      // Rolling average (km/h)
  
  // Passengers & Fare
  passengers: Array,
  totalPassengers: Number,
  totalFare: Number
}
```

---

## � Bugs & Edge Cases (Fixed in Spec)

### Bug #1: GPS Timestamp Extraction ✅ FIXED
**Issue**: `timestamp` comes from `position.timestamp`, not `position.coords.timestamp`

**Code**:
```javascript
// ❌ WRONG
const { latitude, longitude, timestamp } = position.coords;

// ✅ CORRECT
const { latitude, longitude } = position.coords;
const timestamp = position.timestamp;
```

### Bug #2: Division by Zero in Speed Calculation ✅ FIXED
**Issue**: If `timeDiff === 0`, speed calculation causes Infinity or NaN

**Code**:
```javascript
// ❌ WRONG
const speed = distance / timeDiff;  // Can cause Infinity

// ✅ CORRECT
if (timeDiff > 0) {
  const speed = distance / timeDiff;
  // Update speeds array and averageSpeed
}
```

### Bug #3: Missing ETA Fallback for Rural Areas ✅ FIXED
**Issue**: If `averageSpeed === 0` (first GPS update), ETA becomes Infinity

**Code**:
```javascript
// ❌ WRONG
eta = distance / averageSpeed;

// ✅ CORRECT
speed = averageSpeed || 25;  // Fallback to 25 km/h
eta = (distance / speed) * 60;
```

### Bug #4: Status Enum Confusion ✅ FIXED
**Issue**: Schema had STARTED → IN_PROGRESS → COMPLETED, but driver never transitions to IN_PROGRESS

**Fix**: Simplified to **STARTED → COMPLETED** only

---

## �🔗 API Endpoints Summary

### Driver APIs
| Method | Endpoint | Purpose | Frontend Call |
|--------|----------|---------|---------------|
| POST | `/bus/register` | Register new driver | `registerDriver()` |
| POST | `/bus/trip/start` | Start new trip | `startTrip()` |
| POST | `/bus/trip/:tripId/location` | Update GPS location | Called every 5s |
| PUT | `/bus/trip/:tripId/end` | Stop current trip | `endTrip()` |
| GET | `/bus/trip/active` | Get driver's active trip | On load |

### Passenger APIs (For context)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/bus/nearest?stopId=S901` | Find nearest buses |
| GET | `/bus/trips/active/all` | See all active trips |
| POST | `/bookings` | Book a seat |

---

## ✅ Implementation Checklist

### Frontend (React)
- [x] Move trip logic out of Buslogin.jsx
- [x] Create DriverDashboard.jsx component
- [x] Implement GPS tracking with watchPosition()
- [x] Add error handling for GPS permission denied
- [x] Add loading states
- [x] Update routes.jsx with `/bus/driver-dashboard`
- [x] Test navigation flow (Buslogin → DriverDashboard)

### Backend (Node/Express)
- [x] Add Haversine distance calculation to Busservice.js
- [x] Update updateTripLocation() with speed calculation
- [x] Add speeds[] and averageSpeed to BusTrip schema
- [x] Verify startTrip() returns tripId
- [x] Create GET /api/nearest-bus endpoint
- [x] Add error handling for invalid locations
- [ ] Test GPS location updates

### Testing
- [ ] Simulate trip start/stop
- [ ] Verify GPS data being sent every ~5s
- [ ] Check distance/speed calculations
- [ ] Test passenger sees updated bus location
- [ ] Test ETA accuracy

---

## 🚀 Quick Start for Copilot

**Frontend Prompt**:
```
Create a DriverDashboard component that:
1. Shows a route selection dropdown (use BUS_ROUTES)
2. Has a "Start Trip" button
3. When trip starts, automatically sends GPS updates to backend every ~5 seconds
4. Displays current location, speed, and next stop
5. Has a "Stop Trip" button that ends the trip and stops GPS tracking
6. Shows loading/error states
Uses the busService.js API calls provided.
```

**Backend Prompt**:
```
Implement GPS distance calculation:
1. Add Haversine formula to calculateDistance(lat1,lng1,lat2,lng2) → returns km
2. In updateTripLocation(), calculate speed from distance and time
3. Maintain a rolling average of last 10 speeds
4. Create GET /api/nearest-bus endpoint that returns active buses sorted by distance
5. Distance calculated using Haversine between stop location and bus location
6. ETA calculated as distance/speed
```

---

## 📚 References
- **Haversine Formula**: https://en.wikipedia.org/wiki/Haversine_formula
- **Geolocation API**: https://developer.mozilla.org/en-US/docs/Web/API/Geolocation
- **BusTrip Schema**: Existing in backend/models/BusTrip.js
- **BUS_ROUTES Data**: frontend/src/data/BusRoutes.jsx (10 routes, 40+ stops)

---

**Status**: ✅ Implementation Complete  
**Next Step**: Test the application

