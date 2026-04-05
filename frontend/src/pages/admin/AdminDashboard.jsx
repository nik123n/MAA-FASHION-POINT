import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiShoppingBag, FiUsers, FiPackage, FiTrendingUp,
  FiArrowUp, FiArrowDown, FiCalendar, FiDollarSign,
  FiWifi, FiWifiOff, FiPlus, FiX,
} from 'react-icons/fi';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ── Colour palette for charts ─────────────────────────────────────────────────
const CHART_COLORS = ['#34308f', '#67bb2e', '#e1261c', '#f59e0b', '#06b6d4', '#8b5cf6'];

// ── Stat Card ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon: Icon, change, color, delay, subtitle }) => (
  <motion.div
    initial={{ opacity: 0, y: 16 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
  >
    <div className="flex items-start justify-between mb-3">
      <div className={`w-11 h-11 ${color} rounded-xl flex items-center justify-center shrink-0`}>
        <Icon size={20} className="text-white" />
      </div>
      {change !== undefined && (
        <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${change >= 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500'}`}>
          {change >= 0 ? <FiArrowUp size={10} /> : <FiArrowDown size={10} />}
          {Math.abs(change)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
    <p className="text-sm text-gray-500">{title}</p>
    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
  </motion.div>
);

// ── Custom Tooltip for charts ─────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white rounded-xl shadow-xl border border-gray-100 px-4 py-3 text-sm">
      <p className="font-semibold text-gray-700 mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.name} style={{ color: p.color }} className="font-medium">
          {p.name}: {typeof p.value === 'number' && p.name?.toLowerCase().includes('revenue')
            ? `₹${p.value.toLocaleString('en-IN')}`
            : p.value}
        </p>
      ))}
    </div>
  );
};

