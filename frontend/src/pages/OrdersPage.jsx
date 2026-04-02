import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiPackage, FiChevronRight } from 'react-icons/fi';
import { fetchMyOrders, fetchOrder } from '../store/slices/allSlices';

const STATUS_COLORS = {
  placed: 'bg-blue-100 text-blue-700',
  confirmed: 'bg-indigo-100 text-indigo-700',
  processing: 'bg-amber-100 text-amber-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
  returned: 'bg-gray-100 text-gray-700',
};

export function OrdersPage() {
  const dispatch = useDispatch();
  const { orders } = useSelector((s) => s.orders);

  useEffect(() => { dispatch(fetchMyOrders()); }, [dispatch]);

  if (orders.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <FiPackage size={64} className="mx-auto text-gray-300 mb-4" />
        <h2 className="font-display text-2xl text-gray-700 mb-2">No orders yet</h2>
        <p className="text-gray-500 mb-6">Your order history will appear here</p>
        <Link to="/products" className="btn-primary">Start Shopping</Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <h1 className="font-display text-3xl mb-8">My Orders</h1>
      <div className="space-y-4">
        {orders.map((order, i) => (
          <motion.div key={order._id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Link to={`/orders/${order._id}`} className="block bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3">
                  {order.items?.[0]?.image && (
                    <img src={order.items[0].image} alt="" className="w-16 h-20 object-cover rounded-xl" />
                  )}
                  <div>
                    <p className="text-xs text-gray-400 mb-1">
                      Order #{order.orderNumber} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                    <p className="font-medium text-gray-800 text-sm line-clamp-1">
                      {order.items?.[0]?.name} {order.items?.length > 1 && `+ ${order.items.length - 1} more`}
                    </p>
                    <p className="font-bold text-brand-700 mt-1">₹{order.pricing?.total?.toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`badge px-3 py-1 capitalize font-semibold ${STATUS_COLORS[order.orderStatus] || 'bg-gray-100 text-gray-600'}`}>
                    {order.orderStatus}
                  </span>
                  <FiChevronRight size={18} className="text-gray-400" />
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function OrderDetailPage() {
  const { id } = useParams();
  const dispatch = useDispatch();
  const { order } = useSelector((s) => s.orders);

  useEffect(() => { dispatch(fetchOrder(id)); }, [id, dispatch]);

  if (!order) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin" />
    </div>
  );

  const steps = ['placed', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStep = steps.indexOf(order.orderStatus);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      <div className="flex items-center justify-between mb-8">
        <h1 className="font-display text-3xl">Order Details</h1>
        <span className={`badge px-3 py-1.5 capitalize font-semibold text-sm ${STATUS_COLORS[order.orderStatus] || ''}`}>
          {order.orderStatus}
        </span>
      </div>

      {/* Progress tracker */}
      {!['cancelled', 'returned'].includes(order.orderStatus) && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, i) => (
              <React.Fragment key={step}>
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    i <= currentStep ? 'bg-brand-700 text-white' : 'bg-gray-200 text-gray-400'
                  }`}>{i + 1}</div>
                  <span className={`text-[10px] mt-1 capitalize font-medium ${i <= currentStep ? 'text-brand-700' : 'text-gray-400'}`}>{step}</span>
                </div>
                {i < steps.length - 1 && (
                  <div className={`h-0.5 flex-1 mx-1 mb-4 ${i < currentStep ? 'bg-brand-700' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Items */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold mb-4">Items ({order.items?.length})</h3>
          <div className="space-y-3">
            {order.items?.map((item) => (
              <div key={item._id} className="flex gap-3">
                <img src={item.image} alt={item.name} className="w-16 h-20 object-cover rounded-xl" />
                <div>
                  <p className="font-medium text-sm">{item.name}</p>
                  <p className="text-xs text-gray-400">Size: {item.size} · Qty: {item.quantity}</p>
                  <p className="font-semibold text-brand-700 text-sm mt-1">₹{(item.price * item.quantity).toLocaleString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold mb-3">Delivery Address</h3>
          <p className="text-sm text-gray-700">{order.shippingAddress?.fullName}</p>
          <p className="text-sm text-gray-500">{order.shippingAddress?.phone}</p>
          <p className="text-sm text-gray-500 mt-1">{order.shippingAddress?.street}, {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}</p>
        </div>

        {/* Pricing */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <h3 className="font-semibold mb-3">Price Summary</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600"><span>Subtotal</span><span>₹{order.pricing?.subtotal?.toLocaleString()}</span></div>
            <div className="flex justify-between text-gray-600"><span>Shipping</span><span>{order.pricing?.shipping === 0 ? 'FREE' : `₹${order.pricing?.shipping}`}</span></div>
            <div className="flex justify-between text-gray-600"><span>Tax</span><span>₹{order.pricing?.tax?.toLocaleString()}</span></div>
            {order.pricing?.discount > 0 && <div className="flex justify-between text-green-600"><span>Discount</span><span>-₹{order.pricing?.discount?.toLocaleString()}</span></div>}
            <div className="flex justify-between font-bold text-base pt-2 border-t border-gray-100">
              <span>Total</span><span className="text-brand-700">₹{order.pricing?.total?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrdersPage;
