import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiArrowRight, FiStar, FiTruck, FiRefreshCw, FiShield } from 'react-icons/fi';
import { fetchHomeProducts } from '../store/slices/allSlices';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';
import CategoryScroll from '../components/home/CategoryScroll';
import HeroSection from '../components/home/HeroSection';

// ─── CATEGORY DATA ─────────────────────────────────────────────────────────
// Images marked pending:false have been replaced with uploaded product photos.
// Images marked pending:true are awaiting the next batch of uploaded images.
const CATEGORY_DATA = [
  // ── BATCH 1 (uploaded) ──────────────────────────────────────────────────
  { name: '3 Piece',             image: '/categories/3-piece.png',      overlay: 'rgba(80,40,10,0.52)',   pending: false },
  { name: '3 Piece Pair',        image: '/categories/3-piece-pair.png', overlay: 'rgba(20,60,70,0.52)',   pending: false },
  { name: 'Short Top',           image: '/categories/short-top.png',    overlay: 'rgba(15,25,80,0.52)',   pending: false },
  // ── BATCH 2 (uploaded) ──────────────────────────────────────────────────
  { name: '2 Piece',             image: '/categories/2-piece.png',      overlay: 'rgba(10,30,60,0.55)',   pending: false },
  { name: 'Tunic Top',           image: '/categories/tunic-top.png',    overlay: 'rgba(10,25,70,0.55)',   pending: false },
  { name: 'Cotton Tunic Top',    image: '/categories/cotton-tunic.png', overlay: 'rgba(15,15,30,0.55)',   pending: false },
  { name: 'Long Top',            image: '/categories/long-top.png',     overlay: 'rgba(20,50,100,0.55)',  pending: false },
  { name: 'Cord Set',            image: '/categories/cord-set.png',     overlay: 'rgba(100,40,15,0.55)',  pending: false },
  // ── BATCH 3 (uploaded) ──────────────────────────────────────────────────
  { name: 'Plazo Pair',          image: '/categories/plazo-pair.png',   overlay: 'rgba(120,15,15,0.55)', pending: false },
  { name: 'Kurti Plaza Dupata',  image: '/categories/kurti-plazo.png',  overlay: 'rgba(50,25,10,0.55)',  pending: false },
  { name: 'Kurti Pent Dupata',   image: '/categories/kurti-pent.png',   overlay: 'rgba(55,20,65,0.55)',  pending: false },
  { name: 'Cotton Straight Pent',image: '/categories/cotton-pent.png',  overlay: 'rgba(30,55,80,0.55)',  pending: false },
];

const HERO_DATA = {
  title: 'Grace In\nEvery Thread',
  subtitle: 'Fresh ethnic and festive edits — crafted for the modern Indian woman.',
  ctaLabel: 'See New Arrivals',
  ctaLink: '/products?isNewArrival=true',
};

