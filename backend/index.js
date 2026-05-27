require('dotenv').config()

const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const morgan = require('morgan')
const passport = require('./config/passport')
const { connectDB, clearAllLocationData } = require('./config/database')

const authRoutes = require('./auth/userlogin')

const vehicleRoutes = require('./routes/vehicles')
const bookingRoutes = require('./routes/bookings')
const busRoutes = require('./routes/bus')


const app = express()
connectDB()
app.use(cookieParser())


const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173'

app.use(
	cors({
		origin: [CLIENT_URL, 'http://localhost:5173', 'http://localhost:5174'],
		credentials: true,
		allowedHeaders: ['Content-Type', 'Authorization'],
		methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
	}),
)


app.use(morgan('dev'))
app.use(express.json())

app.use(passport.initialize())

app.get('/health', (req, res) => {
	res.json({ status: 'ok' })
})

app.use('/auth', authRoutes)
app.use('/vehicles', vehicleRoutes)
app.use('/bookings', bookingRoutes)
app.use('/bus', busRoutes)



app.use((req, res) => {
	res.status(404).json({ message: 'Not found' })
})

const PORT = process.env.PORT || 4000
const server = app.listen(PORT, () => {
	console.log(`Backend running on port ${PORT}`)
})

// Graceful shutdown - clear location data when server stops
const gracefulShutdown = async (signal) => {
	console.log(`\n${signal} received. Cleaning up location data...`)
	await clearAllLocationData()
	server.close(() => {
		console.log('Server closed')
		process.exit(0)
	})
}

// Handle different shutdown signals
process.on('SIGINT', () => gracefulShutdown('SIGINT'))   // Ctrl+C
process.on('SIGTERM', () => gracefulShutdown('SIGTERM')) // Kill command
process.on('SIGHUP', () => gracefulShutdown('SIGHUP'))   // Terminal closed
