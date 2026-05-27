import { useState } from 'react'
import BookingForm from '../components/booking/BookingForm'
import RentalDurationInput from '../components/booking/RentalDurationInput'
import { createRentalBooking } from '../services/bookingService'

export default function RentalBooking() {
  const [duration, setDuration] = useState({
    rentalHours: null,
    rentalStartDate: null,
    rentalEndDate: null,
  })

  return (
    <BookingForm
      bookingType="rental"
      title="Rent a Vehicle"
      accentColor="orange"
      onSubmit={(data) =>
        createRentalBooking({
          ...data,
          rentalHours: duration.rentalHours,
          rentalStartDate: duration.rentalStartDate,
          rentalEndDate: duration.rentalEndDate,
        })
      }
    >
      {({ formData, handleChange, handleSubmit, loading, purposeOptions }) => (
        <form
          onSubmit={(e) => {
            if (!duration.rentalHours && !duration.rentalStartDate) {
              e.preventDefault()
              alert('Please specify rental duration')
              return
            }
            handleSubmit(e, {
              rentalHours: duration.rentalHours,
              rentalStartDate: duration.rentalStartDate,
              rentalEndDate: duration.rentalEndDate,
            })
          }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5"
        >
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pickup Location *</label>
            <input
              type="text"
              name="pickup"
              value={formData.pickup}
              onChange={handleChange}
              placeholder="e.g. Manila Village Center"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-150"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Drop / Return Location *</label>
            <input
              type="text"
              name="drop"
              value={formData.drop}
              onChange={handleChange}
              placeholder="e.g. Same as pickup"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-150"
            />
          </div>

          <RentalDurationInput onDurationChange={setDuration} />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Purpose *</label>
            <select
              name="purpose"
              value={formData.purpose}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-150"
            >
              {purposeOptions.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 text-white py-3 rounded-xl font-semibold text-sm hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-200 disabled:bg-gray-200 disabled:text-gray-400 disabled:from-gray-200 disabled:to-gray-200"
          >
            {loading ? 'Booking Rental...' : 'Rent Vehicle'}
          </button>
        </form>
      )}
    </BookingForm>
  )
}
