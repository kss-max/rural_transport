const {
  getBookings,
  getBookingsByUser,
  getBookingsForVehicles,
  createBooking,
  updateBookingStatus,
  getBookingById,
} = require('../services/bookingService')
const { getVehicleById, getVehiclesByProvider } = require('../services/vehicleService')

// GET /bookings — list bookings based on role
async function listBookings(req, res) {
  try {
    const role = req.user.role

    if (role === 'ADMIN') {
      const bookings = await getBookings()
      return res.json({ bookings })
    }

    if (role === 'PROVIDER') {
      const providerVehicles = await getVehiclesByProvider(req.user.id)
      const vehicleIds = providerVehicles.map((v) => v.id)
      const bookings = await getBookingsForVehicles(vehicleIds)
      return res.json({ bookings })
    }

    const bookings = await getBookingsByUser(req.user.id)
    return res.json({ bookings })
  } catch (err) {
    console.error('Get bookings error', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

// POST /bookings — create any booking type (instant / scheduled / rental)
async function createBookingHandler(req, res) {
  try {
    const {
      vehicleId,
      pickup,
      drop,
      purpose,
      status,
      bookingType = 'instant',
      scheduledDate,
      rentalHours,
      rentalStartDate,
      rentalEndDate,
    } = req.body

    // Base validation
    if (!vehicleId || !pickup || !drop || !purpose) {
      return res.status(400).json({ message: 'Missing required fields: vehicleId, pickup, drop, purpose' })
    }

    // Booking-type-specific validation
    if (bookingType === 'scheduled') {
      if (!scheduledDate) {
        return res.status(400).json({ message: 'scheduledDate is required for scheduled bookings' })
      }
      if (new Date(scheduledDate) <= new Date()) {
        return res.status(400).json({ message: 'scheduledDate must be in the future' })
      }
    }

    if (bookingType === 'rental') {
      if (!rentalHours && !rentalStartDate) {
        return res.status(400).json({ message: 'rentalHours or rentalStartDate is required for rental bookings' })
      }
    }

    const vehicle = await getVehicleById(vehicleId)
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found.' })
    }

    const bookingData = {
      vehicleId,
      vehicleOwnerName: vehicle.ownerName,
      vehicleCategory: vehicle.category,
      userId: req.user.id,
      pickup,
      drop,
      purpose,
      status: status === 'PENDING_SYNC' ? 'PENDING_SYNC' : 'PENDING',
      bookingType,
    }

    // Add type-specific fields
    if (bookingType === 'scheduled') {
      bookingData.scheduledDate = new Date(scheduledDate)
    }
    if (bookingType === 'rental') {
      if (rentalHours) bookingData.rentalHours = Number(rentalHours)
      if (rentalStartDate) bookingData.rentalStartDate = new Date(rentalStartDate)
      if (rentalEndDate) bookingData.rentalEndDate = new Date(rentalEndDate)
    }

    const booking = await createBooking(bookingData)
    return res.status(201).json({ booking })
  } catch (err) {
    console.error('Create booking error', err)
    if (err.message && err.message.includes('required')) {
      return res.status(400).json({ message: err.message })
    }
    return res.status(500).json({ message: 'Server error' })
  }
}

// PATCH /bookings/:id — update booking status
async function updateBookingStatusHandler(req, res) {
  try {
    const { id } = req.params
    const { status } = req.body
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status.' })
    }

    const booking = await getBookingById(id)
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' })
    }

    if (req.user.role === 'PROVIDER') {
      const vehicle = await getVehicleById(booking.vehicleId)
      if (!vehicle || String(vehicle.providerId?.id || vehicle.providerId) !== String(req.user.id)) {
        return res.status(403).json({ message: 'You cannot modify this booking.' })
      }
    }

    const updated = await updateBookingStatus(id, status)
    return res.json({ booking: updated })
  } catch (err) {
    console.error('Update booking error', err)
    return res.status(500).json({ message: 'Server error' })
  }
}

module.exports = {
  listBookings,
  createBookingHandler,
  updateBookingStatusHandler,
}
