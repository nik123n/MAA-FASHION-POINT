import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import { cartReducer, productReducer, wishlistReducer, orderReducer } from './slices/allSlices';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    products: productReducer,
    wishlist: wishlistReducer,
    orders: orderReducer,
  },
});

export default store;
