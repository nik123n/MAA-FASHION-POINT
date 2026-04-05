import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiPlus, FiTrash2, FiPrinter, FiX, FiSearch,
  FiUser, FiPhone, FiCalendar, FiShoppingBag,
  FiCheckCircle, FiFileText,
} from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

// ─────────────────────────────────────────────────────────────────────────────
// Printable Invoice Component
// ─────────────────────────────────────────────────────────────────────────────
function PrintableInvoice({ bill, billNumber }) {
  return (
    <div id="printable-invoice" className="hidden print:block font-sans text-gray-900 p-8 max-w-xl mx-auto">
      {/* Header */}
      <div className="text-center border-b-2 border-gray-800 pb-4 mb-4">
        <h1 className="text-2xl font-bold uppercase tracking-widest">MAA FASHION POINT</h1>
        <p className="text-sm text-gray-600 mt-1">Ladies Clothing Store</p>
        <p className="text-xs text-gray-500">GSTIN: [Your GST Number] | Ph: [Your Phone]</p>
      </div>

      {/* Bill Info */}
      <div className="flex justify-between text-sm mb-4">
        <div>
          <p className="font-bold text-xs uppercase text-gray-500 mb-1">Bill To:</p>
          <p className="font-semibold">{bill.customerName}</p>
          {bill.phone && <p className="text-gray-600">Mob: {bill.phone}</p>}
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-500">Bill No.</p>
          <p className="font-bold">{billNumber}</p>
          <p className="text-xs text-gray-500 mt-1">Date</p>
          <p className="font-semibold">{new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
        </div>
      </div>

      {/* Products Table */}
      <table className="w-full text-sm border-collapse mb-4">
        <thead>
          <tr className="border-b-2 border-gray-800">
            <th className="text-left py-2 text-xs uppercase">#</th>
            <th className="text-left py-2 text-xs uppercase">Product</th>
            <th className="text-center py-2 text-xs uppercase">Qty</th>
            <th className="text-right py-2 text-xs uppercase">Price</th>
            <th className="text-right py-2 text-xs uppercase">Amount</th>
          </tr>
        </thead>
        <tbody>
          {bill.products.map((item, i) => (
            <tr key={i} className="border-b border-gray-200">
              <td className="py-2 text-gray-500">{i + 1}</td>
              <td className="py-2 font-medium">{item.productName}</td>
              <td className="py-2 text-center">{item.quantity}</td>
              <td className="py-2 text-right">₹{Number(item.price).toLocaleString('en-IN')}</td>
              <td className="py-2 text-right font-semibold">₹{Number(item.total).toLocaleString('en-IN')}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Totals */}
      <div className="ml-auto w-52 text-sm space-y-1.5 border-t border-gray-200 pt-3">
        <div className="flex justify-between">
          <span className="text-gray-600">Subtotal</span>
          <span>₹{Number(bill.totalAmount).toLocaleString('en-IN')}</span>
        </div>
        {Number(bill.discount) > 0 && (
          <div className="flex justify-between text-green-700">
            <span>Discount</span>
            <span>-₹{Number(bill.discount).toLocaleString('en-IN')}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-base border-t-2 border-gray-800 pt-1.5 mt-1">
          <span>TOTAL</span>
          <span>₹{Number(bill.finalAmount).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        <p className="font-semibold text-gray-800 mb-1">Thank you for shopping with us! 🙏</p>
        <p>Goods once sold will not be taken back.</p>
        <p className="mt-1 italic">MAA FASHION POINT — Caring for every woman</p>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Invoice Modal — shown after successful bill creation
// ─────────────────────────────────────────────────────────────────────────────
function InvoiceModal({ bill, billNumber, onClose, onNewBill }) {
  const handlePrint = () => window.print();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 print:hidden"
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.92, opacity: 0 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
      >
        {/* Success Header */}
        <div className="bg-gradient-to-r from-leaf-600 to-leaf-700 rounded-t-2xl px-6 py-5 text-white">
          <div className="flex items-center gap-3 mb-1">
            <FiCheckCircle size={24} />
            <h2 className="text-lg font-bold">Bill Created Successfully!</h2>
          </div>
          <p className="text-leaf-100 text-sm">Bill No: <span className="font-mono font-bold">{billNumber}</span></p>
        </div>

        {/* Invoice Preview */}
        <div className="p-6 border-b border-gray-100">
          {/* Shop Name */}
          <div className="text-center mb-5">
            <h3 className="text-xl font-bold tracking-wide text-gray-900">MAA FASHION POINT</h3>
            <p className="text-xs text-gray-500">Ladies Clothing Store</p>
            <div className="w-16 h-0.5 bg-gray-300 mx-auto mt-2" />
          </div>

          {/* Customer + Date */}
          <div className="flex justify-between text-sm mb-4">
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Bill To</p>
              <p className="font-semibold text-gray-800">{bill.customerName}</p>
              {bill.phone && <p className="text-gray-500 text-xs">{bill.phone}</p>}
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Date</p>
              <p className="font-semibold text-gray-800 text-sm">
                {new Date(bill.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Products */}
          <div className="border border-gray-200 rounded-xl overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Product</th>
                  <th className="text-center px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Qty</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Price</th>
                  <th className="text-right px-3 py-2.5 text-xs font-semibold text-gray-500 uppercase">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {bill.products.map((item, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2.5 font-medium text-gray-800">{item.productName}</td>
                    <td className="px-3 py-2.5 text-center text-gray-600">{item.quantity}</td>
                    <td className="px-3 py-2.5 text-right text-gray-600">₹{Number(item.price).toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5 text-right font-semibold text-gray-800">₹{Number(item.total).toLocaleString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totals */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>₹{Number(bill.totalAmount).toLocaleString('en-IN')}</span>
            </div>
            {Number(bill.discount) > 0 && (
              <div className="flex justify-between text-leaf-700 font-medium">
                <span>Discount</span>
                <span>-₹{Number(bill.discount).toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-base pt-2 border-t-2 border-gray-800">
              <span>Grand Total</span>
              <span className="text-brand-700">₹{Number(bill.finalAmount).toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Thank You */}
          <p className="text-center text-xs text-gray-400 mt-4 italic">Thank you for shopping with us! 🙏</p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 p-4">
          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center gap-2 bg-brand-700 hover:bg-brand-800 text-white py-3 rounded-xl font-semibold text-sm transition-all hover:shadow-lg"
          >
            <FiPrinter size={18} /> Print Bill
          </button>
          <button
            onClick={onNewBill}
            className="flex-1 flex items-center justify-center gap-2 border-2 border-leaf-600 text-leaf-700 hover:bg-leaf-50 py-3 rounded-xl font-semibold text-sm transition-all"
          >
            <FiPlus size={16} /> New Bill
          </button>
          <button
            onClick={onClose}
            className="p-3 border border-gray-200 hover:bg-gray-50 rounded-xl transition-colors text-gray-500"
          >
            <FiX size={18} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Empty line item
// ─────────────────────────────────────────────────────────────────────────────
const emptyItem = () => ({ productId: '', productName: '', quantity: 1, price: '', total: 0 });

// ─────────────────────────────────────────────────────────────────────────────
// Main AdminBilling Page
// ─────────────────────────────────────────────────────────────────────────────
export default function AdminBilling() {
  const today = new Date().toISOString().split('T')[0];

  const [form, setForm] = useState({
    customerName: '',
    phone: '',
    date: today,
    discount: '',
  });
  const [items, setItems] = useState([emptyItem()]);
  const [products, setProducts] = useState([]);
  const [productSearch, setProductSearch] = useState({});
  const [productSuggestions, setProductSuggestions] = useState({});
  const [saving, setSaving] = useState(false);
  const [createdBill, setCreatedBill] = useState(null);
  const [billNumber, setBillNumber] = useState('');
  const [recentBills, setRecentBills] = useState([]);

  // Fetch product list once
  useEffect(() => {
    api.get('/products', { params: { limit: 200 } })
      .then(({ data }) => setProducts(data.products || []))
      .catch(() => {});
    fetchRecentBills();
  }, []);

  const fetchRecentBills = async () => {
    try {
      const { data } = await api.get('/admin/orders', { params: { limit: 10 } });
      const bills = (data.orders || []).filter((o) => o.source === 'offline' || o.type === 'offline');
      setRecentBills(bills.slice(0, 8));
    } catch (_) {}
  };

  // ── Calculated totals ─────────────────────────────────────────────────────
  const subtotal = items.reduce((sum, item) => sum + (Number(item.total) || 0), 0);
  const discount = Number(form.discount) || 0;
  const grandTotal = Math.max(0, subtotal - discount);

  // ── Product line handlers ─────────────────────────────────────────────────
  const updateItem = (idx, field, value) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };

      if (field === 'quantity' || field === 'price') {
        const qty = field === 'quantity' ? Number(value) : Number(updated[idx].quantity);
        const price = field === 'price' ? Number(value) : Number(updated[idx].price);
        updated[idx].total = qty * price;
      }
      return updated;
    });
  };

  const selectProduct = (idx, product) => {
    setItems((prev) => {
      const updated = [...prev];
      const price = product.discountedPrice || product.price || 0;
      const qty = updated[idx].quantity || 1;
      updated[idx] = {
        ...updated[idx],
        productId: product._id,
        productName: product.name,
        price: price,
        total: price * qty,
      };
      return updated;
    });
    setProductSearch((s) => ({ ...s, [idx]: product.name }));
    setProductSuggestions((s) => ({ ...s, [idx]: [] }));
  };

  const handleProductSearch = (idx, query) => {
    setProductSearch((s) => ({ ...s, [idx]: query }));
    updateItem(idx, 'productName', query);
    if (query.length < 1) {
      setProductSuggestions((s) => ({ ...s, [idx]: [] }));
      return;
    }
    const filtered = products.filter((p) =>
      p.name.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 6);
    setProductSuggestions((s) => ({ ...s, [idx]: filtered }));
  };

  const addItem = () => setItems((prev) => [...prev, emptyItem()]);

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems((prev) => prev.filter((_, i) => i !== idx));
    setProductSearch((s) => { const n = { ...s }; delete n[idx]; return n; });
    setProductSuggestions((s) => { const n = { ...s }; delete n[idx]; return n; });
  };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();

    const validItems = items.filter((it) => it.productName && Number(it.quantity) > 0);
    if (validItems.length === 0) {
      toast.error('Add at least one product');
      return;
    }
    if (!form.customerName.trim()) {
      toast.error('Enter customer name');
      return;
    }

    const payload = {
      customerName: form.customerName.trim(),
      phone: form.phone.trim(),
      date: form.date,
      products: validItems.map((it) => ({
        productId: it.productId || '',
        productName: it.productName,
        quantity: Number(it.quantity),
        price: Number(it.price),
        total: Number(it.total),
      })),
      totalAmount: subtotal,
      discount: discount,
      finalAmount: grandTotal,
    };

    setSaving(true);
    try {
      const { data } = await api.post('/admin/offline-sale', payload);
      toast.success('Bill saved successfully!');
      setBillNumber(data.billNumber || `BILL-${Date.now().toString(36).toUpperCase()}`);
      setCreatedBill({ ...payload, date: form.date });

      // Reset form
      setForm({ customerName: '', phone: '', date: today, discount: '' });
      setItems([emptyItem()]);
      setProductSearch({});
      setProductSuggestions({});

      fetchRecentBills();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save bill');
    } finally {
      setSaving(false);
    }
  };

  const handleNewBill = () => setCreatedBill(null);

  return (
    <>
      {/* Hidden Printable Invoice (only shows on Ctrl+P) */}
      {createdBill && (
        <PrintableInvoice bill={createdBill} billNumber={billNumber} />
      )}

      <div className="max-w-4xl mx-auto space-y-6 print:hidden">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-display text-2xl text-gray-800">🧾 Create Bill</h2>
            <p className="text-sm text-gray-500 mt-0.5">Offline sale entry — record manual sales</p>
          </div>
          <div className="flex items-center gap-2 bg-brand-50 border border-brand-100 rounded-xl px-4 py-2">
            <FiFileText size={16} className="text-brand-600" />
            <span className="text-sm font-semibold text-brand-700">{recentBills.length} bills today</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Customer Details Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <FiUser size={16} className="text-brand-600" /> Customer Details
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Customer Name *
                </label>
                <div className="relative">
                  <FiUser size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={form.customerName}
                    onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                    className="input-field pl-9 py-2.5 text-sm"
                    placeholder="Customer ka naam"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Mobile Number
                </label>
                <div className="relative">
                  <FiPhone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="input-field pl-9 py-2.5 text-sm"
                    placeholder="10-digit number"
                    maxLength={10}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Date
                </label>
                <div className="relative">
                  <FiCalendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="date"
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="input-field pl-9 py-2.5 text-sm"
                    max={today}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Products Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <FiShoppingBag size={16} className="text-brand-600" /> Products
              </h3>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700 hover:bg-brand-50 px-3 py-1.5 rounded-lg transition-colors"
              >
                <FiPlus size={15} /> Add Product
              </button>
            </div>

            {/* Column Headers */}
            <div className="hidden sm:grid grid-cols-12 gap-3 mb-2 px-1">
              <div className="col-span-5 text-xs font-semibold text-gray-400 uppercase tracking-wider">Product</div>
              <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Qty</div>
              <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Price (₹)</div>
              <div className="col-span-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">Amount</div>
              <div className="col-span-1" />
            </div>

            <div className="space-y-3">
              <AnimatePresence>
                {items.map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="grid grid-cols-12 gap-3 items-center"
                  >
                    {/* Product Search */}
                    <div className="col-span-12 sm:col-span-5 relative">
                      <div className="relative">
                        <FiSearch size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                          type="text"
                          value={productSearch[idx] ?? item.productName}
                          onChange={(e) => handleProductSearch(idx, e.target.value)}
                          className="input-field pl-8 py-2.5 text-sm"
                          placeholder="Search products..."
                        />
                      </div>
                      <AnimatePresence>
                        {productSuggestions[idx]?.length > 0 && (
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            className="absolute z-20 left-0 right-0 top-full mt-1 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden"
                          >
                            {productSuggestions[idx].map((p) => (
                              <button
                                key={p._id}
                                type="button"
                                onClick={() => selectProduct(idx, p)}
                                className="flex items-center gap-3 w-full px-3 py-2.5 hover:bg-brand-50 transition-colors text-left"
                              >
                                {p.images?.[0]?.url && (
                                  <img src={p.images[0].url} alt="" className="w-8 h-10 object-cover rounded-lg shrink-0" />
                                )}
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-gray-800 truncate">{p.name}</p>
                                  <p className="text-xs text-brand-600">
                                    ₹{(p.discountedPrice || p.price || 0).toLocaleString('en-IN')}
                                  </p>
                                </div>
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Qty */}
                    <div className="col-span-4 sm:col-span-2">
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateItem(idx, 'quantity', e.target.value)}
                        className="input-field py-2.5 text-sm text-center"
                        min="1"
                        placeholder="Qty"
                      />
                    </div>

                    {/* Price */}
                    <div className="col-span-4 sm:col-span-2">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => updateItem(idx, 'price', e.target.value)}
                          className="input-field pl-7 py-2.5 text-sm"
                          min="0"
                          placeholder="Price"
                        />
                      </div>
                    </div>

                    {/* Total */}
                    <div className="col-span-3 sm:col-span-2">
                      <div className="bg-brand-50 border border-brand-100 rounded-xl px-3 py-2.5 text-sm font-bold text-brand-700 text-right">
                        ₹{Number(item.total || 0).toLocaleString('en-IN')}
                      </div>
                    </div>

                    {/* Remove */}
                    <div className="col-span-1 flex justify-center">
                      <button
                        type="button"
                        onClick={() => removeItem(idx)}
                        disabled={items.length === 1}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <FiTrash2 size={15} />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Add More Button (mobile) */}
            <button
              type="button"
              onClick={addItem}
              className="mt-4 w-full border-2 border-dashed border-brand-200 hover:border-brand-400 text-brand-600 hover:text-brand-700 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 hover:bg-brand-50"
            >
              <FiPlus size={16} /> Add Another Product
            </button>
          </motion.div>

          {/* Totals + Discount Card */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6"
          >
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5">
              {/* Discount */}
              <div className="w-full sm:w-56">
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  Discount (₹) — Optional
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">₹</span>
                  <input
                    type="number"
                    value={form.discount}
                    onChange={(e) => setForm({ ...form, discount: e.target.value })}
                    className="input-field pl-7 py-2.5 text-sm"
                    min="0"
                    max={subtotal}
                    placeholder="0"
                  />
                </div>
              </div>

              {/* Summary */}
              <div className="bg-gray-50 rounded-xl p-4 flex-1 sm:max-w-xs space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Subtotal</span>
                  <span className="font-medium">₹{subtotal.toLocaleString('en-IN')}</span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between text-leaf-700">
                    <span>Discount</span>
                    <span className="font-medium">-₹{discount.toLocaleString('en-IN')}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-lg border-t border-gray-200 pt-2">
                  <span>Grand Total</span>
                  <span className="text-brand-700">₹{grandTotal.toLocaleString('en-IN')}</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Submit */}
          <button
            type="submit"
            disabled={saving || grandTotal <= 0}
            className="w-full bg-brand-700 hover:bg-brand-800 text-white py-4 rounded-2xl font-bold text-base transition-all hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {saving ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving Bill...</>
            ) : (
              <><FiCheckCircle size={20} /> Save Bill &amp; Generate Invoice</>
            )}
          </button>
        </form>

        {/* Recent Bills */}
        {recentBills.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-50">
              <h3 className="font-semibold text-gray-800">Recent Offline Bills</h3>
              <p className="text-xs text-gray-400">Pichhli bills</p>
            </div>
            <div className="divide-y divide-gray-50">
              {recentBills.map((bill) => (
                <div key={bill._id || bill.id} className="flex items-center justify-between px-6 py-3.5 hover:bg-gray-50/60 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-leaf-100 text-leaf-700 rounded-full flex items-center justify-center font-bold text-xs shrink-0">
                      {(bill.customerName || 'W')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-800">
                        {bill.customerName || 'Walk-in Customer'}
                      </p>
                      <p className="text-xs text-gray-400">
                        {bill.orderNumber || 'Offline'} ·{' '}
                        {new Date(bill.createdAt || bill.date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  </div>
                  <span className="font-bold text-brand-700 text-sm">
                    ₹{(bill.pricing?.total || bill.finalAmount || 0).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Invoice Modal */}
      <AnimatePresence>
        {createdBill && (
          <InvoiceModal
            bill={createdBill}
            billNumber={billNumber}
            onClose={() => setCreatedBill(null)}
            onNewBill={handleNewBill}
          />
        )}
      </AnimatePresence>
    </>
  );
}
