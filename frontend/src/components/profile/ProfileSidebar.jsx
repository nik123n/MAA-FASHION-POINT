import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  FiUser, FiShoppingBag, FiMapPin, FiHeart, 
  FiHexagon, FiHelpCircle, FiLogOut, FiChevronRight 
} from 'react-icons/fi';

const ProfileSidebar = ({ activeTab, setActiveTab }) => {
  const { user, signOut } = useAuth();
  const { t } = useTranslation();

  const menuItems = [
    { id: 'overview', label: t('profile.title'), icon: <FiUser /> },
    { id: 'orders', label: t('profile.orders'), icon: <FiShoppingBag /> },
    { id: 'address', label: t('profile.address'), icon: <FiMapPin /> },
    { id: 'wishlist', label: t('profile.wishlist'), icon: <FiHeart /> },
    { id: 'coupons', label: t('profile.coupons'), icon: <FiHexagon /> },
    { id: 'help', label: t('profile.help'), icon: <FiHelpCircle /> },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden">
      {/* User Header */}
      <div className="p-6 bg-brand-50 border-b border-brand-100 flex items-center gap-4">
        <div className="w-14 h-14 rounded-full bg-leaf-600 flex items-center justify-center text-white text-xl font-bold uppercase ring-4 ring-leaf-100">
          {user?.name?.charAt(0) || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-brand-500 font-medium uppercase tracking-wider">Hello,</p>
          <h2 className="text-lg font-bold text-brand-900 truncate">{user?.name || 'User'}</h2>
        </div>
      </div>

      {/* Menu */}
      <nav className="p-3">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
              activeTab === item.id 
                ? 'bg-leaf-600 text-white shadow-md shadow-leaf-100' 
                : 'text-brand-600 hover:bg-brand-50 hover:text-leaf-700'
            }`}
          >
            <span className={`text-xl ${activeTab === item.id ? 'text-white' : 'text-brand-400 group-hover:text-leaf-600'}`}>
              {item.icon}
            </span>
            <span className="font-medium flex-1 text-left">{item.label}</span>
            <FiChevronRight className={`text-sm opacity-0 group-hover:opacity-100 transition-opacity ${activeTab === item.id ? 'hidden' : ''}`} />
          </button>
        ))}

        <div className="my-3 border-t border-brand-100" />

        <button
          onClick={signOut}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors group"
        >
          <FiLogOut className="text-xl group-hover:scale-110 transition-transform" />
          <span className="font-medium">{t('profile.logout')}</span>
        </button>
      </nav>
    </div>
  );
};

export default ProfileSidebar;
