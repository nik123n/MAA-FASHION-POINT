import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiHeart, FiShoppingBag, FiStar } from 'react-icons/fi';
import { useDispatch, useSelector } from 'react-redux';
import { toggleWishlist } from '../../store/slices/allSlices';
import { addToCart } from '../../store/slices/allSlices';
import toast from 'react-hot-toast';

const FALLBACK_IMAGE = 'https://via.placeholder.com/400x533?text=No+Image';

export default function ProductCard({ product, index = 0 }) {
  const dispatch = useDispatch();
  const { items: wishlist } = useSelector((s) => s.wishlist);
  const { token } = useSelector((s) => s.auth);
  const [imgIdx, setImgIdx] = useState(0);

  const isWishlisted = wishlist?.some(
    (w) => (typeof w === 'string' ? w : w._id) === product._id
  );

  const discount = product.discountPercent ||
    (product.discountedPrice ? Math.round(((product.price - product.discountedPrice) / product.price) * 100) : 0);

  const handleWishlist = (e) => {
    e.preventDefault();
    if (!token) { toast.error('Please login to add to wishlist'); return; }
    dispatch(toggleWishlist(product._id));
  };

  const handleQuickAdd = (e) => {
    e.preventDefault();
    if (!token) { toast.error('Please login to add to cart'); return; }
    const firstAvailable = product.sizes?.find((s) => s.stock > 0);
    if (!firstAvailable) { toast.error('Out of stock'); return; }
    dispatch(addToCart({ productId: product._id, quantity: 1, size: firstAvailable.size }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
    >
      <Link to={`/products/${product._id}`} className="group block h-full">
        <div className="relative overflow-hidden rounded-t-xl bg-gray-100">
          {/* Image */}
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={product.images?.[imgIdx]?.url || product.images?.[0]?.url || FALLBACK_IMAGE}
              alt={product.name}
              className="product-card-img"
              onError={(e) => { e.target.src = FALLBACK_IMAGE; }}
            />
          </div>

          {/* Image dots for multiple images */}
          {product.images?.length > 1 && (
            <div className="absolute bottom-16 left-0 right-0 flex justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              {product.images.slice(0, 4).map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => { e.preventDefault(); setImgIdx(i); }}
                  className={`w-1.5 h-1.5 rounded-full transition-all ${i === imgIdx ? 'bg-white w-3' : 'bg-white/60'}`}
                />
              ))}
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {discount > 0 && (
              <span className="badge bg-accent-500 text-white text-[10px] font-semibold px-2 py-0.5 shadow-sm">-{discount}%</span>
            )}
            {product.isNewArrival && (
              <span className="badge bg-emerald-500 text-white text-[11px] font-semibold">NEW</span>
            )}
            {product.isTrending && (
              <span className="badge bg-amber-500 text-white text-[11px] font-semibold">🔥 HOT</span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={handleWishlist}
            className={`absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center transition-all bg-white shadow-sm z-10 ${
              isWishlisted ? 'text-accent-500' : 'text-gray-400'
            }`}
          >
            <FiHeart size={14} fill={isWishlisted ? 'currentColor' : 'none'} />
          </button>

          {/* Quick Add */}
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm text-brand-700 py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-200 hover:bg-brand-700 hover:text-white"
          >
            <FiShoppingBag size={15} /> Quick Add
          </button>
        </div>

        {/* Info */}
        <div className="pt-2 px-2 pb-3 bg-white border-x border-b border-gray-100 rounded-b-xl flex flex-col justify-between flex-1">
          <div>
            <p className="text-[10px] text-gray-400 uppercase tracking-wide mb-0.5">{product.category}</p>
            <h3 className="text-[13px] font-medium text-gray-800 line-clamp-1 group-hover:text-accent-600 transition-colors">
              {product.name}
            </h3>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-gray-900 text-[14px]">
                  ₹{(product.discountedPrice || product.price).toLocaleString()}
                </span>
              </div>
              {product.discountedPrice && (
                <span className="text-[11px] text-gray-400 line-through">₹{product.price.toLocaleString()}</span>
              )}
            </div>
            {product.rating > 0 ? (
              <div className="flex items-center gap-0.5 bg-green-600 text-white px-1.5 py-0.5 rounded text-[10px] font-bold">
                {product.rating.toFixed(1)} <FiStar size={10} className="fill-current" />
              </div>
            ) : (
              <div className="flex items-center gap-0.5 bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px] font-medium">
                New
              </div>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// Skeleton Card
export function ProductCardSkeleton() {
  return (
    <div>
      <div className="aspect-[3/4] skeleton rounded-2xl" />
      <div className="pt-3 space-y-2">
        <div className="skeleton h-3 w-16 rounded" />
        <div className="skeleton h-4 w-full rounded" />
        <div className="skeleton h-4 w-3/4 rounded" />
        <div className="skeleton h-5 w-24 rounded" />
      </div>
    </div>
  );
}
