function VehicleCard({ vehicle, onBook }) {
  return (
    <article className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900">{vehicle.category}</h3>
        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full text-sm font-semibold">
          ₹{vehicle.pricePerKm}/km
        </span>
      </div>

      <div className="space-y-2 mb-4 text-sm text-gray-600">
        <p><span className="font-medium text-gray-700">Owner:</span> {vehicle.ownerName}</p>
        <p><span className="font-medium text-gray-700">Village:</span> {vehicle.village}</p>
        <p><span className="font-medium text-gray-700">Phone:</span> {vehicle.phone}</p>
      </div>

      {vehicle.description && (
        <p className="text-gray-400 text-sm mb-5 leading-relaxed">{vehicle.description}</p>
      )}

      <button
        onClick={() => onBook(vehicle)}
        className="w-full text-white rounded-xl px-6 py-3 font-semibold text-sm bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-[0.98] shadow-sm hover:shadow-md transition-all duration-200"
      >
        Book Now
      </button>
    </article>
  )
}

export default VehicleCard
