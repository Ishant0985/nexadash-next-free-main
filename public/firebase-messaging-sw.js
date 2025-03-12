// public/firebase-messaging-sw.js

// Import Firebase scripts (using the compat versions)
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.0.0/firebase-messaging-compat.js');

try {
  firebase.initializeApp({
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID, // Replace with your actual measurementId
  });

  const messaging = firebase.messaging();

  // Listen for background messages
  messaging.onBackgroundMessage((payload) => {
    console.log('Received background message ', payload);
    const { title, body, icon } = payload.notification || {};
    self.registration.showNotification(title, {
      body,
      icon: icon || '/images/logo.svg',
    });
  });
} catch (error) {
  console.error('Error in firebase-messaging-sw.js:', error);
}

// Handle notification click events
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event.notification);
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow('/');
    })
  );
});
