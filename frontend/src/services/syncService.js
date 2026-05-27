import request from './api'
import { getQueuedBookings, removeQueuedBooking } from './offlineStorage'

export async function syncQueuedBookings() {
  const queue = await getQueuedBookings()
  if (!queue.length) {
    return { synced: 0 }
  }

  let synced = 0
  for (const action of queue) {
    if (action.type !== 'BOOKING') {
      continue
    }
    try {
      await request('/bookings', {
        method: 'POST',
        body: action.payload,
      })
      await removeQueuedBooking(action.queueId)
      synced += 1
    } catch (error) {
      if (error.status === 401) {
        // Stop processing if auth expired; user must log in again.
        break
      }
      console.error('Failed to sync booking from queue', error)
    }
  }

  return { synced }
}
