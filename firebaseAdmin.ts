// firebaseAdmin.ts
import * as admin from 'firebase-admin';

// Initialize the Admin SDK if not already initialized.
if (!admin.apps.length) {
  // Parse the service account JSON from an environment variable.
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY as string);
  
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: process.env.FIREBASE_DATABASE_URL, // Optional: if using the Realtime Database
  });
}

export { admin };
