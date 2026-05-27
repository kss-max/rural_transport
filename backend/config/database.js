const mongoose = require('mongoose');
require('dotenv').config();

// Clear all location data from active trips
const clearAllLocationData = async () => {
    try {
        const BusTrip = require('../models/BusTrip');
        const result = await BusTrip.updateMany(
            { status: 'STARTED' },
            {
                $set: {
                    currentLocation: { latitude: null, longitude: null },
                    lastLocationUpdate: null,
                    speeds: [],
                    averageSpeed: 0
                }
            }
        );
        console.log(`🧹 Cleared location data from ${result.modifiedCount} active trips`);
    } catch (err) {
        console.error('Failed to clear location data:', err.message);
    }
};

const connectDB = async () => {
    try {
        const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rural_transport';
        await mongoose.connect(uri);
        console.log('MongoDB connected');

        // Handle connection lost
        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('error', (err) => {
            console.error('MongoDB connection error:', err);
        });

    } catch (err) {
        console.log("mongo connection error", err);
        process.exit(1);
    }
}

module.exports = { connectDB, clearAllLocationData };
