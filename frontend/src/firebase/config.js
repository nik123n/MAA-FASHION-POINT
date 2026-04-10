import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';

const envConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const firebaseConfig = {
  apiKey: envConfig.apiKey || 'AIzaSyAjP1Z_xI3W5iTX4evwQbP8SZ1B4LASP3g',
  authDomain: envConfig.authDomain || 'maa-fashtion-point.firebaseapp.com',
  projectId: envConfig.projectId || 'maa-fashtion-point',
  storageBucket: envConfig.storageBucket || 'maa-fashtion-point.firebasestorage.app',
  messagingSenderId: envConfig.messagingSenderId || '623504510542',
  appId: envConfig.appId || '1:623504510542:web:98317aa4fcde4bd666fd1f',
  measurementId: envConfig.measurementId || 'G-BNRG0FXQ5K',
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics — only initializes in browser environments (not SSR/Node)
export let analytics = null;
isSupported().then((yes) => { if (yes) analytics = getAnalytics(app); });

export default app;
