import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiCheckCircle, FiAlertCircle, 
  FiBox, FiHeart, FiTag, FiHelpCircle, FiChevronRight, FiCreditCard, 
  FiPieChart, FiDollarSign, FiGlobe, FiBell, FiShield, FiActivity,
  FiMessageCircle, FiMonitor, FiLogOut, FiStar
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

const RECENTLY_VIEWED = [
  { id: 1, name: 'Cotton Tunic Top', price: '₹499', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=100&h=100&fit=crop' },
  { id: 2, name: 'Kurti Plazo Dupata', price: '₹1299', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=100&h=100&fit=crop' },
  { id: 3, name: 'Short Denim Top', price: '₹699', image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=100&h=100&fit=crop' }
];

export default function ProfilePage({ setAuthTab }) {
  const navigate = useNavigate();
  const { user, updateProfile, changePassword, removeAddress, logout } = useAuth();

  const [activeSection, setActiveSection] = useState(null);

  // Profile Form State
  const [form, setForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving] = useState(false);

  // Password Form State
  const [pwdForm, setPwdForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState('');

  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      setActiveSection(null);
    } catch (_) {}
    finally { setSaving(false); }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.newPassword.length < 6) return setPwdError('Password must be at least 6 characters.');
    setPwdLoading(true);
    try {
      await changePassword(pwdForm.currentPassword, pwdForm.newPassword);
      toast.success('Password updated successfully!');
      setPwdForm({ currentPassword: '', newPassword: '' });
      setActiveSection(null);
    } catch (err) {
      setPwdError('Failed to update. Check current password.');
      toast.error('Failed to update password');
    } finally {
      setPwdLoading(false);
    }
  };

  const ListItem = ({ icon, title, desc, onClick }) => (
    <button onClick={onClick} className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0">
      <div className="flex items-center gap-4">
        <div className="text-blue-600 shrink-0">{icon}</div>
        <div className="text-left">
          <p className="font-semibold text-[14px] text-gray-800">{title}</p>
          {desc && <p className="text-[12px] text-gray-500 mt-0.5">{desc}</p>}
        </div>
      </div>
      <FiChevronRight className="text-gray-400" />
    </button>
  );

  return (
    <div className="bg-[#f5f5f5] min-h-screen pb-24 md:pb-10 font-sans animate-fade-in text-gray-900">
      
      {/* ── TOP HEADER (FLIPKART STYLE) ── */}
      <div className="bg-blue-600 px-5 pt-8 pb-10 text-white border-b border-blue-700 shadow-sm relative">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="w-[60px] h-[60px] rounded-full bg-white text-blue-600 flex items-center justify-center text-2xl font-bold uppercase shadow-sm border border-white/20">
            {user?.name?.[0] || 'U'}
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-wide">{user?.name || 'Your Account'}</h1>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="bg-yellow-400 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-sm">
                <FiStar size={10} className="fill-current" /> Premium
              </span>
              <span className="text-[12px] text-blue-100 font-medium ml-1">Explore Plus &gt;</span>
            </div>
            <p className="text-[12px] text-blue-100 mt-1">{user?.phone || user?.email}</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 -mt-4 relative z-10 space-y-3">
        
        {/* ── QUICK ACTIONS (2x2 GRID) ── */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          {[
             { name: 'Orders', icon: <FiBox size={22} className="text-blue-500"/>, path: '/orders' },
             { name: 'Wishlist', icon: <FiHeart size={22} className="text-blue-500"/>, path: '/wishlist' },
             { name: 'Coupons', icon: <FiTag size={22} className="text-blue-500"/> },
             { name: 'Help Center', icon: <FiHelpCircle size={22} className="text-blue-500"/> },
          ].map(item => (
            <button key={item.name} onClick={() => item.path ? navigate(item.path) : null} className="bg-white rounded-xl p-4 flex flex-col items-center justify-center gap-2 shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:shadow-md transition-shadow">
              {item.icon}
              <span className="text-[13px] font-semibold text-gray-700">{item.name}</span>
            </button>
          ))}
        </div>

        {/* ── NOTIFICATION BANNER ── */}
        {!user?.emailVerified && (
          <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-3.5 flex items-center justify-between border-l-4 border-yellow-400">
            <div className="flex items-center gap-3">
              <FiAlertCircle className="text-yellow-500" size={20} />
              <div>
                <p className="font-semibold text-sm">Add/Verify your Email</p>
                <p className="text-[11px] text-gray-500">Security requirement</p>
              </div>
            </div>
            <button className="bg-blue-600 text-white text-xs font-bold px-4 py-2 rounded-lg">Update</button>
          </div>
        )}

        {/* ── FINANCE SECTION ── */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden mb-4">
          <ListItem icon={<FiCreditCard size={20}/>} title="Credit Cards" desc="Manage active cards & limits" />
        </div>

        {/* ── RECENTLY VIEWED (HORIZONTAL SCROLL) ── */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4">
          <h3 className="font-bold text-[15px] mb-3 text-gray-800">Recently Viewed</h3>
          <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
            {RECENTLY_VIEWED.map(p => (
              <div key={p.id} className="min-w-[100px] max-w-[100px]">
                <div className="bg-gray-100 rounded-lg aspect-square mb-2 overflow-hidden border border-gray-100">
                  <img src={p.image} className="w-full h-full object-cover" alt={p.name} />
                </div>
                <p className="text-[11px] font-medium text-gray-700 truncate">{p.name}</p>
                <p className="text-[13px] font-bold text-gray-900">{p.price}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── LANGUAGE SELECTOR ── */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FiGlobe size={20} className="text-blue-600" />
            <p className="font-bold text-[14px]">Choose Language</p>
          </div>
          <div className="flex gap-2">
            <span className="bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold px-3 py-1.5 rounded-full">English</span>
            <span className="bg-gray-50 text-gray-600 border border-gray-200 text-xs font-medium px-3 py-1.5 rounded-full">+ more</span>
          </div>
        </div>

        {/* ── ACCOUNT SETTINGS ── */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <h3 className="font-bold text-gray-400 text-[11px] tracking-wider uppercase px-4 pt-4 pb-1">Account Settings</h3>
          
          <ListItem icon={<FiUser size={20}/>} title="Edit Profile" desc="Change name, phone" onClick={() => setActiveSection(activeSection === 'profile' ? null : 'profile')} />
          <AnimatePresence>
            {activeSection === 'profile' && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#f9fafb] border-b border-gray-100">
                <div className="p-4 space-y-3">
                  <input value={form.name} onChange={(e)=>setForm({...form, name: e.target.value})} className="input-field bg-white border border-gray-200" placeholder="Name" />
                  <input value={form.phone} onChange={(e)=>setForm({...form, phone: e.target.value})} className="input-field bg-white border border-gray-200" placeholder="Phone" />
                  <button onClick={handleProfileSave} className="bg-blue-600 text-white font-bold text-sm px-4 py-2.5 rounded-lg w-full shadow-sm">{saving ? 'Saving...' : 'Save Profile'}</button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ListItem icon={<FiMapPin size={20}/>} title="Saved Addresses" desc="Manage shipping locations" onClick={() => setActiveSection(activeSection === 'address' ? null : 'address')} />
          <AnimatePresence>
            {activeSection === 'address' && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#f9fafb] border-b border-gray-100">
                <div className="p-4">
                  {!user?.addresses?.length ? <p className="text-xs text-gray-500">No addresses saved.</p> : (
                    <div className="space-y-3">
                      {user.addresses.map(addr => (
                        <div key={addr.id || addr._id} className="bg-white p-3 rounded-xl border border-gray-200 shadow-[0_1px_3px_rgba(0,0,0,0.02)]">
                          <p className="font-bold text-sm text-gray-800">{addr.fullName} <span className="font-normal text-gray-500 ml-1">· {addr.phone}</span></p>
                          <p className="text-xs text-gray-600 mt-1">{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
                          <button onClick={() => removeAddress(addr.id || addr._id)} className="text-[12px] font-bold text-red-500 mt-2 hover:bg-red-50 px-2 py-1 rounded inline-block">Remove</button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <ListItem icon={<FiLock size={20}/>} title="Security & Passwords" onClick={() => setActiveSection(activeSection === 'security' ? null : 'security')} />
          <AnimatePresence>
            {activeSection === 'security' && (
              <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden bg-[#f9fafb] border-b border-gray-100">
                <form onSubmit={handlePasswordChange} className="p-4 space-y-3">
                  {pwdError && <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">{pwdError}</p>}
                  <input type="password" value={pwdForm.currentPassword} onChange={e=>setPwdForm({...pwdForm, currentPassword: e.target.value})} className="input-field bg-white border border-gray-200" placeholder="Current Password" required />
                  <input type="password" value={pwdForm.newPassword} onChange={e=>setPwdForm({...pwdForm, newPassword: e.target.value})} className="input-field bg-white border border-gray-200" placeholder="New Password" required minLength={6}/>
                  <button type="submit" disabled={pwdLoading} className="bg-blue-600 text-white font-bold text-sm px-4 py-2.5 rounded-lg w-full shadow-sm">{pwdLoading ? 'Updating...' : 'Update Password'}</button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          <ListItem icon={<FiMonitor size={20}/>} title="Manage Devices" />
          <ListItem icon={<FiBell size={20}/>} title="Notifications" />
        </div>

        {/* ── MY ACTIVITY ── */}
        <div className="bg-white rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
          <h3 className="font-bold text-gray-400 text-[11px] tracking-wider uppercase px-4 pt-4 pb-1">My Activity</h3>
          <ListItem icon={<FiActivity size={20}/>} title="Reviews" desc="Your product reviews" />
          <ListItem icon={<FiMessageCircle size={20}/>} title="Questions & Answers" />
        </div>

        {/* ── FOOTER LOGOUT ── */}
        <button onClick={logout} className="w-full bg-white border border-gray-200 text-blue-600 font-bold py-3.5 rounded-xl shadow-[0_2px_8px_rgba(0,0,0,0.04)] hover:bg-blue-50 mt-4 mb-2 flex items-center justify-center gap-2">
          <FiLogOut size={18} /> Logout
        </button>

      </div>
    </div>
  );
}
