import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ── CART SLICE ────────────────────────────────────────────────────────────────
export const fetchCart = createAsyncThunk('cart/fetch', async (_, { rejectWithValue }) => {
  try { return (await api.get('/cart')).data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const addToCart = createAsyncThunk('cart/add', async (data, { rejectWithValue }) => {
  try {
    const res = await api.post('/cart', data);
    toast.success('Added to cart! 🛍️');
    return res.data;
  } catch (e) { toast.error(e.response?.data?.message || 'Failed'); return rejectWithValue(e.response?.data?.message); }
});

export const updateCartItem = createAsyncThunk('cart/update', async ({ itemId, quantity }, { rejectWithValue }) => {
  try { return (await api.put(`/cart/${itemId}`, { quantity })).data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const removeFromCart = createAsyncThunk('cart/remove', async (itemId, { rejectWithValue }) => {
  try { return (await api.delete(`/cart/${itemId}`)).data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const clearCart = createAsyncThunk('cart/clear', async () => {
  await api.delete('/cart');
  return { cart: { items: [] } };
});

const cartSlice = createSlice({
  name: 'cart',
  initialState: { cart: null, loading: false },
  reducers: { resetCart: (s) => { s.cart = null; } },
  extraReducers: (b) => {
    [fetchCart, addToCart, updateCartItem, removeFromCart, clearCart].forEach((thunk) => {
      b.addCase(thunk.pending, (s) => { s.loading = true; });
      b.addCase(thunk.fulfilled, (s, a) => { s.loading = false; s.cart = a.payload.cart; });
      b.addCase(thunk.rejected, (s) => { s.loading = false; });
    });
  },
});

export const { resetCart } = cartSlice.actions;
export const cartReducer = cartSlice.reducer;

// ── PRODUCT SLICE ─────────────────────────────────────────────────────────────
export const fetchProducts = createAsyncThunk('products/fetch', async (params, { rejectWithValue }) => {
  try { return (await api.get('/products', { params })).data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchProduct = createAsyncThunk('products/fetchOne', async (id, { rejectWithValue }) => {
  try { return (await api.get(`/products/${id}`)).data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchHomeProducts = createAsyncThunk('products/home', async (_, { rejectWithValue }) => {
  try { return (await api.get('/products/home')).data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchRecommendations = createAsyncThunk('products/recommendations', async (id, { rejectWithValue }) => {
  try { return (await api.get(`/products/${id}/recommendations`)).data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

const productSlice = createSlice({
  name: 'products',
  initialState: {
    products: [], product: null, pagination: null, homeData: null,
    recommendations: [], loading: false, error: null,
  },
  reducers: { clearProduct: (s) => { s.product = null; } },
  extraReducers: (b) => {
    b.addCase(fetchProducts.pending, (s) => { s.loading = true; });
    b.addCase(fetchProducts.fulfilled, (s, a) => {
      s.loading = false; s.products = a.payload.products; s.pagination = a.payload.pagination;
    });
    b.addCase(fetchProducts.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchProduct.pending, (s) => { s.loading = true; s.product = null; });
    b.addCase(fetchProduct.fulfilled, (s, a) => { s.loading = false; s.product = a.payload.product; });
    b.addCase(fetchProduct.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchHomeProducts.fulfilled, (s, a) => { s.homeData = a.payload; });
    b.addCase(fetchRecommendations.fulfilled, (s, a) => { s.recommendations = a.payload.recommendations; });
  },
});

export const { clearProduct } = productSlice.actions;
export const productReducer = productSlice.reducer;

// ── WISHLIST SLICE ────────────────────────────────────────────────────────────
export const fetchWishlist = createAsyncThunk('wishlist/fetch', async () =>
  (await api.get('/wishlist')).data
);

export const toggleWishlist = createAsyncThunk('wishlist/toggle', async (productId) => {
  const res = await api.post('/wishlist/toggle', { productId });
  if (res.data.added) toast.success('Added to wishlist ❤️');
  else toast.success('Removed from wishlist');
  return res.data;
});

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState: { items: [], loading: false },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(fetchWishlist.fulfilled, (s, a) => { s.items = a.payload.wishlist; });
    b.addCase(toggleWishlist.fulfilled, (s, a) => { s.items = a.payload.wishlist; });
  },
});

export const wishlistReducer = wishlistSlice.reducer;

// ── ORDER SLICE ───────────────────────────────────────────────────────────────
export const placeOrder = createAsyncThunk('orders/place', async (data, { rejectWithValue }) => {
  try { return (await api.post('/orders', data)).data; }
  catch (e) { return rejectWithValue(e.response?.data?.message); }
});

export const fetchMyOrders = createAsyncThunk('orders/fetchMy', async () =>
  (await api.get('/orders/my')).data
);

export const fetchOrder = createAsyncThunk('orders/fetchOne', async (id) =>
  (await api.get(`/orders/${id}`)).data
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: { orders: [], order: null, loading: false, error: null },
  reducers: {},
  extraReducers: (b) => {
    b.addCase(placeOrder.pending, (s) => { s.loading = true; s.error = null; });
    b.addCase(placeOrder.fulfilled, (s, a) => { s.loading = false; s.order = a.payload.order; });
    b.addCase(placeOrder.rejected, (s, a) => { s.loading = false; s.error = a.payload; });
    b.addCase(fetchMyOrders.fulfilled, (s, a) => { s.orders = a.payload.orders; });
    b.addCase(fetchOrder.fulfilled, (s, a) => { s.order = a.payload.order; });
  },
});

export const orderReducer = orderSlice.reducer;

export default {
  cart: cartReducer,
  products: productReducer,
  wishlist: wishlistReducer,
  orders: orderReducer,
};
