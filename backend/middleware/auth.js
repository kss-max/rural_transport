const passport = require('../config/passport')

const requireAuth = passport.authenticate('jwt', { session: false })

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden' })
  }
  return next()
}

const requireDriver = (req, res, next) => {
  if (!req.user || req.user.role !== 'DRIVER') {
    return res.status(403).json({ message: 'Access denied. Driver role required.' })
  }
  return next()
}

module.exports = {
  requireAuth,
  requireRole,
  requireDriver,
}
