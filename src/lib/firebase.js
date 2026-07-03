import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// SvelteKit public env vars or Vite-style env vars
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || ""
};

const isConfigured = !!(firebaseConfig.apiKey && firebaseConfig.projectId);

export const useMock = !isConfigured;

let app;
let auth;
let db;

if (!useMock) {
  try {
    app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Failed to initialize Firebase, falling back to mock mode:", error);
  }
} else {
  if (typeof window !== 'undefined') {
    console.warn(
      "⚠️ Firebase API Key / Project ID not found in environment variables.\n" +
      "Running Tracker in MOCK Mode. Data will be saved in localStorage."
    );
  }
}

export { auth, db };
