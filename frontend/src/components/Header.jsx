import useOffline from '../hooks/useOffline'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function Header() {
  const isOffline = useOffline()
  const isOnline = !isOffline
  const navigate = useNavigate()
  const { user, logout, loading } = useAuth()

  const handleLogout = async () => {
    await logout()
    navigate('/')
  }

  const handleLogin = () => {
    navigate('/login')
  }

  const linkClass = ({ isActive }) =>
    `px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150 ${isActive
      ? 'bg-emerald-50 text-emerald-700'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
    }`

  const role = user?.role

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left */}
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold text-gray-900 tracking-tight">
            🚐 Rural Transport
          </h1>

          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium ${isOnline
              ? 'bg-emerald-50 text-emerald-700'
              : 'bg-red-50 text-red-600'
              }`}
          >
            {isOnline ? '● Online' : '● Offline'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex items-center gap-1">
          <NavLink to="/" className={linkClass} end>
            Home
          </NavLink>

          {(role === 'PROVIDER' || role === 'OWNER') && (
            <NavLink to="/provider-dashboard" className={linkClass}>
              Dashboard
            </NavLink>
          )}

          {user && role === 'USER' && (
            <NavLink to="/bookings" className={linkClass}>
              My Bookings
            </NavLink>
          )}

          <NavLink to="/bus" className={linkClass}>
            Bus Service
          </NavLink>

          {isOnline && !user && !loading && (
            <button
              onClick={handleLogin}
              className="ml-2 px-5 py-2 text-sm font-semibold text-white rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-200"
            >
              Login
            </button>
          )}

          {user && (
            <button
              onClick={handleLogout}
              className="ml-2 px-4 py-2 text-sm font-medium text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 active:scale-[0.98] transition-all duration-150"
            >
              Logout
            </button>
          )}
        </nav>
      </div>
    </header>
  )
}

export default Header
