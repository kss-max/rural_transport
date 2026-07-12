// ============================================
// NOTIFICATION SERVICE
// ============================================
// This is the "brain" of the push notification system.
//
// HOW WEB PUSH WORKS (simplified):
// 1. Provider allows notifications → browser gives us a subscription
// 2. We save that subscription in MongoDB (saveSubscription)
// 3. When a passenger books → we call notifyProvider()
// 4. notifyProvider() looks up the provider's subscription from MongoDB
// 5. We use the `web-push` library to send a push message
//    to the browser's push service (Google/Mozilla servers)
// 6. The push service delivers it to the provider's browser
// 7. The Service Worker (sw.js) catches it and shows a notification popup
//
// The provider sees the notification even if they closed the tab!
// ============================================

const webpush = require('web-push');
const PushSubscription = require('../models/PushSubscription');

// Configure web-push with our VAPID keys
// VAPID keys prove to browser push services that WE are the ones
// sending the notification (not a spammer)
webpush.setVapidDetails(
  'mailto:admin@ruraltransport.com',  // Contact email (required by the spec)
  process.env.VAPID_PUBLIC_KEY,
  process.env.VAPID_PRIVATE_KEY
);

// ---- SAVE SUBSCRIPTION ----
// Called when a provider clicks "Allow notifications"
// Saves their browser's push subscription to MongoDB
async function saveSubscription(userId, subscription) {
  try {
    // Upsert: if subscription exists for this user, replace it
    // (handles case where user clears browser data and re-subscribes)
    const result = await PushSubscription.findOneAndUpdate(
      { userId },
      { userId, subscription },
      { upsert: true, new: true }
    );
    console.log(`[Push] Subscription saved for user ${userId}`);
    return result;
  } catch (error) {
    console.error('[Push] Failed to save subscription:', error.message);
    throw error;
  }
}

// ---- REMOVE SUBSCRIPTION ----
// Called when a provider disables notifications
async function removeSubscription(userId) {
  try {
    await PushSubscription.findOneAndDelete({ userId });
    console.log(`[Push] Subscription removed for user ${userId}`);
  } catch (error) {
    console.error('[Push] Failed to remove subscription:', error.message);
    throw error;
  }
}

// ---- SEND PUSH NOTIFICATION ----
// Sends a push notification to a specific user
// The payload is what the Service Worker will show as a notification
async function sendPushToUser(userId, payload) {
  try {
    const sub = await PushSubscription.findOne({ userId });
    if (!sub) {
      console.log(`[Push] No subscription found for user ${userId} — skipping`);
      return null;
    }

    // web-push.sendNotification() sends the message to the browser's
    // push service (e.g., Google's FCM endpoint), which then delivers
    // it to the user's browser
    const result = await webpush.sendNotification(
      sub.subscription,
      JSON.stringify(payload)  // Must be a string
    );
    console.log(`[Push] Notification sent to user ${userId}`);
    return result;
  } catch (error) {
    // If the subscription is expired/invalid, clean it up
    if (error.statusCode === 410 || error.statusCode === 404) {
      console.log(`[Push] Subscription expired for user ${userId} — removing`);
      await PushSubscription.findOneAndDelete({ userId });
    } else {
      console.error(`[Push] Failed to send notification to user ${userId}:`, error.message);
    }
    return null;
  }
}

// ---- NOTIFY PROVIDER ABOUT NEW BOOKING ----
// This is the main function called from bookingController
// when a passenger creates a new booking
async function notifyProviderAboutBooking(providerId, booking) {
  const payload = {
    title: '🚗 New Booking Request!',
    body: `${booking.vehicleCategory} requested: ${booking.pickup} → ${booking.drop}`,
    // data is passed to the Service Worker so it can decide
    // what page to open when the user clicks the notification
    data: {
      url: '/provider-dashboard',
      bookingId: booking.id,
      type: 'NEW_BOOKING'
    }
  };

  return sendPushToUser(providerId, payload);
}

module.exports = {
  saveSubscription,
  removeSubscription,
  sendPushToUser,
  notifyProviderAboutBooking,
};
