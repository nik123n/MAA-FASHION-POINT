import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiShoppingBag, FiHeart, FiUser, FiMenu, FiX,
  FiChevronDown, FiLogOut, FiPackage, FiSettings,
} from 'react-icons/fi';
import { logout } from '../../store/slices/authSlice';
import api from '../../utils/api';

const CATEGORIES = ['3 Piece', '3 Piece Pair', 'Short Top', '2 Piece', 'Tunic Top', 'Cotton Tunic Top', 'Long Top', 'Cord Set', 'Plazo Pair', 'Kurti Plaza Dupata', 'Kurti Pent Dupata', 'Cotton Straight Pent'];

export default function Navbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, token } = useSelector((s) => s.auth);
  const { cart } = useSelector((s) => s.cart);
  const { items: wishlist } = useSelector((s) => s.wishlist);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const searchRef = useRef(null);
  const debounceRef = useRef(null);

  const cartCount = cart?.items?.reduce((a, i) => a + i.quantity, 0) || 0;
  const wishlistCount = wishlist?.length || 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    setSearchOpen(false);
  }, [location.pathname]);

  // Debounced autocomplete
  const handleSearch = useCallback((q) => {
    setSearchQ(q);
    clearTimeout(debounceRef.current);
    if (q.length < 2) { setSuggestions({ products: [], categories: [] }); return; }
    debounceRef.current = setTimeout(async () => {
      try {
        const { data } = await api.get('/products/search/autocomplete', { params: { q } });
        setSuggestions(data);
      } catch (_) {}
    }, 300);
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQ.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQ.trim())}`);
      setSearchOpen(false);
      setSuggestions({ products: [], categories: [] });
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    setUserMenuOpen(false);
    navigate('/');
  };

  return (
    <>
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
      }`}>
        {/* Top announcement bar */}
        <div className="bg-brand-700 text-white text-center py-1.5 text-xs font-body tracking-wider">
          ✨ FREE SHIPPING on orders above ₹999 &nbsp;|&nbsp; Use code <span className="font-semibold">WELCOME20</span> for 20% off
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex-shrink-0">
              <span className="font-display text-2xl text-brand-700 tracking-wider">MAA </span>
              <span className="font-accent text-sm text-gray-400 block -mt-1 tracking-widest ml-0.5">FASHION POINT </span>
            </Link>

            {/* Desktop Nav */}
            <nav className="hidden lg:flex items-center gap-7">
              <Link to="/" className="text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors">Home</Link>
              <div className="relative group">
                <button className="flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors py-5">
                  Categories <FiChevronDown size={14} className="group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute top-full left-1/2 -translate-x-1/2 w-56 bg-white rounded-2xl shadow-xl border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-2">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat}
                      to={`/products?category=${cat}`}
                      className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
              <Link to="/products?isNewArrival=true" className="text-sm font-medium text-brand-600 hover:text-brand-800 transition-colors">New Arrivals</Link>
              <Link to="/products?isTrending=true" className="text-sm font-medium text-gray-600 hover:text-brand-700 transition-colors">Trending</Link>
            </nav>

            {/* Right Icons */}
            <div className="flex items-center gap-1">
              {/* Search */}
              <button onClick={() => setSearchOpen(true)} className="p-2 text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-full transition-colors">
                <FiSearch size={20} />
              </button>

              {/* Wishlist */}
              <Link to="/wishlist" className="relative p-2 text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-full transition-colors">
                <FiHeart size={20} />
                {wishlistCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-brand-600 text-white text-[10px] rounded-full flex items-center justify-center font-medium">{wishlistCount}</span>
                )}
              </Link>

              {/* Cart */}
              <Link to="/cart" className="relative p-2 text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-full transition-colors">
                <FiShoppingBag size={20} />
                {cartCount > 0 && (
                  <motion.span
                    key={cartCount}
                    initial={{ scale: 1.4 }}
                    animate={{ scale: 1 }}
                    className="absolute top-0.5 right-0.5 w-4 h-4 bg-brand-600 text-white text-[10px] rounded-full flex items-center justify-center font-medium"
                  >{cartCount}</motion.span>
                )}
              </Link>

              {/* User Menu */}
              {token ? (
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 p-1.5 text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-full transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-brand-100 flex items-center justify-center text-brand-700 font-semibold text-sm">
                      {user?.name?.[0]?.toUpperCase() || <FiUser size={16} />}
                    </div>
                  </button>
                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50"
                      >
                        <div className="px-4 py-2 border-b border-gray-100 mb-1">
                          <p className="font-semibold text-sm text-gray-800">{user?.name}</p>
                          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
                        </div>
                        <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                          <FiSettings size={15} /> My Profile
                        </Link>
                        <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-brand-50 hover:text-brand-700 transition-colors">
                          <FiPackage size={15} /> My Orders
                        </Link>
                        {user?.role === 'admin' && (
                          <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-brand-700 font-medium hover:bg-brand-50 transition-colors">
                            <FiSettings size={15} /> Admin Panel
                          </Link>
                        )}
                        <div className="border-t border-gray-100 mt-1 pt-1">
                          <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors">
                            <FiLogOut size={15} /> Logout
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <Link to="/auth/login" className="hidden sm:flex items-center gap-1.5 bg-brand-700 text-white px-4 py-2 rounded-full text-sm font-medium hover:bg-brand-800 transition-colors">
                  <FiUser size={15} /> Login
                </Link>
              )}

              {/* Mobile Menu */}
              <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden p-2 text-gray-600 hover:text-brand-700 rounded-full transition-colors">
                {mobileOpen ? <FiX size={22} /> : <FiMenu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="lg:hidden bg-white border-t border-gray-100 overflow-hidden"
            >
              <div className="px-4 py-4 space-y-1">
                <Link to="/" className="block py-2.5 px-3 text-gray-700 hover:text-brand-700 hover:bg-brand-50 rounded-xl font-medium">Home</Link>
                {CATEGORIES.map((cat) => (
                  <Link key={cat} to={`/products?category=${cat}`} className="block py-2.5 px-3 text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-xl text-sm">{cat}</Link>
                ))}
                <Link to="/products?isNewArrival=true" className="block py-2.5 px-3 text-brand-600 hover:bg-brand-50 rounded-xl font-medium">✨ New Arrivals</Link>
                {!token && (
                  <div className="pt-2 flex gap-2">
                    <Link to="/auth/login" className="flex-1 btn-primary text-center text-sm py-2.5">Login</Link>
                    <Link to="/auth/register" className="flex-1 btn-outline text-center text-sm py-2.5">Register</Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Search Overlay */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[60] flex items-start justify-center pt-24 px-4"
            onClick={(e) => { if (e.target === e.currentTarget) setSearchOpen(false); }}
          >
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-2xl"
              ref={searchRef}
            >
              <form onSubmit={handleSearchSubmit} className="relative">
                <input
                  autoFocus
                  type="text"
                  value={searchQ}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search sarees, kurtis, dresses..."
                  className="w-full px-6 py-4 text-lg bg-white rounded-2xl shadow-2xl border-0 outline-none focus:ring-2 focus:ring-brand-300 pr-14"
                />
                <button type="submit" className="absolute right-4 top-1/2 -translate-y-1/2 text-brand-600 hover:text-brand-800">
                  <FiSearch size={22} />
                </button>
              </form>

              {/* Suggestions */}
              {(suggestions.products?.length > 0 || suggestions.categories?.length > 0) && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-2 bg-white rounded-2xl shadow-xl overflow-hidden"
                >
                  {suggestions.categories?.length > 0 && (
                    <div className="px-4 pt-3 pb-1">
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Categories</p>
                      <div className="flex flex-wrap gap-2">
                        {suggestions.categories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => { navigate(`/products?category=${cat}`); setSearchOpen(false); }}
                            className="px-3 py-1 bg-brand-50 text-brand-700 rounded-full text-sm hover:bg-brand-100 transition-colors"
                          >{cat}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {suggestions.products?.length > 0 && (
                    <div className="px-2 py-2">
                      {suggestions.products.map((p) => (
                        <button
                          key={p._id}
                          onClick={() => { navigate(`/products/${p._id}`); setSearchOpen(false); }}
                          className="flex items-center gap-3 w-full px-3 py-2 hover:bg-brand-50 rounded-xl transition-colors text-left"
                        >
                          <img src={p.images?.[0]?.url} alt={p.name} className="w-10 h-12 object-cover rounded-lg" />
                          <div>
                            <p className="text-sm font-medium text-gray-800">{p.name}</p>
                            <p className="text-xs text-brand-600">₹{(p.discountedPrice || p.price).toLocaleString()}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-[calc(64px+28px)]" />

      {/* Backdrop for user menu */}
      {userMenuOpen && <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />}
    </>
  );
}
