const DB_NAME = 'ruralTransportDB'
const DB_VERSION = 2

const STORES = {
  vehicles: 'vehicles',
  bookings: 'bookings',
  queue: 'bookingQueue',
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onupgradeneeded = (event) => {
      const db = event.target.result
      if (!db.objectStoreNames.contains(STORES.vehicles)) {
        db.createObjectStore(STORES.vehicles, { keyPath: 'id' })
      }       
      if (!db.objectStoreNames.contains(STORES.bookings)) {
        db.createObjectStore(STORES.bookings, { keyPath: 'id' })
      }
      if (!db.objectStoreNames.contains(STORES.queue)) {
        db.createObjectStore(STORES.queue, { keyPath: 'queueId' })
      }
    }

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

function runStoreOperation(storeName, mode, operation) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, mode)
        const store = tx.objectStore(storeName)
        const result = operation(store, tx)
        tx.oncomplete = () => resolve(result)
        tx.onerror = () => reject(tx.error)
      }),
  )
}

function clearAndPutAll(storeName, records) {
  return runStoreOperation(storeName, 'readwrite', (store) => {
    store.clear()
    records.forEach((record) => store.put(record))
  })
}

function getAll(storeName) {
  return openDb().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(storeName, 'readonly')
        const store = tx.objectStore(storeName)
        const request = store.getAll()
        request.onsuccess = () => resolve(request.result || [])
        request.onerror = () => reject(request.error)
      }),
  )
}

export function cacheVehicles(vehicles) {
  return clearAndPutAll(STORES.vehicles, vehicles)
}

export function getCachedVehicles() {
  return getAll(STORES.vehicles)
}

export function cacheBookings(bookings) {
  return clearAndPutAll(STORES.bookings, bookings)
}

export function getCachedBookings() {
  return getAll(STORES.bookings)
}

export function enqueueBooking(booking) {
  const entry = {
    ...booking,
    queueId: booking.queueId || `queue-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    createdAt: booking.createdAt || new Date().toISOString(),
  }
  return runStoreOperation(STORES.queue, 'readwrite', (store) => {
    store.put(entry)
  }).then(() => entry)
}

export function getQueuedBookings() {
  return getAll(STORES.queue)
}

export function removeQueuedBooking(queueId) {
  return runStoreOperation(STORES.queue, 'readwrite', (store) => store.delete(queueId))
}
