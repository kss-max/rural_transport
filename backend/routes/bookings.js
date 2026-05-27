const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const {
  listBookings,
  createBookingHandler,
  updateBookingStatusHandler,
} = require('../controllers/bookingController')

const router = express.Router()

// GET /bookings
router.get('/', requireAuth, listBookings)

// POST /bookings — supports instant, scheduled, rental
router.post('/', requireAuth, requireRole('USER', 'DRIVER', 'ADMIN'), createBookingHandler)

// PATCH /bookings/:id — update status (approve / reject)
router.patch('/:id', requireAuth, requireRole('PROVIDER', 'ADMIN'), updateBookingStatusHandler)

module.exports = router
