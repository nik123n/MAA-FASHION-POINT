import { createSlice } from '@reduxjs/toolkit';

// ─────────────────────────────────────────────────────────────────────────────
// Auth slice — lightweight Redux slice that mirrors the Firebase auth state.
// The AuthContext (Firebase) is the source of truth; this slice is kept so
// existing components using `useSelector((s) => s.auth)` continue to work
// without any changes.
// ─────────────────────────────────────────────────────────────────────────────
const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user:        null,
    token:       null,   // holds Firebase UID (truthy = logged in)
    loading:     false,
    error:       null,
    initialized: false,  // true once onAuthStateChanged fires for the first time
  },
  reducers: {
    // Called by AuthContext after Firebase + Firestore data is ready
    setUser: (state, action) => {
      state.user        = action.payload;
      state.token       = action.payload?.uid ?? null; // uid acts as the "token" flag
      state.initialized = true;
      state.loading     = false;
    },
    // Called by AuthContext after Firebase signOut
    clearUser: (state) => {
      state.user        = null;
      state.token       = null;
      state.initialized = true;
      state.loading     = false;
    },
    // Legacy alias kept so any remaining `dispatch(logout())` calls still work
    logout: (state) => {
      state.user        = null;
      state.token       = null;
      state.initialized = true;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

export const { setUser, clearUser, logout, setLoading } = authSlice.actions;
export default authSlice.reducer;
