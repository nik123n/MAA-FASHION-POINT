import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { FiHeart } from 'react-icons/fi';
import { fetchWishlist } from '../store/slices/allSlices';
import ProductCard from '../components/product/ProductCard';

export default function WishlistPage() {
  const dispatch = useDispatch();
  const { items } = useSelector((s) => s.wishlist);
  const { token } = useSelector((s) => s.auth);

  useEffect(() => { if (token) dispatch(fetchWishlist()); }, [token, dispatch]);

  if (!token) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <FiHeart size={64} className="text-gray-200 mb-4" />
        <h2 className="font-display text-2xl text-gray-700 mb-2">Your wishlist awaits</h2>
        <p className="text-gray-500 mb-6">Login to save your favourite items</p>
        <Link to="/auth/login" className="btn-primary">Login</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <FiHeart size={64} className="text-gray-200 mb-4" />
        <h2 className="font-display text-2xl text-gray-700 mb-2">Wishlist is empty</h2>
        <p className="text-gray-500 mb-6">Save items you love and shop them later</p>
        <Link to="/products" className="btn-primary">Explore Products</Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl mb-8">My Wishlist <span className="text-gray-400 text-xl">({items.length})</span></h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
        {items.map((p, i) => typeof p === 'object' && p._id ? (
          <ProductCard key={p._id} product={p} index={i} />
        ) : null)}
      </div>
    </div>
  );
}
