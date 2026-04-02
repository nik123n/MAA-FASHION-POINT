// CartPage.jsx
import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTrash2, FiShoppingBag, FiArrowRight, FiTag } from 'react-icons/fi';
import { updateCartItem, removeFromCart } from '../store/slices/allSlices';

export function CartPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart, loading } = useSelector((s) => s.cart);
  const items = cart?.items || [];

  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 79;
  const total = subtotal + shipping;

  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="text-7xl mb-6">🛍️</div>
        <h2 className="font-display text-3xl text-gray-800 mb-3">Your cart is empty</h2>
        <p className="text-gray-500 mb-8">Explore our beautiful collections and find something you love!</p>
        <Link to="/products" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl mb-8">Shopping Cart <span className="text-gray-400 text-xl">({items.length} items)</span></h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          <AnimatePresence>
            {items.map((item) => (
              <motion.div key={item._id} layout exit={{ opacity: 0, x: -50 }}
                className="flex gap-4 bg-white rounded-2xl border border-gray-100 p-4 shadow-sm"
              >
                <Link to={`/products/${item.product?._id}`} className="shrink-0">
                  <img src={item.product?.images?.[0]?.url} alt={item.product?.name}
                    className="w-24 h-28 object-cover rounded-xl" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product?._id}`} className="font-medium text-gray-800 hover:text-brand-700 line-clamp-2 text-sm">
                    {item.product?.name}
                  </Link>
                  <p className="text-xs text-gray-400 mt-1">Size: {item.size}{item.color && ` · ${item.color}`}</p>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200 rounded-xl overflow-hidden">
                      <button onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity - 1 }))}
                        className="px-3 py-1.5 hover:bg-gray-50 text-gray-700 font-bold text-lg">−</button>
                      <span className="px-3 py-1.5 text-sm font-semibold border-x border-gray-200 min-w-[2.5rem] text-center">{item.quantity}</span>
                      <button onClick={() => dispatch(updateCartItem({ itemId: item._id, quantity: item.quantity + 1 }))}
                        className="px-3 py-1.5 hover:bg-gray-50 text-gray-700 font-bold text-lg">+</button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-gray-900">₹{(item.price * item.quantity).toLocaleString()}</span>
                      <button onClick={() => dispatch(removeFromCart(item._id))} className="text-red-400 hover:text-red-600 p-1.5 hover:bg-red-50 rounded-full transition-colors">
                        <FiTrash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm sticky top-24">
            <h2 className="font-display text-xl mb-4">Order Summary</h2>
            <div className="space-y-3 text-sm border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-medium' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span>
              </div>
              {subtotal < 999 && <p className="text-xs text-amber-600">Add ₹{(999 - subtotal).toLocaleString()} more for free shipping</p>}
            </div>
            <div className="flex justify-between font-bold text-lg mb-6">
              <span>Total</span><span>₹{total.toLocaleString()}</span>
            </div>
            <button onClick={() => navigate('/checkout')} className="btn-primary w-full flex items-center justify-center gap-2 py-3.5">
              Proceed to Checkout <FiArrowRight size={18} />
            </button>
            <Link to="/products" className="block text-center text-sm text-brand-600 mt-3 hover:text-brand-800">
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CartPage;
