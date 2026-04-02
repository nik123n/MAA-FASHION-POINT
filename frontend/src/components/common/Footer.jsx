// Footer.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { FiInstagram, FiTwitter, FiFacebook, FiYoutube, FiMail, FiPhone, FiMapPin } from 'react-icons/fi';

export function Footer() {
  return (
    <footer className="bg-[#1e0e16] text-gray-300 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          {/* Brand */}
          <div>
            <div className="mb-4">
              <span className="font-display text-3xl text-white">MAA</span>
              <span className="font-accent text-sm text-brand-300 block tracking-widest">FASHTION POINT </span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Celebrating the modern Indian woman — where tradition meets contemporary fashion. Every piece tells a story.
            </p>
            <div className="flex gap-3">
              {[FiInstagram, FiFacebook, FiTwitter, FiYoutube].map((Icon, i) => (
                <a key={i} href="#" className="w-9 h-9 bg-white/10 hover:bg-brand-700 rounded-full flex items-center justify-center transition-colors">
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-white text-lg mb-4">Shop</h4>
            <ul className="space-y-2.5">
              {['3 Piece', '3 Piece Pair', 'Short Top', '2 Piece', 'Tunic Top', 'Cotton Tunic Top', 'Long Top', 'Cord Set', 'Plazo Pair', 'Kurti Plaza Dupata', 'Kurti Pent Dupata', 'Cotton Straight Pent'].map((cat) => (
                <li key={cat}>
                  <Link to={`/products?category=${cat}`} className="text-sm text-gray-400 hover:text-brand-300 transition-colors">{cat}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h4 className="font-display text-white text-lg mb-4">Account</h4>
            <ul className="space-y-2.5">
              {[
                { label: 'My Account', to: '/profile' },
                { label: 'My Orders', to: '/orders' },
                { label: 'Wishlist', to: '/wishlist' },
                { label: 'Shopping Cart', to: '/cart' },
              ].map((l) => (
                <li key={l.label}>
                  <Link to={l.to} className="text-sm text-gray-400 hover:text-brand-300 transition-colors">{l.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display text-white text-lg mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-start gap-3 text-sm text-gray-400">
                <FiMapPin size={15} className="mt-0.5 text-brand-400 shrink-0" />
                near bageshwar mandir, Amarpara, Bagasara, Gujarat 365440
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <FiPhone size={15} className="text-brand-400" />
                +91 75674 73009
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <FiPhone size={15} className="text-brand-400" />
                +91 88660 28038
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <FiMail size={15} className="text-brand-400" />
                maafashtionpoint@gmail.com
              </li>
            </ul>
            <div className="mt-5">
              <p className="text-xs text-gray-500 mb-2">Newsletter</p>
              <div className="flex">
                <input type="email" placeholder="your@email.com" className="flex-1 bg-white/10 border border-white/10 rounded-l-full px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-500" />
                <button className="bg-brand-700 hover:bg-brand-600 text-white px-4 py-2 rounded-r-full text-sm transition-colors">Subscribe</button>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">© 2026 MAA FASHION POINT. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Razorpay_logo.png" alt="Razorpay" className="h-5 opacity-50 filter grayscale" />
            <span className="text-xs text-gray-500">Secure Payments</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
