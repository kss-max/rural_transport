import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createBooking } from '../services/bookingService'
import { useAuth } from '../context/AuthContext'
import useOffline from '../hooks/useOffline'

function BookVehicleForm() {
  const location = useLocation()
  const navigate = useNavigate()
  const vehicle = location.state?.vehicle
  const isOffline = useOffline()
  const isOnline = !isOffline
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { user, loading: authLoading } = useAuth()

  const [formData, setFormData] = useState({
    pickup: '',
    drop: '',
    purpose: 'Market',
  })

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (!['USER', 'ADMIN'].includes(user.role)) {
      navigate('/', { replace: true })
    }
  }, [authLoading, user, navigate])

  if (!vehicle) {
    return (
      <div className="text-center py-12">
        <p className="text-slate-600">No vehicle selected</p>
        <button onClick={() => navigate('/')} className="mt-4 text-teal-700 font-semibold hover:underline">
          Go to Home
        </button>
      </div>
    )
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!vehicle || loading) return
    setLoading(true)
    setError(null)
    try {
      await createBooking({
        vehicleId: vehicle.id,
        pickup: formData.pickup,
        drop: formData.drop,
        purpose: formData.purpose,
        status: isOnline ? 'PENDING' : 'PENDING_SYNC',
      })
      navigate('/bookings', { replace: true })
    } catch (err) {
      setError(err.message || 'Unable to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-6">Book Vehicle</h1>

      
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-5 mb-6">
          <h2 className="text-xl font-bold text-teal-900 mb-2">Selected Vehicle</h2>
        <p className="text-teal-800">
            <span className="font-semibold">{vehicle.category}</span> - {vehicle.ownerName}
        </p>
        <p className="text-teal-700">₹{vehicle.pricePerKm}/km</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 space-y-5">
        <div>
          <label className="block text-slate-700 font-semibold mb-2">Pickup Location *</label>
          <input
            type="text"
            name="pickup"
            value={formData.pickup}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            placeholder="Enter pickup location"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-2">Drop Location *</label>
          <input
            type="text"
            name="drop"
            value={formData.drop}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
            placeholder="Enter drop location"
          />
        </div>

        <div>
          <label className="block text-slate-700 font-semibold mb-2">Purpose *</label>
          <select
            name="purpose"
            value={formData.purpose}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-600 focus:border-transparent"
          >
            <option value="Market">Market</option>
            <option value="Personal">Personal</option>
            <option value="Emergency">Emergency</option>
          </select>
        </div>

        {!isOnline && (
          <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 text-amber-800">
            <p className="font-semibold">Offline Mode</p>
            <p className="text-sm">Your booking will be saved and synced when you're back online.</p>
          </div>
        )}

        {error && <div className="bg-red-50 text-red-700 rounded-lg px-4 py-3">{error}</div>}

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 rounded-lg px-6 py-3 font-semibold transition ${
              loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-teal-700 text-white hover:bg-teal-800'
            }`}
          >
            {loading ? 'Saving...' : 'Confirm Booking'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-gray-200 text-slate-700 rounded-lg font-semibold hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default BookVehicleForm
