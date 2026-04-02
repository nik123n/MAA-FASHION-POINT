require('dotenv').config();
const admin = require('../config/firebaseAdmin');
const { getFirestore } = require('firebase-admin/firestore');

const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'admin@saanjhboutique.com').trim().toLowerCase();
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_NAME = process.env.ADMIN_NAME || 'MAA Admin';

const ensureFirebaseAdmin = async () => {
  if (!admin) {
    throw new Error('Firebase Admin is not configured');
  }

  let userRecord;

  try {
    userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    console.log(`Firebase Auth admin already exists: ${ADMIN_EMAIL}`);
  } catch (err) {
    if (err.code !== 'auth/user-not-found') throw err;

    userRecord = await admin.auth().createUser({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
      displayName: ADMIN_NAME,
      emailVerified: true,
    });

    console.log(`Created Firebase Auth admin: ${ADMIN_EMAIL}`);
  }

  await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });

  const db = getFirestore();
  await db.collection('users').doc(userRecord.uid).set({
    name: ADMIN_NAME,
    email: ADMIN_EMAIL,
    phone: '',
    role: 'admin',
    avatar: '',
    addresses: [],
    preferences: { sizes: [], categories: [] },
    wishlist: [],
    isActive: true,
    updatedAt: new Date().toISOString(),
  }, { merge: true });

  console.log('Firestore admin profile ensured');
  console.log(`Admin login email: ${ADMIN_EMAIL}`);
  console.log(`Admin login password: ${ADMIN_PASSWORD}`);
};

ensureFirebaseAdmin()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('ensureFirebaseAdmin failed:', err.message);
    process.exit(1);
  });
