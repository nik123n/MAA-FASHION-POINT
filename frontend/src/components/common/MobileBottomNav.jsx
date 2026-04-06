import React from 'react';
import { NavLink } from 'react-router-dom';
import { FiHome, FiGrid, FiShoppingCart, FiTag, FiUser } from 'react-icons/fi';
import { useSelector } from 'react-redux';

export default function MobileBottomNav() {
  const { totalQuantity } = useSelector((state) => state.cart);

  const navItems = [
    { name: 'Home', path: '/', icon: <FiHome className="w-6 h-6" /> },
    { name: 'Categories', path: '/products', icon: <FiGrid className="w-6 h-6" /> },
    { 
      name: 'Cart', 
      path: '/cart', 
      icon: (
        <div className="relative">
          <FiShoppingCart className="w-6 h-6" />
          {totalQuantity > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-accent-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {totalQuantity > 99 ? '99+' : totalQuantity}
            </span>
          )}
        </div>
      ) 
    },
    { name: 'Offers', path: '/products?discount=true', icon: <FiTag className="w-6 h-6" /> },
    { name: 'Profile', path: '/profile', icon: <FiUser className="w-6 h-6" /> },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-gray-200 z-[60] pb-safe shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-16">
        {navItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center w-full h-full space-y-1 transition-colors ${
                isActive ? 'text-accent-600' : 'text-gray-500 hover:text-gray-900'
              }`
            }
          >
            {item.icon}
            <span className="text-[10px] font-medium">{item.name}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}
