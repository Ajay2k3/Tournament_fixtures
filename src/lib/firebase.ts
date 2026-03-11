import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getFirestore, Firestore, onSnapshotsInSync } from "firebase/firestore";
import { getAuth, Auth } from "firebase/auth";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app: FirebaseApp | undefined;
let db: Firestore | undefined;
let auth: Auth | undefined;

if (firebaseConfig.apiKey) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    db = getFirestore(app);
    auth = getAuth(app);
  } catch (error) {
    console.error("Firebase initialization failed:", error);
  }
}

// Monitor connection status
if (typeof window !== "undefined" && db) {
  console.log("🔥 Firebase initialized with Project ID:", firebaseConfig.projectId);
  onSnapshotsInSync(db, () => {
    console.log("✅ Firestore connected and synced!");
  });
}

// Initialize Analytics
const analytics = (typeof window !== "undefined" && app) 
  ? isSupported().then(yes => (yes && app) ? getAnalytics(app) : null) 
  : null;

export { app, db, auth, analytics };
