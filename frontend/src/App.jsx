import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { fetchCart } from './store/slices/allSlices';


// Layout
import Navbar from './components/common/BrandedNavbar';
import Footer from './components/common/BrandedFooter';
import MobileBottomNav from './components/common/MobileBottomNav';
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
import AdminBilling from './pages/admin/AdminBilling';

// ── Full-screen loader ────────────────────────────────────────────────────────
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-brand-50">
    <div className="text-center">
      <div className="w-16 h-16 border-4 border-brand-200 border-t-leaf-600 rounded-full animate-spin mx-auto mb-4" />
      <p className="font-display text-brand-700 text-lg italic">MAA Fashion Point</p>
    </div>
  </div>
);

// ── Route Guards (now use AuthContext — works with Firebase session) ──────────
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/auth/login" replace />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/auth/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

const GuestRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/" replace /> : children;
};

// ── Inner app — has access to AuthContext ─────────────────────────────────────
function AppInner() {
  const dispatch = useDispatch();
  const { user } = useAuth();

  // Fetch cart whenever the logged-in user changes
  React.useEffect(() => {
    if (user) {
      dispatch(fetchCart());
    }
  }, [user?.uid, dispatch]);

  return (
    <>
      <ScrollToTop />
      <Routes>
        {/* ── Admin Routes ─────────────────────────────────── */}
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
                  <Route path="billing" element={<AdminBilling />} />
                </Routes>
              </AdminLayout>
            </AdminRoute>
          }
        />

        {/* ── Public Routes with Navbar ────────────────────── */}
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

                  {/* Auth (guests only) */}
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
              <MobileBottomNav />
            </>
          }
        />
      </Routes>
    </>
  );
}

// ── Root — AuthProvider must wrap everything that uses useAuth() ─────────────
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
