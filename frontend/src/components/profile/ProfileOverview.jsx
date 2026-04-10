import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { 
  FiShoppingBag, FiHeart, FiHexagon, 
  FiHelpCircle, FiSettings, FiEdit2, FiPhone, FiMail 
} from 'react-icons/fi';
import { motion } from 'framer-motion';

const ProfileOverview = ({ setActiveTab }) => {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [recentlyViewed, setRecentlyViewed] = React.useState([]);

  React.useEffect(() => {
    const list = JSON.parse(localStorage.getItem('recentlyViewed') || '[]');
    setRecentlyViewed(list);
  }, []);

  const cards = [
    { id: 'orders', label: t('profile.orders'), icon: <FiShoppingBag />, color: 'bg-blue-50 text-blue-600', count: user?.orders?.length || 0 },
    { id: 'wishlist', label: t('profile.wishlist'), icon: <FiHeart />, color: 'bg-rose-50 text-rose-600', count: user?.wishlist?.length || 0 },
    { id: 'coupons', label: t('profile.coupons'), icon: <FiHexagon />, color: 'bg-amber-50 text-amber-600', count: 0 },
    { id: 'help', label: t('profile.help'), icon: <FiHelpCircle />, color: 'bg-teal-50 text-teal-600', count: null },
  ];

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-brand-100 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 translate-x-4 -translate-y-4 group-hover:translate-x-0 group-hover:translate-y-0 transition-transform">
          <FiSettings className="w-24 h-24" />
        </div>
        
        <div className="flex flex-col md:flex-row items-center gap-6 relative z-10">
          <div className="w-24 h-24 rounded-full bg-brand-50 border-4 border-white shadow-xl flex items-center justify-center text-3xl font-bold text-leaf-600 uppercase">
            {user?.name?.charAt(0) || 'U'}
          </div>
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-2xl font-bold text-brand-900 mb-1">{user?.name}</h1>
            <div className="flex flex-wrap justify-center md:justify-start gap-4 text-brand-500 text-sm">
              <span className="flex items-center gap-1.5"><FiMail className="text-leaf-600" /> {user?.email}</span>
              {user?.phone && <span className="flex items-center gap-1.5"><FiPhone className="text-leaf-600" /> {user?.phone}</span>}
            </div>
          </div>
          <button 
            onClick={() => setActiveTab('edit_profile')}
            className="flex items-center gap-2 px-6 py-2.5 bg-leaf-600 text-white rounded-full font-semibold hover:bg-leaf-700 transition-colors shadow-lg shadow-leaf-100"
          >
            <FiEdit2 /> {t('profile.edit')}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card, idx) => (
          <motion.button
            key={card.id}
            whileHover={{ y: -5 }}
            onClick={() => setActiveTab(card.id)}
            className="bg-white p-6 rounded-2xl border border-brand-100 shadow-sm hover:shadow-md transition-all text-left group"
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl mb-4 ${card.color} group-hover:scale-110 transition-transform`}>
              {card.icon}
            </div>
            <p className="text-brand-500 text-sm font-medium mb-1">{card.label}</p>
            <p className="text-xl font-bold text-brand-900">{card.count !== null ? card.count : '→'}</p>
          </motion.button>
        ))}
      </div>

      {/* Recently Viewed */}
      <div className="bg-white p-6 rounded-2xl border border-brand-100">
        <h3 className="text-lg font-bold text-brand-900 mb-4 px-2 tracking-tight">Recently Viewed</h3>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
          {recentlyViewed.length > 0 ? (
            recentlyViewed.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(`/products/${item.id}`)}
                className="min-w-[130px] max-w-[130px] group text-left"
              >
                <div className="aspect-[3/4] bg-brand-50 rounded-xl overflow-hidden mb-2 border border-brand-100 group-hover:border-leaf-600 transition-colors">
                  <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <p className="text-xs font-bold text-brand-900 truncate mb-0.5">{item.name}</p>
                <p className="text-[11px] font-medium text-leaf-700">{item.price}</p>
              </button>
            ))
          ) : (
            <div className="w-full py-8 text-center bg-brand-50/50 rounded-xl border border-dashed border-brand-200">
              <p className="text-brand-400 text-xs italic">Explore products to see them here!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileOverview;
