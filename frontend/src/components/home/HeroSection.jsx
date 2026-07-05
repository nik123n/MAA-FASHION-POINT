import React, { useRef, useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { FiArrowRight, FiShoppingBag, FiChevronLeft, FiChevronRight } from 'react-icons/fi';
import { HiSparkles } from 'react-icons/hi2';

/* ─── FASHION SLIDES ───────────────────────────────────────────────────── */
const FASHION_SLIDES = [
  {
    id: 1,
    src: '/hero-kurti-black.png',
    label: 'Signature Kurti',
    tag: 'Daily Elegance',
    accent: 'from-slate-700 to-slate-900',
    tagColor: 'bg-slate-800/80 text-slate-100',
    link: '/products?category=Short Top',
  },
  {
    id: 2,
    src: '/hero-ethnic-brown.png',
    label: 'Anarkali Festive',
    tag: 'Festive Collection',
    accent: 'from-amber-800 to-amber-950',
    tagColor: 'bg-amber-900/80 text-amber-100',
    link: '/products?category=Kurti Pent Dupata',
  },
  {
    id: 3,
    src: '/hero-floral-pink.png',
    label: 'Floral Peplum Set',
    tag: 'Party Wear',
    accent: 'from-rose-600 to-rose-900',
    tagColor: 'bg-rose-800/80 text-rose-100',
    link: '/products?category=2 Piece',
  },
  {
    id: 4,
    src: '/hero-denim-blue.png',
    label: 'Denim Midi Dress',
    tag: 'Western Fusion',
    accent: 'from-blue-700 to-blue-950',
    tagColor: 'bg-blue-800/80 text-blue-100',
    link: '/products?category=3 Piece',
  },
];

/* ─── FLOATING ORB ──────────────────────────────────────────────────────── */
function FloatingOrb({ style, delay = 0, duration = 8 }) {
  return (
    <motion.div
      className="absolute rounded-full pointer-events-none blur-3xl"
      style={style}
      animate={{ y: [0, -24, 0], opacity: [style.opacity, style.opacity * 0.7, style.opacity] }}
      transition={{ duration, delay, repeat: Infinity, ease: 'easeInOut' }}
    />
  );
}

/* ─── HERO SECTION ──────────────────────────────────────────────────────── */
export default function HeroSection({ heroData }) {
  const { title, subtitle, ctaLabel, ctaLink } = heroData || {
    title: 'Grace In\nEvery Thread',
    subtitle: 'Fresh ethnic and festive edits — crafted for the modern Indian woman.',
    ctaLabel: 'See New Arrivals',
    ctaLink: '/products?isNewArrival=true',
  };

  const [current, setCurrent] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef(null);
  const total = FASHION_SLIDES.length;

  const next = useCallback(() => setCurrent((c) => (c + 1) % total), [total]);
  const prev = useCallback(() => setCurrent((c) => (c - 1 + total) % total), [total]);

  /* auto-play */
  useEffect(() => {
    if (isPaused) return;
    intervalRef.current = setInterval(next, 3000);
    return () => clearInterval(intervalRef.current);
  }, [next, isPaused]);

  /* touch / swipe */
  const touchStartX = useRef(null);
  const handleTouchStart = (e) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(dx) > 40) dx < 0 ? next() : prev();
    touchStartX.current = null;
  };

  const slide = FASHION_SLIDES[current];

  return (
    <section
      className="relative overflow-hidden"
      style={{ minHeight: 'clamp(560px, 90vh, 820px)' }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* ── BACKGROUND ─────────────────────────────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, #0f0c29 0%, #1a1060 25%, #2d1b69 45%, #1e3a8a 70%, #0f172a 100%)',
        }}
      />

      {/* ── FLOATING GRADIENT ORBS ──────────────────────────── */}
      <FloatingOrb style={{ width: 520, height: 520, left: '-8%', top: '-15%', background: 'radial-gradient(circle, rgba(99,102,241,0.28) 0%, transparent 70%)', opacity: 1 }} delay={0} duration={9} />
      <FloatingOrb style={{ width: 380, height: 380, left: '30%', top: '55%', background: 'radial-gradient(circle, rgba(167,139,250,0.2) 0%, transparent 70%)', opacity: 1 }} delay={2} duration={11} />
      <FloatingOrb style={{ width: 300, height: 300, right: '5%', top: '5%', background: 'radial-gradient(circle, rgba(251,191,36,0.12) 0%, transparent 70%)', opacity: 1 }} delay={1} duration={7} />
      <FloatingOrb style={{ width: 220, height: 220, right: '28%', bottom: '5%', background: 'radial-gradient(circle, rgba(244,114,182,0.18) 0%, transparent 70%)', opacity: 1 }} delay={3} duration={10} />

      {/* ── GRID NOISE TEXTURE (subtle) ─────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 200 200\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'n\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23n)\'/%3E%3C/svg%3E")', backgroundSize: '200px' }}
      />

      {/* ── CONTENT ─────────────────────────────────────────── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 sm:px-10 lg:px-16 h-full flex items-center" style={{ minHeight: 'inherit' }}>
        <div className="w-full grid lg:grid-cols-[1fr_1fr] gap-10 xl:gap-20 items-center py-16 lg:py-20">

          {/* ── LEFT: TEXT ─────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col gap-6 text-white"
          >
            {/* badge */}
            <motion.div
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="inline-flex items-center gap-2 self-start bg-white/10 backdrop-blur-md border border-white/20 rounded-full px-4 py-2 text-sm text-white/90"
            >
              <HiSparkles className="text-amber-300" size={15} />
              <span className="tracking-wide">Caring For Every Woman</span>
            </motion.div>

            {/* heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22, duration: 0.65 }}
              className="font-display leading-[1.08] text-white"
              style={{ fontSize: 'clamp(2.6rem, 5.5vw, 4.8rem)', fontWeight: 800, whiteSpace: 'pre-line' }}
            >
              {title.split('\n').map((line, i) => (
                <span key={i} className="block">
                  {i === 1 ? (
                    <span className="bg-gradient-to-r from-violet-300 via-pink-300 to-amber-300 bg-clip-text text-transparent">{line}</span>
                  ) : line}
                </span>
              ))}
            </motion.h1>

            {/* subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.32 }}
              className="text-blue-100/75 text-lg leading-relaxed max-w-md"
            >
              {subtitle}
            </motion.p>

            {/* CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.42 }}
              className="flex flex-wrap gap-4 mt-2"
            >
              <Link
                to={ctaLink}
                className="group inline-flex items-center gap-3 px-7 py-4 rounded-full font-semibold text-base transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                  boxShadow: '0 0 32px rgba(124,58,237,0.45)',
                  color: '#fff',
                }}
                onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 0 48px rgba(124,58,237,0.7)'; }}
                onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 0 32px rgba(124,58,237,0.45)'; }}
              >
                <FiShoppingBag size={19} />
                {ctaLabel}
                <FiArrowRight size={17} className="group-hover:translate-x-1 transition-transform" />
              </Link>

              <Link
                to="/products?isTrending=true"
                className="inline-flex items-center gap-2 px-7 py-4 rounded-full font-semibold text-base border border-white/25 text-white/90 backdrop-blur-sm hover:bg-white/10 hover:border-white/40 transition-all duration-300"
              >
                Explore Trends
                <FiArrowRight size={17} />
              </Link>
            </motion.div>

            {/* dot nav (desktop) */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="flex items-center gap-3 mt-4"
            >
              {FASHION_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrent(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className="transition-all duration-300 rounded-full"
                  style={{
                    width: i === current ? 32 : 10,
                    height: 10,
                    background: i === current
                      ? 'linear-gradient(90deg, #a78bfa, #f472b6)'
                      : 'rgba(255,255,255,0.3)',
                  }}
                />
              ))}
            </motion.div>
          </motion.div>

          {/* ── RIGHT: CAROUSEL ────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.18, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {/* glow behind card */}
            <div
              className="absolute inset-[-20px] rounded-[3rem] blur-3xl opacity-40 transition-all duration-700"
              style={{ background: `radial-gradient(ellipse, rgba(139,92,246,0.5) 0%, rgba(59,130,246,0.3) 50%, transparent 80%)` }}
            />

            {/* MAIN CARD */}
            <div
              className="relative w-full max-w-[420px] mx-auto"
              style={{
                perspective: '1200px',
              }}
            >
              {/* Background peek cards */}
              {[-1, 1].map((offset) => {
                const idx = (current + offset + total) % total;
                return (
                  <div
                    key={idx}
                    className="absolute inset-0 rounded-[2.5rem] overflow-hidden cursor-pointer"
                    style={{
                      transform: `translateX(${offset * 72}px) scale(0.88) translateZ(-60px)`,
                      opacity: 0.45,
                      zIndex: 0,
                      transition: 'all 0.6s cubic-bezier(0.22,1,0.36,1)',
                    }}
                    onClick={() => offset > 0 ? next() : prev()}
                  >
                    <img
                      src={FASHION_SLIDES[idx].src}
                      alt={FASHION_SLIDES[idx].label}
                      className="w-full h-full object-cover object-top"
                      style={{ aspectRatio: '3/4' }}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-[rgba(15,12,41,0.5)]" />
                  </div>
                );
              })}

              {/* ACTIVE CARD */}
              <motion.div
                key={current}
                initial={{ opacity: 0, scale: 0.94, y: 16 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.94, y: -16 }}
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="relative z-10 rounded-[2.5rem] overflow-hidden group cursor-pointer"
                style={{
                  boxShadow: '0 40px 100px -20px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.08)',
                  aspectRatio: '3/4',
                }}
                onClick={() => window.location.href = slide.link}
              >
                <img
                  src={slide.src}
                  alt={slide.label}
                  className="w-full h-full object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  loading="eager"
                />

                {/* card overlay gradient */}
                <div
                  className="absolute inset-0"
                  style={{
                    background: 'linear-gradient(to top, rgba(10,8,40,0.85) 0%, rgba(10,8,40,0.3) 40%, transparent 65%)',
                  }}
                />

                {/* glassmorphism info bar */}
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div
                    className="rounded-2xl p-4"
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      backdropFilter: 'blur(16px)',
                      border: '1px solid rgba(255,255,255,0.14)',
                    }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <span
                          className={`inline-block text-xs font-semibold tracking-widest px-2.5 py-1 rounded-full mb-2 ${slide.tagColor}`}
                        >
                          {slide.tag}
                        </span>
                        <p className="text-white font-semibold text-lg leading-tight">{slide.label}</p>
                      </div>
                      <Link
                        to={slide.link}
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center text-white hover:scale-110 transition-transform duration-200"
                        style={{
                          background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
                          boxShadow: '0 4px 20px rgba(124,58,237,0.5)',
                        }}
                      >
                        <FiArrowRight size={18} />
                      </Link>
                    </div>
                  </div>
                </div>

                {/* animated shine */}
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)',
                  }}
                />
              </motion.div>

              {/* Arrow nav */}
              <button
                onClick={prev}
                className="absolute left-[-16px] top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white border border-white/20 backdrop-blur-md hover:scale-110 transition-all duration-200"
                style={{ background: 'rgba(30,20,80,0.7)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                aria-label="Previous"
              >
                <FiChevronLeft size={20} />
              </button>
              <button
                onClick={next}
                className="absolute right-[-16px] top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full flex items-center justify-center text-white border border-white/20 backdrop-blur-md hover:scale-110 transition-all duration-200"
                style={{ background: 'rgba(30,20,80,0.7)', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}
                aria-label="Next"
              >
                <FiChevronRight size={20} />
              </button>

              {/* counter badge */}
              <div
                className="absolute top-5 right-5 z-20 px-3 py-1.5 rounded-full text-white/90 text-xs font-semibold tracking-wider"
                style={{ background: 'rgba(15,12,41,0.65)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.12)' }}
              >
                {String(current + 1).padStart(2, '0')} / {String(total).padStart(2, '0')}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── BOTTOM WAVE ─────────────────────────────────────────── */}
      <div className="absolute bottom-0 left-0 right-0 h-20 pointer-events-none" style={{
        background: 'linear-gradient(to top, rgba(255,255,255,0.04) 0%, transparent 100%)',
      }} />
    </section>
  );
}
