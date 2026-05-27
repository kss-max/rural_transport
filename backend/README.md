# Rural Transport - Backend

Backend API server for the Rural Transport application.

## Tech Stack

- Node.js with Express
- MongoDB with Mongoose
- JWT Authentication with Passport
- bcryptjs for password hashing

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the backend directory based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the `.env` file with your MongoDB connection string:
```
MONGODB_URI=mongodb://localhost:27017/rural_transport
# Or use MongoDB Atlas:
# MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/rural_transport?retryWrites=true&w=majority

JWT_SECRET=your_secure_jwt_secret
PORT=4000
CLIENT_URL=http://localhost:5173
```

4. Start the server:
```bash
npm start
```

The server will run on http://localhost:4000 by default.

## Database Architecture

The backend uses MongoDB as the primary datastore for all online operations:

- **Users Collection**: Stores user authentication and profile data
- **Vehicles Collection**: Stores vehicle information added by owners/providers
- **Bookings Collection**: Stores booking requests and their status

### Offline Support

Offline capability is implemented entirely on the frontend using IndexedDB (Dexie.js):
- When offline, read operations use cached data from IndexedDB
- Write operations (create/update) are queued locally
- When network connectivity is restored, queued operations sync to backend APIs
- Backend persists all synced data to MongoDB

## API Endpoints

### Authentication
- `POST /auth/register` - Register a new user
- `POST /auth/login` - Login user
- `POST /auth/logout` - Logout user
- `GET /auth/me` - Get current user

### Vehicles
- `GET /vehicles` - Get all vehicles
- `GET /vehicles/:id` - Get vehicle by ID
- `POST /vehicles` - Create new vehicle (authenticated)
- `GET /vehicles/provider/:providerId` - Get vehicles by provider

### Bookings
- `GET /bookings` - Get all bookings
- `GET /bookings/:id` - Get booking by ID
- `POST /bookings` - Create new booking (authenticated)
- `PATCH /bookings/:id/status` - Update booking status
- `GET /bookings/user/:userId` - Get bookings by user
- `GET /bookings/vehicles` - Get bookings for specific vehicles

## Project Structure

```
backend/
├── config/
│   ├── database.js      # MongoDB connection setup
│   └── passport.js      # JWT passport configuration
├── models/
│   ├── User.js          # User Mongoose model
│   ├── Vehicle.js       # Vehicle Mongoose model
│   └── Booking.js       # Booking Mongoose model
├── routes/
│   ├── auth.js          # Authentication routes
│   ├── vehicles.js      # Vehicle routes
│   └── bookings.js      # Booking routes
├── services/
│   ├── userService.js   # User business logic
│   ├── vehicleService.js # Vehicle business logic
│   └── bookingService.js # Booking business logic
├── middleware/
│   └── auth.js          # Authentication middleware
├── index.js             # Application entry point
└── package.json
```
