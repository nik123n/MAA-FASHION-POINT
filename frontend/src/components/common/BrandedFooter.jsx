import React from 'react';
import { Link } from 'react-router-dom';
import { FiMail, FiPhone, FiMapPin, FiInstagram, FiFacebook } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import BrandLogo from './BrandLogoNew';

export default function BrandedFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#19204a] text-gray-200 pt-16 pb-24 md:pb-8 border-t-[6px] border-leaf-500 pb-safe">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(103,187,46,0.18),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(225,38,28,0.12),transparent_22%)]" />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-12">
          {/* About Section */}
          <div className="flex flex-col">
            <BrandLogo className="mb-4" />
            <p className="text-sm text-brand-100/80 leading-relaxed mb-6 mt-4">
              A boutique space for every woman, blending tradition, comfort, and everyday confidence with a fresh local identity.
            </p>
            <div className="flex gap-4">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-pink-600 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg group">
                <FiInstagram size={18} className="group-hover:text-white text-brand-100" />
              </a>
              <a href="https://wa.me/917567473009" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-green-500 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg group">
                <FaWhatsapp size={18} className="group-hover:text-white text-brand-100" />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 bg-white/10 hover:bg-blue-600 rounded-full flex items-center justify-center transition-all hover:scale-110 shadow-lg group">
                <FiFacebook size={18} className="group-hover:text-white text-brand-100" />
              </a>
            </div>
          </div>

          {/* Quick Links Section */}
          <div>
            <h4 className="font-display text-white text-lg mb-6 border-b border-white/10 pb-2 inline-block">Quick Links</h4>
            <ul className="grid grid-cols-2 gap-y-3 gap-x-6">
              {[
                { label: 'Shop New Arrivals', to: '/products?isNewArrival=true' },
                { label: 'Trending Collection', to: '/products?isTrending=true' },
                { label: 'All Products', to: '/products' },
                { label: 'My Profile', to: '/profile' },
                { label: 'Track Orders', to: '/orders' },
                { label: 'Wishlist', to: '/wishlist' },
                { label: 'Shopping Cart', to: '/cart' },
              ].map((item) => (
                <li key={item.label}>
                  <Link to={item.to} className="text-sm text-brand-100/80 hover:text-white hover:translate-x-1 transition-all flex items-center gap-2">
                    <span className="w-1 h-1 bg-leaf-400 rounded-full"></span>
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Section */}
          <div>
            <h4 className="font-display text-white text-lg mb-6 border-b border-white/10 pb-2 inline-block">Contact</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-4 text-sm text-brand-100/80 group">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-leaf-500 transition-colors">
                  <FiMapPin size={15} className="text-leaf-400 group-hover:text-white transition-colors" />
                </div>
                <span className="mt-1 leading-snug">Near Bageshwar Mandir, Amarpara,<br/>Bagasara, Gujarat 365440</span>
              </li>
              <li className="flex items-center gap-4 text-sm text-brand-100/80 group">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-leaf-500 transition-colors">
                  <FiPhone size={15} className="text-leaf-400 group-hover:text-white transition-colors" />
                </div>
                <span>+91 75674 73009 <span className="opacity-50 mx-1">|</span> +91 88660 28038</span>
              </li>
              <li className="flex items-center gap-4 text-sm text-brand-100/80 group">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-leaf-500 transition-colors">
                  <FiMail size={15} className="text-leaf-400 group-hover:text-white transition-colors" />
                </div>
                <span>maafashtionpoint@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-brand-100/60 font-medium tracking-wide">© 2026 MAA Fashion Point. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="text-xs text-brand-100/60 font-medium">Secured by</span>
            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a4/Razorpay_logo.png" alt="Razorpay" className="h-4 opacity-70 grayscale hover:grayscale-0 transition-all" />
          </div>
        </div>
      </div>
    </footer>
  );
}
