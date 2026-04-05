import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiChevronDown } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const STATUS_OPTIONS = ['placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'returned'];
const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-600',
  returned: 'bg-gray-100 text-gray-600',
};

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedId, setExpandedId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/orders', {
        params: { status: filterStatus || undefined, page, limit: 15 },
      });
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [filterStatus, page]);

  const updateStatus = async (orderId, status) => {
    try {
      await api.put(`/orders/${orderId}/status`, { status });
      toast.success('Order status updated');
      fetchOrders();
    } catch { toast.error('Update failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-gray-800">Orders ({total})</h2>
        <select value={filterStatus} onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="input-field w-48 py-2.5 text-sm">
          <option value="">All Statuses</option>
          {STATUS_OPTIONS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array(8).fill(0).map((_, i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Order', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Update'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-4 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map((order) => (
                <React.Fragment key={order._id}>
                  <motion.tr
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                    className="hover:bg-gray-50/50 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                  >
                    <td className="px-4 py-4">
                      <p className="font-mono text-xs font-bold text-brand-700">#{order.orderNumber}</p>
                      <p className="text-[11px] text-gray-400">{new Date(order.createdAt).toLocaleDateString('en-IN')}</p>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm font-medium text-gray-800">{order.user?.name}</p>
                      <p className="text-xs text-gray-400">{order.user?.email}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className="badge bg-gray-100 text-gray-600 font-semibold">{order.items?.length} items</span>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-bold text-brand-700">₹{order.pricing?.total?.toLocaleString()}</p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge text-xs font-semibold ${order.payment?.status === 'paid' ? 'bg-green-100 text-green-700' : order.payment?.status === 'failed' ? 'bg-red-100 text-red-600' : 'bg-amber-100 text-amber-700'}`}>
                        {order.payment?.status}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`badge capitalize text-xs font-semibold ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                        {order.orderStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={order.orderStatus}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-700 focus:outline-none focus:ring-1 focus:ring-brand-300 bg-white capitalize"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s} className="capitalize">{s}</option>
                        ))}
                      </select>
                    </td>
                  </motion.tr>

                  {/* Expanded Row */}
                  {expandedId === order._id && (
                    <tr>
                      <td colSpan={7} className="px-4 py-4 bg-brand-50/30">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Items</p>
                            <div className="space-y-2">
                              {order.items?.map((item) => (
                                <div key={item._id} className="flex items-center gap-2 text-sm">
                                  <img src={item.image} alt={item.name} className="w-10 h-12 object-cover rounded-lg" />
                                  <div>
                                    <p className="font-medium text-gray-800 text-xs">{item.name}</p>
                                    <p className="text-gray-400 text-xs">Size: {item.size} · Qty: {item.quantity}</p>
                                  </div>
                                  <p className="ml-auto font-semibold text-xs text-brand-700">₹{(item.price * item.quantity).toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-500 mb-2 uppercase tracking-wider">Delivery Address</p>
                            <p className="text-sm text-gray-700">{order.shippingAddress?.fullName}</p>
                            <p className="text-xs text-gray-500">{order.shippingAddress?.phone}</p>
                            <p className="text-xs text-gray-500 mt-1">{order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <div className="text-center py-12 text-gray-400">No orders found</div>
          )}
        </div>
      )}

      {/* Pagination */}
      {Math.ceil(total / 15) > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: Math.ceil(total / 15) }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => setPage(p)}
              className={`w-9 h-9 rounded-full text-sm font-medium transition-all ${p === page ? 'bg-brand-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'}`}>
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
