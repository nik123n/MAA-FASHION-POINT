import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiEdit, FiTrash2, FiX, FiUpload, FiSearch } from 'react-icons/fi';
import api from '../../utils/api';
import toast from 'react-hot-toast';

const CATEGORIES = ['3 Piece', '3 Piece Pair', 'Short Top', '2 Piece', 'Tunic Top', 'Cotton Tunic Top', 'Long Top', 'Cord Set', 'Plazo Pair', 'Kurti Plaza Dupata', 'Kurti Pent Dupata', 'Cotton Straight Pent'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const OCCASIONS = ['Casual', 'Wedding', 'Festival', 'Party', 'Office', 'Beach', 'College', 'Engagement', 'Reception', 'Mehndi', 'Sangeet'];

const emptyForm = {
  name: '', description: '', price: '', discountedPrice: '', category: '3 Piece',
  fabric: '', brand: 'Saanjh', isFeatured: false, isNewArrival: false, isTrending: false,
  sizes: SIZES.map((s) => ({ size: s, stock: 0 })),
  occasion: [], tags: '', imageUrls: '',
};

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploadEnabled, setUploadEnabled] = useState(false);
  const [uploadStatusLoaded, setUploadStatusLoaded] = useState(false);
  const [uploadMode, setUploadMode] = useState('local');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [images, setImages] = useState([]);
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/products', { params: { limit: 50, sort: 'newest' } });
      setProducts(data.products);
    } catch { toast.error('Failed to load products'); }
    finally { setLoading(false); }
  };

  const fetchUploadStatus = async () => {
    try {
      const { data } = await api.get('/products/upload-status');
      setUploadEnabled(Boolean(data.enabled));
      setUploadMode(data.mode || 'local');
    } catch {
      setUploadEnabled(false);
      setUploadMode('local');
    } finally {
      setUploadStatusLoaded(true);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchUploadStatus();
  }, []);

  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setImages([]);
    setModalOpen(true);
  };

  const openEdit = (p) => {
    setEditProduct(p);
    setForm({
      name: p.name, description: p.description, price: p.price,
      discountedPrice: p.discountedPrice || '', category: p.category,
      fabric: p.fabric || '', brand: p.brand || 'Saanjh',
      isFeatured: p.isFeatured, isNewArrival: p.isNewArrival, isTrending: p.isTrending,
      sizes: SIZES.map((s) => {
        const existing = p.sizes?.find((x) => x.size === s);
        return { size: s, stock: existing?.stock || 0 };
      }),
      occasion: p.occasion || [], tags: p.tags?.join(', ') || '',
      imageUrls: p.images?.map((img) => img.url).join('\n') || '',
    });
    setImages([]);
    setModalOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch { toast.error('Delete failed'); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => {
        if (k === 'sizes' || k === 'occasion') fd.append(k, JSON.stringify(v));
        else if (k === 'imageUrls') {
          const parsedUrls = v.split('\n').map((url) => url.trim()).filter(Boolean);
          fd.append(k, JSON.stringify(parsedUrls));
        }
        else fd.append(k, v);
      });
      images.forEach((img) => fd.append('images', img));

      if (editProduct) {
        await api.put(`/products/${editProduct._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product updated!');
      } else {
        await api.post('/products', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
        toast.success('Product created!');
      }
      setModalOpen(false);
      fetchProducts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally { setSaving(false); }
  };

  const toggleOccasion = (occ) => {
    setForm((f) => ({
      ...f,
      occasion: f.occasion.includes(occ) ? f.occasion.filter((o) => o !== occ) : [...f.occasion, occ],
    }));
  };

  const filtered = products.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.category.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="font-display text-2xl text-gray-800">Products ({products.length})</h2>
        <button onClick={openAdd} className="btn-primary flex items-center gap-2 py-2.5 px-5">
          <FiPlus size={18} /> Add Product
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-5">
        <FiSearch size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search products..." className="input-field pl-11 max-w-sm" />
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array(6).fill(0).map((_, i) => (
            <div key={i} className="skeleton h-16 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                {['Product', 'Category', 'Price', 'Stock', 'Status', 'Actions'].map((h) => (
                  <th key={h} className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider px-5 py-3.5">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((p) => (
                <motion.tr key={p._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <img src={p.images?.[0]?.url} alt={p.name}
                        className="w-12 h-14 object-cover rounded-xl" />
                      <div>
                        <p className="font-medium text-sm text-gray-800 line-clamp-1">{p.name}</p>
                        <p className="text-xs text-gray-400">{p.sku}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="badge bg-brand-50 text-brand-700 text-xs">{p.category}</span>
                  </td>
                  <td className="px-5 py-4">
                    <p className="font-semibold text-sm text-gray-800">₹{(p.discountedPrice || p.price).toLocaleString()}</p>
                    {p.discountedPrice && <p className="text-xs text-gray-400 line-through">₹{p.price.toLocaleString()}</p>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={`badge font-semibold text-xs ${p.totalStock > 10 ? 'bg-green-100 text-green-700' : p.totalStock > 0 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-600'}`}>
                      {p.totalStock} units
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col gap-1">
                      {p.isFeatured && <span className="badge bg-purple-100 text-purple-700 text-[10px]">Featured</span>}
                      {p.isNewArrival && <span className="badge bg-emerald-100 text-emerald-700 text-[10px]">New</span>}
                      {p.isTrending && <span className="badge bg-amber-100 text-amber-700 text-[10px]">Trending</span>}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openEdit(p)}
                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                        <FiEdit size={16} />
                      </button>
                      <button onClick={() => handleDelete(p._id, p.name)}
                        className="p-2 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="text-center py-12 text-gray-400">No products found</div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {modalOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
              onClick={() => setModalOpen(false)} />
            <motion.div
              initial={{ opacity: 0, x: '100%' }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 28 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-xl bg-white z-50 overflow-y-auto shadow-2xl"
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between z-10">
                <h2 className="font-display text-xl font-semibold">
                  {editProduct ? 'Edit Product' : 'Add New Product'}
                </h2>
                <button onClick={() => setModalOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <FiX size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Basic Info */}
                <div className="grid grid-cols-1 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Product Name *</label>
                    <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="input-field" placeholder="e.g. Banarasi Silk Saree" required />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Description *</label>
                    <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                      className="input-field resize-none" rows={3} placeholder="Product description..." required />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">MRP (₹) *</label>
                    <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })}
                      className="input-field" placeholder="2999" required min="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Sale Price (₹)</label>
                    <input type="number" value={form.discountedPrice} onChange={(e) => setForm({ ...form, discountedPrice: e.target.value })}
                      className="input-field" placeholder="1999" min="0" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Category *</label>
                    <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
                      className="input-field">
                      {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Fabric</label>
                    <input value={form.fabric} onChange={(e) => setForm({ ...form, fabric: e.target.value })}
                      className="input-field" placeholder="e.g. Pure Cotton" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Brand</label>
                    <input value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}
                      className="input-field" placeholder="Saanjh" />
                  </div>
                </div>

                {/* Size/Stock */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Size & Stock</label>
                  <div className="grid grid-cols-4 gap-2">
                    {form.sizes.map((s, i) => (
                      <div key={s.size} className="text-center">
                        <div className="text-xs text-gray-500 mb-1 font-medium">{s.size}</div>
                        <input type="number" value={s.stock} min="0"
                          onChange={(e) => {
                            const updated = [...form.sizes];
                            updated[i] = { ...updated[i], stock: parseInt(e.target.value) || 0 };
                            setForm({ ...form, sizes: updated });
                          }}
                          className="input-field py-2 text-center text-sm" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Occasion */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">Occasion</label>
                  <div className="flex flex-wrap gap-2">
                    {OCCASIONS.map((occ) => (
                      <button type="button" key={occ} onClick={() => toggleOccasion(occ)}
                        className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                          form.occasion.includes(occ)
                            ? 'bg-brand-700 text-white border-brand-700'
                            : 'border-gray-200 text-gray-600 hover:border-brand-300'
                        }`}>
                        {occ}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">Tags (comma-separated)</label>
                  <input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })}
                    className="input-field" placeholder="silk, wedding, traditional, zari" />
                </div>

                {/* Flags */}
                <div className="flex flex-wrap gap-4">
                  {[
                    { key: 'isFeatured', label: '⭐ Featured' },
                    { key: 'isNewArrival', label: '✨ New Arrival' },
                    { key: 'isTrending', label: '🔥 Trending' },
                  ].map(({ key, label }) => (
                    <label key={key} className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={form[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.checked })}
                        className="w-4 h-4 rounded accent-brand-700" />
                      <span className="text-sm font-medium text-gray-700">{label}</span>
                    </label>
                  ))}
                </div>

                {/* Image Upload */}
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                    Product Images {editProduct ? '(add more)' : ''}
                  </label>
                  {!uploadEnabled && uploadStatusLoaded && (
                    <div className="mb-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      Cloudinary upload is off. Paste one or more image URLs below and the product can still be saved normally.
                    </div>
                  )}
                  {uploadEnabled && uploadStatusLoaded && (
                    <div className="mb-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                      {uploadMode === 'local'
                        ? 'Image upload is enabled. Uploaded files will be stored locally and their image URLs will be saved in MongoDB.'
                        : 'Image upload is enabled with Cloudinary and saved image URLs will be stored in MongoDB.'}
                    </div>
                  )}
                  <label className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-6 transition-colors ${
                    uploadEnabled
                      ? 'border-gray-200 cursor-pointer hover:border-brand-300'
                      : 'border-gray-200 bg-gray-50 cursor-not-allowed opacity-70'
                  }`}>
                    <FiUpload size={24} className="text-gray-400 mb-2" />
                    <span className="text-sm text-gray-500">
                      {uploadEnabled ? 'Click to upload images' : 'Image upload unavailable'}
                    </span>
                    <span className="text-xs text-gray-400 mt-1">
                      {uploadEnabled
                        ? (uploadMode === 'local' ? 'JPG, PNG, WebP up to 5MB each. Stored on your server.' : 'JPG, PNG, WebP up to 5MB each')
                        : 'Add Cloudinary keys to enable uploads'}
                    </span>
                    <input type="file" accept="image/*" multiple className="hidden" disabled={!uploadEnabled}
                      onChange={(e) => setImages(Array.from(e.target.files))} />
                  </label>
                  <div className="mt-3">
                    <label className="block text-xs font-semibold text-gray-600 mb-1.5 uppercase tracking-wider">
                      Image URLs
                    </label>
                    <textarea
                      value={form.imageUrls}
                      onChange={(e) => setForm({ ...form, imageUrls: e.target.value })}
                      className="input-field resize-none"
                      rows={4}
                      placeholder={'https://example.com/image-1.jpg\nhttps://example.com/image-2.jpg'}
                    />
                    <p className="mt-1 text-xs text-gray-400">Add one image URL per line. These work even when Cloudinary is not configured.</p>
                  </div>
                  {images.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {images.map((img, i) => (
                        <div key={i} className="relative w-16 h-20">
                          <img src={URL.createObjectURL(img)} alt="" className="w-full h-full object-cover rounded-lg" />
                          <button type="button" onClick={() => setImages(images.filter((_, j) => j !== i))}
                            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center text-xs">×</button>
                        </div>
                      ))}
                    </div>
                  )}
                  {editProduct?.images?.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {editProduct.images.map((img, i) => (
                        <img key={i} src={img.url} alt="" className="w-16 h-20 object-cover rounded-lg opacity-70" />
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 pt-2 sticky bottom-0 bg-white pb-2">
                  <button type="button" onClick={() => setModalOpen(false)} className="btn-outline flex-1 py-3">Cancel</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                    {saving ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Saving...</> : (editProduct ? 'Update Product' : 'Create Product')}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
