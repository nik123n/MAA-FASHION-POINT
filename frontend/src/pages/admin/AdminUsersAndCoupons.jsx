import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiToggleLeft, FiToggleRight, FiTrash2,
  FiPackage, FiX, FiUser, FiAlertTriangle,
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ── Delete Confirm Modal ──────────────────────────────────────────────────────
function DeleteConfirm({ user, onConfirm, onCancel, loading }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center shrink-0">
            <FiAlertTriangle size={22} className="text-red-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">Delete User?</h3>
            <p className="text-sm text-gray-500">Yeh action undo nahi hoga</p>
          </div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3 mb-5">
          <p className="font-medium text-sm text-gray-800">{user.name}</p>
          <p className="text-xs text-gray-500">{user.email}</p>
        </div>
        <p className="text-sm text-gray-600 mb-5">
          This will permanently delete the user from Firebase Auth and Firestore.
          Their orders will remain in the database.
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="btn-outline flex-1 py-2.5 text-sm">Cancel</button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className="flex-1 py-2.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-full font-medium transition-all flex items-center justify-center gap-2"
          >
            {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <FiTrash2 size={14} />}
            {loading ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── User Orders Modal ─────────────────────────────────────────────────────────
function UserOrdersModal({ user, onClose }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/orders', { params: { limit: 100 } })
      .then(({ data }) => {
        // Filter orders for this user
        const userOrders = (data.orders || []).filter(
          (o) => o.userId === user._id || o.user?._id === user._id || o.user?.id === user._id
        );
        setOrders(userOrders);
      })
      .catch(() => toast.error('Failed to load orders'))
      .finally(() => setLoading(false));
  }, [user._id]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 60, opacity: 0 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
              {user.name?.[0]?.toUpperCase()}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">{user.name}'s Orders</h3>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full">
            <FiX size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="space-y-3">
              {Array(4).fill(0).map((_, i) => (
                <div key={i} className="skeleton h-16 rounded-xl" />
              ))}
            </div>
          ) : orders.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FiPackage size={32} className="mx-auto mb-2 opacity-40" />
              <p>No orders found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map((o) => (
                <div key={o._id || o.id} className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm text-gray-800">
                      #{(o.orderNumber || (o._id || o.id)?.slice(-6) || '').toUpperCase()}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {o.items?.length || 0} items ·{' '}
                      {new Date(o.createdAt?.toDate ? o.createdAt.toDate() : o.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-brand-700">₹{(o.pricing?.total || 0).toLocaleString('en-IN')}</p>
                    <span className={`badge text-[10px] capitalize ${
                      o.orderStatus === 'delivered' ? 'bg-green-100 text-green-700' :
                      o.orderStatus === 'cancelled' ? 'bg-red-100 text-red-600' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {o.orderStatus || 'placed'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main AdminUsers Component ─────────────────────────────────────────────────
export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [viewOrdersUser, setViewOrdersUser] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { search, limit: 50 } });
      setUsers(data.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const toggleUser = async (id, name, isActive) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      toast.success(`${name} ${isActive ? 'blocked' : 'unblocked'}`);
      fetchUsers();
    } catch {
      toast.error('Toggle failed');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/admin/users/${deleteTarget._id}`);
      toast.success(`${deleteTarget.name} deleted`);
      setDeleteTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="font-display text-2xl text-gray-800">Users</h2>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} registered users</p>
        </div>
        <div className="relative">
          <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="input-field pl-11 w-full sm:w-72 py-2.5 text-sm"
          />
        </div>
      </div>

      {/* Mobile card view */}
      <div className="block sm:hidden space-y-3">
        {loading ? (
          Array(5).fill(0).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
        ) : users.map((u) => (
          <motion.div
            key={u._id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold">
                  {u.name?.[0]?.toUpperCase() || <FiUser size={16} />}
                </div>
                <div>
                  <p className="font-medium text-sm text-gray-800">{u.name}</p>
                  <p className="text-xs text-gray-400">{u.email}</p>
                </div>
              </div>
              <span className={`badge text-xs font-semibold ${u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                {u.isActive !== false ? 'Active' : 'Blocked'}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-50">
              <span className={`badge font-semibold text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                {u.role}
              </span>
              <div className="flex items-center gap-1 ml-auto">
                <button
                  onClick={() => setViewOrdersUser(u)}
                  className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                  title="View Orders"
                >
                  <FiPackage size={15} />
                </button>
                {u.role !== 'admin' && (
                  <>
                    <button
                      onClick={() => toggleUser(u._id, u.name, u.isActive !== false)}
                      className={`p-2 rounded-lg transition-colors ${u.isActive !== false ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                      title={u.isActive !== false ? 'Block' : 'Unblock'}
                    >
                      {u.isActive !== false ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                    </button>
                    <button
                      onClick={() => setDeleteTarget(u)}
                      className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete User"
                    >
                      <FiTrash2 size={15} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Desktop table view */}
      <div className="hidden sm:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['User', 'Phone', 'Role', 'Joined', 'Status', 'Actions'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              Array(8).fill(0).map((_, i) => (
                <tr key={i}>
                  <td colSpan={6} className="px-5 py-4"><div className="skeleton h-8 rounded-lg" /></td>
                </tr>
              ))
            ) : users.map((u) => (
              <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {u.name?.[0]?.toUpperCase() || <FiUser size={14} />}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">{u.name}</p>
                      <p className="text-xs text-gray-400">{u.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">{u.phone || '—'}</td>
                <td className="px-5 py-4">
                  <span className={`badge font-semibold text-xs ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'}`}>
                    {u.role}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">
                  {u.createdAt ? new Date(u.createdAt?.toDate ? u.createdAt.toDate() : u.createdAt).toLocaleDateString('en-IN') : '—'}
                </td>
                <td className="px-5 py-4">
                  <span className={`badge text-xs font-semibold ${u.isActive !== false ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.isActive !== false ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setViewOrdersUser(u)}
                      className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors"
                      title="View Orders"
                    >
                      <FiPackage size={15} />
                    </button>
                    {u.role !== 'admin' && (
                      <>
                        <button
                          onClick={() => toggleUser(u._id, u.name, u.isActive !== false)}
                          className={`p-2 rounded-lg transition-colors ${u.isActive !== false ? 'text-amber-500 hover:bg-amber-50' : 'text-green-500 hover:bg-green-50'}`}
                          title={u.isActive !== false ? 'Block User' : 'Unblock User'}
                        >
                          {u.isActive !== false ? <FiToggleRight size={20} /> : <FiToggleLeft size={20} />}
                        </button>
                        <button
                          onClick={() => setDeleteTarget(u)}
                          className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete User"
                        >
                          <FiTrash2 size={15} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <div className="text-center py-16 text-gray-400">
            <FiUser size={32} className="mx-auto mb-2 opacity-40" />
            <p>No users found</p>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {deleteTarget && (
          <DeleteConfirm
            user={deleteTarget}
            onConfirm={handleDelete}
            onCancel={() => setDeleteTarget(null)}
            loading={deleting}
          />
        )}
        {viewOrdersUser && (
          <UserOrdersModal user={viewOrdersUser} onClose={() => setViewOrdersUser(null)} />
        )}
      </AnimatePresence>
    </div>
  );
}

export function AdminCoupons() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    code: '', description: '', discountType: 'flat', discountValue: '',
    minOrderAmount: '', maxDiscount: '', usageLimit: '', validUntil: '',
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/coupons');
      setCoupons(data.coupons || []);
    } catch { toast.error('Failed to load coupons'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchCoupons(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await api.post('/coupons', form);
      toast.success('Coupon created!');
      setShowForm(false);
      setForm({ code: '', description: '', discountType: 'flat', discountValue: '', minOrderAmount: '', maxDiscount: '', usageLimit: '', validUntil: '' });
      fetchCoupons();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
  };

  const toggleCoupon = async (id) => {
    try {
      await api.patch(`/coupons/${id}/toggle`);
      fetchCoupons();
    } catch { toast.error('Toggle failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="font-display text-2xl text-gray-800">Coupons</h2>
          <p className="text-sm text-gray-500 mt-0.5">{coupons.length} active coupons</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2.5 px-5 text-sm">
          {showForm ? 'Cancel' : '+ New Coupon'}
        </button>
      </div>

      {showForm && (
        <motion.form
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleCreate}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6"
        >
          <h3 className="font-semibold text-lg mb-4">Create Coupon</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { key: 'code', label: 'Code', placeholder: 'SAVE20', required: true },
              { key: 'description', label: 'Description', placeholder: '20% off on first order' },
              { key: 'discountValue', label: 'Discount Value', type: 'number', placeholder: '200', required: true },
              { key: 'minOrderAmount', label: 'Min Order (₹)', type: 'number', placeholder: '999' },
              { key: 'maxDiscount', label: 'Max Discount (₹)', type: 'number', placeholder: '500' },
              { key: 'usageLimit', label: 'Usage Limit', type: 'number', placeholder: '100' },
            ].map(({ key, label, type = 'text', placeholder, required }) => (
              <div key={key}>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">{label}</label>
                <input type={type} value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="input-field" placeholder={placeholder} required={required} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Discount Type</label>
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })} className="input-field">
                <option value="flat">Flat Amount (₹)</option>
                <option value="percent">Percentage (%)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Valid Until *</label>
              <input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                className="input-field" required />
            </div>
          </div>
          <button type="submit" className="btn-primary mt-4 px-6 py-2.5">Create Coupon</button>
        </motion.form>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['Code', 'Discount', 'Min Order', 'Used', 'Valid Until', 'Status', 'Action'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {coupons.map((c) => (
              <tr key={c._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4">
                  <p className="font-mono font-bold text-sm text-brand-700">{c.code}</p>
                  <p className="text-xs text-gray-400">{c.description}</p>
                </td>
                <td className="px-5 py-4 text-sm font-semibold text-gray-800">
                  {c.discountType === 'flat' ? `₹${c.discountValue}` : `${c.discountValue}%`}
                  {c.maxDiscount && <span className="text-xs text-gray-400 ml-1">(max ₹{c.maxDiscount})</span>}
                </td>
                <td className="px-5 py-4 text-sm text-gray-600">₹{c.minOrderAmount || 0}</td>
                <td className="px-5 py-4">
                  <span className="badge bg-gray-100 text-gray-600 font-semibold">
                    {c.usedCount}{c.usageLimit ? `/${c.usageLimit}` : ''}
                  </span>
                </td>
                <td className="px-5 py-4 text-xs text-gray-500">
                  {new Date(c.validUntil).toLocaleDateString('en-IN')}
                </td>
                <td className="px-5 py-4">
                  <span className={`badge text-xs font-semibold ${c.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {c.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  <button onClick={() => toggleCoupon(c._id)}
                    className={`p-2 rounded-lg transition-colors ${c.isActive ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>
                    {c.isActive ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {coupons.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">No coupons yet</div>
        )}
      </div>
    </div>
  );
}

export default AdminUsers;
