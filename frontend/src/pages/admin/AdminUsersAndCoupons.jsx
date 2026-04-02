import React, { useEffect, useState } from 'react';
import { FiSearch, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

export function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/admin/users', { params: { search, limit: 50 } });
      setUsers(data.users);
    } catch { toast.error('Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchUsers(); }, [search]);

  const toggleUser = async (id, name) => {
    try {
      await api.patch(`/admin/users/${id}/toggle`);
      toast.success(`User ${name} status updated`);
      fetchUsers();
    } catch { toast.error('Toggle failed'); }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-gray-800">Users ({users.length})</h2>
        <div className="relative">
          <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..." className="input-field pl-11 w-64 py-2.5 text-sm" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {['User', 'Phone', 'Role', 'Joined', 'Status', 'Action'].map((h) => (
                <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {users.map((u) => (
              <tr key={u._id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                      {u.name?.[0]?.toUpperCase()}
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
                  {new Date(u.createdAt).toLocaleDateString('en-IN')}
                </td>
                <td className="px-5 py-4">
                  <span className={`badge text-xs font-semibold ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {u.isActive ? 'Active' : 'Blocked'}
                  </span>
                </td>
                <td className="px-5 py-4">
                  {u.role !== 'admin' && (
                    <button onClick={() => toggleUser(u._id, u.name)}
                      className={`p-2 rounded-lg transition-colors ${u.isActive ? 'text-red-400 hover:bg-red-50' : 'text-green-500 hover:bg-green-50'}`}>
                      {u.isActive ? <FiToggleRight size={22} /> : <FiToggleLeft size={22} />}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && !loading && (
          <div className="text-center py-12 text-gray-400">No users found</div>
        )}
      </div>
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
      setCoupons(data.coupons);
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
        <h2 className="font-display text-2xl text-gray-800">Coupons ({coupons.length})</h2>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary py-2.5 px-5 text-sm">
          {showForm ? 'Cancel' : '+ New Coupon'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-6">
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
              <select value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                className="input-field">
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
        </form>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
