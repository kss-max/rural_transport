import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { addVehicle } from '../services/vehicleService'
import { useAuth } from '../context/AuthContext'
import useOffline from '../hooks/useOffline'

function AddVehicleForm() {
  const isOffline = useOffline()
  const isOnline = !isOffline
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [formData, setFormData] = useState({
    ownerName: '',
    phone: '',
    village: '',
    category: 'Auto',
    description: '',
    pricePerKm: '',
  })

  useEffect(() => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    if (user.role !== 'PROVIDER' && user.role !== 'DRIVER' && user.role !== 'ADMIN') {
      navigate('/', { replace: true })
    }
  }, [user, navigate])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      await addVehicle({
        ownerName: formData.ownerName,
        phone: formData.phone,
        village: formData.village,
        category: formData.category,
        description: formData.description,
        pricePerKm: parseInt(formData.pricePerKm, 10) || 10,

      })
      navigate('/', { replace: true })
    } catch (err) {
      setError(err.message || 'Failed to add vehicle. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputClass = "w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-150"

  return (
    <div className="max-w-xl mx-auto py-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Your Vehicle</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Owner Name *</label>
          <input
            type="text"
            name="ownerName"
            value={formData.ownerName}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Your name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number *</label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="10-digit phone number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Village *</label>
          <input
            type="text"
            name="village"
            value={formData.village}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder="Your village"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category *</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            required
            className={inputClass}
          >
            <option value="Auto">Auto Rickshaw</option>
            <option value="Car">Car</option>
            <option value="Pickup">Pickup</option>
            <option value="Tractor">Tractor</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows="3"
            className={inputClass}
            placeholder="Vehicle details..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Price per KM (₹) *</label>
          <input
            type="number"
            name="pricePerKm"
            value={formData.pricePerKm}
            onChange={handleChange}
            required
            min="1"
            className={inputClass}
            placeholder="Price per kilometer"
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 rounded-xl px-4 py-3 text-sm border border-red-100">{error}</div>
        )}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={!isOnline || loading}
            className={`flex-1 px-6 py-3 rounded-xl font-semibold text-sm transition-all duration-150 ${!isOnline || loading
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] shadow-sm hover:shadow-md'
              }`}
          >
            {loading ? 'Saving...' : 'Add Vehicle'}
          </button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="px-6 py-3 bg-white text-gray-600 rounded-xl font-semibold text-sm border border-gray-200 hover:bg-gray-50 active:scale-[0.98] transition-all duration-150"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

export default AddVehicleForm
