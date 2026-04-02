import React from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import BrandLogo from './BrandLogoNew';

export default function BrandedFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#19204a] text-gray-200 pt-16 pb-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,187,46,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(225,38,28,0.12),transparent_22%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <BrandLogo className="mb-4" />
            <p className="text-sm text-brand-100/80 leading-relaxed mb-5">
              A boutique space for every woman, blending tradition, comfort, and everyday confidence with a fresh local identity.
            </p>
            <div className="flex gap-3">
              {[FiInstagram, FiFacebook, FiTwitter, FiYoutube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-white/10 hover:bg-leaf-600 rounded-full flex items-center justify-center transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-display text-white text-lg mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {['3 Piece', '3 Piece Pair', 'Short Top', '2 Piece', 'Tunic Top', 'Cotton Tunic Top', 'Long Top', 'Cord Set', 'Plazo Pair', 'Kurti Plaza Dupata', 'Kurti Pent Dupata', 'Cotton Straight Pent'].map((cat) => (
                <li key={cat}>
                  <Link to={`/products?category=${cat}`} className="text-sm text-brand-100/80 hover:text-leaf-300 transition-colors">{cat}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-white text-lg mb-4">Account</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'My Account', to: '/profile' },
                { label: 'My Orders', to: '/orders' },
                { label: 'Wishlist', to: '/wishlist' },
                { label: 'Shopping Cart', to: '/cart' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-brand-100/80 hover:text-leaf-300 transition-colors">{item.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-display text-white text-lg mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-brand-100/80">
                <FiMapPin size={15} className="mt-0.5 text-leaf-400 shrink-0" />
                near bageshwar mandir, Amarpara, Bagasara, Gujarat 365440
              </li>
              <li className="flex items-center gap-3 text-sm text-brand-100/80">
                <FiPhone size={15} className="text-leaf-400" />
                +91 75674 73009
              </li>
              <li className="flex items-center gap-3 text-sm text-brand-100/80">
                <FiPhone size={15} className="text-leaf-400" />
                +91 88660 28038
              </li>
              <li className="flex items-center gap-3 text-sm text-brand-100/80">
                <FiMail size={15} className="text-leaf-400" />
                maafashtionpoint@gmail.com
              </li>
            </ul>
            <div className="mt-5">
              <p className="text-xs text-brand-100/60 mb-2 uppercase tracking-[0.2em]">Newsletter</p>
              <div className="flex">
                <input type="email" placeholder="your@email.com" className="flex-1 bg-white/10 border border-white/10 rounded-l-full px-3 py-2 text-sm text-white placeholder-gray-400 focus:outline-none focus:border-leaf-400" />
                <button className="bg-coral-600 hover:bg-coral-700 text-white px-4 py-2 rounded-r-full text-sm transition-colors">Subscribe</button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-brand-100/60">Copyright 2026 MAA Fashion Point. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Razorpay_logo.png" alt="Razorpay" className="h-5 opacity-60" />
            <span className="text-xs text-brand-100/60">Secure Payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
