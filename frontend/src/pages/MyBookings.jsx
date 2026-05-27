import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchBookings } from '../services/bookingService'
import { useAuth } from '../context/AuthContext'
import useOffline from '../hooks/useOffline'

function MyBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const isOffline = useOffline()
  const isOnline = !isOffline
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }

    const loadBookings = async () => {
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
    }

    loadBookings()
  }, [authLoading, user, navigate])

  const statusBadge = (status) => {
    const map = {
      PENDING: 'bg-amber-50 text-amber-700 border-amber-100',
      PENDING_SYNC: 'bg-amber-50 text-amber-700 border-amber-100',
      APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      REJECTED: 'bg-red-50 text-red-600 border-red-100',
    }
    return map[status] || 'bg-gray-50 text-gray-600 border-gray-100'
  }

  return (
    <section className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Bookings</h1>
          <p className="text-sm text-gray-500 mt-0.5">Track your vehicle bookings</p>
        </div>
      </div>

      {!isOnline && (
        <div className="bg-amber-50 border border-amber-100 text-amber-700 rounded-xl px-4 py-3 text-sm">
          ⚡ Offline — showing cached bookings
        </div>
      )}

      {error && (
        <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm border border-red-100">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-16">
          <div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-400">Loading bookings...</p>
        </div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-lg">No bookings yet</p>
          <button
            onClick={() => navigate('/')}
            className="mt-4 text-emerald-600 font-medium text-sm hover:text-emerald-700 transition-all duration-150"
          >
            Browse vehicles →
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <div
              key={booking.id}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-150"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{booking.vehicleCategory}</h3>
                  <p className="text-sm text-gray-500">
                    Owner: {booking.vehicleOwnerName}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-xs font-semibold border ${statusBadge(booking.status)}`}>
                  {booking.status}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
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
                    {booking.createdAt ? new Date(booking.createdAt).toLocaleDateString() : 'Pending'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

export default MyBookings
