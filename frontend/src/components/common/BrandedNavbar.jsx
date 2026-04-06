import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiShoppingBag, FiHeart, FiUser, FiMenu, FiX,
  FiChevronDown, FiLogOut, FiPackage, FiSettings,
} from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';
import BrandLogo from './BrandLogoNew';

const CATEGORIES = ['3 Piece', '3 Piece Pair', 'Short Top', '2 Piece', 'Tunic Top', 'Cotton Tunic Top', 'Long Top', 'Cord Set', 'Plazo Pair', 'Kurti Plaza Dupata', 'Kurti Pent Dupata', 'Cotton Straight Pent'];

export default function BrandedNavbar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user: authUser, signOut: firebaseSignOut } = useAuth();
  const { user } = useSelector((s) => s.auth);
  const { cart } = useSelector((s) => s.cart);
  const { items: wishlist } = useSelector((s) => s.wishlist);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQ, setSearchQ] = useState('');
  const [suggestions, setSuggestions] = useState({ products: [], categories: [] });
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);

  const searchRef = useRef(null);
  const debounceRef = useRef(null);
  const mobileMenuRef = useRef(null);
  const mobileToggleRef = useRef(null);

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
    setIsSearchExpanded(false);
  }, [location.pathname]);

  // Handle Outside Click for Mobile Menu AND Search
  useEffect(() => {
    const handleClickOutside = (e) => {
      // Mobile menu
      if (
        mobileOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(e.target) &&
        mobileToggleRef.current &&
        !mobileToggleRef.current.contains(e.target)
      ) {
        setMobileOpen(false);
      }
      
      // Inline Search
      if (
        isSearchExpanded &&
        searchRef.current &&
        !searchRef.current.contains(e.target)
      ) {
        setIsSearchExpanded(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [mobileOpen, isSearchExpanded]);

  const handleSearch = useCallback((q) => {
    setSearchQ(q);
    clearTimeout(debounceRef.current);
    if (q.length < 2) {
      setSuggestions({ products: [], categories: [] });
      return;
    }

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
      setIsSearchExpanded(false);
      setSuggestions({ products: [], categories: [] });
    }
  };

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await firebaseSignOut();
    navigate('/');
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-white shadow-[0_4px_24px_rgba(0,0,0,0.06)]'
            : 'bg-white border-b border-gray-100'
        }`}
      >
        {/* Top Announcement Bar */}
        <div className="bg-brand-900 text-white text-center py-2 text-[11px] sm:text-xs font-medium tracking-wide">
          <span className="opacity-90">FREE SHIPPING ON ORDERS OVER ₹999</span>
          <span className="mx-2 sm:mx-3 opacity-50">|</span>
          <span className="opacity-90">USE CODE <strong className="text-brand-300">WELCOME20</strong> FOR 20% OFF</span>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20 gap-4">
            
            {/* Left: Logo */}
            <div className="flex items-center gap-3">
              <Link to="/" className="flex-shrink-0">
                <BrandLogo compact showText={false} />
              </Link>
            </div>

            {/* Center: Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              <Link to="/" className="text-[15px] font-medium text-gray-700 hover:text-brand-700 transition-colors relative group">
                Home
                <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-brand-700 transition-all group-hover:w-full"></span>
              </Link>
              
              <div className="relative group h-full flex items-center">
                <button className="flex items-center gap-1 text-[15px] font-medium text-gray-700 hover:text-brand-700 transition-colors py-8">
                  Categories <FiChevronDown size={16} className="mt-0.5 group-hover:rotate-180 transition-transform duration-200" />
                </button>
                <div className="absolute top-[100%] left-1/2 -translate-x-1/2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 py-3 z-50">
                  {CATEGORIES.map((cat) => (
                    <Link
                      key={cat}
                      to={`/products?category=${cat}`}
                      className="block px-5 py-2 text-[14px] text-gray-600 hover:bg-brand-50 hover:text-brand-700 hover:translate-x-1 transition-all"
                    >
                      {cat}
                    </Link>
                  ))}
                </div>
              </div>
              
              <Link to="/products?isNewArrival=true" className="text-[15px] font-medium text-gray-700 hover:text-brand-700 transition-colors relative group">
                New Arrivals
                <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-brand-700 transition-all group-hover:w-full"></span>
              </Link>
              <Link to="/products?isTrending=true" className="text-[15px] font-medium text-gray-700 hover:text-brand-700 transition-colors relative group">
                Trending
                <span className="absolute -bottom-1.5 left-0 w-0 h-0.5 bg-brand-700 transition-all group-hover:w-full"></span>
              </Link>
            </nav>

            {/* Right: Search, Wishlist, Cart, Profile */}
            <div className="flex items-center gap-1 sm:gap-4 flex-1 justify-end">
              
              {/* Expandable Search (Desktop) / Icon Search (Mobile) */}
              <div className="relative flex-1 max-w-sm hidden sm:block" ref={searchRef}>
                <form 
                  onSubmit={handleSearchSubmit} 
                  className={`flex items-center bg-gray-50 border transition-all duration-300 rounded-full overflow-hidden ${isSearchExpanded ? 'border-brand-300 bg-white ring-2 ring-brand-100' : 'border-gray-200 hover:bg-gray-100'}`}
                >
                  <button type="submit" className="pl-4 pr-2 py-2.5 text-gray-400 hover:text-brand-600 transition-colors">
                    <FiSearch size={18} />
                  </button>
                  <input
                    type="text"
                    value={searchQ}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => setIsSearchExpanded(true)}
                    placeholder="Search for products, categories..."
                    className="w-full bg-transparent border-none focus:ring-0 text-sm py-2.5 pr-4 outline-none text-gray-700 placeholder-gray-400"
                  />
                </form>

                {/* Inline Search Autocomplete */}
                <AnimatePresence>
                  {isSearchExpanded && (suggestions.products?.length > 0 || suggestions.categories?.length > 0) && (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                      className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50"
                    >
                      {suggestions.categories?.length > 0 && (
                        <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                          <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2">Categories</p>
                          <div className="flex flex-wrap gap-2">
                            {suggestions.categories.map((cat) => (
                              <button
                                key={cat}
                                onClick={() => { navigate(`/products?category=${cat}`); setIsSearchExpanded(false); }}
                                className="px-3 py-1 bg-white border border-gray-200 text-gray-600 rounded-full text-[13px] hover:border-brand-300 hover:text-brand-700 transition-colors"
                              >
                                {cat}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      {suggestions.products?.length > 0 && (
                        <div className="py-2">
                          {suggestions.products.slice(0, 4).map((p) => (
                            <button
                              key={p._id}
                              onClick={() => { navigate(`/products/${p._id}`); setIsSearchExpanded(false); }}
                              className="flex items-center gap-3 w-full px-4 py-2.5 hover:bg-gray-50 transition-colors text-left"
                            >
                              <img src={p.images?.[0]?.url} alt={p.name} className="w-10 h-10 object-cover rounded-md border border-gray-100" />
                              <div className="flex-1 overflow-hidden">
                                <p className="text-[13px] font-medium text-gray-800 truncate">{p.name}</p>
                                <p className="text-[12px] text-brand-600 font-semibold">₹{(p.discountedPrice || p.price).toLocaleString()}</p>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Mobile Search Icon */}
              <button 
                onClick={() => setSearchOpen(true)} 
                className="sm:hidden p-2 text-gray-600 hover:text-brand-700 transition-colors"
              >
                <FiSearch size={22} />
              </button>

              {/* Icons Group */}
              <div className="hidden md:flex items-center gap-1 sm:gap-2">
                <Link to="/wishlist" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors group">
                  <FiHeart size={22} className="group-hover:text-red-500 transition-colors" />
                  {wishlistCount > 0 && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold border border-white">
                      {wishlistCount}
                    </span>
                  )}
                </Link>

                <Link to="/cart" className="relative p-2 text-gray-600 hover:bg-gray-100 rounded-full transition-colors group">
                  <FiShoppingBag size={22} className="group-hover:text-brand-700 transition-colors" />
                  {cartCount > 0 && (
                    <motion.span
                      key={cartCount}
                      initial={{ scale: 1.4 }}
                      animate={{ scale: 1 }}
                      className="absolute top-0 right-0 w-4 h-4 bg-brand-600 text-white text-[10px] rounded-full flex items-center justify-center font-bold border border-white"
                    >
                      {cartCount}
                    </motion.span>
                  )}
                </Link>

                {/* Profile */}
                {authUser ? (
                  <div className="relative" onMouseLeave={() => setUserMenuOpen(false)}>
                    <button
                      onMouseEnter={() => setUserMenuOpen(true)}
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 p-1 text-gray-600 hover:bg-gray-100 rounded-full transition-colors ml-1"
                    >
                      <div className="w-8 h-8 rounded-full bg-brand-50 border border-brand-100 flex items-center justify-center text-brand-700 font-bold text-[13px]">
                        {user?.name?.[0]?.toUpperCase() || <FiUser size={16} />}
                      </div>
                    </button>
                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 10 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-1 w-56 bg-white rounded-xl shadow-[0_10px_40px_rgba(0,0,0,0.08)] border border-gray-100 py-1 z-50"
                        >
                          <div className="px-4 py-3 border-b border-gray-50 bg-gray-50/50">
                            <p className="font-semibold text-[14px] text-gray-800 tracking-tight">{user?.name}</p>
                            <p className="text-[12px] text-gray-500 truncate mt-0.5">{user?.email}</p>
                          </div>
                          <div className="py-1">
                            <Link to="/profile" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 hover:text-brand-700 transition-colors">
                              <FiUser size={16} className="text-gray-400" /> My Profile
                            </Link>
                            <Link to="/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[14px] text-gray-700 hover:bg-gray-50 hover:text-brand-700 transition-colors">
                              <FiPackage size={16} className="text-gray-400" /> Orders
                            </Link>
                            {user?.role === 'admin' && (
                              <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-3 px-4 py-2.5 text-[14px] font-medium text-brand-700 hover:bg-brand-50 transition-colors">
                                <FiSettings size={16} className="text-brand-500" /> Admin Panel
                              </Link>
                            )}
                          </div>
                          <div className="border-t border-gray-50 py-1">
                            <button onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2.5 text-[14px] text-red-600 hover:bg-red-50 transition-colors">
                              <FiLogOut size={16} className="text-red-400" /> Logout
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <Link to="/auth/login" className="hidden sm:flex items-center gap-2 bg-brand-700 text-white px-5 py-2.5 rounded-full text-[14px] font-medium hover:bg-brand-800 transition-colors shadow-sm ml-2">
                    Login
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>

      </header>

      {/* Mobile Full Screen Search */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 bg-white z-[60] sm:hidden flex flex-col"
          >
            <div className="flex items-center gap-3 p-4 border-b border-gray-100 shadow-sm">
              <button onClick={() => setSearchOpen(false)} className="p-2 text-gray-500 hover:bg-gray-100 rounded-full">
                <FiX size={24} />
              </button>
              <form onSubmit={handleSearchSubmit} className="flex-1">
                <input
                  autoFocus
                  type="text"
                  value={searchQ}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search for products..."
                  className="w-full bg-gray-100 rounded-lg px-4 py-2 outline-none"
                />
              </form>
            </div>
            {/* Mobile Search Autocomplete */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
              {suggestions.categories?.length > 0 && (
                <div className="mb-6">
                  <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">Categories</p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => { navigate(`/products?category=${cat}`); setSearchOpen(false); }}
                        className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-full text-[14px] hover:border-brand-300 shadow-sm"
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {suggestions.products?.length > 0 && (
                <div>
                  <p className="text-[12px] font-bold text-gray-400 uppercase tracking-wider mb-3">Products</p>
                  <div className="space-y-2">
                    {suggestions.products.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => { navigate(`/products/${p._id}`); setSearchOpen(false); }}
                        className="flex items-center gap-4 w-full p-3 bg-white hover:bg-brand-50 rounded-xl shadow-sm text-left border border-gray-100"
                      >
                        <img src={p.images?.[0]?.url} alt={p.name} className="w-14 h-16 object-cover rounded-md" />
                        <div className="flex-1">
                          <p className="text-[14px] font-medium text-gray-800 line-clamp-2">{p.name}</p>
                          <p className="text-[14px] text-brand-600 font-bold mt-1">₹{(p.discountedPrice || p.price).toLocaleString()}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="h-[calc(80px+32px)]" />
    </>
  );
}
