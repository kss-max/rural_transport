const owners = ['Koushik', 'Meena', 'Ravi', 'Sita', 'Arun', 'Priya', 'Deepak', 'Lakshmi']
const villages = ['Manila', 'Nila', 'Kaveri', 'Ganga', 'Krishna', 'Godavari']
const categories = ['Auto', 'Car', 'Pickup', 'Tractor']

function randomChoice(list) {
  return list[Math.floor(Math.random() * list.length)]
}

function randomPrice() {
  return 8 + Math.floor(Math.random() * 12)
}

export function generateVehicles(count = 8) {
  return Array.from({ length: count }).map((_, idx) => {
    const category = randomChoice(categories)
    return {
      id: `veh-${Date.now()}-${idx}-${Math.random().toString(16).slice(2, 6)}`,
      owner: randomChoice(owners),
      phone: '9876543210',
      village: randomChoice(villages),
      category,
      description: `${category} available for local trips`,
      pricePerKm: randomPrice(),
    }
  })
}

export const initialVehicles = generateVehicles(8)
