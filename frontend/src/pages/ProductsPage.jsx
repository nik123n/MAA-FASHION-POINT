import React, { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiFilter, FiX, FiChevronDown, FiChevronUp, FiGrid, FiList } from 'react-icons/fi';
import { fetchProducts } from '../store/slices/allSlices';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';

const CATEGORIES = ['3 Piece', '3 Piece Pair', 'Short Top', '2 Piece', 'Tunic Top', 'Cotton Tunic Top', 'Long Top', 'Cord Set', 'Plazo Pair', 'Kurti Plaza Dupata', 'Kurti Pent Dupata', 'Cotton Straight Pent'];
const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'Free Size'];
const SORT_OPTIONS = [
  { label: 'Newest First', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Top Rated', value: 'rating' },
  { label: 'Most Popular', value: 'popular' },
];

function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="border-b border-gray-100 pb-4 mb-4">
      <button onClick={() => setOpen(!open)} className="flex items-center justify-between w-full mb-3">
        <span className="font-semibold text-gray-700">{title}</span>
        {open ? <FiChevronUp size={16} /> : <FiChevronDown size={16} />}
      </button>
      {open && children}
    </div>
  );
}

export default function ProductsPage() {
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products, pagination, loading } = useSelector((s) => s.products);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Filter state derived from URL
  const selectedCategories = searchParams.get('category')?.split(',').filter(Boolean) || [];
  const selectedSizes = searchParams.get('size')?.split(',').filter(Boolean) || [];
  const minPrice = searchParams.get('minPrice') || '';
  const maxPrice = searchParams.get('maxPrice') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = parseInt(searchParams.get('page') || '1');
  const search = searchParams.get('search') || '';

  const updateParam = useCallback((key, value) => {
    const p = new URLSearchParams(searchParams);
    if (value) p.set(key, value); else p.delete(key);
    p.set('page', '1');
    setSearchParams(p);
  }, [searchParams, setSearchParams]);

  const toggleCategory = (cat) => {
    const cats = selectedCategories.includes(cat)
      ? selectedCategories.filter((c) => c !== cat)
      : [...selectedCategories, cat];
    updateParam('category', cats.join(','));
  };

  const toggleSize = (size) => {
    const sizes = selectedSizes.includes(size)
      ? selectedSizes.filter((s) => s !== size)
      : [...selectedSizes, size];
    updateParam('size', sizes.join(','));
  };

  const clearAll = () => {
    setSearchParams(new URLSearchParams());
  };

  useEffect(() => {
    const params = {};
    if (selectedCategories.length) params.category = selectedCategories.join(',');
    if (selectedSizes.length) params.size = selectedSizes.join(',');
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    if (sort) params.sort = sort;
    if (page > 1) params.page = page;
    if (search) params.search = search;
    params.limit = 12;
    dispatch(fetchProducts(params));
  }, [searchParams, dispatch]);

  const activeFilterCount = selectedCategories.length + selectedSizes.length + (minPrice ? 1 : 0) + (maxPrice ? 1 : 0);

  const FilterPanel = () => (
    <div className="space-y-0">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display text-lg font-semibold">Filters</h3>
        {activeFilterCount > 0 && (
          <button onClick={clearAll} className="text-xs text-brand-600 hover:text-brand-800 font-medium">
            Clear All ({activeFilterCount})
          </button>
        )}
      </div>

      <FilterSection title="Category">
        <div className="space-y-2">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-2.5 cursor-pointer group">
              <input
                type="checkbox"
                checked={selectedCategories.includes(cat)}
                onChange={() => toggleCategory(cat)}
                className="w-4 h-4 rounded accent-brand-700"
              />
              <span className="text-sm text-gray-600 group-hover:text-brand-700 transition-colors">{cat}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => (
            <button
              key={size}
              onClick={() => toggleSize(size)}
              className={`px-3 py-1.5 text-xs rounded-lg border font-medium transition-all ${
                selectedSizes.includes(size)
                  ? 'bg-brand-700 text-white border-brand-700'
                  : 'border-gray-200 text-gray-600 hover:border-brand-300 hover:text-brand-700'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      <FilterSection title="Price Range">
        <div className="space-y-2">
          <div className="flex gap-2">
            <input
              type="number"
              placeholder="Min ₹"
              value={minPrice}
              onChange={(e) => updateParam('minPrice', e.target.value)}
              className="input-field py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Max ₹"
              value={maxPrice}
              onChange={(e) => updateParam('maxPrice', e.target.value)}
              className="input-field py-2 text-sm"
            />
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {[['Under ₹500', 0, 500], ['₹500-₹1500', 500, 1500], ['₹1500-₹5000', 1500, 5000], ['Above ₹5000', 5000, '']].map(([label, min, max]) => (
              <button
                key={label}
                onClick={() => {
                  const p = new URLSearchParams(searchParams);
                  p.set('minPrice', min); if (max) p.set('maxPrice', max); else p.delete('maxPrice');
                  p.set('page', '1');
                  setSearchParams(p);
                }}
                className="text-xs px-2.5 py-1 bg-gray-100 hover:bg-brand-50 hover:text-brand-700 rounded-full transition-colors text-gray-600"
              >{label}</button>
            ))}
          </div>
        </div>
      </FilterSection>

      <FilterSection title="Rating">
        {[4, 3, 2].map((r) => (
          <button
            key={r}
            onClick={() => updateParam('rating', r)}
            className="flex items-center gap-1 text-sm text-gray-600 hover:text-brand-700 transition-colors mb-1 w-full text-left"
          >
            {'★'.repeat(r)}{'☆'.repeat(5 - r)} & above
          </button>
        ))}
      </FilterSection>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header / Filter Bar */}
      <div className="sticky top-16 lg:static z-30 bg-white lg:bg-transparent -mx-4 px-4 lg:mx-0 lg:px-0 border-b border-gray-200 lg:border-none mb-4 lg:mb-6">
        {/* Desktop Header */}
        <div className="hidden lg:flex items-center justify-between">
          <div>
            <h1 className="font-display text-3xl text-gray-900">
              {search ? `Results for "${search}"` : selectedCategories.length === 1 ? selectedCategories[0] : 'All Products'}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{pagination?.total || 0} products found</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="input-field py-2 text-sm w-48">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>

        {/* Mobile Sticky Bar */}
        <div className="flex lg:hidden items-center justify-between h-12 w-full pb-safe">
          <button onClick={() => setFiltersOpen(true)} className="flex flex-1 items-center justify-center gap-2 text-[13px] font-medium text-gray-700 h-full border-r border-gray-200">
            <FiFilter size={16} /> Filter {activeFilterCount > 0 && <span className="w-4 h-4 bg-accent-600 text-white rounded-full flex items-center justify-center text-[10px]">{activeFilterCount}</span>}
          </button>
          
          <div className="flex flex-1 items-center justify-center gap-2 text-[13px] font-medium text-gray-700 h-full relative">
            Sort <FiChevronDown size={14} className="text-gray-400"/>
            <select value={sort} onChange={(e) => updateParam('sort', e.target.value)} className="absolute opacity-0 inset-0 w-full h-full cursor-pointer">
              {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block w-60 shrink-0">
          <div className="sticky top-24 bg-white rounded-2xl border border-gray-100 p-5">
            <FilterPanel />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-6">
              {Array(12).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="font-display text-2xl text-gray-700 mb-2">No products found</h3>
              <p className="text-gray-500 mb-6">Try adjusting your filters or search terms</p>
              <button onClick={clearAll} className="btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-6">
                {products.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
              </div>

              {/* Pagination */}
              {pagination?.pages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((p) => (
                    <button
                      key={p}
                      onClick={() => updateParam('page', p)}
                      className={`w-10 h-10 rounded-full text-sm font-medium transition-all ${
                        p === page ? 'bg-brand-700 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:border-brand-300'
                      }`}
                    >{p}</button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {filtersOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-50 lg:hidden"
              onClick={() => setFiltersOpen(false)}
            />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 overflow-y-auto p-6 lg:hidden"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-display text-xl font-bold">Filters</h2>
                <button onClick={() => setFiltersOpen(false)} className="p-2 hover:bg-gray-100 rounded-full">
                  <FiX size={20} />
                </button>
              </div>
              <FilterPanel />
              <button onClick={() => setFiltersOpen(false)} className="btn-primary w-full mt-4">
                Apply Filters
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
