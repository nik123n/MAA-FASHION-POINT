const fs = require('fs');
const path = require('path');
const admin = require('firebase-admin');

// Supports either:
// 1. FIREBASE_SERVICE_ACCOUNT_JSON  -> full JSON string
// 2. FIREBASE_SERVICE_ACCOUNT_PATH  -> local path to the downloaded JSON file

let firebaseAdmin = null;

const loadServiceAccount = () => {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
    try {
      // 1. Get raw string and trim whitespace
      let rawJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON.trim();
      
      // 2. Fix typical Render/Vercel ENV copy-paste errors
      // Remove surrounding single or double quotes if accidentally included
      if ((rawJson.startsWith("'") && rawJson.endsWith("'")) || 
          (rawJson.startsWith('"') && rawJson.endsWith('"')) && !rawJson.startsWith('"{')) {
        rawJson = rawJson.slice(1, -1);
      }
      
      const parsed = JSON.parse(rawJson);
      
      // 3. Fix private key formatting: 
      // Sometimes Render escapes newlines in the private key. 
      // Firebase requires literal newline characters.
      if (parsed.private_key) {
        parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
      }
      
      return parsed;
    } catch (e) {
      console.error("❌ CRITICAL: Failed to parse FIREBASE_SERVICE_ACCOUNT_JSON context.");
      console.error("👉 Parsing Error:", e.message);
      console.error("👉 Hint: Ensure your Render environment variable contains raw JSON without surrounding quotes.");
      return null;
    }
  }

  if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
    try {
      const resolvedPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      return JSON.parse(fs.readFileSync(resolvedPath, 'utf8'));
    } catch (e) {
      console.error("❌ CRITICAL: Failed to read from FIREBASE_SERVICE_ACCOUNT_PATH:", e.message);
      return null;
    }
  }

  return null;
};

if (!admin.apps.length) {
  try {
    const serviceAccount = loadServiceAccount();

    if (!serviceAccount || !serviceAccount.project_id) {
      throw new Error(
        'Missing or invalid Firebase credentials. Verify FIREBASE_SERVICE_ACCOUNT_JSON in Render dashboard.'
      );
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });

    console.log('✅ Firebase Admin initialized securely');
    firebaseAdmin = admin;
  } catch (err) {
    console.error('❌ Firebase Admin init error:', err.message);
    firebaseAdmin = null;
  }
} else {
  firebaseAdmin = admin;
}

module.exports = firebaseAdmin;
