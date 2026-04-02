import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion } from 'framer-motion';
import { FiArrowRight, FiShoppingBag, FiStar, FiTruck, FiRefreshCw, FiShield } from 'react-icons/fi';
import { fetchHomeProducts } from '../store/slices/allSlices';
import ProductCard, { ProductCardSkeleton } from '../components/product/ProductCard';
import BrandLogo from '../components/common/BrandLogoNew';

const CATEGORY_DATA = [
  { name: '3 Piece', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=500&fit=crop', color: 'from-brand-900/65' },
  { name: '3 Piece Pair', image: 'https://images.unsplash.com/photo-1583391733981-8498408ee4b6?w=400&h=500&fit=crop', color: 'from-coral-900/60' },
  { name: 'Short Top', image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=400&h=500&fit=crop', color: 'from-leaf-900/65' },
  { name: '2 Piece', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=500&fit=crop', color: 'from-brand-800/60' },
  { name: 'Tunic Top', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=400&h=500&fit=crop', color: 'from-coral-800/65' },
  { name: 'Cotton Tunic Top', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=400&h=500&fit=crop', color: 'from-leaf-800/65' },
  { name: 'Long Top', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=400&h=500&fit=crop', color: 'from-brand-900/60' },
  { name: 'Cord Set', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=400&h=500&fit=crop', color: 'from-coral-900/65' },
  { name: 'Plazo Pair', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop', color: 'from-leaf-900/60' },
  { name: 'Kurti Plaza Dupata', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=400&h=500&fit=crop', color: 'from-brand-800/65' },
  { name: 'Kurti Pent Dupata', image: 'https://images.unsplash.com/photo-1583391733981-8498408ee4b6?w=400&h=500&fit=crop', color: 'from-coral-800/60' },
  { name: 'Cotton Straight Pent', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=400&h=500&fit=crop', color: 'from-leaf-800/60' },
];

const HERO_SLIDES = [
  {
    title: 'Fashion That Cares',
    subtitle: 'Boutique looks for every woman',
    cta: 'Shop Collection',
    link: '/products',
    bg: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=1400&h=700&fit=crop',
  },
  {
    title: 'Grace In Every Thread',
    subtitle: 'Fresh ethnic and festive edits',
    cta: 'See New Arrivals',
    link: '/products?isNewArrival=true',
    bg: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=1400&h=700&fit=crop',
  },
];

const FEATURES = [
  { icon: FiTruck, title: 'Free Shipping', desc: 'On orders above Rs 999' },
  { icon: FiRefreshCw, title: 'Easy Returns', desc: '7-day hassle-free returns' },
  { icon: FiShield, title: 'Secure Payment', desc: 'Protected checkout experience' },
  { icon: FiStar, title: 'Quality Assured', desc: 'Curated looks for daily wear' },
];

export default function BrandedHomePage() {
  const dispatch = useDispatch();
  const { homeData, loading } = useSelector((s) => s.products);
  const [heroIdx, setHeroIdx] = React.useState(0);

  useEffect(() => {
    dispatch(fetchHomeProducts());
    const timer = setInterval(() => setHeroIdx((i) => (i + 1) % HERO_SLIDES.length), 5000);
    return () => clearInterval(timer);
  }, [dispatch]);

  return (
    <div className="animate-fade-in">
      <section className="relative overflow-hidden min-h-[78vh]">
        {HERO_SLIDES.map((slide, i) => (
          <motion.div
            key={i}
            initial={false}
            animate={{ opacity: i === heroIdx ? 1 : 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-0"
          >
            <img src={slide.bg} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[linear-gradient(112deg,rgba(25,32,74,0.92)_0%,rgba(25,32,74,0.72)_38%,rgba(52,48,143,0.4)_72%,rgba(103,187,46,0.2)_100%)]" />
          </motion.div>
        ))}

        <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 py-16 lg:py-24">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center min-h-[78vh]">
            <motion.div
              key={heroIdx}
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6 }}
              className="max-w-2xl"
            >
              <div className="inline-flex items-center gap-3 bg-white/12 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-white/90 mb-6">
                <span className="w-2.5 h-2.5 rounded-full bg-leaf-400" />
                Caring for every women
              </div>
              <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-white leading-tight mb-5">
                {HERO_SLIDES[heroIdx].title}
              </h1>
              <p className="font-accent text-2xl italic text-brand-100 mb-8">
                {HERO_SLIDES[heroIdx].subtitle}
              </p>
              <div className="flex flex-wrap gap-4">
                <Link to={HERO_SLIDES[heroIdx].link} className="inline-flex items-center gap-3 bg-white text-brand-700 px-8 py-4 rounded-full font-semibold text-lg hover:bg-brand-50 transition-all hover:gap-5 hover:shadow-xl">
                  <FiShoppingBag size={20} />
                  {HERO_SLIDES[heroIdx].cta}
                  <FiArrowRight size={18} />
                </Link>
                <Link to="/products?isTrending=true" className="inline-flex items-center gap-3 border border-white/30 text-white px-8 py-4 rounded-full font-semibold text-lg hover:bg-white/10 transition-all">
                  Explore Trends
                </Link>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.6 }}
              className="relative"
            >
              <div className="rounded-[2rem] bg-white/12 backdrop-blur-xl border border-white/15 p-6 sm:p-8 shadow-[0_30px_80px_rgba(10,16,45,0.32)]">
                <BrandLogo className="mb-6" />
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-[1.5rem] bg-white p-5">
                    <p className="text-xs uppercase tracking-[0.24em] text-brand-500 mb-2">Signature</p>
                    <p className="font-display text-2xl text-brand-800">MAA FASHTION POINT </p>
                    <p className="text-sm text-gray-500 mt-2">Freshly styled outfits with a strong local identity.</p>
                  </div>
                  <div className="rounded-[1.5rem] bg-leaf-50 p-5 border border-leaf-100">
                    <p className="text-xs uppercase tracking-[0.24em] text-leaf-700 mb-2">This Week</p>
                    <p className="font-display text-2xl text-leaf-900">Festive Edit</p>
                    <p className="text-sm text-leaf-900/70 mt-2">Sarees, kurtis, and daily wear made brighter.</p>
                  </div>
                </div>
                <div className="mt-5 rounded-[1.5rem] bg-gradient-to-r from-coral-600 to-coral-500 text-white p-5">
                  <p className="text-sm uppercase tracking-[0.24em] text-white/80 mb-2">Welcome offer</p>
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-display text-3xl">20% Off</p>
                      <p className="text-sm text-white/85">Use code WELCOME20 on your first order.</p>
                    </div>
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                      <FiArrowRight size={20} />
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

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

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <p className="font-accent text-brand-600 italic text-lg mb-1">Shop by Style</p>
          <h2 className="font-display text-4xl text-gray-900">Our Collections</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
          {CATEGORY_DATA.map((cat, i) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
            >
              <Link to={`/products?category=${cat.name}`} className="group block relative overflow-hidden rounded-[1.75rem] aspect-[3/4] shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
                <img src={cat.image} alt={cat.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                <div className={`absolute inset-0 bg-gradient-to-t ${cat.color} to-transparent`} />
                <div className="absolute bottom-0 left-0 right-0 p-4 text-white text-center">
                  <p className="font-display text-base font-semibold">{cat.name}</p>
                </div>
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
          {[...Array(20)].map((_, i) => (
            <div key={i} className="absolute w-32 h-32 border border-white rounded-full" style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%`, opacity: Math.random() * 0.5 }} />
          ))}
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center px-4 text-white">
          <p className="font-accent text-brand-100 italic text-xl mb-3">Limited Time Offer</p>
          <h2 className="font-display text-5xl font-bold mb-4">Get 20% Off Your First Order</h2>
          <p className="text-brand-100 mb-8 text-lg">Use code <span className="bg-white text-brand-700 px-3 py-1 rounded-full font-bold font-mono">WELCOME20</span> at checkout</p>
          <Link to="/auth/register" className="inline-flex items-center gap-3 bg-white text-brand-700 px-8 py-4 rounded-full font-bold text-lg hover:bg-brand-50 transition-all hover:shadow-2xl">
            Join Now And Save <FiArrowRight size={20} />
          </Link>
        </div>
      </section>
    </div>
  );
}
