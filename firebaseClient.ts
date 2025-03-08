// firebaseClient.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore';

// Firebase client configuration using environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Initialize the Firebase app if not already initialized
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const auth = getAuth(app);
export const db = getFirestore(app);

// Helper function to get and increment counter
export async function getNextId(counterName: string) {
  const counterRef = doc(db, 'counters', counterName);
  const counterDoc = await getDoc(counterRef);
  
  if (!counterDoc.exists()) {
    await setDoc(counterRef, { value: 1 });
    return 1;
  }

  const currentValue = counterDoc.data().value || 0;
  const nextValue = currentValue + 1;
  await updateDoc(counterRef, { value: nextValue });
  return nextValue;
}
