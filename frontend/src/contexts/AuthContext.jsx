import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import toast from 'react-hot-toast';
import {
  signUpWithEmail,
  signInWithEmail,
  signOutUser,
  getUserProfile,
  updateUserProfile,
  changeUserPassword,
  addUserAddress,
  removeUserAddress,
  onAuthChange,
} from '../firebase/auth';
import { setUser, clearUser } from '../store/slices/authSlice';

const AuthContext = createContext(null);
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@saanjhboutique.com').trim().toLowerCase();

export const AuthProvider = ({ children }) => {
  const dispatch = useDispatch();
  const [firebaseUser, setFirebaseUser] = useState(undefined);
  const [user, setUserState] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthChange(async (fbUser) => {
      if (fbUser) {
        try {
          const profile = await getUserProfile(fbUser.uid);
          const fallbackRole = (fbUser.email || '').toLowerCase() === ADMIN_EMAIL ? 'admin' : 'user';
          const userData = profile ?? {
            uid: fbUser.uid,
            name: fbUser.displayName || '',
            email: fbUser.email,
            role: fallbackRole,
            avatar: '',
            addresses: [],
            preferences: { sizes: [], categories: [] },
          };
          if ((fbUser.email || '').toLowerCase() === ADMIN_EMAIL) {
            userData.role = 'admin';
          }
          setFirebaseUser(fbUser);
          setUserState(userData);
          dispatch(setUser(userData));
        } catch (err) {
          console.error('Failed to load user profile:', err);
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

  const signUp = useCallback(async (formData) => {
    try {
      await signUpWithEmail(formData);
      toast.success('Welcome to MAA Fashion Point!');
    } catch (err) {
      console.error('Sign up failed:', err);
      toast.error(getFirebaseErrorMessage(err.code));
      throw err;
    }
  }, []);

  const signIn = useCallback(async (formData) => {
    try {
      await signInWithEmail(formData);
    } catch (err) {
      toast.error(getFirebaseErrorMessage(err.code));
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      await signOutUser();
      toast.success('Logged out successfully');
    } catch (err) {
      toast.error('Failed to log out. Please try again.');
    }
  }, []);

  const updateProfile = useCallback(async (updates) => {
    if (!firebaseUser) return;
    try {
      await updateUserProfile(firebaseUser.uid, updates);
      const updated = { ...user, ...updates };
      setUserState(updated);
      dispatch(setUser(updated));
      toast.success('Profile updated!');
    } catch (err) {
      toast.error('Failed to update profile');
      throw err;
    }
  }, [firebaseUser, user, dispatch]);

  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await changeUserPassword(currentPassword, newPassword);
  }, []);

  const addAddress = useCallback(async (address) => {
    if (!firebaseUser || !user) return;
    try {
      const addresses = await addUserAddress(firebaseUser.uid, address, user.addresses || []);
      const updated = { ...user, addresses };
      setUserState(updated);
      dispatch(setUser(updated));
      toast.success('Address added!');
    } catch (err) {
      toast.error('Failed to add address');
      throw err;
    }
  }, [firebaseUser, user, dispatch]);

  const removeAddress = useCallback(async (addressId) => {
    if (!firebaseUser || !user) return;
    try {
      const addresses = await removeUserAddress(firebaseUser.uid, addressId, user.addresses || []);
      const updated = { ...user, addresses };
      setUserState(updated);
      dispatch(setUser(updated));
      toast.success('Address removed');
    } catch (err) {
      toast.error('Failed to remove address');
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
      signOut,
      updateProfile,
      changePassword,
      addAddress,
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
    'auth/operation-not-allowed': 'Email/password sign-in is not enabled in Firebase Authentication.',
    'auth/configuration-not-found': 'Open Firebase Console > Authentication > Get started, then enable Email/Password.',
    'auth/unauthorized-domain': 'This website domain is not authorized in Firebase Authentication.',
    'auth/user-not-found': 'No account found with this email.',
    'auth/wrong-password': 'Incorrect password. Please try again.',
    'auth/invalid-credential': 'Invalid email or password.',
    'auth/too-many-requests': 'Too many failed attempts. Please wait and try again.',
    'auth/network-request-failed': 'Network error. Please check your connection.',
    'auth/requires-recent-login': 'Please log out and sign in again to change your password.',
    'auth/user-disabled': 'This account has been disabled.',
    'auth/popup-closed-by-user': 'Sign-in was cancelled.',
    'permission-denied': 'Firestore blocked profile creation. Update your Firestore rules for signed-in users.',
    'failed-precondition': 'Firestore database is not ready yet. Create the Firestore database in Firebase Console.',
    'unavailable': 'Firestore is temporarily unavailable. Please try again.',
  };
  return map[code] || 'Something went wrong. Please try again.';
}
