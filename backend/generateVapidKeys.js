// ============================================
// GENERATE VAPID KEYS (Run once only!)
// ============================================
// VAPID = Voluntary Application Server Identification
//
// These keys are like a "passport" for your server.
// When your backend sends a push notification, the browser's
// push service (Google/Mozilla) needs to verify it's really
// coming from YOUR server. VAPID keys prove your identity.
//
// PUBLIC KEY  → shared with the browser (frontend)
// PRIVATE KEY → kept secret on your server (backend only)
//
// Run this script: node generateVapidKeys.js
// Then copy the keys into your .env file
// ============================================

const webpush = require('web-push')

const vapidKeys = webpush.generateVAPIDKeys()

console.log('=== VAPID Keys Generated ===')
console.log('')
console.log('Add these to your backend .env file:')
console.log('')
console.log(`VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log(`VAPID_PRIVATE_KEY=${vapidKeys.privateKey}`)
console.log('')
console.log('Add this to your frontend .env file:')
console.log('')
console.log(`VITE_VAPID_PUBLIC_KEY=${vapidKeys.publicKey}`)
console.log('')
console.log('================================')
