require('dotenv').config();
const mongoose = require('mongoose');
const Driver = require('./models/Driver');
const BusTrip = require('./models/BusTrip');

async function clearActiveTrip() {
  await mongoose.connect(process.env.MONGODB_URI);
  
  // Clear the active trip reference for all drivers
  const result = await Driver.updateMany(
    { currentTripId: { $ne: null } },
    { $set: { currentTripId: null } }
  );
  console.log('Cleared currentTripId for drivers:', result.modifiedCount);
  
  // Also mark any STARTED trips as CANCELLED (orphaned trips)
  const tripResult = await BusTrip.updateMany(
    { status: 'STARTED' },
    { $set: { status: 'CANCELLED', endTime: new Date() } }
  );
  console.log('Cancelled orphaned trips:', tripResult.modifiedCount);
  
  await mongoose.disconnect();
  console.log('✅ Done! You can now start a new trip.');
}

clearActiveTrip().catch(console.error);
