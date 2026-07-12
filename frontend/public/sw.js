// ============================================
// SERVICE WORKER — Push Notification Handler
// ============================================
// 
// WHAT IS A SERVICE WORKER?
// A Service Worker is a JavaScript file that the browser runs
// IN THE BACKGROUND, separate from your website.
// 
// Think of it like a security guard who stays at the building
// even after everyone goes home. When a delivery (push notification)
// arrives, the guard (SW) receives it and puts a note on your door
// (shows a notification popup).
//
// KEY POINTS:
// - It runs even when your website tab is closed
// - It can't access the DOM (no document, no window)
// - It can show notifications and open URLs
// - It must be in the public/ folder (browser requirement)
//
// TWO EVENTS WE HANDLE:
// 1. "push"            → a notification arrived from the server
// 2. "notificationclick" → user clicked on the notification popup
// ============================================

// ---- EVENT: PUSH ----
// Fired when our backend sends a push notification via web-push
// The data comes as a JSON string (we sent it from notificationService.js)
self.addEventListener('push', (event) => {
  console.log('[SW] Push notification received');

  let data = {
    title: 'Rural Transport',
    body: 'You have a new notification',
    data: { url: '/' }
  };

  // Parse the payload sent from our backend
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      console.error('[SW] Failed to parse push data:', e);
    }
  }
 
  // Show the notification popup
  // event.waitUntil() tells the browser: "don't kill the SW
  // until this promise resolves" (otherwise the notification
  // might not show if the SW gets terminated too early)
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/vite.svg',            // Small icon shown in notification
      badge: '/vite.svg',           // Android badge icon
      vibrate: [200, 100, 200],     // Vibration pattern for mobile
      tag: data.data?.type || 'default',  // Prevents duplicate notifications
      data: data.data               // Custom data (we use it in notificationclick)
    })
  );
});

// ---- EVENT: NOTIFICATION CLICK ----
// Fired when the user clicks on the notification popup
// We open the relevant page (e.g., /provider-dashboard) 
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Notification clicked');
  
  // Close the notification popup
  event.notification.close();

  // Get the URL to open (we set this in notificationService.js → payload.data.url)
  const urlToOpen = event.notification.data?.url || '/';

  // Open the URL in an existing tab if available, otherwise open a new tab
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if we already have a tab open with our site
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin)) {
          // Found an existing tab — navigate it and bring it to focus
          client.navigate(urlToOpen);
          return client.focus();
        }
      }
      // No existing tab — open a new one
      return clients.openWindow(urlToOpen);
    })
  );
});

// ---- EVENT: ACTIVATE ----
// Take control of all tabs immediately (don't wait for refresh)
self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});
