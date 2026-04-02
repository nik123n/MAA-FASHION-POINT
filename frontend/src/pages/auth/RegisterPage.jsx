import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff } from 'react-icons/fi';
import { registerUser } from '../../store/slices/authSlice';

export default function RegisterPage() {
  const dispatch = useDispatch();
  const { loading } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
  const [showPwd, setShowPwd] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.password.length < 6) { alert('Password must be at least 6 characters'); return; }
    dispatch(registerUser(form));
  };

  const fields = [
    { key: 'name', label: 'Full Name', icon: FiUser, type: 'text', placeholder: 'Priya Sharma' },
    { key: 'email', label: 'Email Address', icon: FiMail, type: 'email', placeholder: 'you@example.com' },
    { key: 'phone', label: 'Phone Number', icon: FiPhone, type: 'tel', placeholder: '+91 98765 43210' },
  ];

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <span className="font-display text-4xl text-brand-700">Saanjh</span>
          <p className="font-accent text-gray-500 italic mt-1">Join the boutique family</p>
        </div>
        <div className="bg-white rounded-3xl shadow-xl border border-gray-100 p-8">
          <h2 className="font-display text-2xl text-gray-900 mb-6">Create Account</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            {fields.map(({ key, label, icon: Icon, type, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <div className="relative">
                  <Icon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="input-field pl-11" placeholder={placeholder} required={key !== 'phone'} />
                </div>
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <FiLock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type={showPwd ? 'text' : 'password'} value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="input-field pl-11 pr-11" placeholder="Min 6 characters" required />
                <button type="button" onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                  {showPwd ? <FiEyeOff size={16} /> : <FiEye size={16} />}
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-400">
              Use code <span className="font-mono font-bold text-brand-700">WELCOME20</span> for 20% off your first order!
            </p>
            <button type="submit" disabled={loading}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 mt-2">
              {loading ? <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating account...</> : 'Create Account 🎉'}
            </button>
          </form>
          <p className="text-center text-sm text-gray-500 mt-5">
            Already have an account?{' '}
            <Link to="/auth/login" className="text-brand-700 font-semibold hover:text-brand-900">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
