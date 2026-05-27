export default function DateTimePicker({ label, value, onChange, name, min, required = false }) {
  return (
    <div>
      <label className="block text-slate-700 font-semibold mb-2 text-sm">
        {label} {required && '*'}
      </label>
      <input
        type="datetime-local"
        name={name}
        value={value}
        onChange={onChange}
        min={min}
        required={required}
        className="w-full border border-slate-200 rounded-xl px-4 py-3 shadow-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all duration-200"
      />
    </div>
  )
}
