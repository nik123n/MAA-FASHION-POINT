import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  deleteUser,
  signOut,
  updateProfile as fbUpdateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
} from 'firebase/auth';
import {
  doc, setDoc, getDoc, updateDoc, serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from './config';

const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || 'admin@saanjhboutique.com').trim().toLowerCase();

export const signUpWithEmail = async ({ name, email, password, phone = '' }) => {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const normalizedEmail = email.toLowerCase().trim();
  const role = normalizedEmail === ADMIN_EMAIL ? 'admin' : 'user';

  try {
    await fbUpdateProfile(cred.user, { displayName: name });

    await setDoc(doc(db, 'users', cred.user.uid), {
      name,
      email: normalizedEmail,
      phone,
      role,
      avatar: '',
      addresses: [],
      preferences: { sizes: [], categories: [] },
      isActive: true,
      createdAt: serverTimestamp(),
      lastLogin: serverTimestamp(),
    });

    return cred.user;
  } catch (err) {
    try {
      await deleteUser(cred.user);
    } catch (_) {}

    throw err;
  }
};

export const signInWithEmail = async ({ email, password }) => {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  const normalizedEmail = cred.user.email?.toLowerCase().trim();
  const role = normalizedEmail === ADMIN_EMAIL ? 'admin' : 'user';

  try {
    await setDoc(doc(db, 'users', cred.user.uid), {
      name: cred.user.displayName || '',
      email: normalizedEmail || '',
      phone: '',
      role,
      avatar: '',
      addresses: [],
      preferences: { sizes: [], categories: [] },
      isActive: true,
      lastLogin: serverTimestamp(),
    }, { merge: true });
  } catch (_) { }

  return cred.user;
};

export const signOutUser = () => signOut(auth);

export const getUserProfile = async (uid) => {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? { uid, ...snap.data() } : null;
};

export const updateUserProfile = async (uid, { name, phone, preferences } = {}) => {
  const updates = {};
  if (name !== undefined) updates.name = name;
  if (phone !== undefined) updates.phone = phone;
  if (preferences !== undefined) updates.preferences = preferences;

  if (name && auth.currentUser) {
    await fbUpdateProfile(auth.currentUser, { displayName: name });
  }

  await updateDoc(doc(db, 'users', uid), updates);
};

export const addUserAddress = async (uid, address, currentAddresses = []) => {
  let addresses = currentAddresses.map((a) =>
    address.isDefault ? { ...a, isDefault: false } : a
  );
  addresses = [...addresses, { ...address, id: `addr_${Date.now()}` }];
  await updateDoc(doc(db, 'users', uid), { addresses });
  return addresses;
};

export const removeUserAddress = async (uid, addressId, currentAddresses = []) => {
  const addresses = currentAddresses.filter((a) => a.id !== addressId);
  await updateDoc(doc(db, 'users', uid), { addresses });
  return addresses;
};

export const changeUserPassword = async (currentPassword, newPassword) => {
  const user = auth.currentUser;
  if (!user) throw new Error('Not authenticated');

  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
};

export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
