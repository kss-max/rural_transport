// ============================================
// NOTIFICATION ROUTES
// ============================================
// These are the API endpoints the frontend calls:
//
// POST /notifications/subscribe
//   → Frontend sends the browser's push subscription
//   → We save it in MongoDB
//   → Now we can send this user push notifications
//
// POST /notifications/unsubscribe
//   → Frontend tells us to stop sending notifications
//   → We delete the subscription from MongoDB
//
// GET /notifications/vapid-public-key
//   → Frontend needs our VAPID public key to subscribe
//   → This is like giving the frontend our "server ID"
//     so the browser knows which server to accept pushes from
// ============================================

const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { saveSubscription, removeSubscription } = require('../services/notificationService');

const router = express.Router();

// POST /notifications/subscribe
// Body: { subscription: { endpoint, keys: { p256dh, auth } } }
router.post('/subscribe', requireAuth, async (req, res) => {
  try {
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: 'Invalid subscription object' });
    }

    await saveSubscription(req.user.id, subscription);
    return res.json({ message: 'Subscribed to notifications' });
  } catch (error) {
    console.error('[Notifications] Subscribe error:', error);
    return res.status(500).json({ message: 'Failed to subscribe' });
  }
});

// POST /notifications/unsubscribe
router.post('/unsubscribe', requireAuth, async (req, res) => {
  try {
    await removeSubscription(req.user.id);
    return res.json({ message: 'Unsubscribed from notifications' });
  } catch (error) {
    console.error('[Notifications] Unsubscribe error:', error);
    return res.status(500).json({ message: 'Failed to unsubscribe' });
  }
});

// GET /notifications/vapid-public-key
// No auth required — frontend needs this BEFORE the user is logged in
// to set up the service worker
router.get('/vapid-public-key', (req, res) => {
  return res.json({ publicKey: process.env.VAPID_PUBLIC_KEY });
});

module.exports = router;
