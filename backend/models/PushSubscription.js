// ============================================
// PUSH SUBSCRIPTION MODEL
// ============================================
// When a provider clicks "Allow notifications" in their browser,
// the browser generates a "subscription" object that looks like:
//
// {
//   endpoint: "https://fcm.googleapis.com/fcm/send/abc123...",  ← unique URL for THIS browser
//   keys: {
//     p256dh: "BNcR...",   ← encryption key (browser generates this)
//     auth: "tBHI..."      ← auth secret (browser generates this)
//   }
// }
//
// We store this in MongoDB, linked to the user's ID.
// Later, when a passenger books their vehicle, we look up this
// subscription and use it to send a push notification.
// ============================================

const mongoose = require('mongoose');

const pushSubscriptionSchema = new mongoose.Schema({
  // Which user this subscription belongs to
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },

  // The push subscription object from the browser
  // This contains the endpoint URL and encryption keys
  subscription: {
    endpoint: { type: String, required: true },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
  },
}, {
  timestamps: true,  // adds createdAt, updatedAt
});

// One subscription per user (if they re-subscribe, replace the old one)
pushSubscriptionSchema.index({ userId: 1 }, { unique: true });

module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);