const FEATURES = [
  { icon: FiTruck, title: 'Free Shipping', desc: 'On orders above Rs 999' },
  { icon: FiRefreshCw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
  { icon: FiShield, title: 'Secure Payment', desc: 'Protected checkout experience' },
  { icon: FiStar, title: 'Quality Assured', desc: 'Curated looks for daily wear' },
];

const CIRCLE_POSITIONS = [
  { left: '8%', top: '12%', opacity: 0.3 }, { left: '22%', top: '65%', opacity: 0.2 },
  { left: '45%', top: '8%', opacity: 0.25 }, { left: '67%', top: '78%', opacity: 0.15 },
  { left: '80%', top: '35%', opacity: 0.3 }, { left: '15%', top: '45%', opacity: 0.2 },
  { left: '55%', top: '55%', opacity: 0.18 }, { left: '92%', top: '20%', opacity: 0.25 },
  { left: '33%', top: '85%', opacity: 0.15 }, { left: '73%', top: '10%', opacity: 0.22 },
  { left: '5%', top: '80%', opacity: 0.28 }, { left: '88%', top: '60%', opacity: 0.18 },
  { left: '40%', top: '30%', opacity: 0.2 }, { left: '62%', top: '48%', opacity: 0.25 },
  { left: '28%', top: '18%', opacity: 0.15 }, { left: '78%', top: '85%', opacity: 0.2 },
  { left: '50%', top: '72%', opacity: 0.18 }, { left: '18%', top: '92%', opacity: 0.22 },
  { left: '95%', top: '50%', opacity: 0.15 }, { left: '42%', top: '96%', opacity: 0.2 },
];

export default function BrandedHomePage() {
  const dispatch = useDispatch();
  const { homeData, loading } = useSelector((s) => s.products);

  useEffect(() => {
    dispatch(fetchHomeProducts());
  }, [dispatch]);

  return (
    <div className="animate-fade-in">
      {/* Mobile Category Scroll */}
      <div className="md:hidden pt-2">
        <CategoryScroll />
      </div>

      <HeroSection heroData={HERO_DATA} />

      <section className="bg-white/85 backdrop-blur-sm border-y border-brand-100">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {FEATURES.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_10px_24px_rgba(15,23,42,0.05)]">
                <div className="w-11 h-11 bg-brand-50 rounded-full flex items-center justify-center text-brand-700 shrink-0">
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

      {/* ── CATEGORY GRID ───────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="font-accent text-brand-600 italic text-lg mb-1">Shop by Style</p>
          <h2 className="font-display text-4xl text-gray-900">Our Collections</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 sm:gap-5">
          {CATEGORY_DATA.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06, duration: 0.45, ease: 'easeOut' }}
              className="flex flex-col"
            >
              <Link
                to={`/products?category=${encodeURIComponent(cat.name)}`}
                className="group block relative overflow-hidden rounded-[2rem] shadow-[0_16px_40px_rgba(15,23,42,0.10)] hover:shadow-[0_24px_56px_rgba(15,23,42,0.18)] transition-shadow duration-400"
                style={{ aspectRatio: '3/4' }}
                aria-label={`Shop ${cat.name}`}
              >
                {/* ── IMAGE ── */}
                {cat.pending ? (
                  /* Elegant gradient placeholder while awaiting uploaded image */
                  <div
                    className="w-full h-full flex items-end"
                    style={{ background: `linear-gradient(160deg, ${cat.overlay.replace('0.52', '1')}, rgba(10,10,30,0.9))` }}
                  />
                ) : (
                  <img
                    src={cat.image}
                    alt={cat.name}
                    loading="lazy"
                    decoding="async"
                    className="absolute inset-0 w-full h-full object-cover object-top transition-transform duration-500 ease-out group-hover:scale-105"
                  />
                )}

                {/* ── GRADIENT OVERLAY ── */}
                <div
                  className="absolute inset-0 transition-opacity duration-300 group-hover:opacity-90"
                  style={{
                    background: `linear-gradient(to top, ${cat.overlay} 0%, rgba(0,0,0,0.18) 55%, transparent 100%)`,
                  }}
                />

                {/* ── LABEL ── */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-4">
                  <p className="font-display text-white text-sm sm:text-base font-semibold text-center leading-tight drop-shadow-sm">
                    {cat.name}
                  </p>
                  {cat.pending && (
                    <p className="text-white/50 text-[10px] text-center mt-0.5 tracking-wide">Coming soon</p>
                  )}
                </div>

                {/* ── HOVER SHINE ── */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-400 pointer-events-none"
                  style={{ background: 'linear-gradient(120deg, transparent 45%, rgba(255,255,255,0.07) 55%, transparent 65%)' }}
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="font-accent text-brand-600 italic text-lg mb-1">Editor&apos;s Pick</p>
              <h2 className="font-display text-4xl text-gray-900">Featured Styles</h2>
            </div>
            <Link to="/products?isFeatured=true" className="btn-outline hidden sm:flex items-center gap-2 py-2.5 px-5 text-sm">
              View All <FiArrowRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {loading && !homeData
              ? Array(8).fill(0).map((_, i) => <ProductCardSkeleton key={i} />)
              : homeData?.featured?.map((p, i) => <ProductCard key={p._id} product={p} index={i} />)}
          </div>
        </div>
      </section>

      {homeData?.newArrivals?.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="flex items-center justify-between mb-10">
            <div>
              <p className="font-accent text-leaf-700 italic text-lg mb-1">Just Dropped</p>
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

      {homeData?.trending?.length > 0 && (
        <section className="bg-[#19204a] py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-10">
              <p className="font-accent text-leaf-300 italic text-lg mb-1">Most Loved</p>
              <h2 className="font-display text-4xl text-white">Trending Now</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
              {homeData.trending.map((p, i) => (
                <div key={p._id} className="bg-white/6 rounded-[1.5rem] overflow-hidden border border-white/10">
                  <ProductCard product={p} index={i} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="relative overflow-hidden py-20">
        <div className="absolute inset-0 bg-[linear-gradient(120deg,#34308f_0%,#253170_45%,#67bb2e_100%)]" />
        <div className="absolute inset-0 opacity-20">
          {CIRCLE_POSITIONS.map((pos, i) => (
            <div key={i} className="absolute w-32 h-32 border border-white rounded-full" style={pos} />
          ))}
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4 text-white">
          <p className="font-accent text-brand-100 italic text-xl mb-3">Limited Time Offer</p>
          <h2 className="font-display text-3xl sm:text-5xl font-bold mb-4 px-2 tracking-tight">Get 20% Off Your First Order</h2>
          <p className="text-brand-100 mb-8 text-base sm:text-lg">Use code <span className="bg-white text-brand-700 px-3 py-1 rounded-md font-bold font-mono">WELCOME20</span> at checkout</p>
          <Link to="/auth/register" className="inline-flex items-center gap-3 bg-white text-brand-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-50 transition-all hover:shadow-2xl">
            Join Now And Save <FiArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
