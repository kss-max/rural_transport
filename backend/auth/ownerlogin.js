const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const { findUserByEmail, createUser } = require('../services/userService')

const router = express.Router()

const COOKIE_NAME = 'access_token'
const JWT_SECRET = process.env.JWT_SECRET || 'dev_secret_key'
const TOKEN_EXPIRES_IN = '7d'

const defaultCookieOptions = {
  httpOnly: true,
  sameSite: 'none',
  secure: process.env.COOKIE_SECURE !== 'false',
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

//
// OWNER REGISTER
//
router.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const existingUser = await findUserByEmail(email)
    if (existingUser) {
      return res.status(409).json({ message: 'Email already in use.' })
    }

    const passwordHash = await bcrypt.hash(password, 10)

    const owner = await createUser({
      email: email.toLowerCase(),
      passwordHash,
      role: 'OWNER',
    })

    const token = createToken(owner)
    res.cookie(COOKIE_NAME, token, defaultCookieOptions)

    return res.status(201).json({
      user: {
        id: owner.id,
        email: owner.email,
        role: owner.role,
      },
    })
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }
})

//
// OWNER LOGIN
//
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const owner = await findUserByEmail(email)
    if (!owner || owner.role !== 'OWNER') {
      return res.status(401).json({ message: 'Invalid owner credentials.' })
    }

    const validPassword = await bcrypt.compare(password, owner.passwordHash)
    if (!validPassword) {
      return res.status(401).json({ message: 'Invalid owner credentials.' })
    }

    const token = createToken(owner)
    res.cookie(COOKIE_NAME, token, defaultCookieOptions)

    return res.json({
      user: {
        id: owner.id,
        email: owner.email,
        role: owner.role,
      },
    })
  } catch (err) {
    return res.status(500).json({ message: 'Server error' })
  }
})

module.exports = router
