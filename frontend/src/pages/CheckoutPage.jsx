import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiCheck, FiTag, FiCreditCard, FiMapPin } from 'react-icons/fi';
import { placeOrder, clearCart } from '../store/slices/allSlices';
import api from '../utils/api';
import toast from 'react-hot-toast';

const INDIAN_STATES = [
  'Andhra Pradesh','Arunachal Pradesh','Assam','Bihar','Chhattisgarh','Goa','Gujarat',
  'Haryana','Himachal Pradesh','Jharkhand','Karnataka','Kerala','Madhya Pradesh',
  'Maharashtra','Manipur','Meghalaya','Mizoram','Nagaland','Odisha','Punjab',
  'Rajasthan','Sikkim','Tamil Nadu','Telangana','Tripura','Uttar Pradesh',
  'Uttarakhand','West Bengal','Delhi','Jammu & Kashmir',
];

const steps = ['Address', 'Review', 'Payment'];

export default function CheckoutPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart } = useSelector((s) => s.cart);
  const { user } = useSelector((s) => s.auth);

  const [step, setStep] = useState(0);
  const [payLoading, setPayLoading] = useState(false);
  const [couponCode, setCouponCode] = useState('');
  const [couponData, setCouponData] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const [address, setAddress] = useState(() => {
    const def = user?.addresses?.find((a) => a.isDefault) || user?.addresses?.[0];
    return def || { fullName: user?.name || '', phone: user?.phone || '', street: '', city: '', state: '', pincode: '' };
  });

  const items = cart?.items || [];
  const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
  const shipping = subtotal > 999 ? 0 : 79;
  const tax = Math.round(subtotal * 0.05);
  const discount = couponData?.discount || 0;
  const total = subtotal + shipping + tax - discount;

  const handleAddressChange = (e) => setAddress({ ...address, [e.target.name]: e.target.value });

  const applyCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', { code: couponCode, cartTotal: subtotal });
      setCouponData(data);
      toast.success(data.message);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      setCouponData(null);
    } finally { setCouponLoading(false); }
  };

  const handleRazorpay = async () => {
    setPayLoading(true);
    try {
      // 1. Place order
      const orderResult = await dispatch(placeOrder({
        shippingAddress: address,
        paymentMethod: 'razorpay',
        coupon: couponData,
      })).unwrap();

      const order = orderResult.order;

      // 2. Create Razorpay order
      const { data: rzp } = await api.post('/payments/create-order', { orderId: order._id });

      // 3. Open Razorpay checkout
      const options = {
        key: rzp.keyId,
        amount: rzp.amount,
        currency: rzp.currency,
        name: 'Saanjh Boutique',
        description: `Order #${order.orderNumber}`,
        order_id: rzp.razorpayOrderId,
        prefill: { name: user?.name, email: user?.email, contact: user?.phone },
        theme: { color: '#c8496a' },
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              ...response,
              orderId: order._id,
            });
            dispatch(clearCart());
            navigate(`/order-success/${order._id}`);
          } catch {
            toast.error('Payment verification failed. Contact support.');
            setPayLoading(false);
          }
        },
        modal: { ondismiss: () => { toast.error('Payment cancelled'); setPayLoading(false); } },
      };

      const rzpInstance = new window.Razorpay(options);
      rzpInstance.open();
    } catch (err) {
      toast.error(err?.message || 'Checkout failed');
      setPayLoading(false);
    }
  };

  if (items.length === 0) {
    navigate('/cart');
    return null;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="font-display text-3xl mb-8">Checkout</h1>

      {/* Steps */}
      <div className="flex items-center justify-center gap-0 mb-10">
        {steps.map((s, i) => (
          <React.Fragment key={s}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all ${
                i < step ? 'bg-green-500 text-white' : i === step ? 'bg-brand-700 text-white ring-4 ring-brand-200' : 'bg-gray-200 text-gray-500'
              }`}>
                {i < step ? <FiCheck size={16} /> : i + 1}
              </div>
              <span className={`text-xs mt-1.5 font-medium ${i === step ? 'text-brand-700' : 'text-gray-400'}`}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div className={`h-0.5 w-16 sm:w-24 mb-4 mx-1 transition-all ${i < step ? 'bg-green-500' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2">
          {/* Step 0 — Address */}
          {step === 0 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <FiMapPin className="text-brand-600" /> Delivery Address
                </h2>
                {user?.addresses?.length > 0 && (
                  <div className="mb-5 space-y-2">
                    {user.addresses.map((addr) => (
                      <label key={addr._id} className="flex items-start gap-3 p-3 border rounded-xl cursor-pointer hover:border-brand-300 transition-colors">
                        <input type="radio" name="savedAddr" className="mt-1 accent-brand-700"
                          onChange={() => setAddress({ fullName: addr.fullName, phone: addr.phone, street: addr.street, city: addr.city, state: addr.state, pincode: addr.pincode })}
                        />
                        <div className="text-sm">
                          <p className="font-medium">{addr.fullName}</p>
                          <p className="text-gray-500">{addr.street}, {addr.city}, {addr.state} - {addr.pincode}</p>
                        </div>
                      </label>
                    ))}
                    <p className="text-xs text-gray-400 mt-2">Or enter a new address below:</p>
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { name: 'fullName', label: 'Full Name', full: true },
                    { name: 'phone', label: 'Phone Number' },
                    { name: 'street', label: 'Street / Apartment', full: true },
                    { name: 'city', label: 'City' },
                    { name: 'pincode', label: 'Pincode' },
                  ].map(({ name, label, full }) => (
                    <div key={name} className={full ? 'sm:col-span-2' : ''}>
                      <label className="block text-xs font-medium text-gray-600 mb-1">{label}</label>
                      <input name={name} value={address[name] || ''} onChange={handleAddressChange}
                        className="input-field" placeholder={label} />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">State</label>
                    <select name="state" value={address.state} onChange={handleAddressChange} className="input-field">
                      <option value="">Select State</option>
                      {INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const required = ['fullName', 'phone', 'street', 'city', 'state', 'pincode'];
                    if (required.some((f) => !address[f])) { toast.error('Please fill all address fields'); return; }
                    setStep(1);
                  }}
                  className="btn-primary w-full mt-6"
                >
                  Continue to Review
                </button>
              </div>
            </motion.div>
          )}

          {/* Step 1 — Review */}
          {step === 1 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-semibold text-lg mb-5">Review Order</h2>
                <div className="space-y-3 mb-6">
                  {items.map((item) => (
                    <div key={item._id} className="flex gap-3">
                      <img src={item.product?.images?.[0]?.url} alt={item.product?.name} className="w-16 h-20 object-cover rounded-xl" />
                      <div className="flex-1">
                        <p className="text-sm font-medium line-clamp-1">{item.product?.name}</p>
                        <p className="text-xs text-gray-400">Size: {item.size} · Qty: {item.quantity}</p>
                        <p className="text-sm font-semibold text-brand-700 mt-1">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="border-t border-gray-100 pt-4 mb-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <FiTag size={14} /> Apply Coupon
                  </p>
                  <div className="flex gap-2">
                    <input value={couponCode} onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter coupon code" className="input-field py-2.5 text-sm uppercase" />
                    <button onClick={applyCoupon} disabled={couponLoading}
                      className="bg-brand-700 text-white px-4 rounded-xl text-sm font-medium hover:bg-brand-800 transition-colors disabled:opacity-60 whitespace-nowrap">
                      {couponLoading ? '...' : 'Apply'}
                    </button>
                  </div>
                  {couponData && (
                    <p className="text-sm text-green-600 mt-2 font-medium">✅ {couponData.message}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {['WELCOME20', 'FLAT200', 'SAANJH10'].map((code) => (
                      <button key={code} onClick={() => setCouponCode(code)}
                        className="text-xs px-2.5 py-1 bg-brand-50 text-brand-700 rounded-full hover:bg-brand-100 transition-colors font-mono">
                        {code}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button onClick={() => setStep(0)} className="btn-outline flex-1 py-3">← Back</button>
                  <button onClick={() => setStep(2)} className="btn-primary flex-1 py-3">Continue to Payment →</button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2 — Payment */}
          {step === 2 && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
                <h2 className="font-semibold text-lg mb-5 flex items-center gap-2">
                  <FiCreditCard className="text-brand-600" /> Payment
                </h2>
                <div className="bg-gradient-to-br from-brand-50 to-rose-50 border border-brand-200 rounded-2xl p-5 mb-6">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-brand-700 rounded-full flex items-center justify-center">
                      <FiCreditCard size={18} className="text-white" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">Pay with Razorpay <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded ml-1 tracking-widest uppercase align-middle border border-red-200">Test Mode</span></p>
                      <p className="text-xs text-gray-500">Cards, UPI, Wallets, Net Banking</p>
                    </div>
                  </div>
                  <p className="text-[11px] text-gray-500 mb-4">Your payment is secured by Razorpay's 256-bit SSL encryption</p>
                  
                  <div className="bg-white/90 rounded-xl p-3 border border-brand-200 shadow-sm">
                    <p className="text-xs font-bold text-gray-700 mb-2 uppercase tracking-wide">Test Credentials</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-gray-400 block mb-0.5 uppercase tracking-wider">Card Number</span>
                        <code className="font-mono text-brand-700 font-semibold tracking-wider">4111 1111 1111 1111</code>
                      </div>
                      <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100">
                        <span className="text-[10px] text-gray-400 block mb-0.5 uppercase tracking-wider">CVV / Expiry</span>
                        <code className="font-mono text-brand-700 font-semibold tracking-wider">123 / Any Future</code>
                      </div>
                      <div className="bg-gray-50/50 p-2 rounded-lg border border-gray-100 col-span-2">
                        <span className="text-[10px] text-gray-400 block mb-0.5 uppercase tracking-wider">Test UPI ID</span>
                        <code className="font-mono text-brand-700 font-semibold tracking-wider">success@razorpay</code>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 text-sm text-gray-600 bg-gray-50 rounded-xl p-4 mb-6">
                  <p className="font-semibold text-gray-800 mb-2">Delivery to:</p>
                  <p>{address.fullName} · {address.phone}</p>
                  <p>{address.street}, {address.city}, {address.state} - {address.pincode}</p>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="btn-outline flex-1 py-3">← Back</button>
                  <button onClick={handleRazorpay} disabled={payLoading}
                    className="btn-primary flex-1 py-3 flex items-center justify-center gap-2">
                    {payLoading ? (
                      <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</>
                    ) : (<>Pay ₹{total.toLocaleString()} →</>)}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm sticky top-24">
            <h3 className="font-semibold mb-4">Price Details</h3>
            <div className="space-y-2.5 text-sm border-b border-gray-100 pb-4 mb-4">
              <div className="flex justify-between text-gray-600"><span>Subtotal ({items.length} items)</span><span>₹{subtotal.toLocaleString()}</span></div>
              <div className="flex justify-between text-gray-600"><span>Shipping</span><span className={shipping === 0 ? 'text-green-600' : ''}>{shipping === 0 ? 'FREE' : `₹${shipping}`}</span></div>
              <div className="flex justify-between text-gray-600"><span>GST (5%)</span><span>₹{tax.toLocaleString()}</span></div>
              {discount > 0 && <div className="flex justify-between text-green-600"><span>Coupon Discount</span><span>-₹{discount.toLocaleString()}</span></div>}
            </div>
            <div className="flex justify-between font-bold text-base">
              <span>Total Amount</span><span className="text-brand-700">₹{total.toLocaleString()}</span>
            </div>
            {discount > 0 && <p className="text-xs text-green-600 mt-2">🎉 You're saving ₹{discount.toLocaleString()} on this order!</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
