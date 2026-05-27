const passport = require('passport'); 
const { Strategy: JwtStrategy, ExtractJwt } = require('passport-jwt');
const { findUserById } = require('../services/userService'); 

const cookieExtractor = (req) => {
  if (req && req.cookies) {
    const token = req.cookies.access_token || null;
    console.log('[JWT] Cookie extractor:', token ? 'Token found in cookie' : 'No token in cookies');
    console.log('[JWT] Auth header:', req.headers.authorization || 'No Authorization header');
    return token;
  }
  console.log('[JWT] No cookies object in request');
  return null;
};

const options = {
  jwtFromRequest: ExtractJwt.fromExtractors([
    cookieExtractor, 
    ExtractJwt.fromAuthHeaderAsBearerToken()
  ]),
  secretOrKey: process.env.JWT_SECRET || 'dev_secret_key',
  passReqToCallback: false,
};

console.log('[JWT] Passport configured with secret:', (process.env.JWT_SECRET || 'dev_secret_key').substring(0, 10) + '...');

passport.use(
  new JwtStrategy(options, async (payload, done) => {
    try {
      console.log('[JWT] ✅ Token decoded successfully');
      console.log('[JWT] Verifying payload:', payload.sub, 'role:', payload.role);
      const user = await findUserById(payload.sub);
      if (!user) {
        console.log('[JWT] ❌ User not found for id:', payload.sub);
        return done(null, false);
      }
      console.log('[JWT] ✅ User authenticated:', user.email, 'role:', user.role);
      return done(null, user);
    } catch (err) {
      console.log('[JWT] ❌ Error:', err.message);
      return done(err, false);
    }
  }),
);

module.exports = passport; 