/**
 * AuthContext.jsx
 *
 * CRITICAL SECURITY FIXES:
 * 1. REMOVED ADMIN_EMAIL check — was a client-side role spoofing vulnerability
 * 2. Role comes ONLY from Firebase ID token custom claims (set by backend)
 * 3. Address management now calls backend APIs (not direct Firestore)
 * 4. Profile sync calls backend after Firebase signup
 * 5. Token forced-refresh on login to get latest custom claims
 */

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import {
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOutUser,
  changeUserPassword,
  onAuthChange,
  getUserRole,
} from '../firebase/auth';
import { setUser, clearUser } from '../store/slices/authSlice';
import api from '../utils/api';

const AuthContext = createContext(null);

// ⚠️ REMOVED: ADMIN_EMAIL constant — was a critical security vulnerability
// Role is now determined ONLY by Firebase custom claims set by the backend.

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      if (fbUser) {
        try {
          // ✅ Get role from Firebase custom claims — NOT from email comparison
          // forceRefresh=true ensures we have the latest claims after role assignment
          const role = await getUserRole(true);

          // Fetch Firestore profile from backend (not directly from Firestore)
          let profile = {};
          try {
            const { data } = await api.get('/auth/me');
            profile = data.user || {};
          } catch (err) {
            // Profile not yet created — will be created on first successful backend call
            console.warn('Profile fetch failed (may be first login):', err.message);
          }

          const userData = {
            uid: fbUser.uid,
            _id: fbUser.uid,
            name: profile.name || fbUser.displayName || '',
            email: profile.email || fbUser.email || '',
            phone: profile.phone || '',
            avatar: profile.avatar || fbUser.photoURL || '',
            addresses: profile.addresses || [],
            wishlist: profile.wishlist || [],
            preferences: profile.preferences || { sizes: [], categories: [] },
            // ✅ Role from custom claims only — never from email or Firestore
            role,
          };

          setFirebaseUser(fbUser);
          setUserState(userData);
          dispatch(setUser(userData));
        } catch (err) {
          console.error('Failed to load user profile:', err);
          // Minimal fallback — role defaults to 'user' (safe default)
          const fallbackData = {
            uid: fbUser.uid,
            _id: fbUser.uid,
            name: fbUser.displayName || '',
            email: fbUser.email || '',
            role: 'user', // ✅ Safe default — never 'admin' without verified claims
            avatar: fbUser.photoURL || '',
            addresses: [],
            preferences: { sizes: [], categories: [] },
          };
          setFirebaseUser(fbUser);
          setUserState(fallbackData);
          dispatch(setUser(fallbackData));
        }
      } else {
        setFirebaseUser(null);
        setUserState(null);
        dispatch(clearUser());
      }
      setLoading(false);
    });

    return unsubscribe;
  }, [dispatch]);

  // ─── Sign Up ──────────────────────────────────────────────────────────────
  const signUp = useCallback(async (formData) => {
    try {
      const fbUser = await signUpWithEmail(formData);

      // Sync profile to backend (creates Firestore doc without role field)
      try {
        await api.post('/auth/sync-profile', {
          name: formData.name,
          phone: formData.phone || '',
        });
      } catch (syncErr) {
        // Non-fatal — AuthContext state change will handle profile load
        console.warn('Profile sync failed (non-fatal):', syncErr.message);
      }

      toast.success('Welcome to MAA Fashion Point!');
      return fbUser;
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err.code));
      throw err;
    }
  }, []);

  // ─── Sign In ──────────────────────────────────────────────────────────────
  const signIn = useCallback(async (formData) => {
    try {
      await signInWithEmail(formData);
      // onAuthChange listener above will handle state update with fresh claims
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err.code));
      throw err;
    }
  }, []);

  // ─── Google Sign In ───────────────────────────────────────────────────────
  const signInGoogle = useCallback(async () => {
    try {
      await signInWithGoogle();
      // onAuthChange will sync profile and get role from claims
      toast.success('Signed in with Google!');
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err.code) || 'Failed to sign in with Google');
      throw err;
    }
  }, []);

  // ─── Sign Out ─────────────────────────────────────────────────────────────
  const signOut = useCallback(async () => {
    try {
      await signOutUser();
      toast.success('Logged out successfully');
    } catch {
      toast.error('Failed to log out. Please try again.');
    }
  }, []);

  // ─── Update Profile (via backend API) ────────────────────────────────────
  const updateProfile = useCallback(async (updates) => {
    if (!firebaseUser) return;
    try {
      const { data } = await api.put('/auth/profile', updates);
      const updated = { ...user, ...data.user, role: user.role };
      setUserState(updated);
      dispatch(setUser(updated));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update profile');
      throw err;
    }
  }, [firebaseUser, user, dispatch]);

  // ─── Change Password ──────────────────────────────────────────────────────
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await changeUserPassword(currentPassword, newPassword);
  }, []);

  // ─── Address Management (via backend API — NOT direct Firestore) ──────────
  const addAddress = useCallback(async (address) => {
    if (!firebaseUser || !user) return;
    try {
      const { data } = await api.post('/auth/address', address);
      const updated = { ...user, addresses: data.addresses };
      setUserState(updated);
      dispatch(setUser(updated));
      toast.success('Address added!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add address');
      throw err;
    }
  }, [firebaseUser, user, dispatch]);

  const updateAddress = useCallback(async (addressId, updates) => {
    if (!firebaseUser || !user) return;
    try {
      const { data } = await api.put(`/auth/address/${addressId}`, updates);
      const updated = { ...user, addresses: data.addresses };
      setUserState(updated);
      dispatch(setUser(updated));
      toast.success('Address updated!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update address');
      throw err;
    }
  }, [firebaseUser, user, dispatch]);

  const removeAddress = useCallback(async (addressId) => {
    if (!firebaseUser || !user) return;
    try {
      const { data } = await api.delete(`/auth/address/${addressId}`);
      const updated = { ...user, addresses: data.addresses };
      setUserState(updated);
      dispatch(setUser(updated));
      toast.success('Address removed');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to remove address');
      throw err;
    }
  }, [firebaseUser, user, dispatch]);

  return (
    <AuthContext.Provider value={{
      user,
      firebaseUser,
      loading,
      signUp,
      signIn,
      signInGoogle,
      signOut,
      updateProfile,
      changePassword,
      addAddress,
      updateAddress,
      removeAddress,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
};

function getFirebaseErrorMessage(code) {
  const map = {
    'auth/email-already-in-use': 'This email is already registered. Please sign in.',
    'auth/invalid-email': 'Invalid email address format.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase.',
    'auth/configuration-not-found': 'Enable Email/Password in Firebase Console > Authentication.',
    'auth/unauthorized-domain': 'Domain not authorized in Firebase Authentication.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/requires-recent-login': 'Please sign out and sign in again to change your password.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'auth/id-token-revoked': 'Session expired. Please sign in again.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
