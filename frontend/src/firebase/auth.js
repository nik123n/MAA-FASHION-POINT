/**
 * firebase/auth.js
 *
 * CRITICAL SECURITY FIXES:
 * 1. REMOVED all client-side role assignment (role = email === ADMIN_EMAIL ? 'admin' : 'user')
 * 2. REMOVED writing `role` and `isActive` to Firestore from client
 * 3. Signup now calls backend /api/v1/auth/sync-profile to create Firestore doc
 * 4. Role comes from Firebase custom claims ONLY (via getIdTokenResult)
 * 5. REMOVED resolvePhone dependency
 *
 * Rule: The client NEVER decides what role a user has.
 *       The backend sets custom claims via Firebase Admin SDK.
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile as fbUpdateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from './config';

// ─── Email/Password Auth ───────────────────────────────────────────────────────

/**
 * Sign up with email + password.
 * Creates Firebase Auth user, then syncs profile to backend (no role written).
 */
export const signUpWithEmail = async ({ name, email, password, phone = '' }) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);

  try {
    // Update Firebase Auth display name
    await fbUpdateProfile(cred.user, { displayName: name });
    // Profile sync is handled in AuthContext after auth state changes
    return cred.user;
  } catch (err) {
    // If profile update fails, still return the created user (non-fatal)
    console.warn('Profile update failed (non-fatal):', err.message);
    return cred.user;
  }
};

/**
 * Sign in with email + password.
 */
export const signInWithEmail = async ({ email, password }) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
};

/**
 * Sign in with Google.
 */
export const signInWithGoogle = async () => {
  const provider = new GoogleAuthProvider();
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
};

/**
 * Sign out the current user.
 */
export const signOutUser = () => signOut(auth);

/**
 * Get role from Firebase ID token custom claims.
 * This is the AUTHORITATIVE source of role — never Firestore.
 *
 * @param {boolean} forceRefresh - Force token refresh to get latest claims
 */
export const getUserRole = async (forceRefresh = false) => {
  const user = auth.currentUser;
  if (!user) return 'user';

  try {
    const tokenResult = await user.getIdTokenResult(forceRefresh);
    return tokenResult.claims.admin === true ? 'admin' : 'user';
  } catch (_) {
    return 'user';
  }
};

/**
 * Get the current user's Firebase ID token for API calls.
 */
export const getIdToken = async () => {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
};

/**
 * Change password — requires re-authentication.
 */
export const changeUserPassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

/**
 * Subscribe to auth state changes.
 */
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