// ── Offline Sale Modal ────────────────────────────────────────────────────────
function OfflineSaleModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({ amount: '', description: '', date: new Date().toISOString().split('T')[0] });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      toast.error('Enter a valid amount');
      return;
    }
    setSaving(true);
    try {
      await api.post('/admin/offline-sale', form);
      toast.success('Offline sale recorded!');
      onSuccess();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to record sale');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-display text-lg font-semibold text-gray-800">Record Offline Sale</h3>
              <p className="text-sm text-gray-500 mt-0.5">Add manual offline sales</p>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <FiX size={18} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Amount (₹) *</label>
              <input
                type="number"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="input-field"
                placeholder="e.g. 1500"
                min="1"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="input-field"
                placeholder="e.g. 2 sarees + 1 kurti"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Sale Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="input-field"
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-outline flex-1 py-3 text-sm">Cancel</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 text-sm flex items-center justify-center gap-2">
                {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : '✅ Record Sale'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOfflineModal, setShowOfflineModal] = useState(false);

  const fetchAnalytics = () => {
    setLoading(true);
    api.get('/admin/analytics')
      .then(({ data }) => setAnalytics(data.analytics))
      .catch(() => toast.error('Failed to load analytics'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchAnalytics(); }, []);

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="skeleton h-11 w-11 rounded-xl mb-3" />
              <div className="skeleton h-7 w-24 rounded mb-2" />
              <div className="skeleton h-4 w-32 rounded" />
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
              <div className="skeleton h-6 w-40 rounded mb-4" />
              <div className="skeleton h-48 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!analytics) return (
    <div className="text-center py-24 text-gray-400">
      <FiPackage size={40} className="mx-auto mb-3 opacity-40" />
      <p>No analytics data available yet.</p>
      <p className="text-sm mt-1">Place some orders to see data here.</p>
    </div>
  );

  const revenueGrowth = analytics.lastMonthRevenue > 0
    ? Math.round(((analytics.monthRevenue - analytics.lastMonthRevenue) / analytics.lastMonthRevenue) * 100)
    : 0;

  const statCards = [
    {
      title: 'Total Revenue',
      value: `₹${(analytics.totalRevenue / 1000).toFixed(1)}K`,
      icon: FiTrendingUp,
      color: 'bg-brand-700',
      change: revenueGrowth,
      subtitle: `This month: ₹${(analytics.monthRevenue / 1000).toFixed(1)}K`,
    },
    {
      title: 'Total Orders',
      value: analytics.totalOrders.toLocaleString(),
      icon: FiPackage,
      color: 'bg-blue-500',
      subtitle: `Today: ${analytics.todayOrders}`,
    },
    {
      title: 'Total Users',
      value: analytics.totalUsers.toLocaleString(),
      icon: FiUsers,
      color: 'bg-emerald-500',
    },
    {
      title: 'Products Listed',
      value: analytics.totalProducts.toLocaleString(),
      icon: FiShoppingBag,
      color: 'bg-amber-500',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Today Banner */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-brand-700 via-brand-800 to-leaf-700 rounded-2xl p-5 text-white flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-2 text-brand-100 text-sm mb-1">
            <FiCalendar size={14} />
            Today — {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
          <div className="flex items-center gap-6">
            <div>
              <p className="text-xs text-brand-200 uppercase tracking-wider">Today's Revenue</p>
              <p className="text-3xl font-bold">₹{analytics.todayRevenue.toLocaleString('en-IN')}</p>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div>
              <p className="text-xs text-brand-200 uppercase tracking-wider">Today's Orders</p>
              <p className="text-3xl font-bold">{analytics.todayOrders}</p>
            </div>
          </div>
        </div>
        <button
          onClick={() => setShowOfflineModal(true)}
          className="flex items-center gap-2 bg-white/15 hover:bg-white/25 border border-white/20 text-white px-4 py-2.5 rounded-xl text-sm font-medium transition-all backdrop-blur-sm shrink-0"
        >
          <FiPlus size={16} /> Record Offline Sale
        </button>
      </motion.div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s, i) => <StatCard key={s.title} {...s} delay={i * 0.06} />)}
      </div>

      {/* Online vs Offline Revenue */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-br from-brand-50 to-white rounded-2xl border border-brand-100 p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-brand-700 rounded-xl flex items-center justify-center shrink-0">
            <FiWifi size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-brand-600 uppercase tracking-wider mb-0.5">Online Revenue</p>
            <p className="text-2xl font-bold text-brand-800">₹{analytics.onlineRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-0.5">Website orders</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-leaf-50 to-white rounded-2xl border border-leaf-100 p-5 flex items-center gap-4"
        >
          <div className="w-12 h-12 bg-leaf-600 rounded-xl flex items-center justify-center shrink-0">
            <FiWifiOff size={20} className="text-white" />
          </div>
          <div>
            <p className="text-xs font-semibold text-leaf-700 uppercase tracking-wider mb-0.5">Offline Revenue</p>
            <p className="text-2xl font-bold text-leaf-800">₹{analytics.offlineRevenue.toLocaleString('en-IN')}</p>
            <p className="text-xs text-gray-500 mt-0.5">Offline sales</p>
          </div>
        </motion.div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Bar Chart — Monthly Revenue */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="font-semibold text-gray-800 mb-1">Monthly Revenue</h3>
          <p className="text-xs text-gray-400 mb-5">Last 6 months ka revenue</p>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.monthlyRevenue} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="monthShort" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="revenue" name="Revenue" fill="#34308f" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Line Chart — Daily Revenue (last 7 days) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="font-semibold text-gray-800 mb-1">Daily Revenue</h3>
          <p className="text-xs text-gray-400 mb-5">Last 7 days ka trend</p>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={analytics.dailyRevenue}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="day" tick={{ fontSize: 12, fill: '#6b7280' }} />
              <YAxis tick={{ fontSize: 11, fill: '#6b7280' }} tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}K`} width={52} />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="revenue"
                name="Revenue"
                stroke="#67bb2e"
                strokeWidth={2.5}
                dot={{ r: 4, fill: '#67bb2e', stroke: '#fff', strokeWidth: 2 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pie Chart — Order Status */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
        >
          <h3 className="font-semibold text-gray-800 mb-1">Order Status</h3>
          <p className="text-xs text-gray-400 mb-4">Orders ka breakdown</p>
          {analytics.orderStatusData?.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={180}>
                <PieChart>
                  <Pie
                    data={analytics.orderStatusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={76}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {analytics.orderStatusData.map((_, idx) => (
                      <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => [v, 'Orders']} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {analytics.orderStatusData.map((item, idx) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span className="capitalize text-gray-600">{item.name}</span>
                    </div>
                    <span className="font-semibold text-gray-800">{item.value}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No order data yet</div>
          )}
        </motion.div>

        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 lg:col-span-2"
        >
          <h3 className="font-semibold text-gray-800 mb-1">🏆 Top Selling Products</h3>
          <p className="text-xs text-gray-400 mb-4">Sabse zyada bikne wale products</p>
          {analytics.topProducts?.length > 0 ? (
            <div className="space-y-3">
              {analytics.topProducts.map((p, i) => {
                const maxSold = analytics.topProducts[0]?.sold || 1;
                const pct = ((p.sold || 0) / maxSold) * 100;
                return (
                  <div key={p._id} className="flex items-center gap-3">
                    <span className="text-xs font-bold text-gray-400 w-5 shrink-0">#{i + 1}</span>
                    {p.images?.[0]?.url ? (
                      <img src={p.images[0].url} alt={p.name} className="w-10 h-12 object-cover rounded-lg shrink-0" />
                    ) : (
                      <div className="w-10 h-12 bg-gray-100 rounded-lg shrink-0 flex items-center justify-center">
                        <FiShoppingBag size={16} className="text-gray-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                        <span className="text-xs text-gray-500 shrink-0">{p.sold || 0} sold</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-1.5">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.7, delay: 0.5 + i * 0.1 }}
                          className="h-full bg-brand-600 rounded-full"
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        {p.category} · ₹{((p.discountedPrice || p.price) || 0).toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-gray-300 text-sm">No product sales data yet</div>
          )}
        </motion.div>
      </div>

      {/* Recent Orders */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
      >
        <div className="px-6 py-4 border-b border-gray-50">
          <h3 className="font-semibold text-gray-800">Recent Orders</h3>
          <p className="text-xs text-gray-400">Sabse latest paid orders</p>
        </div>
        {analytics.recentOrders?.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {analytics.recentOrders.map((o) => {
              const orderDate = o.createdAt?.toDate
                ? o.createdAt.toDate()
                : new Date(o.createdAt || Date.now());
              return (
                <div key={o.id || o._id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-xs shrink-0">
                      {(o.user?.name || o.shippingAddress?.fullName || 'U')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        {o.user?.name || o.shippingAddress?.fullName || 'Customer'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {o.source === 'offline' ? '🏪 Offline sale' : `#${o.orderNumber || (o.id || o._id)?.slice(-6).toUpperCase()}`}
                        {' · '}{orderDate.toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-brand-700 text-sm">₹{(o.pricing?.total || 0).toLocaleString('en-IN')}</p>
                    <span className={`badge text-[10px] capitalize ${
                      o.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                      o.orderStatus === 'cancelled' ? 'bg-red-100 text-red-600' :
                      o.source === 'offline' ? 'bg-leaf-100 text-leaf-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {o.source === 'offline' ? 'offline' : (o.orderStatus || 'placed')}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            <FiPackage size={32} className="mx-auto mb-2 opacity-40" />
            <p>No orders yet</p>
          </div>
        )}
      </motion.div>

      {/* Offline Sale Modal */}
      {showOfflineModal && (
        <OfflineSaleModal
          onClose={() => setShowOfflineModal(false)}
          onSuccess={fetchAnalytics}
        />
      )}
    </div>
  );
}
