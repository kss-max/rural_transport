const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { findUserByEmail, createUser } = require('../services/userService')
const { requireAuth } = require('../middleware/auth')

const router = express.Router()

const COOKIE_NAME = 'access_token'
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key'
const TOKEN_EXPIRES_IN = '7d'

// For local development, use none/secure flags or lax depending on environment
const isProduction = process.env.NODE_ENV === 'production'
const defaultCookieOptions = {
  httpOnly: true,
  sameSite: isProduction ? 'none' : 'lax',
  secure: isProduction,
  maxAge: 7 * 24 * 60 * 60 * 1000,
}

function createToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: user.role,
      email: user.email,
    },
    JWT_SECRET,
    { expiresIn: TOKEN_EXPIRES_IN }
  )
}

router.post('/register', async (req, res) => {
  try {
    const { email, password, role } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    // Only allow USER or PROVIDER roles, default to USER
    const validRoles = ['USER', 'PROVIDER']
    const userRole = validRoles.includes(role) ? role : 'USER'

    const user = await createUser({
      email: email.toLowerCase(),
      passwordHash,
      role: userRole,
    })

    const token = createToken(user)
    res.cookie(COOKIE_NAME, token, defaultCookieOptions)

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }
})

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const user = await findUserByEmail(email)
    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash)
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid credentials.' })
    }

    const token = createToken(user)
    res.cookie(COOKIE_NAME, token, defaultCookieOptions)

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
    })
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE_NAME, { ...defaultCookieOptions, maxAge: 0 })
  return res.json({ message: 'Logged out' })
})

router.get('/me', requireAuth, (req, res) => {
  return res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      role: req.user.role,
    },
  })
})

module.exports = router
