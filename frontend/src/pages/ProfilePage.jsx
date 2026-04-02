import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiPhone, FiMapPin, FiLock, FiEdit, FiAlertCircle, FiCheckCircle } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

export default function ProfilePage() {
  const { user, updateProfile, changePassword, removeAddress } = useAuth();

  const [editing, setEditing] = useState(false);
  const [form, setForm]       = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [saving, setSaving]   = useState(false);

  const [pwdForm, setPwdForm]     = useState({ currentPassword: '', newPassword: '' });
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError]   = useState('');

  // ── Profile save ────────────────────────────────────────────────────────────
  const handleProfileSave = async () => {
    setSaving(true);
    try {
      await updateProfile(form);
      setEditing(false);
    } catch (_) {} // toast handled inside AuthContext
    finally { setSaving(false); }
  };

  // ── Password change ─────────────────────────────────────────────────────────
  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwdError('');
    if (pwdForm.newPassword.length < 6) {
      setPwdError('New password must be at least 6 characters.');
      return;
    }
    setPwdLoading(true);
    try {
      await changePassword(pwdForm.currentPassword, pwdForm.newPassword);
      toast.success('Password updated successfully!');
      setPwdForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      const msg = err.code?.includes('wrong-password')
        ? 'Current password is incorrect.'
        : err.code?.includes('requires-recent-login')
        ? 'Please log out and sign in again before changing your password.'
        : 'Failed to update password. Please try again.';
      setPwdError(msg);
      toast.error(msg);
    } finally {
      setPwdLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl mb-8">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* ── Personal Info ──────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-semibold text-lg">Personal Info</h2>
            <button
              onClick={() => { setEditing(!editing); setForm({ name: user?.name || '', phone: user?.phone || '' }); }}
              className="text-brand-600 hover:text-brand-800 transition-colors"
            >
              <FiEdit size={18} />
            </button>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold font-display">
              {user?.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <p className="font-semibold text-gray-800">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.role === 'admin' ? '🌟 Admin' : '💕 Member'}</p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Full Name</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Phone</label>
                <input
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className="input-field"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  onClick={handleProfileSave}
                  disabled={saving}
                  className="btn-primary flex-1 py-2.5 text-sm flex items-center justify-center gap-2"
                >
                  {saving ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiCheckCircle size={15} />}
                  Save
                </button>
                <button onClick={() => setEditing(false)} className="btn-outline flex-1 py-2.5 text-sm">Cancel</button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 text-sm">
              {[
                { icon: FiUser,  label: 'Name',  value: user?.name },
                { icon: FiMail,  label: 'Email', value: user?.email },
                { icon: FiPhone, label: 'Phone', value: user?.phone || 'Not added' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-center gap-3">
                  <Icon size={16} className="text-brand-400 shrink-0" />
                  <div>
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="font-medium text-gray-700">{value}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* ── Change Password ────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
            <FiLock size={18} className="text-brand-600" /> Change Password
          </h2>

          {pwdError && (
            <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
              <FiAlertCircle size={15} className="shrink-0" />
              {pwdError}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Current Password</label>
              <input
                type="password"
                value={pwdForm.currentPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, currentPassword: e.target.value })}
                className="input-field"
                placeholder="••••••••"
                required
                autoComplete="current-password"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">New Password</label>
              <input
                type="password"
                value={pwdForm.newPassword}
                onChange={(e) => setPwdForm({ ...pwdForm, newPassword: e.target.value })}
                className="input-field"
                placeholder="Min 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>
            <button
              type="submit"
              disabled={pwdLoading}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2"
            >
              {pwdLoading ? (
                <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Updating...</>
              ) : 'Update Password'}
            </button>
          </form>
        </motion.div>

        {/* ── Saved Addresses ─────────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <FiMapPin size={18} className="text-brand-600" /> Saved Addresses
          </h2>
          {!user?.addresses?.length ? (
            <p className="text-sm text-gray-400">No addresses saved. Add one during checkout.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {user.addresses.map((addr) => (
                <div
                  key={addr.id || addr._id}
                  className={`p-4 rounded-xl border ${addr.isDefault ? 'border-brand-300 bg-brand-50' : 'border-gray-200'}`}
                >
                  {addr.isDefault && (
                    <span className="inline-block text-[10px] font-semibold text-brand-700 bg-brand-100 rounded-full px-2 py-0.5 mb-2">
                      Default
                    </span>
                  )}
                  <p className="font-medium text-sm">{addr.fullName} · {addr.phone}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {addr.street}, {addr.city}, {addr.state} - {addr.pincode}
                  </p>
                  <button
                    onClick={() => removeAddress(addr.id || addr._id)}
                    className="text-xs text-red-500 hover:text-red-700 mt-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
