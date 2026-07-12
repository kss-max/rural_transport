import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { fetchVehicles } from '../../services/vehicleService'
import useOffline from '../../hooks/useOffline'

export default function BookingForm({
  bookingType = 'instant',
  title = 'Book Vehicle',
  accentColor = 'teal',
  onSubmit,
  children,
}) {
  const location = useLocation()
  const navigate = useNavigate()
  const passedVehicle = location.state?.vehicle || null
  const { user, loading: authLoading } = useAuth()
  const isOffline = useOffline()
  const isOnline = !isOffline
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  // Vehicle selection state
  const [selectedVehicle, setSelectedVehicle] = useState(passedVehicle)
  const [vehicles, setVehicles] = useState([])
  const [vehiclesLoading, setVehiclesLoading] = useState(false)

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
    if (!['USER', 'ADMIN', 'PROVIDER', 'DRIVER'].includes(user.role)) {
      navigate('/', { replace: true })
    }
  }, [authLoading, user, navigate])

  // Load vehicles if none was passed
  useEffect(() => {
    if (passedVehicle) return
    let mounted = true
    async function load() {
      setVehiclesLoading(true)
      try {
        const res = await fetchVehicles()
        const list = res.vehicles || res || []
        if (mounted) setVehicles(list)
      } catch {
        if (mounted) setError('Unable to load vehicles')
      } finally {
        if (mounted) setVehiclesLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [passedVehicle])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e, extraData = {}) => {
    e.preventDefault()
    if (loading || !selectedVehicle) return
    setLoading(true)
    setError(null)
    setSuccess(false)

    try {
      await onSubmit({
        vehicleId: selectedVehicle.id,
        pickup: formData.pickup,
        drop: formData.drop,
        purpose: formData.purpose,
        status: isOnline ? 'PENDING' : 'PENDING_SYNC',
        bookingType,
        ...extraData,
      })
      setSuccess(true)
      setTimeout(() => navigate('/bookings', { replace: true }), 1500)
    } catch (err) {
      setError(err.message || 'Unable to create booking. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const purposeOptions = ['Market', 'Hospital', 'School', 'Work', 'Travel', 'Other']

  // Icon map
  const iconMap = { instant: '🚗', scheduled: '📅', rental: '🔑' }
  const heroIcon = iconMap[bookingType] || '🚗'

  // --- Vehicle selector view ---
  if (!selectedVehicle) {
    return (
      <div className="max-w-4xl mx-auto py-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
            {heroIcon}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">Select a vehicle to continue</p>
        </div>

        {vehiclesLoading ? (
          <div className="text-center py-16">
            <div className="inline-block w-8 h-8 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
            <p className="text-gray-400">Loading vehicles...</p>
          </div>
        ) : vehicles.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-400">No vehicles available</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vehicles.map((v) => (
              <article
                key={v.id}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md hover:scale-[1.02] transition-all duration-150"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-bold text-gray-900">{v.category}</h3>
                  <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold">
                    ₹{v.pricePerKm}/km
                  </span>
                </div>
                <div className="space-y-1.5 mb-4 text-sm text-gray-600">
                  <p><span className="font-medium text-gray-700">Owner:</span> {v.ownerName}</p>
                  <p><span className="font-medium text-gray-700">Village:</span> {v.village}</p>
                  <p><span className="font-medium text-gray-700">Phone:</span> {v.phone}</p>
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">{v.description}</p>
                <button
                  onClick={() => setSelectedVehicle(v)}
                  className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl px-6 py-3 font-semibold text-sm hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-200"
                >
                  Select & Continue
                </button>
              </article>
            ))}
          </div>
        )}
      </div>
    )
  }

  // --- Booking form view (vehicle selected) ---
  return (
    <div className="max-w-xl mx-auto py-4">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-3">
          {heroIcon}
        </div>
        <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      </div>

      {/* Selected Vehicle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-xl">🚐</div>
            <div>
              <p className="font-bold text-gray-900">{selectedVehicle.category}</p>
              <p className="text-sm text-gray-500">{selectedVehicle.ownerName} • ₹{selectedVehicle.pricePerKm}/km</p>
            </div>
          </div>
          {!passedVehicle && (
            <button
              type="button"
              onClick={() => setSelectedVehicle(null)}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 border border-gray-200 px-4 py-2 rounded-xl hover:bg-gray-50 transition-all duration-150"
            >
              Change
            </button>
          )}
        </div>
      </div>

      {/* Status Messages */}
      {!isOnline && (
        <div className="bg-amber-50 border border-amber-100 rounded-xl p-3 text-amber-700 text-sm mb-4">
          ⚡ You are offline. Booking will be synced when you reconnect.
        </div>
      )}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-3 text-red-600 text-sm mb-4">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 text-emerald-700 text-sm font-medium mb-4">
          ✅ Booking created successfully! Redirecting...
        </div>
      )}

      {/* Booking Form */}
      {children({
        formData,
        handleChange,
        handleSubmit,
        loading,
        purposeOptions,
        vehicle: selectedVehicle,
      })}
    </div>
  )
}
