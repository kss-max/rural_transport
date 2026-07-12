import { useEffect, useState, useCallback } from 'react'
import { Routes, Route } from 'react-router-dom'
import Header from '../components/Header'
import OfflineBanner from '../components/OfflineBanner'
import Home from '../pages/Home'
import LoginModal from '../pages/LoginModal'
import BookVehicleForm from '../pages/BookVehicleForm'
import InstantBooking from '../pages/InstantBooking'
import ScheduledBooking from '../pages/ScheduledBooking'
import RentalBooking from '../pages/RentalBooking'
import MyBookings from '../pages/MyBookings'
import ProviderDashboard from '../pages/OwnerApproval'
import AddVehicleForm from '../pages/AddVehicleForm'
import Bus from '../pages/bus/Bus'
import Buslogin from '../pages/bus/Buslogin'
import DriverDashboard from '../pages/bus/DriverDashboard'
import BusPassenger from '../pages/bus/BusPassenger'
import BusPassengerLogin from '../pages/bus/BusPassengerLogin'
import BusRouteSelection from '../pages/bus/BusRouteSelection'
import { syncQueuedBookings } from '../services/syncService'
import { locationQueue } from '../services/tileCache'
import { updateTripLocation } from '../services/busService'
import { useAuth } from '../context/AuthContext'
import { subscribeToPush, isSubscribedToPush } from '../services/pushNotification'

function SyncToast({ message, onClose }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div className="bg-emerald-600 text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-2">
        <span>✅</span>
        <span>{message}</span>
      </div>
    </div>
  )
}

function App() {
  const [syncToast, setSyncToast] = useState(null)
  const { user } = useAuth()

  // Auto-subscribe removed. We now use a manual button on the provider dashboard.

  // Sync queued data when app comes back online
  const handleOnline = useCallback(async () => {
    console.log('[Sync] Back online — syncing queued data...')
    let messages = []

    // 1. Sync queued bookings
    try {
      const { synced } = await syncQueuedBookings()
      if (synced > 0) {
        messages.push(`${synced} booking${synced > 1 ? 's' : ''} synced`)
        console.log(`[Sync] ${synced} queued bookings synced`)
      }
    } catch (err) {
      console.error('[Sync] Failed to sync bookings:', err)
    }

    // 2. Sync queued driver location updates
    try {
      const pendingLocations = await locationQueue.getAll()
      if (pendingLocations.length > 0) {
        let locationsSynced = 0
        for (let i = 0; i < pendingLocations.length; i++) {
          const loc = pendingLocations[i]
          try {
            await updateTripLocation(loc.tripId, loc.location)
            locationsSynced++
          } catch (err) {
            console.error('[Sync] Failed to sync location update:', err)
            break // Stop if server rejects (e.g. trip ended)
          }
        }
        if (locationsSynced > 0) {
          await locationQueue.clear()
          messages.push(`${locationsSynced} GPS update${locationsSynced > 1 ? 's' : ''} synced`)
          console.log(`[Sync] ${locationsSynced} location updates synced`)
        }
      }
    } catch (err) {
      console.error('[Sync] Failed to sync locations:', err)
    }

    // Show toast if anything was synced
    if (messages.length > 0) {
      setSyncToast(messages.join(' • '))
    }
  }, [])

  useEffect(() => {
    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [handleOnline])

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-emerald-50/40">
      <OfflineBanner />
      <Header />
      <main className="flex-1 px-6 py-8 max-w-7xl mx-auto w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<LoginModal />} />
          <Route path="/book-vehicle" element={<BookVehicleForm />} />
          <Route path="/book" element={<InstantBooking />} />
          <Route path="/schedule" element={<ScheduledBooking />} />
          <Route path="/rent" element={<RentalBooking />} />
          <Route path="/bookings" element={<MyBookings />} />
          <Route path="/provider-dashboard" element={<ProviderDashboard />} />
          <Route path="/add-vehicle" element={<AddVehicleForm />} />
          <Route path="/bus" element={<Bus />} />
          <Route path="/bus-login" element={<Buslogin />} />
          <Route path="/bus/driver-dashboard" element={<DriverDashboard />} />
          <Route path="/bus/passenger-login" element={<BusPassengerLogin />} />
          <Route path="/bus/select-route" element={<BusRouteSelection />} />
          <Route path="/bus/track" element={<BusPassenger />} />
        </Routes>
      </main>

      {/* Sync notification toast */}
      {syncToast && (
        <SyncToast message={syncToast} onClose={() => setSyncToast(null)} />
      )}
    </div>
  )
}

export default App
