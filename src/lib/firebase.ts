
// src/lib/firebase.ts
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
// Import getAnalytics if you plan to use it
// import { getAnalytics, isSupported } from "firebase/analytics";

// --- TEMPORARY DEBUGGING - CHECK YOUR SERVER TERMINAL OUTPUT ---
console.log("DEBUG: NEXT_PUBLIC_FIREBASE_API_KEY:", process.env.NEXT_PUBLIC_FIREBASE_API_KEY);
console.log("DEBUG: NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN:", process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN);
console.log("DEBUG: NEXT_PUBLIC_FIREBASE_PROJECT_ID:", process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
console.log("DEBUG: NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET:", process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET);
console.log("DEBUG: NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:", process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID);
console.log("DEBUG: NEXT_PUBLIC_FIREBASE_APP_ID:", process.env.NEXT_PUBLIC_FIREBASE_APP_ID);
console.log("DEBUG: NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID:", process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID);
// --- END TEMPORARY DEBUGGING ---

const firebaseConfig = {
  apiKey: String(process.env.NEXT_PUBLIC_FIREBASE_API_KEY || ""),
  authDomain: String(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || ""),
  projectId: String(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || ""),
  storageBucket: String(process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || ""),
  messagingSenderId: String(process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || ""),
  appId: String(process.env.NEXT_PUBLIC_FIREBASE_APP_ID || ""),
  measurementId: String(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || ""), // Optional
};

// Initialize Firebase
let app: FirebaseApp; // Use FirebaseApp type
if (!getApps().length) {
  // Basic check to prevent initialization with obviously missing critical config
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    console.error("Firebase configuration is missing critical values (apiKey or projectId). Firebase will not initialize properly.");
    // You might want to throw an error here or handle it more gracefully
    // For now, we'll let initializeApp attempt and likely fail, triggering Firebase's own error.
  }
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

const auth = getAuth(app);
const db = getFirestore(app);

// Initialize Analytics if needed and supported
// let analytics;
// if (typeof window !== 'undefined' && firebaseConfig.measurementId) {
//   isSupported().then(supported => {
//     if (supported) {
//       analytics = getAnalytics(app);
//     }
//   });
// }

export { app, auth, db }; // Add 'analytics' here if you enable it
