import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiPhone } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../utils/api';

export default function LoginPage() {
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState('email'); // 'email' or 'phone'

  // Email form state
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);
  
  // Phone form state
  const [phoneForm, setPhoneForm] = useState({ phone: '', password: '' });
  const [showPhonePwd, setShowPhonePwd] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signIn(form);
      navigate('/');
    } catch (err) {
      setError(getInlineError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const handlePhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    let emailParams;
    try {
      let formattedPhone = phoneForm.phone.trim().replace(/[^\d+]/g, '');
      if (!formattedPhone.startsWith('+')) {
        formattedPhone = formattedPhone.length === 10 ? `+91${formattedPhone}` : `+${formattedPhone}`;
      }
      
      const { data } = await api.get('/auth/resolve-phone', { params: { number: formattedPhone } });
      emailParams = data.email;
    } catch (err) {
      setLoading(false);
      setError(err.response?.data?.message || 'Failed to verify phone number. Ensure it is registered.');
      return;
    }

    try {
      await signIn({ email: emailParams, password: phoneForm.password });
      navigate('/');
    } catch (err) {
      setError(getInlineError(err.code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <span className="font-display text-4xl text-brand-700">MAA Fashion Point</span>
          <p className="font-accent text-gray-500 italic mt-1">Welcome back</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8 overflow-hidden">
          
          <div className="flex bg-gray-100 p-1 rounded-xl mb-6">
            <button
              onClick={() => { setMethod('email'); setError(''); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${method === 'email' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Email Login
            </button>
            <button
              onClick={() => { setMethod('phone'); setError(''); setPhoneForm({ phone: '', password: '' }); }}
              className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${method === 'phone' ? 'bg-white text-brand-700 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Phone Login
            </button>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700"
            >
              <FiAlertCircle size={16} className="shrink-0" />
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {method === 'email' ? (
              <motion.form key="email-form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} onSubmit={handleEmailSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
                  <div className="relative">
                    <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="input-field pl-11"
                      placeholder="you@example.com"
                      required
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      className="input-field pl-11 pr-11"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPwd(!showPwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
                </button>
              </motion.form>
            ) : (
              <motion.form key="phone-form" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} onSubmit={handlePhoneSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <FiPhone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="tel"
                      value={phoneForm.phone}
                      onChange={(e) => setPhoneForm({ ...phoneForm, phone: e.target.value })}
                      className="input-field pl-11"
                      placeholder="9876543210"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPhonePwd ? 'text' : 'password'}
                      value={phoneForm.password}
                      onChange={(e) => setPhoneForm({ ...phoneForm, password: e.target.value })}
                      className="input-field pl-11 pr-11"
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPhonePwd(!showPhonePwd)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPhonePwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                    </button>
                  </div>
                </div>

                <button type="submit" disabled={loading || !phoneForm.phone || !phoneForm.password} className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-2">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <p className="text-center text-sm text-gray-500 mt-6 pt-6 border-t border-gray-100">
            Don't have an account?{' '}
            <Link to="/auth/register" className="text-brand-700 font-semibold hover:text-brand-900">
              Create one
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function getInlineError(code) {
  if (!code) return '';
  if (code.includes('user-not-found'))   return 'No account found with this email address.';
  if (code.includes('wrong-password'))   return 'Incorrect password. Please try again.';
  if (code.includes('invalid-credential')) return 'Invalid credentials.';
  if (code.includes('too-many-requests'))  return 'Too many failed attempts. Try again later.';
  if (code.includes('user-disabled'))      return 'This account has been disabled.';
  if (code.includes('invalid-verification-code')) return 'Invalid OTP code entered.';
  if (code.includes('invalid-phone-number')) return 'Invalid format. Remember +91 at the start.';
  return 'Login failed. Please check your credentials.';
}
