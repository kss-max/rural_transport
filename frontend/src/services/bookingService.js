import request from './api'
import {
  cacheBookings,
  getCachedBookings,
  enqueueBooking,
} from './offlineStorage'

async function appendBookingToCache(booking) {
  const cached = await getCachedBookings() || []
  const next = [booking, ...cached.filter((b) => b.id !== booking.id)]
  await cacheBookings(next)
}

async function replaceBookingInCache(booking) {
  const cached = await getCachedBookings() || []
  const next = cached.map((item) => (item.id === booking.id ? booking : item))
  await cacheBookings(next)
}

export async function fetchBookings() {
  try {
    const data = await request('/bookings')
    await cacheBookings(data.bookings)
    return data.bookings
  } catch (error) {
    const cached = await getCachedBookings()
    if (cached.length) {
      return cached
    }
    throw error
  }
}

export async function createBooking(payload) {
  const isOnline = navigator.onLine

  if (isOnline) {
    try {
      const data = await request('/bookings', {
        method: 'POST',
        body: payload,
      })
      await appendBookingToCache(data.booking)
      return data.booking
    } catch (error) {
      if (error.message !== 'Failed to fetch') {
        throw error
      }
      else{
      throw new Error('Failed to fetch')
    }
    }
    
  }

  const offlineBooking = {
    ...payload,
    id: `temp-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
    status: 'PENDING_SYNC',
    createdAt: new Date().toISOString(),
  }
  await appendBookingToCache(offlineBooking)
  await enqueueBooking({ type: 'BOOKING', payload })
  return offlineBooking
}

export async function updateBookingStatus(id, status) {
  const data = await request(`/bookings/${id}`, {
    method: 'PATCH',
    body: { status },
  })
  await replaceBookingInCache(data.booking)
  return data.booking
}

// ---- Enhanced booking type helpers ----

export async function createInstantBooking(payload) {
  return createBooking({ ...payload, bookingType: 'instant' })
}

export async function createScheduledBooking(payload) {
  if (!payload.scheduledDate) {
    throw new Error('scheduledDate is required for scheduled bookings')
  }
  return createBooking({ ...payload, bookingType: 'scheduled' })
}

export async function createRentalBooking(payload) {
  if (!payload.rentalHours && !payload.rentalStartDate) {
    throw new Error('rentalHours or rentalStartDate is required for rental bookings')
  }
  return createBooking({ ...payload, bookingType: 'rental' })
}
