// OrderSuccessPage.jsx
import React, { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiPackage, FiArrowRight } from 'react-icons/fi';
import { fetchOrder } from '../store/slices/allSlices';
import { trackPurchase } from '../hooks/useAnalytics';

export function OrderSuccessPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { order } = useSelector((s) => s.orders);

  useEffect(() => { dispatch(fetchOrder(id)); }, [id, dispatch]);

  // Fire purchase analytics event once order data is loaded
  useEffect(() => { if (order) trackPurchase(order); }, [order]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        className="text-center max-w-lg">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <FiCheckCircle size={48} className="text-green-500" />
        </motion.div>
        <h1 className="font-display text-4xl text-gray-900 mb-3">Order Placed! 🎉</h1>
        <p className="text-gray-500 mb-2">Thank you for shopping with Saanjh Boutique</p>
        {order && (
          <div className="bg-brand-50 rounded-2xl p-5 my-6 text-left">
            <p className="text-sm font-semibold text-gray-700 mb-2">Order Details</p>
            <p className="text-xs text-gray-500">Order #<span className="font-mono font-bold text-brand-700">{order.orderNumber}</span></p>
            <p className="text-xs text-gray-500 mt-1">Total: <strong>₹{order.pricing?.total?.toLocaleString()}</strong></p>
            <p className="text-xs text-gray-500 mt-1">
              Expected delivery: <strong>{new Date(order.estimatedDelivery).toDateString()}</strong>
            </p>
            <p className="text-xs text-green-600 mt-2 font-medium">📧 Confirmation email sent!</p>
          </div>
        )}
        <div className="flex gap-3 justify-center">
          <Link to="/orders" className="btn-outline flex items-center gap-2">
            <FiPackage size={16} /> Track Order
          </Link>
          <Link to="/products" className="btn-primary flex items-center gap-2">
            Continue Shopping <FiArrowRight size={16} />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

export default OrderSuccessPage;
