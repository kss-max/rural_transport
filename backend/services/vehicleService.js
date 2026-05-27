const Vehicle = require('../models/Vehicle');

async function getVehicles() {
  return await Vehicle.find().populate('providerId', 'email role');
}

async function getVehicleById(id) {
  return await Vehicle.findById(id).populate('providerId', 'email role');
}

async function createVehicle({ ownerName, phone, village, category, description, pricePerKm, providerId }) {
  const newVehicle = new Vehicle({
    ownerName,
    phone,
    village,
    category,
    description,
    pricePerKm,
    providerId
  });
  
  await newVehicle.save();
  return await newVehicle.populate('providerId', 'email role');
}

async function getVehiclesByProvider(providerId) {
  return await Vehicle.find({ providerId }).populate('providerId', 'email role');
}

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  getVehiclesByProvider,
}
