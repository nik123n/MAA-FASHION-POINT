import React from 'react';
import { FiSliders, FiChevronDown, FiGrid, FiList } from 'react-icons/fi';

export default function FilterBar() {
  return (
    <div className="sticky top-16 lg:top-20 z-40 bg-white border-b border-gray-200 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-12">
          {/* Mobile Sort/Filter Grid */}
          <div className="flex w-full divide-x divide-gray-200 md:hidden">
            <button className="flex-1 flex items-center justify-center gap-2 text-[13px] font-medium text-gray-700 hover:text-accent-600 py-3">
              <FiSliders size={16} /> Filter
            </button>
            <button className="flex-1 flex items-center justify-center gap-2 text-[13px] font-medium text-gray-700 hover:text-accent-600 py-3">
              Sort By <FiChevronDown size={14} />
            </button>
          </div>

          {/* Desktop Filters */}
          <div className="hidden md:flex flex-1 items-center gap-6 overflow-x-auto scrollbar-hide py-3">
             <button className="flex items-center gap-2 text-sm font-semibold text-gray-800 bg-gray-50 hover:bg-gray-100 px-4 py-1.5 rounded-full border border-gray-200">
              <FiSliders size={16} /> Filters
            </button>
            {['Brand', 'Size', 'Color', 'Price', 'Pattern'].map(filter => (
              <button key={filter} className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 font-medium whitespace-nowrap">
                {filter} <FiChevronDown size={14} className="text-gray-400" />
              </button>
            ))}
          </div>

          {/* View Toggle (Desktop) */}
          <div className="hidden md:flex items-center gap-2 ml-4">
            <span className="text-xs text-gray-400 font-medium tracking-wide uppercase mr-2">View</span>
            <button className="p-1.5 rounded bg-gray-100 text-gray-700"><FiGrid size={18} /></button>
            <button className="p-1.5 rounded text-gray-400 hover:bg-gray-50"><FiList size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
