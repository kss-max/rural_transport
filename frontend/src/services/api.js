import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
})


api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken')
  console.log('[API] Token from localStorage:', token ? `${token.substring(0, 20)}...` : 'NO TOKEN')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
    console.log('[API] Added Authorization header')
  } else {
    console.log('[API] NO TOKEN - not adding Authorization header')
  }
  console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`)
  return config
})

export default async function request(url, options = {}) {
  try {
    const config = {
      url: url,
      method: options.method || 'GET',
      data: options.body || undefined,
    }
    

    if (options.headers && Object.keys(options.headers).length > 0) {
      config.headers = options.headers
    }
    
    const res = await api(config)
    return res.data
  } catch (err) {
    // Backend may return error in 'error' or 'message' field
    const message = err.response?.data?.error || err.response?.data?.message || 'Request failed'
    const error = new Error(message)
    error.status = err.response?.status
    console.log('API request error:', message, err.response?.data)
    throw error
  }
}
