const Booking = require('../models/Booking');

async function getBookings() {
  return await Booking.find()
    .populate('vehicleId', 'ownerName phone village category description pricePerKm')
    .populate('userId', 'email role');
}

async function getBookingById(id) {
  return await Booking.findById(id)
    .populate('vehicleId', 'ownerName phone village category description pricePerKm')
    .populate('userId', 'email role');
}

async function createBooking(data) {
  const newBooking = new Booking({
    vehicleId: data.vehicleId,
    vehicleOwnerName: data.vehicleOwnerName,
    vehicleCategory: data.vehicleCategory,
    userId: data.userId,
    pickup: data.pickup,
    drop: data.drop,
    purpose: data.purpose,
    status: data.status || 'PENDING',
    bookingType: data.bookingType || 'instant',
    scheduledDate: data.scheduledDate || undefined,
    rentalHours: data.rentalHours || undefined,
    rentalStartDate: data.rentalStartDate || undefined,
    rentalEndDate: data.rentalEndDate || undefined,
  });
  
  await newBooking.save();
  
  return await Booking.findById(newBooking._id)
    .populate('vehicleId', 'ownerName phone village category description pricePerKm')
    .populate('userId', 'email role');
}

async function updateBookingStatus(id, status) {
  const booking = await Booking.findByIdAndUpdate(
    id,
    { status },
    { new: true }
  )
    .populate('vehicleId', 'ownerName phone village category description pricePerKm')
    .populate('userId', 'email role');
  
  return booking;
}

async function getBookingsByUser(userId) {
  return await Booking.find({ userId })
    .populate('vehicleId', 'ownerName phone village category description pricePerKm')
    .populate('userId', 'email role');
}

async function getBookingsForVehicles(vehicleIds = []) {
  return await Booking.find({ vehicleId: { $in: vehicleIds } })
    .populate('vehicleId', 'ownerName phone village category description pricePerKm')
    .populate('userId', 'email role');
}

module.exports = {
  getBookings,
  getBookingById,
  createBooking,
  updateBookingStatus,
  getBookingsByUser,
  getBookingsForVehicles,
}
