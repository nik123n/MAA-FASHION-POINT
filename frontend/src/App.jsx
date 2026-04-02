import React, { useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchMe } from './store/slices/authSlice';
import { fetchCart } from './store/slices/allSlices';

// Layout
import Navbar from './components/common/BrandedNavbar';
import Footer from './components/common/BrandedFooter';
import ScrollToTop from './components/common/ScrollToTop';

// Pages
import HomePage from './pages/BrandedHomePage';
import ProductsPage from './pages/ProductsPage';
import ProductDetailPage from './pages/ProductDetailPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import CheckoutPage from './pages/CheckoutPage';
import OrderSuccessPage from './pages/OrderSuccessPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';

// Admin Pages
import AdminLayout from './components/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminOrders from './pages/admin/AdminOrders';
import AdminUsers from './pages/admin/AdminUsers';
import AdminCoupons from './pages/admin/AdminCoupons';

// Guards
const ProtectedRoute = ({ children }) => {
  const { token, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <PageLoader />;
  return token ? children : <Navigate to="/auth/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, token, initialized } = useSelector((s) => s.auth);
  if (!initialized) return <PageLoader />;
  if (!token) return <Navigate to="/auth/login" replace />;
  if (user?.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { token } = useSelector((s) => s.auth);
  return token ? <Navigate to="/" replace /> : children;
};

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-brand-200 border-t-leaf-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="font-display text-brand-700 text-lg italic">MAA Fashion Point</p>
    </div>
  </div>
);

export default function App() {
  const dispatch = useDispatch();
  const { token } = useSelector((s) => s.auth);

  useEffect(() => {
    if (token) {
      dispatch(fetchMe());
      dispatch(fetchCart());
    } else {
      // Mark initialized even without token
      dispatch({ type: 'auth/me/rejected' });
    }
  }, [token, dispatch]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminDashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                </Routes>
              </AdminLayout>
            </AdminRoute>
          }
        />

        {/* Public Routes with Navbar */}
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <main className="min-h-screen">
                <Routes>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/products" element={<ProductsPage />} />
                  <Route path="/products/:id" element={<ProductDetailPage />} />
                  <Route path="/cart" element={<CartPage />} />
                  <Route path="/wishlist" element={<WishlistPage />} />

                  {/* Auth */}
                  <Route path="/auth/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
                  <Route path="/auth/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />

                  {/* Protected */}
                  <Route path="/checkout" element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
                  <Route path="/order-success/:id" element={<ProtectedRoute><OrderSuccessPage /></ProtectedRoute>} />
                  <Route path="/orders" element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
                  <Route path="/orders/:id" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
                  <Route path="/profile" element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </main>
              <Footer />
            </>
          }
        />
      </Routes>
    </>
  );
}
