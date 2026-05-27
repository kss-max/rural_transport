function LargeButton({ label, onClick, type = 'button' }) {
  return (
    <button
      className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-xl px-6 py-3 font-semibold hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
      type={type}
      onClick={onClick}
    >
      {label}
    </button>
  )
}

export default LargeButton
