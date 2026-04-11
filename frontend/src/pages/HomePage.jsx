import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShoppingBag, FiStar, FiTruck, FiRefreshCw, FiShield, FiLoader } from 'react-icons/fi';
import { fetchHomeProducts, fetchPersonalizedRecommendations } from '../store/slices/allSlices';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';
import { useInView } from 'react-intersection-observer';

const CATEGORY_DATA = [
  { name: '3 Piece', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=500&fit=crop', color: 'from-rose-900/60' },
  { name: '3 Piece Pair', image: 'https://images.unsplash.com/photo-1583391733981-8498408ee4b6?w=400&h=500&fit=crop', color: 'from-purple-900/60' },
  { name: 'Short Top', image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400&h=500&fit=crop', color: 'from-amber-900/60' },
  { name: '2 Piece', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop', color: 'from-teal-900/60' },
  { name: 'Tunic Top', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop', color: 'from-pink-900/60' },
  { name: 'Cotton Tunic Top', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=500&fit=crop', color: 'from-indigo-900/60' },
  { name: 'Long Top', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=500&fit=crop', color: 'from-rose-900/60' },
  { name: 'Cord Set', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop', color: 'from-purple-900/60' },
  { name: 'Plazo Pair', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop', color: 'from-amber-900/60' },
  { name: 'Kurti Plaza Dupata', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=500&fit=crop', color: 'from-teal-900/60' },
  { name: 'Kurti Pent Dupata', image: 'https://images.unsplash.com/photo-1583391733981-8498408ee4b6?w=400&h=500&fit=crop', color: 'from-pink-900/60' },
  { name: 'Cotton Straight Pent', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=500&fit=crop', color: 'from-indigo-900/60' },
];

const HERO_SLIDES = [
  {
    title: 'Wear Your Story',
    subtitle: 'New festive collection is here',
    cta: 'Shop New Arrivals',
    link: '/products?isNewArrival=true',
    bg: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&h=700&fit=crop',
    accent: 'text-rose-300',
  },
  {
    title: 'Tradition, Reimagined',
    subtitle: 'Curated ethnic wear for every occasion',
    cta: 'Explore Collection',
    link: '/products',
    bg: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1400&h=700&fit=crop',
    accent: 'text-amber-300',
  },
];

const FEATURES = [
  { icon: FiTruck, title: 'Free Shipping', desc: 'On orders above ₹999' },
  { icon: FiRefreshCw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
  { icon: FiShield, title: 'Secure Payment', desc: '100% secure via Razorpay' },
  { icon: FiStar, title: 'Quality Assured', desc: 'Curated & quality-checked' },
];

export default function HomePage() {
  const dispatch = useDispatch();
  const { homeData, loading, personalizedRecommendations, personalizedPage, hasMorePersonalized } = useSelector((s) => s.products);
  const [heroIdx, setHeroIdx] = React.useState(0);
  const { ref: loadMoreRef, inView } = useInView();

  useEffect(() => {
    dispatch(fetchHomeProducts());
    dispatch(fetchPersonalizedRecommendations({ page: 1, limit: 12 }));
    const timer = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, [dispatch]);

  useEffect(() => {
    if (inView && hasMorePersonalized && !loading) {
      dispatch(fetchPersonalizedRecommendations({ page: personalizedPage + 1, limit: 12 }));
    }
  }, [inView, hasMorePersonalized, loading, personalizedPage, dispatch]);

  const hero = HERO_SLIDES[heroIdx];

  return (
    <div className="animate-fade-in">
      {/* ── HERO BANNER ──────────────────────────────────────── */}
      <section className="relative h-[70vh] min-h-[480px] overflow-hidden">
        {HERO_SLIDES.map((slide, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{ opacity: i === heroIdx ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img src={slide.bg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/30 to-transparent" />
          </motion.div>
        ))}

        {/* Content */}
        <div className="relative z-10 h-full flex items-center">
          <div className="max-w-7xl mx-auto px-6 sm:px-10 lg:px-16">
            <motion.div
              key={heroIdx}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-xl"
            >
              <p className={`font-accent text-xl italic mb-3 ${hero.accent}`}>{hero.subtitle}</p>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-6">
                {hero.title}
              </h1>
              <Link to={hero.link} className="inline-flex items-center gap-3 bg-white text-brand-700 px-8 py-4 rounded-full font-semibold text-lg hover:bg-brand-50 transition-all hover:gap-5 hover:shadow-xl">
                <FiShoppingBag size={20} />
                {hero.cta}
                <FiArrowRight size={18} />
              </Link>
            </motion.div>
          </div>
        </div>

        {/* Slide dots */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
          {HERO_SLIDES.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIdx(i)}
              className={`rounded-full transition-all duration-300 ${i === heroIdx ? 'w-8 h-2.5 bg-white' : 'w-2.5 h-2.5 bg-white/40'}`}
            />
          ))}
        </div>
      </section>

      {/* ── FEATURES BAR ─────────────────────────────────────── */}
      <section className="bg-brand-50 border-y border-brand-100">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-10 h-10 bg-brand-100 rounded-full flex items-center justify-center text-brand-600 shrink-0">
                  <Icon size={18} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">{title}</p>
                  <p className="text-xs text-gray-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CATEGORIES ───────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="font-accent text-brand-600 italic text-lg mb-1">Shop by Style</p>
          <h2 className="font-display text-4xl text-gray-900">Our Collections</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {CATEGORY_DATA.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <Link to={`/products?category=${cat.name}`} className="group block relative overflow-hidden rounded-2xl aspect-[3/4]">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} to-transparent`} />
                <div className="absolute bottom-0 left-0 right-0 p-3 text-white text-center">
                  <p className="font-display text-base font-semibold">{cat.name}</p>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── FEATURED PRODUCTS ─────────────────────────────────── */}
      <section className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="font-accent text-brand-600 italic text-lg mb-1">Editor's Pick</p>
              <h2 className="font-display text-4xl text-gray-900">Featured Styles</h2>
            </div>
            <Link to="/products?isFeatured=true" className="btn-outline hidden sm:flex items-center gap-2 py-2.5 px-5 text-sm">
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {loading && !homeData
              ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              : homeData?.featured?.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)
            }
          </div>
        </div>
      </section>

      {/* ── NEW ARRIVALS ──────────────────────────────────────── */}
      {homeData?.newArrivals?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="font-accent text-emerald-600 italic text-lg mb-1">Just Dropped</p>
              <h2 className="font-display text-4xl text-gray-900">New Arrivals</h2>
            </div>
            <Link to="/products?isNewArrival=true" className="btn-outline hidden sm:flex items-center gap-2 py-2.5 px-5 text-sm">
              Shop All <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {homeData.newArrivals.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </section>
      )}

      {/* ── TRENDING ─────────────────────────────────────────── */}
      {homeData?.trending?.length > 0 && (
        <section className="bg-[#1e0e16] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="font-accent text-brand-300 italic text-lg mb-1">Most Loved</p>
              <h2 className="font-display text-4xl text-white">🔥 Trending Now</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {homeData.trending.map((p, i) => (
                <div key={p._id} className="bg-white/5 rounded-2xl overflow-hidden">
                  <ProductCard product={p} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── RECOMMENDED FOR YOU (INFINITE SCROLL) ─────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="font-accent text-brand-600 italic text-lg mb-1">Tailored To Your Taste</p>
            <h2 className="font-display text-4xl text-gray-900">Recommended For You</h2>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {personalizedRecommendations?.map((p, i) => (
              <ProductCard key={`${p._id}-${i}`} product={p} index={i % 12} />
            ))}
            
            {/* Skeletons while loading first page or next page */}
            {loading && Array(4).fill(0).map((_, i) => <ProductCardSkeleton key={`skeleton-${i}`} />)}
          </div>
          
          {/* Infinite Scroll Trigger */}
          {hasMorePersonalized && !loading && (
            <div ref={loadMoreRef} className="py-10 flex justify-center">
              <FiLoader className="animate-spin text-brand-500 text-3xl" />
            </div>
          )}
          
          {!hasMorePersonalized && personalizedRecommendations?.length > 0 && (
             <div className="text-center py-10 text-gray-500 font-medium">
               You've seen all recommendations!
             </div>
          )}
        </div>
      </section>

      {/* ── BANNER CTA ───────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-brand-700 text-white py-20">
        <div className="absolute inset-0 opacity-10">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute w-32 h-32 border border-white rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.5 }} />
          ))}
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4">
          <p className="font-accent text-brand-200 italic text-xl mb-3">Limited Time Offer</p>
          <h2 className="font-display text-5xl font-bold mb-4">Get 20% Off Your First Order</h2>
          <p className="text-brand-200 mb-8 text-lg">Use code <span className="bg-white text-brand-700 px-3 py-1 rounded-full font-bold font-mono">WELCOME20</span> at checkout</p>
          <Link to="/auth/register" className="inline-flex items-center gap-3 bg-white text-brand-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-50 transition-all hover:shadow-2xl">
            Join Now & Save <FiArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
