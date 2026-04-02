const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Supports either:
// 1. FIREBASE_SERVICE_ACCOUNT_JSON  -> full JSON string
// 2. FIREBASE_SERVICE_ACCOUNT_PATH  -> local path to the downloaded JSON file

let firebaseAdmin;

const loadServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    return JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    const resolvedPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
    return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
  }

  return null;
};

if (!admin.apps.length) {
  try {
    const serviceAccount = loadServiceAccount();

    if (!serviceAccount?.project_id) {
      throw new Error(
        'Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log('✅ Firebase Admin initialized');
    firebaseAdmin = admin;
  } catch (err) {
    console.error('❌ Firebase Admin init error:', err.message);
    // App still starts — routes without auth protection still work
    firebaseAdmin = null;
  }
} else {
  firebaseAdmin = admin;
}

module.exports = firebaseAdmin;
