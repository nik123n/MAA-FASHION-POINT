import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiX, FiMapPin, FiPhone, FiUser, FiInfo } from 'react-icons/fi';
import toast from 'react-hot-toast';

const AddressForm = ({ onClose, initialData = null }) => {
  const { addAddress, updateAddress } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    pincode: '',
    state: '',
    city: '',
    address: '',
    isDefault: false,
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        fullName: initialData.fullName || '',
        phone: initialData.phone || '',
        pincode: initialData.pincode || '',
        state: initialData.state || '',
        city: initialData.city || '',
        address: initialData.address || '',
        isDefault: initialData.isDefault || false,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.fullName || !formData.phone || !formData.pincode || !formData.address) {
      toast.error('Please fill all required fields');
      return;
    }

    if (formData.phone.length < 10) {
      toast.error('Please enter a valid phone number');
      return;
    }

    setLoading(true);
    try {
      if (initialData) {
        await updateAddress(initialData.id, formData);
      } else {
        await addAddress(formData);
      }
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="px-6 py-4 bg-brand-50 border-b border-brand-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FiMapPin className="text-leaf-600 text-lg" />
            <h3 className="text-lg font-bold text-brand-900">
              {initialData ? t('profile.edit_address') : t('profile.add_address')}
            </h3>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-brand-100 rounded-full transition-colors text-brand-400">
            <FiX className="text-xl" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-brand-700 flex items-center gap-1.5">
                <FiUser className="text-xs" /> {t('profile.fields.name')} *
              </label>
              <input
                type="text"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                placeholder="e.g. John Doe"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:ring-2 focus:ring-leaf-500 focus:border-leaf-500 outline-none transition-all bg-brand-50/50"
                required
              />
            </div>

            {/* Phone Number */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-brand-700 flex items-center gap-1.5">
                <FiPhone className="text-xs" /> {t('profile.fields.phone')} *
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:ring-2 focus:ring-leaf-500 focus:border-leaf-500 outline-none transition-all bg-brand-50/50"
                required
              />
            </div>

            {/* Pincode */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-700 flex items-center gap-1.5">
                <FiInfo className="text-xs" /> {t('profile.fields.pincode')} *
              </label>
              <input
                type="text"
                name="pincode"
                value={formData.pincode}
                onChange={handleChange}
                placeholder="6 digits"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:ring-2 focus:ring-leaf-500 focus:border-leaf-500 outline-none transition-all bg-brand-50/50"
                required
              />
            </div>

            {/* State */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-brand-700">{t('profile.fields.state')} *</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleChange}
                placeholder="e.g. Gujarat"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:ring-2 focus:ring-leaf-500 focus:border-leaf-500 outline-none transition-all bg-brand-50/50"
                required
              />
            </div>

            {/* City */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-brand-700">{t('profile.fields.city')} *</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleChange}
                placeholder="e.g. Surat"
                className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:ring-2 focus:ring-leaf-500 focus:border-leaf-500 outline-none transition-all bg-brand-50/50"
                required
              />
            </div>

            {/* Full Address */}
            <div className="space-y-1.5 md:col-span-2">
              <label className="text-sm font-semibold text-brand-700">{t('profile.fields.full_address')} *</label>
              <textarea
                name="address"
                value={formData.address}
                onChange={handleChange}
                rows="3"
                placeholder="House No., Building Name, Street, etc."
                className="w-full px-4 py-2.5 rounded-xl border border-brand-200 focus:ring-2 focus:ring-leaf-500 focus:border-leaf-500 outline-none transition-all bg-brand-50/50 resize-none"
                required
              ></textarea>
            </div>

            {/* Default Switch */}
            <div className="md:col-span-2 flex items-center gap-3 py-2">
              <input
                type="checkbox"
                id="isDefault"
                name="isDefault"
                checked={formData.isDefault}
                onChange={handleChange}
                className="w-5 h-5 text-leaf-600 border-brand-200 rounded focus:ring-leaf-500 cursor-pointer"
              />
              <label htmlFor="isDefault" className="text-sm font-medium text-brand-600 cursor-pointer select-none">
                Set as default address
              </label>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-brand-50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 rounded-2xl border border-brand-200 text-brand-600 font-bold hover:bg-brand-50 transition-colors"
            >
              {t('profile.actions.cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-6 py-3 rounded-2xl bg-leaf-600 text-white font-bold transition-all shadow-lg shadow-leaf-100 ${
                loading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-leaf-700 active:scale-95'
              }`}
            >
              {loading ? 'Saving...' : initialData ? t('profile.actions.update') : t('profile.actions.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddressForm;
