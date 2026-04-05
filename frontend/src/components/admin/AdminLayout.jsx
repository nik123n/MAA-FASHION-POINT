import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiGrid, FiShoppingBag, FiPackage, FiUsers, FiTag, FiLogOut, FiMenu, FiFileText } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import BrandLogo from '../common/BrandLogoNew';

const NAV_ITEMS = [
  { icon: FiGrid, label: 'Dashboard', to: '/admin' },
  { icon: FiShoppingBag, label: 'Products', to: '/admin/products' },
  { icon: FiPackage, label: 'Orders', to: '/admin/orders' },
  { icon: FiUsers, label: 'Users', to: '/admin/users' },
  { icon: FiTag, label: 'Coupons', to: '/admin/coupons' },
  { icon: FiFileText, label: 'Billing', to: '/admin/billing' },
];

export default function AdminLayout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useSelector((s) => s.auth);
  const { signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/');
  };

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="p-6 border-b border-white/10">
        <BrandLogo compact showText={false} className="text-white" />
        <p className="text-xs text-brand-200 font-body uppercase tracking-[0.35em] mt-3">Admin Panel</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map(({ icon: Icon, label, to }) => {
          const active = location.pathname === to || (to !== '/admin' && location.pathname.startsWith(to));
          return (
            <Link key={to} to={to} onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                active ? 'bg-white text-brand-800 shadow-sm' : 'text-pink-200 hover:bg-white/10 hover:text-white'
              }`}>
              <Icon size={18} /> {label}
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3 mb-3 px-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm">
            {user?.name?.[0]}
          </div>
          <div>
            <p className="text-sm font-medium text-white">{user?.name}</p>
            <p className="text-xs text-pink-300">Administrator</p>
          </div>
        </div>
        <button onClick={handleLogout}
          className="flex items-center gap-2 w-full px-4 py-2.5 text-pink-200 hover:text-white hover:bg-white/10 rounded-xl text-sm transition-colors">
          <FiLogOut size={16} /> Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-60 shrink-0 bg-gradient-to-b from-brand-800 to-brand-900 flex-col">
        <Sidebar />
      </aside>

      {/* Mobile Sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 bottom-0 w-60 bg-gradient-to-b from-brand-800 to-brand-900 flex flex-col">
            <Sidebar />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 text-gray-600 hover:bg-gray-100 rounded-lg">
              <FiMenu size={20} />
            </button>
            <h1 className="font-semibold text-gray-800">
              {NAV_ITEMS.find((n) => location.pathname === n.to || (n.to !== '/admin' && location.pathname.startsWith(n.to)))?.label || 'Dashboard'}
            </h1>
          </div>
          <Link to="/" className="text-sm text-brand-600 hover:text-brand-800 transition-colors">← View Store</Link>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
