import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { FiPlus, FiEdit, FiTrash2, FiMapPin, FiCheckCircle } from 'react-icons/fi';
import AddressForm from './AddressForm';

const AddressBook = () => {
  const { user, removeAddress, updateAddress } = useAuth();
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);

  const handleEdit = (address) => {
    setEditingAddress(address);
    setShowForm(true);
  };

  const handleSetDefault = async (addrId) => {
    await updateAddress(addrId, { isDefault: true });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-900">{t('profile.address')}</h2>
          <p className="text-brand-500 text-sm">Manage your shipping addresses</p>
        </div>
        <button
          onClick={() => { setEditingAddress(null); setShowForm(true); }}
          className="flex items-center gap-2 px-4 py-2 bg-leaf-600 text-white rounded-xl font-semibold hover:bg-leaf-700 transition-shadow shadow-md shadow-leaf-100"
        >
          <FiPlus /> {t('profile.add_address')}
        </button>
      </div>

      {showForm && (
        <AddressForm 
          onClose={() => setShowForm(false)} 
          initialData={editingAddress} 
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {user?.addresses && user.addresses.length > 0 ? (
          user.addresses.map((addr) => (
            <div 
              key={addr.id} 
              className={`p-5 rounded-2xl border-2 transition-all group relative overflow-hidden ${
                addr.isDefault 
                  ? 'border-leaf-500 bg-leaf-50/30' 
                  : 'border-brand-100 bg-white hover:border-brand-200 shadow-sm'
              }`}
            >
              <div className="flex justify-between items-start mb-3">
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  addr.isDefault ? 'bg-leaf-600 text-white' : 'bg-brand-50 text-brand-400'
                }`}>
                  {addr.isDefault ? 'Default' : 'Regular'}
                </span>
                <div className="flex gap-2">
                  {!addr.isDefault && (
                    <button 
                      onClick={() => handleSetDefault(addr.id)}
                      className="p-2 text-brand-400 hover:text-leaf-600 hover:bg-leaf-50 rounded-lg transition-colors"
                      title="Set as Default"
                    >
                      <FiCheckCircle />
                    </button>
                  )}
                  <button 
                    onClick={() => handleEdit(addr)}
                    className="p-2 text-brand-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Edit"
                  >
                    <FiEdit />
                  </button>
                  <button 
                    onClick={() => removeAddress(addr.id)}
                    className="p-2 text-brand-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              </div>

              <div className="space-y-1 relative z-10">
                <h4 className="font-bold text-brand-900 flex items-center gap-2">
                  <FiMapPin className="text-leaf-600" /> {addr.fullName}
                </h4>
                <p className="text-brand-600 font-medium text-sm">{addr.phone}</p>
                <div className="text-brand-500 text-sm leading-relaxed mt-2 whitespace-pre-wrap">
                  {addr.address}<br />
                  {addr.city}, {addr.state} - {addr.pincode}
                </div>
              </div>
              
              {addr.isDefault && (
                <div className="absolute bottom-0 right-0 p-2 opacity-5 scale-150 rotate-12">
                  <FiMapPin className="w-24 h-24" />
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-dashed border-brand-200">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-4 text-brand-300">
              <FiMapPin className="text-2xl" />
            </div>
            <p className="text-brand-500 font-medium tracking-wide">No addresses saved yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AddressBook;
