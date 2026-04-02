import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import {
  FiHeart, FiShoppingBag, FiStar, FiTruck, FiRefreshCw,
  FiChevronLeft, FiChevronRight, FiShare2,
} from 'react-icons/fi';
import { fetchProduct, fetchRecommendations, addToCart, toggleWishlist } from '../store/slices/allSlices';
import ProductCard from '../components/product/ProductCard';
import toast from 'react-hot-toast';

const FALLBACK_IMAGE = 'https://via.placeholder.com/800x1000?text=No+Image';

export default function ProductDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { product, recommendations, loading } = useSelector((s) => s.products);
  const { items: wishlist } = useSelector((s) => s.wishlist);
  const { token } = useSelector((s) => s.auth);

  const [activeImg, setActiveImg] = useState(0);
  const [selectedSize, setSelectedSize] = useState('');
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('details');

  useEffect(() => {
    dispatch(fetchProduct(id));
    dispatch(fetchRecommendations(id));
    setActiveImg(0);
    setSelectedSize('');
  }, [id, dispatch]);

  if (loading || !product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            <div className="skeleton aspect-square rounded-2xl" />
            <div className="flex gap-2">
              {Array(4).fill(0).map((_, i) => <div key={i} className="skeleton w-20 h-20 rounded-xl" />)}
            </div>
          </div>
          <div className="space-y-4 pt-4">
            {Array(6).fill(0).map((_, i) => <div key={i} className={`skeleton h-${i === 0 ? 8 : 4} rounded`} />)}
          </div>
        </div>
      </div>
    );
  }

  const isWishlisted = wishlist?.some((w) => (typeof w === 'string' ? w : w._id) === product._id);
  const discount = product.discountPercent || (product.discountedPrice
    ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) : 0);
  const selectedSizeObj = product.sizes?.find((s) => s.size === selectedSize);
  const maxQty = selectedSizeObj?.stock || 0;

  const handleAddToCart = async () => {
    if (!token) { toast.error('Please login to add to cart'); navigate('/auth/login'); return; }
    if (!selectedSize) { toast.error('Please select a size'); return; }
    try {
      await dispatch(addToCart({ productId: product._id, quantity: qty, size: selectedSize })).unwrap();
    } catch (_) {}
  };

  const handleBuyNow = async () => {
    if (!token) { navigate('/auth/login'); return; }
    if (!selectedSize) { toast.error('Please select a size'); return; }
    try {
      await dispatch(addToCart({ productId: product._id, quantity: qty, size: selectedSize })).unwrap();
      navigate('/cart');
    } catch (_) {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <button onClick={() => navigate(-1)} className="hover:text-brand-700 flex items-center gap-1">
          <FiChevronLeft size={16} /> Back
        </button>
        <span>/</span>
        <span className="text-brand-700">{product.category}</span>
        <span>/</span>
        <span className="text-gray-400 truncate max-w-[200px]">{product.name}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
        {/* ── IMAGE GALLERY ── */}
        <div className="space-y-3">
          <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-gray-100 group">
            <motion.img
              key={activeImg}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
              src={product.images?.[activeImg]?.url || product.images?.[0]?.url || FALLBACK_IMAGE}
              alt={product.name}
              className="w-full h-full object-cover object-top"
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
            />
            {/* Nav arrows */}
            {product.images?.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImg((i) => (i - 1 + product.images.length) % product.images.length)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <FiChevronLeft size={20} />
                </button>
                <button
                  onClick={() => setActiveImg((i) => (i + 1) % product.images.length)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/90 rounded-full flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
                >
                  <FiChevronRight size={20} />
                </button>
              </>
            )}
            {discount > 0 && (
              <div className="absolute top-4 left-4">
                <span className="badge bg-brand-600 text-white text-sm font-bold px-3 py-1">{discount}% OFF</span>
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {product.images?.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveImg(i)}
                  className={`shrink-0 w-20 h-24 rounded-xl overflow-hidden border-2 transition-all ${
                    i === activeImg ? 'border-brand-600 shadow-md' : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img.url || FALLBACK_IMAGE} alt="" className="w-full h-full object-cover" onError={(e) => { e.target.src = FALLBACK_IMAGE; }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── PRODUCT INFO ── */}
        <div className="py-2">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div>
              <p className="text-sm font-medium text-brand-600 mb-1">{product.brand} · {product.category}</p>
              <h1 className="font-display text-2xl sm:text-3xl text-gray-900 leading-tight">{product.name}</h1>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => { if (!token) { toast.error('Login to wishlist'); return; } dispatch(toggleWishlist(product._id)); }}
                className={`w-10 h-10 rounded-full border-2 flex items-center justify-center transition-all ${
                  isWishlisted ? 'border-brand-600 bg-brand-600 text-white' : 'border-gray-200 text-gray-500 hover:border-brand-400'
                }`}
              >
                <FiHeart size={18} fill={isWishlisted ? 'currentColor' : 'none'} />
              </button>
              <button
                onClick={() => { navigator.share?.({ title: product.name, url: window.location.href }); }}
                className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-brand-400 transition-all"
              >
                <FiShare2 size={16} />
              </button>
            </div>
          </div>

          {/* Rating */}
          {product.numReviews > 0 && (
            <div className="flex items-center gap-3 mb-4">
              <div className="flex items-center gap-1 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                <FiStar size={14} className="text-green-600 fill-current" />
                <span className="text-sm font-semibold text-green-700">{product.rating?.toFixed(1)}</span>
              </div>
              <span className="text-sm text-gray-500">{product.numReviews} reviews</span>
              <span className="text-sm text-gray-400">·</span>
              <span className="text-sm text-gray-500">{product.sold} sold</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-gray-100">
            <span className="font-display text-3xl font-bold text-gray-900">
              ₹{(product.discountedPrice || product.price).toLocaleString()}
            </span>
            {product.discountedPrice && (
              <>
                <span className="text-xl text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
                <span className="badge bg-green-100 text-green-700 font-semibold">You save ₹{(product.price - product.discountedPrice).toLocaleString()}</span>
              </>
            )}
          </div>

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div className="mb-5">
              <p className="text-sm font-semibold text-gray-700 mb-2">Colors</p>
              <div className="flex gap-2">
                {product.colors.map((c) => (
                  <div key={c.name} title={c.name}
                    className="w-7 h-7 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-110 transition-transform"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Size Selection */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-semibold text-gray-700">Select Size</p>
              <button className="text-xs text-brand-600 underline">Size Guide</button>
            </div>
            <div className="flex flex-wrap gap-2">
              {product.sizes?.map(({ size, stock }) => (
                <button
                  key={size}
                  disabled={stock === 0}
                  onClick={() => { setSelectedSize(size); setQty(1); }}
                  className={`relative px-4 py-2.5 border-2 rounded-xl text-sm font-medium transition-all ${
                    selectedSize === size
                      ? 'border-brand-600 bg-brand-600 text-white shadow-md'
                      : stock === 0
                      ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50'
                      : 'border-gray-200 text-gray-700 hover:border-brand-400 hover:text-brand-700'
                  }`}
                >
                  {size}
                  {stock === 0 && (
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="absolute w-full h-0.5 bg-gray-300 rotate-12" />
                    </span>
                  )}
                </button>
              ))}
            </div>
            {selectedSizeObj && selectedSizeObj.stock < 5 && selectedSizeObj.stock > 0 && (
              <p className="text-xs text-amber-600 mt-2 font-medium">⚠️ Only {selectedSizeObj.stock} left in this size!</p>
            )}
          </div>

          {/* Quantity */}
          <div className="flex items-center gap-4 mb-6">
            <p className="text-sm font-semibold text-gray-700">Qty</p>
            <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-semibold transition-colors"
              >−</button>
              <span className="px-4 py-2.5 text-sm font-semibold border-x border-gray-200 min-w-[3rem] text-center">{qty}</span>
              <button
                onClick={() => setQty((q) => Math.min(maxQty || 10, q + 1))}
                className="px-4 py-2.5 hover:bg-gray-50 text-gray-700 font-semibold transition-colors"
              >+</button>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="flex gap-3 mb-6">
            <button onClick={handleAddToCart} className="flex-1 btn-outline flex items-center justify-center gap-2">
              <FiShoppingBag size={18} /> Add to Cart
            </button>
            <button onClick={handleBuyNow} className="flex-1 btn-primary flex items-center justify-center gap-2">
              Buy Now
            </button>
          </div>

          {/* Delivery Info */}
          <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <FiTruck size={16} className="text-brand-600" />
              <span className="text-gray-600">Free delivery on orders above <strong>₹999</strong></span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <FiRefreshCw size={16} className="text-brand-600" />
              <span className="text-gray-600"><strong>7-day</strong> easy returns & exchanges</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── TABS: Details, Reviews ── */}
      <div className="mt-14">
        <div className="flex gap-1 border-b border-gray-200 mb-6">
          {['details', 'reviews'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-semibold capitalize transition-all ${
                tab === t ? 'text-brand-700 border-b-2 border-brand-700' : 'text-gray-500 hover:text-gray-700'
              }`}
            >{t}</button>
          ))}
        </div>

        {tab === 'details' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Product Description</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{product.description}</p>
              {product.occasion?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Occasion</p>
                  <div className="flex flex-wrap gap-2">
                    {product.occasion.map((o) => (
                      <span key={o} className="badge bg-brand-50 text-brand-700">{o}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800 mb-3">Product Details</h3>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {[
                    ['Fabric', product.fabric],
                    ['SKU', product.sku],
                    ['Return Policy', product.returnPolicy],
                    ['Brand', product.brand],
                  ].filter(([, v]) => v).map(([k, v]) => (
                    <tr key={k}>
                      <td className="py-2.5 text-gray-500 w-1/3">{k}</td>
                      <td className="py-2.5 text-gray-800 font-medium">{v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'reviews' && (
          <div>
            {product.reviews?.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <div className="text-4xl mb-3">⭐</div>
                <p>No reviews yet. Be the first to review!</p>
              </div>
            ) : (
              <div className="space-y-4">
                {product.reviews?.map((r) => (
                  <div key={r._id} className="bg-gray-50 rounded-2xl p-5">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
                        {r.name?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-gray-800">{r.name}</p>
                        <div className="flex">
                          {Array(5).fill(0).map((_, i) => (
                            <FiStar key={i} size={12} className={i < r.rating ? 'text-amber-400 fill-current' : 'text-gray-300'} />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{r.comment}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── AI RECOMMENDATIONS ── */}
      {recommendations?.length > 0 && (
        <section className="mt-16">
          <div className="mb-8">
            <p className="font-accent text-brand-600 italic text-lg mb-1">You May Also Like</p>
            <h2 className="font-display text-3xl text-gray-900">AI Recommendations</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {recommendations.slice(0, 4).map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </section>
      )}
    </div>
  );
}
