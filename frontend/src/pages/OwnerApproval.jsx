import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchBookings, updateBookingStatus } from '../services/bookingService'
import { useAuth } from '../context/AuthContext'
import useOffline from '../hooks/useOffline'
import { subscribeToPush, isSubscribedToPush } from '../services/pushNotification'

function ProviderDashboard() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isOffline = useOffline()
  const isOnline = !isOffline
  const [updatingId, setUpdatingId] = useState(null)
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [subscribing, setSubscribing] = useState(false)

  useEffect(() => {
    isSubscribedToPush().then(setIsSubscribed)
  }, [])

  const handleSubscribe = async () => {
    setSubscribing(true)
    const success = await subscribeToPush()
    setIsSubscribed(success)
    setSubscribing(false)
  }

  const loadBookings = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const list = await fetchBookings()
      setBookings(list)
    } catch (err) {
      setError('Unable to load bookings. Please try again later.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (!['PROVIDER', 'DRIVER', 'ADMIN'].includes(user.role)) {
      navigate('/', { replace: true })
      return
    }

    loadBookings()
  }, [authLoading, user, navigate, loadBookings])

  const pendingBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'PENDING' || booking.status === 'PENDING_SYNC'),
    [bookings],
  )

  const handleStatusChange = async (bookingId, status) => {
    if (!isOnline) {
      setError('You must be online to update bookings.')
      return
    }

    setUpdatingId(bookingId)
    setError(null)
    try {
      const updated = await updateBookingStatus(bookingId, status)
      setBookings((prev) => prev.map((booking) => (booking.id === bookingId ? updated : booking)))
    } catch (err) {
      setError(err.message || 'Unable to update booking. Please try again.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Provider Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Manage your vehicles and bookings</p>
        </div>
        <div className="flex gap-3">
          {!isSubscribed && (
            <button
              onClick={handleSubscribe}
              disabled={subscribing}
              className="bg-blue-50 text-blue-600 border border-blue-200 px-4 py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-100 transition-all duration-200 shadow-sm"
            >
              {subscribing ? 'Enabling...' : '🔔 Enable Notifications'}
            </button>
          )}
          <button
            onClick={() => navigate('/add-vehicle')}
            className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] transition-all duration-200 shadow-sm hover:shadow-md"
          >
            + Add Vehicle
          </button>
        </div>
      </div>

      {!isOnline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 rounded-xl px-4 py-3 text-sm">
          ⚡ Offline — approving/rejecting requires a connection
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm border border-red-100">{error}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-gray-900">
            Pending Bookings ({pendingBookings.length})
          </h2>
          <button onClick={loadBookings} className="text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-all duration-150">
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading bookings...</p>
          </div>
        ) : pendingBookings.length === 0 ? (
          <p className="text-gray-400 text-center py-12">No pending booking requests</p>
        ) : (
          <div className="space-y-4">
            {pendingBookings.map((booking) => (
              <div key={booking.id} className="border border-gray-100 rounded-xl p-5 hover:shadow-sm transition-all duration-150">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{booking.vehicleCategory}</h3>
                    <p className="text-sm text-gray-500">Owner: {booking.vehicleOwnerName}</p>
                    <p className="text-sm text-gray-500">Requested by: {booking.userId?.email || booking.userId}</p>
                  </div>
                  <span className="px-3 py-1 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-semibold">
                    {booking.status}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                  <div>
                    <p className="text-gray-400 text-xs">Pickup</p>
                    <p className="font-medium text-gray-700">{booking.pickup}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Drop</p>
                    <p className="font-medium text-gray-700">{booking.drop}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Purpose</p>
                    <p className="font-medium text-gray-700">{booking.purpose}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Date</p>
                    <p className="font-medium text-gray-700">
                      {booking.createdAt ? new Date(booking.createdAt).toLocaleString() : 'Pending'}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleStatusChange(booking.id, 'APPROVED')}
                    disabled={!isOnline || updatingId === booking.id}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${!isOnline || updatingId === booking.id
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] shadow-sm hover:shadow-md'
                      }`}
                  >
                    {updatingId === booking.id ? 'Updating...' : '✓ Approve'}
                  </button>
                  <button
                    onClick={() => handleStatusChange(booking.id, 'REJECTED')}
                    disabled={!isOnline || updatingId === booking.id}
                    className={`flex-1 px-4 py-2.5 rounded-xl font-semibold text-sm transition-all duration-150 ${!isOnline || updatingId === booking.id
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-red-600 border border-red-200 hover:bg-red-50 active:scale-[0.98]'
                      }`}
                  >
                    ✗ Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

export default ProviderDashboard
