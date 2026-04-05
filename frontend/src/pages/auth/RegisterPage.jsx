import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { useAuth } from '../../contexts/AuthContext';

export default function RegisterPage() {
  const { signUp } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    let submissionForm = { ...form };
    let formattedPhone = submissionForm.phone.trim().replace(/[^\d+]/g, '');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.length === 10 ? `+91${formattedPhone}` : `+${formattedPhone}`;
    }
    submissionForm.phone = formattedPhone;

    if (!submissionForm.email) {
      submissionForm.email = `${formattedPhone.replace('+', '')}@maafashion.com`;
    }

    setLoading(true);
    try {
      await signUp(submissionForm);
      navigate('/');
    } catch (err) {
      console.error('RegisterPage error:', err);
      setError(getInlineError(err.code));
    } finally {
      setLoading(false);
    }
  };

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <span className="font-display text-4xl text-brand-700">MAA Fashion Point</span>
          <p className="font-accent text-gray-500 italic mt-1">Join the boutique family</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h2 className="font-display text-2xl text-gray-900 mb-6">Create Account</h2>

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

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <div className="relative">
                <FiUser size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="reg-name"
                  type="text"
                  value={form.name}
                  onChange={set('name')}
                  className="input-field pl-11"
                  placeholder="Priya Sharma"
                  required
                  autoComplete="name"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Phone Number
              </label>
              <div className="relative">
                <FiPhone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="reg-phone"
                  type="tel"
                  value={form.phone}
                  onChange={set('phone')}
                  className="input-field pl-11"
                  placeholder="9876543210"
                  autoComplete="tel"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email Address <span className="text-gray-400 text-xs">(optional)</span></label>
              <div className="relative">
                <FiMail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="reg-email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  className="input-field pl-11"
                  placeholder="you@example.com"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  id="reg-password"
                  type={showPwd ? 'text' : 'password'}
                  value={form.password}
                  onChange={set('password')}
                  className="input-field pl-11 pr-11"
                  placeholder="Min 6 characters"
                  required
                  autoComplete="new-password"
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

            <p className="text-xs text-gray-400">
              Use code <span className="font-mono font-bold text-brand-700">WELCOME20</span> for 20% off your first order!
            </p>

            <button
              id="reg-submit"
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Creating account...
                </>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-brand-700 font-semibold hover:text-brand-900">
              Sign in
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}

function getInlineError(code) {
  if (!code) return 'Registration failed. Open the browser console to see the exact Firebase error.';
  if (code.includes('email-already-in-use')) return 'This email is already registered. Please sign in.';
  if (code.includes('invalid-email')) return 'Please enter a valid email address.';
  if (code.includes('weak-password')) return 'Password must be at least 6 characters.';
  if (code.includes('operation-not-allowed')) return 'Enable Email/Password in Firebase Authentication.';
  if (code.includes('configuration-not-found')) return 'Open Firebase Console > Authentication > Get started, then enable Email/Password.';
  if (code.includes('unauthorized-domain')) return 'Add this site domain in Firebase Authentication settings.';
  if (code.includes('network-request-failed')) return 'Network error. Please check your connection.';
  if (code.includes('permission-denied')) return 'Firestore blocked profile creation. Update Firestore rules.';
  if (code.includes('failed-precondition')) return 'Create the Firestore database in Firebase Console first.';
  if (code.includes('unavailable')) return 'Firestore is temporarily unavailable. Please try again.';
  return `Registration failed (${code}).`;
}
