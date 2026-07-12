// ============================================
// PUSH NOTIFICATION SERVICE (Frontend)
// ============================================
//
// This service handles 3 things:
//
// 1. REGISTER SERVICE WORKER
//    Tells the browser: "Hey, load sw.js and keep it running
//    in the background to catch push notifications"
//
// 2. REQUEST PERMISSION
//    Shows the "Allow notifications?" popup to the user
//
// 3. SUBSCRIBE TO PUSH
//    If user clicks "Allow", the browser creates a push subscription
//    (endpoint URL + encryption keys) and we send it to our backend
//
// FLOW:
// App loads → is user a PROVIDER? → register SW → ask permission
// → user clicks Allow → browser creates subscription → send to backend
// → done! Now backend can send push notifications to this browser
// ============================================

import { api } from './api'

// Convert VAPID public key from base64 string to Uint8Array
// (the browser's PushManager needs it in this format)
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

// ---- REGISTER SERVICE WORKER ----
// Must be called when the app loads
// Returns the SW registration object (we need it to subscribe)
export async function registerServiceWorker() {
  // Check if browser supports Service Workers
  if (!('serviceWorker' in navigator)) {
    console.log('[Push] Service Workers not supported in this browser')
    return null
  }

  try {
    // Register sw.js (it's in the public/ folder, served at root /)
    const registration = await navigator.serviceWorker.register('/sw.js')
    console.log('[Push] Service Worker registered')
    return registration
  } catch (error) {
    console.error('[Push] Service Worker registration failed:', error)
    return null
  }
}

// ---- SUBSCRIBE TO PUSH NOTIFICATIONS ----
// This does everything: register SW → ask permission → subscribe → send to backend
export async function subscribeToPush() {
  try {
    // Step 1: Register the service worker
    const registration = await registerServiceWorker()
    if (!registration) return false

    // Step 2: Check if notifications are supported
    if (!('PushManager' in window)) {
      console.log('[Push] Push notifications not supported in this browser')
      return false
    }
  
    // Step 3: Request permission (shows "Allow notifications?" popup)
    const permission = await Notification.requestPermission()
    if (permission !== 'granted') {
      console.log('[Push] Notification permission denied by user')
      return false
    }

    // Step 4: Get the VAPID public key
    // We could also use import.meta.env.VITE_VAPID_PUBLIC_KEY directly,
    // but fetching from backend ensures frontend and backend are always in sync
    const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY

    if (!vapidPublicKey) {
      console.error('[Push] No VAPID public key found')
      return false
    }

    // Step 5: Subscribe to push
    // This tells the browser: "Create a push subscription using this server's VAPID key"
    // The browser contacts Google/Mozilla push service and gets back a subscription object
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,  // Required: promise to always show a visible notification
      applicationServerKey: urlBase64ToUint8Array(vapidPublicKey)
    })

    console.log('[Push] Push subscription created:', subscription.endpoint.substring(0, 50) + '...')

    // Step 6: Send the subscription to our backend to save in MongoDB
    await api.post('/notifications/subscribe', { subscription })
    console.log('[Push] Subscription sent to backend ✅')

    return true
  } catch (error) {
    console.error('[Push] Failed to subscribe:', error)
    return false
  }
}

// ---- UNSUBSCRIBE FROM PUSH ----
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()

    if (subscription) {
      await subscription.unsubscribe()
      await api.post('/notifications/unsubscribe')
      console.log('[Push] Unsubscribed from push notifications')
    }

    return true
  } catch (error) {
    console.error('[Push] Failed to unsubscribe:', error)
    return false
  }
}

// ---- CHECK IF ALREADY SUBSCRIBED ----
export async function isSubscribedToPush() {
  try {
    if (!('serviceWorker' in navigator)) return false
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  } catch {
    return false
  }
}
