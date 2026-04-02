import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// Thunks
export const registerUser = createAsyncThunk('auth/register', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/register', data);
    localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Registration failed');
  }
});

export const loginUser = createAsyncThunk('auth/login', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/auth/login', data);
    localStorage.setItem('token', res.data.token);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message || 'Login failed');
  }
});

export const fetchMe = createAsyncThunk('auth/me', async (_, { rejectWithValue }) => {
  try {
    const res = await api.get('/auth/me');
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

export const updateProfile = createAsyncThunk('auth/updateProfile', async (data, { rejectWithValue }) => {
  try {
    const res = await api.put('/auth/profile', data);
    return res.data;
  } catch (err) {
    return rejectWithValue(err.response?.data?.message);
  }
});

const token = localStorage.getItem('token');

const authSlice = createSlice({
  name: 'auth',
  initialState: { user: null, token: token || null, loading: false, error: null, initialized: false },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
      toast.success('Logged out successfully');
    },
    clearError: (state) => { state.error = null; },
  },
  extraReducers: (builder) => {
    // Register
    builder.addCase(registerUser.pending, (s) => { s.loading = true; s.error = null; });
    builder.addCase(registerUser.fulfilled, (s, a) => {
      s.loading = false; s.user = a.payload.user; s.token = a.payload.token;
      toast.success('Welcome to Saanjh Boutique! 🎉');
    });
    builder.addCase(registerUser.rejected, (s, a) => {
      s.loading = false; s.error = a.payload; toast.error(a.payload);
    });
    // Login
    builder.addCase(loginUser.pending, (s) => { s.loading = true; s.error = null; });
    builder.addCase(loginUser.fulfilled, (s, a) => {
      s.loading = false; s.user = a.payload.user; s.token = a.payload.token;
      toast.success(`Welcome back, ${a.payload.user.name}! 💕`);
    });
    builder.addCase(loginUser.rejected, (s, a) => {
      s.loading = false; s.error = a.payload; toast.error(a.payload);
    });
    // Fetch me
    builder.addCase(fetchMe.pending, (s) => { s.loading = true; });
    builder.addCase(fetchMe.fulfilled, (s, a) => {
      s.loading = false; s.user = a.payload.user; s.initialized = true;
    });
    builder.addCase(fetchMe.rejected, (s) => {
      s.loading = false; s.initialized = true; s.token = null;
      localStorage.removeItem('token');
    });
    // Update profile
    builder.addCase(updateProfile.fulfilled, (s, a) => {
      s.user = a.payload.user; toast.success('Profile updated!');
    });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
