export function estimateCost({ distanceKm = 0, ratePerKm = 10, bookingFee = 20 }) {
  return distanceKm * ratePerKm + bookingFee
}
