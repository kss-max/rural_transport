import { useState, useEffect, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchVehicles } from '../services/vehicleService'
import CategoryFilter from '../components/CategoryFilter'
import VehicleCard from '../components/VehicleCard'
import { useAuth } from '../context/AuthContext'

function Home() {
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [vehicles, setVehicles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const navigate = useNavigate()
  const { user } = useAuth()

  useEffect(() => {
    let isMounted = true

    async function loadVehicles() {
      setLoading(true)
      setError(null)
      try {
        console.log('Fetching vehicles...')
        const response = await fetchVehicles()
        console.log('Fetch response:', response)
        const list = response.vehicles || response || []
        console.log('Processed vehicle list:', list)
        if (list.length === 0) {
          console.log('No vehicles found.')
        }
        if (isMounted) {
          setVehicles(list)
        }
      } catch (err) {
        console.error('Error loading vehicles:', err)
        if (isMounted) {
          setError('Unable to load vehicles. Please try again later.')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    loadVehicles()
    return () => {
      isMounted = false
    }
  }, [])

  function filterVehiclesByCategory(vehicles, category) {
    if (category === 'All') {
      return vehicles;
    }
    return vehicles.filter(v => v.category === category);
  }

  const displayedVehicles = filterVehiclesByCategory(vehicles, selectedCategory);

  const handleBook = (vehicle) => {
    if (!user) {
      navigate('/login', { replace: true })
      return
    }
    navigate('/book', { state: { vehicle } })
  }

  return (
    <section className="space-y-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 px-8 py-12 md:px-12 md:py-16">
        <div className="absolute top-0 right-0 w-72 h-72 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4"></div>
        <div className="relative">
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight leading-tight mb-3">
            Rural Transport<br />
            <span className="text-emerald-200">for Manila Village</span>
          </h1>
          <p className="text-emerald-100 text-base md:text-lg max-w-lg mb-6">
            Find and book reliable vehicles for your journey — autos, cars, pickups and tractors available.
          </p>
          {user?.role === 'PROVIDER' && (
            <button
              onClick={() => navigate('/add-vehicle')}
              className="bg-white text-emerald-700 px-6 py-3 rounded-xl font-semibold text-sm hover:bg-emerald-50 active:scale-[0.98] transition-all duration-200 shadow-sm"
            >
              + Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Service Cards */}
      <div>
        <h2 className="text-lg font-bold text-gray-900 mb-4">Our Services</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            onClick={() => navigate('/')}
            className="cursor-pointer bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-emerald-100 transition-colors duration-200">🚗</div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Instant Booking</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Select a vehicle below and book immediately for your trip</p>
          </div>
          <div
            onClick={() => navigate('/schedule')}
            className="cursor-pointer bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-emerald-100 transition-colors duration-200">📅</div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Schedule Ride</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Plan ahead — book a ride for a future date and time</p>
          </div>
          <div
            onClick={() => navigate('/rent')}
            className="cursor-pointer bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 group"
          >
            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:bg-emerald-100 transition-colors duration-200">🔑</div>
            <h3 className="text-base font-bold text-gray-900 mb-1">Rent Vehicle</h3>
            <p className="text-gray-500 text-sm leading-relaxed">Rent a vehicle for hours or days at affordable rates</p>
          </div>
        </div>
      </div>

      {/* Vehicles Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-gray-900">Available Vehicles</h2>
        </div>

        <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={setSelectedCategory} />

        <div className="mt-5">
          {loading ? (
            <div className="text-center py-20">
              <div className="inline-block w-10 h-10 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-400 text-sm">Loading vehicles...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 rounded-2xl p-5 border border-red-100 text-center text-sm">
              {error}
            </div>
          ) : displayedVehicles.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-gray-300 text-5xl mb-4">🚗</p>
              <p className="text-gray-400 text-base">No vehicles available in this category</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {displayedVehicles.map((vehicle) => (
                <VehicleCard key={vehicle.id} vehicle={vehicle} onBook={handleBook} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

export default Home
