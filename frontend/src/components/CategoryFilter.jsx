function CategoryFilter({ selectedCategory, onSelectCategory }) {
  const categories = ['All', 'Auto', 'Car', 'Pickup', 'Tractor']

  return (
    <div className="flex gap-2 flex-wrap">
      {categories.map((cat) => (
        <button
          key={cat}
          onClick={() => onSelectCategory(cat)}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-200 ${selectedCategory === cat
              ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm'
              : 'bg-white text-gray-600 border border-gray-200 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-sm'
            }`}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}

export default CategoryFilter
