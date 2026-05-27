import { useState } from 'react'
import BookingForm from '../components/booking/BookingForm'
import DateTimePicker from '../components/booking/DateTimePicker'
import { createScheduledBooking } from '../services/bookingService'

export default function ScheduledBooking() {
  const [scheduledDate, setScheduledDate] = useState('')

  const now = new Date()
  const minDateTime = now.toISOString().slice(0, 16)

  return (
    <BookingForm
      bookingType="scheduled"
      title="Schedule a Ride"
      accentColor="indigo"
      onSubmit={(data) => createScheduledBooking({ ...data, scheduledDate })}
    >
      {({ formData, handleChange, handleSubmit, loading, purposeOptions }) => (
        <form
          onSubmit={(e) => {
            if (!scheduledDate) {
              e.preventDefault()
              alert('Please select a scheduled date and time')
              return
            }
            handleSubmit(e, { scheduledDate })
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
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Drop Location *</label>
            <input
              type="text"
              name="drop"
              value={formData.drop}
              onChange={handleChange}
              placeholder="e.g. District Hospital"
              required
              className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all duration-150"
            />
          </div>

          <DateTimePicker
            label="Schedule Date & Time"
            name="scheduledDate"
            value={scheduledDate}
            onChange={(e) => setScheduledDate(e.target.value)}
            min={minDateTime}
            required
          />

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
            {loading ? 'Scheduling...' : 'Schedule Ride'}
          </button>
        </form>
      )}
    </BookingForm>
  )
}
