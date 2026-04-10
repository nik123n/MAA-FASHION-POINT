import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiUser, FiMail, FiPhone, FiChevronLeft, FiSave } from 'react-icons/fi';

const EditProfile = ({ onBack }) => {
  const { user, updateProfile } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await updateProfile({
        name: formData.name,
        phone: formData.phone,
      });
      onBack();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-brand-100 overflow-hidden max-w-2xl mx-auto">
      {/* Header */}
      <div className="p-6 border-b border-brand-100 flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 hover:bg-brand-50 rounded-full text-brand-400 hover:text-leaf-600 transition-colors"
        >
          <FiChevronLeft className="text-xl" />
        </button>
        <h2 className="text-xl font-bold text-brand-900">{t('profile.edit')}</h2>
      </div>

      <form onSubmit={handleSubmit} className="p-8 space-y-6">
        {/* Name */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-brand-700 flex items-center gap-1.5">
            <FiUser className="text-xs" /> {t('profile.fields.name')}
          </label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-leaf-500 focus:border-leaf-500 outline-none transition-all bg-brand-50/50"
            required
          />
        </div>

        {/* Email - Read Only for now (Firebase constraint) */}
        <div className="space-y-1.5 opacity-60">
          <label className="text-sm font-semibold text-brand-700 flex items-center gap-1.5">
            <FiMail className="text-xs" /> {t('profile.fields.email')}
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            disabled
            className="w-full px-4 py-3 rounded-xl border border-brand-200 bg-brand-100/50 cursor-not-allowed"
          />
          <p className="text-[10px] text-brand-400">Email cannot be changed directly for security reasons.</p>
        </div>

        {/* Phone */}
        <div className="space-y-1.5">
          <label className="text-sm font-semibold text-brand-700 flex items-center gap-1.5">
            <FiPhone className="text-xs" /> {t('profile.fields.phone')}
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border border-brand-200 focus:ring-2 focus:ring-leaf-500 focus:border-leaf-500 outline-none transition-all bg-brand-50/50"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 pt-4">
          <button
            type="button"
            onClick={onBack}
            className="flex-1 px-6 py-3 rounded-xl border border-brand-200 text-brand-600 font-bold hover:bg-brand-50 transition-colors"
          >
            {t('profile.actions.cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`flex-1 px-6 py-3 rounded-xl bg-leaf-600 text-white font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-leaf-100 ${
              loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-leaf-700 active:scale-95'
            }`}
          >
            {loading ? 'Saving...' : <><FiSave /> {t('profile.actions.save')}</>}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
