import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiShoppingBag, FiUsers, FiPackage, FiTrendingUp, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import api from '../../utils/api';

const StatCard = ({ title, value, icon: Icon, change, color, delay }) => (
  <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
    <div className="flex items-start justify-between mb-4">
      <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center`}>
        <Icon size={22} className="text-white" />
      </div>
      {change !== undefined && (
        <span className={`flex items-center gap-1 text-xs font-medium ${change >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          {change >= 0 ? <FiArrowUp size={12} /> : <FiArrowDown size={12} />}
          {Math.abs(change)}%
        </span>
      )}
    </div>
    <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
    <p className="text-sm text-gray-500">{title}</p>
  </motion.div>
);

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/analytics')
      .then(({ data }) => setAnalytics(data.analytics))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {Array(4).fill(0).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6">
            <div className="skeleton h-12 w-12 rounded-xl mb-4" />
            <div className="skeleton h-7 w-24 rounded mb-2" />
            <div className="skeleton h-4 w-32 rounded" />
          </div>
        ))}
      </div>
    );
  }

  if (!analytics) return null;

  const revenueGrowth = analytics.lastMonthRevenue > 0
    ? Math.round(((analytics.monthRevenue - analytics.lastMonthRevenue) / analytics.lastMonthRevenue) * 100)
    : 0;

  const statCards = [
    { title: 'Total Revenue', value: `₹${(analytics.totalRevenue / 1000).toFixed(1)}K`, icon: FiTrendingUp, color: 'bg-brand-600', change: revenueGrowth },
    { title: 'Total Orders', value: analytics.totalOrders.toLocaleString(), icon: FiPackage, color: 'bg-blue-500' },
    { title: 'Total Users', value: analytics.totalUsers.toLocaleString(), icon: FiUsers, color: 'bg-emerald-500' },
    { title: 'Products Listed', value: analytics.totalProducts.toLocaleString(), icon: FiShoppingBag, color: 'bg-amber-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((s, i) => <StatCard key={s.title} {...s} delay={i * 0.08} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Monthly Revenue Chart */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Monthly Revenue</h3>
          <div className="space-y-3">
            {analytics.monthlyRevenue?.map((m) => {
              const maxRev = Math.max(...analytics.monthlyRevenue.map((x) => x.revenue));
              const pct = maxRev > 0 ? (m.revenue / maxRev) * 100 : 0;
              const monthName = new Date(m._id.year, m._id.month - 1).toLocaleString('default', { month: 'short' });
              return (
                <div key={`${m._id.year}-${m._id.month}`} className="flex items-center gap-3">
                  <span className="text-xs text-gray-500 w-8">{monthName}</span>
                  <div className="flex-1 bg-gray-100 rounded-full h-2.5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                      className="h-full bg-brand-600 rounded-full"
                    />
                  </div>
                  <span className="text-xs font-medium text-gray-700 w-16 text-right">₹{(m.revenue / 1000).toFixed(1)}K</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order Status Breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Orders by Status</h3>
          <div className="space-y-3">
            {Object.entries(analytics.ordersByStatus || {}).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <span className="text-sm capitalize text-gray-600">{status}</span>
                <span className="badge bg-brand-50 text-brand-700 font-semibold">{count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">🏆 Top Selling Products</h3>
          <div className="space-y-3">
            {analytics.topProducts?.map((p, i) => (
              <div key={p._id} className="flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-5">#{i + 1}</span>
                <img src={p.images?.[0]?.url} alt={p.name} className="w-10 h-12 object-cover rounded-lg" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                  <p className="text-xs text-gray-500">{p.category}</p>
                </div>
                <span className="text-xs text-gray-500 shrink-0">{p.sold} sold</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Orders */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-semibold text-gray-800 mb-4">Recent Orders</h3>
          <div className="space-y-3">
            {analytics.recentOrders?.map((o) => (
              <div key={o._id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium text-gray-800">{o.user?.name}</p>
                  <p className="text-xs text-gray-400">#{o.orderNumber}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-brand-700">₹{o.pricing?.total?.toLocaleString()}</p>
                  <span className={`badge text-[10px] capitalize ${
                    o.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                    o.orderStatus === 'cancelled' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-700'
                  }`}>{o.orderStatus}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
