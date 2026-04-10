import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiMenu, FiX } from 'react-icons/fi';

// Components
import ProfileSidebar from '../components/profile/ProfileSidebar';
import ProfileOverview from '../components/profile/ProfileOverview';
import AddressBook from '../components/profile/AddressBook';
import EditProfile from '../components/profile/EditProfile';

export default function ProfilePage() {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Close sidebar on mobile when tab changes
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [activeTab]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-50">
        <div className="w-12 h-12 border-4 border-leaf-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return <ProfileOverview setActiveTab={setActiveTab} />;
      case 'address':
        return <AddressBook />;
      case 'edit_profile':
        return <EditProfile onBack={() => setActiveTab('overview')} />;
      case 'orders':
        return (
          <div className="bg-white p-12 rounded-2xl border border-brand-100 text-center">
            <p className="text-brand-500 font-medium">Orders functionality coming soon!</p>
          </div>
        );
      case 'wishlist':
        return (
          <div className="bg-white p-12 rounded-2xl border border-brand-100 text-center">
            <p className="text-brand-500 font-medium">Wishlist functionality coming soon!</p>
          </div>
        );
      default:
        return <ProfileOverview setActiveTab={setActiveTab} />;
    }
  };

  return (
    <div className="min-h-screen bg-brand-50/30 pt-20 pb-20 md:pb-10 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between mb-6 bg-white p-4 rounded-xl shadow-sm border border-brand-100">
          <h1 className="text-lg font-bold text-brand-900">{t('profile.title')}</h1>
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 text-leaf-600 bg-leaf-50 rounded-lg"
          >
            {isSidebarOpen ? <FiX size={24} /> : <FiMenu size={24} />}
          </button>
        </div>

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden md:block w-80 shrink-0">
            <div className="sticky top-24">
              <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
            </div>
          </aside>

          {/* Sidebar - Mobile Overlay */}
          <AnimatePresence>
            {isSidebarOpen && (
              <>
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsSidebarOpen(false)}
                  className="fixed inset-0 bg-brand-950/40 backdrop-blur-sm z-[60] md:hidden"
                />
                <motion.aside
                  initial={{ x: '-100%' }}
                  animate={{ x: 0 }}
                  exit={{ x: '-100%' }}
                  transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                  className="fixed top-0 left-0 bottom-0 w-[85%] max-w-sm bg-white z-[70] md:hidden overflow-y-auto"
                >
                  <div className="p-4">
                    <ProfileSidebar activeTab={activeTab} setActiveTab={setActiveTab} />
                  </div>
                </motion.aside>
              </>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <main className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </main>
        </div>
      </div>
    </div>
  );
}
