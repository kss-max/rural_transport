import { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { fetchCurrentUser, login as loginRequest, logout as logoutRequest, register as registerRequest } from '../services/authService'

const AuthContext = createContext({
  user: null,
  loading: true,
  login: async () => {},
  logout: async () => {},
  register: async () => {},
  refresh: async () => {},
})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(async () => {
    setLoading(true)
    try {
      // Try to restore token from localStorage
      const token = localStorage.getItem('authToken')
      if (token) {
        // Token exists, set it in the API for subsequent requests
        console.log('[Auth] Token restored from localStorage')
      }
      const data = await fetchCurrentUser()
      setUser(data.user)
    } catch (error) {
      localStorage.removeItem('authToken')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadUser()
  }, [loadUser])

  const login = async ({ email, password }) => {
    const data = await loginRequest({ email, password })
    console.log('[Auth] Login response:', data)
    if (data.token) {
      localStorage.setItem('authToken', data.token)
      console.log('[Auth] Token stored in localStorage')
    } else {
      console.error('[Auth] NO TOKEN in login response!')
    }
    setUser(data.user)
    return data.user
  }

  const register = async ({ email, password, role }) => {
    const data = await registerRequest({ email, password, role })
    console.log('[Auth] Register response:', data)
    if (data.token) {
      localStorage.setItem('authToken', data.token)
      console.log('[Auth] Token stored in localStorage')
    } else {
      console.error('[Auth] NO TOKEN in register response!')
    }
    setUser(data.user)
    return data.user
  }

  const logout = async () => {
    try {
      await logoutRequest()
    } catch (err) {
      console.warn('Logout request failed (server may be offline):', err.message)
    }
    localStorage.removeItem('authToken')
    console.log('[Auth] Token removed from localStorage')
    setUser(null)
  }

  const value = {
    user,
    loading,
    login,
    logout,
    register,
    refresh: loadUser,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  return useContext(AuthContext)
}
