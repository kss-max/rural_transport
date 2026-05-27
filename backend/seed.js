const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const User = require('./models/User')
const Vehicle = require('./models/Vehicle')

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/rural_transport'
    await mongoose.connect(uri)
    console.log('Connected to MongoDB')

    // Clear existing data
    await User.deleteMany({})
    await Vehicle.deleteMany({})
    console.log('Cleared existing data')

    // Create test users
    const hashedPassword = await bcrypt.hash('password123', 10)

    const users = await User.insertMany([
      {
        email: 'provider1@example.com',
        passwordHash: hashedPassword,
        role: 'PROVIDER',
      },
      {
        email: 'provider2@example.com',
        passwordHash: hashedPassword,
        role: 'PROVIDER',
      },
      {
        email: 'user@example.com',
        passwordHash: hashedPassword,
        role: 'USER',
      },
      {
        email: 'admin@example.com',
        passwordHash: hashedPassword,
        role: 'ADMIN',
      },
    ])
    console.log('Created 4 users')

    // Create sample vehicles
    const vehicles = await Vehicle.insertMany([
      {
        ownerName: 'Raj Kumar',
        phone: '9876543210',
        village: 'Manila Village',
        category: 'Auto',
        description: 'Comfortable auto rickshaw for short trips',
        pricePerKm: 10,
        providerId: users[0]._id,
      },
      {
        ownerName: 'Priya Singh',
        phone: '9876543211',
        village: 'Manila Village',
        category: 'Bike',
        description: 'Fast bike for quick deliveries',
        pricePerKm: 5,
        providerId: users[0]._id,
      },
      {
        ownerName: 'Amit Patel',
        phone: '9876543212',
        village: 'Manila Village',
        category: 'Car',
        description: 'Spacious car for family trips',
        pricePerKm: 20,
        providerId: users[1]._id,
      },
      {
        ownerName: 'Sneha Gupta',
        phone: '9876543213',
        village: 'Manila Village',
        category: 'Van',
        description: 'Large van for group travel',
        pricePerKm: 30,
        providerId: users[1]._id,
      },
      {
        ownerName: 'Vikram Singh',
        phone: '9876543214',
        village: 'Manila Village',
        category: 'Truck',
        description: 'Heavy truck for cargo transport',
        pricePerKm: 50,
        providerId: users[0]._id,
      },
    ])
    console.log('Created 5 vehicles')

    console.log('\n✅ Seed data inserted successfully!\n')
    console.log('Test credentials:')
    console.log('Provider: provider1@example.com / password123')
    console.log('Provider: provider2@example.com / password123')
    console.log('User: user@example.com / password123')
    console.log('Admin: admin@example.com / password123')

    await mongoose.connection.close()
    console.log('\nDisconnected from MongoDB')
  } catch (error) {
    console.error('Seed error:', error)
    process.exit(1)
  }
}

seed()
