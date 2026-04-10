import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { fetchCart } from './store/slices/allSlices';
import * as Sentry from '@sentry/react';

// Layout
import Navbar from './components/common/BrandedNavbar';
import Footer from './components/common/BrandedFooter';
import MobileBottomNav from './components/common/MobileBottomNav';
import ScrollToTop from './components/common/ScrollToTop';

// Pages - Homepage is critical, load statically
import HomePage from './pages/BrandedHomePage';

// Pages - Lazy load the rest to reduce bundle size
const ProductsPage = lazy(() => import('./pages/ProductsPage'));
const ProductDetailPage = lazy(() => import('./pages/ProductDetailPage'));
const CartPage = lazy(() => import('./pages/CartPage'));
const WishlistPage = lazy(() => import('./pages/WishlistPage'));
const CheckoutPage = lazy(() => import('./pages/CheckoutPage'));
const OrderSuccessPage = lazy(() => import('./pages/OrderSuccessPage'));
const OrdersPage = lazy(() => import('./pages/OrdersPage'));
const OrderDetailPage = lazy(() => import('./pages/OrderDetailPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/auth/LoginPage'));
const RegisterPage = lazy(() => import('./pages/auth/RegisterPage'));

// Admin Pages - Lazy load all
const AdminLayout = lazy(() => import('./components/admin/AdminLayout'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminProducts = lazy(() => import('./pages/admin/AdminProducts'));
const AdminOrders = lazy(() => import('./pages/admin/AdminOrders'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminCoupons = lazy(() => import('./pages/admin/AdminCoupons'));
const AdminBilling = lazy(() => import('./pages/admin/AdminBilling'));

// ── Sentry Initialization ─────────────────────────────────────────────────────
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN || '',
  integrations: [
    Sentry.browserTracingIntegration(),
  ],
  tracesSampleRate: import.meta.env.PROD ? 0.2 : 0.0, // Only sample in production
  enabled: !!import.meta.env.VITE_SENTRY_DSN, // Disabled if no DSN
});

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
      <Suspense fallback={<PageLoader />}>
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
      </Suspense>
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
