import request from './api'
import { cacheVehicles, getCachedVehicles } from './offlineStorage'

export async function fetchVehicles() {
  try {
    const data = await request('/vehicles', {method: 'GET'})
    await cacheVehicles(data.vehicles)
    return { vehicles: data.vehicles, fromCache: false }
  } catch (error) {
    const cached = await getCachedVehicles() || []
    if (cached.length) {
      return { vehicles: cached, fromCache: true }
    }
    throw error
  }
}

export async function addVehicle(vehicle) {
  const data = await request('/vehicles', {
    method: 'POST',
    body: vehicle,
  })
  const cached = await getCachedVehicles() || []
  await cacheVehicles([data.vehicle, ...cached])
  return data.vehicle
}

export function filterVehiclesByCategory(vehicles, category) {
  if (!category || category === 'All') {
    return vehicles
  }
  return vehicles.filter((v) => v.category === category)
}
