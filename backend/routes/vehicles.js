const express = require('express')
const { requireAuth, requireRole } = require('../middleware/auth')
const { getVehicles, createVehicle } = require('../services/vehicleService')

const router = express.Router()

router.get('/', async (req, res) => {
  try {
    const vehicles = await getVehicles()
    return res.json({ vehicles })
  } catch (err) {
    console.error('Get vehicles error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})


router.post('/', requireAuth, requireRole('PROVIDER', 'ADMIN'), async (req, res) => {
  try {
    const { ownerName, phone, village, category, description, pricePerKm } = req.body
    if (!ownerName || !phone || !village || !category || !pricePerKm) {
      return res.status(400).json({ message: 'Missing required fields.' })
    }

    const vehicle = await createVehicle({
      ownerName,
      phone,
      village,
      category,
      description: description || '',
      pricePerKm: Number(pricePerKm) || 0,
      providerId: req.user.id,
    })

    return res.status(201).json({ vehicle })
  } catch (err) {
    console.error('Create vehicle error', err)
    return res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
