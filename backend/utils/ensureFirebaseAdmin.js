/**
 * ensureFirebaseAdmin.js
 *
 * CLI script to assign the admin custom claim to a Firebase user.
 * Run this ONCE from the backend directory:
 *
 *   node utils/ensureFirebaseAdmin.js
 *
 * This is the ONLY way to grant admin access — the app itself cannot
 * grant admin roles (Zero Trust principle).
 *
 * After running, the user must LOG OUT and LOG BACK IN for the new
 * custom claim to appear in their ID token.
 */

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const admin = require('../config/firebaseAdmin');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

if (!ADMIN_EMAIL) {
  console.error('❌ ADMIN_EMAIL not set in .env');
  process.exit(1);
}

if (!admin) {
  console.error('❌ Firebase Admin SDK not initialized. Check FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH');
  process.exit(1);
}

const run = async () => {
  console.log(`\n🔐 Assigning admin custom claim to: ${ADMIN_EMAIL}`);

  try {
    // Look up the user by email
    const userRecord = await admin.auth().getUserByEmail(ADMIN_EMAIL);
    console.log(`✅ Found Firebase user: ${userRecord.uid}`);

    // Check current claims
    const currentClaims = userRecord.customClaims || {};
    if (currentClaims.admin === true) {
      console.log('ℹ️  User already has admin custom claim. No changes made.');
      process.exit(0);
    }

    // Set the admin custom claim
    await admin.auth().setCustomUserClaims(userRecord.uid, { admin: true });
    console.log('✅ Admin custom claim set successfully!');

    // Verify
    const updated = await admin.auth().getUser(userRecord.uid);
    console.log('✅ Verified claims:', updated.customClaims);

    console.log('\n⚠️  IMPORTANT: The user must LOG OUT and LOG BACK IN for the');
    console.log('   admin role to appear in their ID token.\n');

    // Optional: Create/update Firestore profile (without role field)
    const { getFirestore } = require('firebase-admin/firestore');
    const db = getFirestore();
    await db.collection('users').doc(userRecord.uid).set({
      _id: userRecord.uid,
      email: userRecord.email,
      name: userRecord.displayName || 'Admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }, { merge: true });

    console.log('✅ Firestore profile synced (without role field — role lives in custom claims)');
    process.exit(0);
  } catch (err) {
    if (err.code === 'auth/user-not-found') {
      console.error(`❌ No Firebase user found with email: ${ADMIN_EMAIL}`);
      console.error('   Create the user in Firebase Console or via the app first.');
    } else {
      console.error('❌ Error:', err.message);
    }
    process.exit(1);
  }
};

run();
