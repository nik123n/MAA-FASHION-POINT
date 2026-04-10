import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiLock, FiEye, FiEyeOff, FiAlertCircle, FiPhone, FiInfo } from 'react-icons/fi';
import { FcGoogle } from 'react-icons/fc';
import { useAuth } from '../../contexts/AuthContext';

export default function LoginPage() {
  const { signIn, signInGoogle } = useAuth();
  const navigate = useNavigate();

  const [method, setMethod] = useState('email'); // 'email' only now

  // Email form state
  const [form, setForm] = useState({ email: '', password: '' });
  const [showPwd, setShowPwd] = useState(false);

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

  const handleGoogleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      await signInGoogle();
      // Use replace so they can't go back to login page
      navigate('/', { replace: true });
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

          <motion.form
            key="email-form"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            onSubmit={handleEmailSubmit}
            className="space-y-4"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address</label>
              <div className="relative">
                <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="login-email"
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
                  id="login-password"
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
                  aria-label="Toggle password visibility"
                >
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Sign In'}
            </button>
          </motion.form>

          <div className="flex items-start gap-2 p-3 mt-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
            <FiInfo size={14} className="shrink-0 mt-0.5" />
            <span>Registered with phone? Use the email linked to your account, or sign in with Google.</span>
          </div>

          <div className="mt-6 border-t border-gray-100 pt-6">
            <button
              type="button"
              onClick={handleGoogleSubmit}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-gray-200 text-gray-700 font-semibold rounded-xl shadow-sm hover:bg-gray-50 transition-colors"
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>
          </div>

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
