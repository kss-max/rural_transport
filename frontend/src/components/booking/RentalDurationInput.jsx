import { useState } from 'react'

export default function RentalDurationInput({ onDurationChange }) {
  const [durationType, setDurationType] = useState('hours') // hours | days | custom
  const [hours, setHours] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleHoursChange = (e) => {
    const val = e.target.value
    setHours(val)
    onDurationChange({
      rentalHours: Number(val) || 0,
      rentalStartDate: null,
      rentalEndDate: null,
    })
  }

  const handleDaysChange = (e) => {
    const days = Number(e.target.value) || 0
    setHours(days * 24)
    onDurationChange({
      rentalHours: days * 24,
      rentalStartDate: null,
      rentalEndDate: null,
    })
  }

  const handleCustomChange = (field, val) => {
    const newStart = field === 'start' ? val : startDate
    const newEnd = field === 'end' ? val : endDate
    if (field === 'start') setStartDate(val)
    if (field === 'end') setEndDate(val)

    onDurationChange({
      rentalHours: null,
      rentalStartDate: newStart || null,
      rentalEndDate: newEnd || null,
    })
  }

  const now = new Date()
  const minDateTime = now.toISOString().slice(0, 16)

  return (
    <div className="space-y-4">
      <label className="block text-slate-700 font-semibold mb-2 text-sm">Rental Duration *</label>

      {/* Duration type selector */}
      <div className="flex gap-2">
        {[
          { key: 'hours', label: 'By Hours' },
          { key: 'days', label: 'By Days' },
          { key: 'custom', label: 'Custom Dates' },
        ].map((opt) => (
          <button
            type="button"
            key={opt.key}
            onClick={() => setDurationType(opt.key)}
            className={`px-4 py-2 rounded-xl border text-sm font-medium transition-all duration-200 hover:scale-[1.03] active:scale-[0.98] ${
              durationType === opt.key
                ? 'bg-orange-600 text-white border-orange-600 shadow-md'
                : 'bg-white text-slate-600 border-slate-200 hover:border-orange-400 shadow-sm'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {durationType === 'hours' && (
        <input
          type="number"
          min="1"
          placeholder="Enter number of hours"
          value={hours}
          onChange={handleHoursChange}
          required
          className="w-full border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
      )}

      {durationType === 'days' && (
        <input
          type="number"
          min="1"
          placeholder="Enter number of days"
          onChange={handleDaysChange}
          required
          className="w-full border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
        />
      )}

      {durationType === 'custom' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1">Start Date & Time</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={(e) => handleCustomChange('start', e.target.value)}
              min={minDateTime}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            />
          </div>
          <div>
            <label className="block text-slate-600 text-sm font-medium mb-1">End Date & Time</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={(e) => handleCustomChange('end', e.target.value)}
              min={startDate || minDateTime}
              required
              className="w-full border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-all duration-200"
            />
          </div>
        </div>
      )}
    </div>
  )
}
