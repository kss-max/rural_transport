import React from 'react'
import Home from '../pages/Home'
import BookVehicle from '../pages/BookVehicle'
import InstantBooking from '../pages/InstantBooking'
import ScheduledBooking from '../pages/ScheduledBooking'
import RentalBooking from '../pages/RentalBooking'
import MyBookings from '../pages/MyBookings'
import OwnerApproval from '../pages/OwnerApproval'
import Bus from '../pages/bus/Bus'
import Buslogin from '../pages/bus/Buslogin'
import DriverDashboard from '../pages/bus/DriverDashboard'
import BusPassengerLogin from '../pages/bus/BusPassengerLogin'
import BusRouteSelection from '../pages/bus/BusRouteSelection'
import BusPassenger from '../pages/bus/BusPassenger'

export const routes = [
  { path: '/', element: <Home /> },
  { path: '/book', element: <InstantBooking /> },
  { path: '/schedule', element: <ScheduledBooking /> },
  { path: '/rent', element: <RentalBooking /> },
  { path: '/bookings', element: <MyBookings /> },
  { path: '/owner-approval', element: <OwnerApproval /> },
  { path: '/bus', element: <Bus /> },
  { path: '/bus-login', element: <Buslogin /> },
  { path: '/bus/driver-dashboard', element: <DriverDashboard /> },
  { path: '/bus/passenger-login', element: <BusPassengerLogin /> },
  { path: '/bus/select-route', element: <BusRouteSelection /> },
  { path: '/bus/track', element: <BusPassenger /> },
]

export default routes
