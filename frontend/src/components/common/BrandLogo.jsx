import React from 'react';

export default function BrandLogo({ className = '', showText = true, compact = false }) {
  const sizeClass = compact ? 'w-12 h-12' : 'w-16 h-16';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClass} rounded-full bg-white shadow-[0_14px_40px_rgba(31,50,122,0.16)] ring-1 ring-[#d7def7] overflow-hidden shrink-0`}>
        <svg viewBox="0 0 100 100" className="w-full h-full" role="img" aria-label="MAA logo">
          <rect width="100" height="100" fill="#ffffff" />
          <path
            d="M18 26c4-7 11-11 18-11 4 0 7 1 9 4 2 3 2 7-1 10-2 3-5 5-5 9v14c0 14-7 26-22 36-3 2-7-1-6-5l5-12-1-9c-1-13 0-25 3-36z"
            fill="#67bb2e"
          />
          <path
            d="M30 27c4 4 6 8 6 14 0 9-1 22-3 38l-4 12-7-5c-6-8-9-17-9-28 0-12 5-23 17-31z"
            fill="#b0d312"
            opacity="0.95"
          />
          <path
            d="M25 20c4-3 8-4 12-2 4 2 6 6 6 10 0 4-2 7-5 10-1-5-4-8-10-10-2-1-3-4-3-8z"
            fill="#34308f"
          />
          <circle cx="63" cy="50" r="31" fill="none" stroke="#34308f" strokeWidth="7" />
          <path
            d="M77 67c-7 7-16 11-27 11-10 0-19-3-26-8"
            fill="none"
            stroke="#67bb2e"
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.8"
          />
          <path
            d="M63 28c2-3 4-4 7-4 4 0 6 2 8 5"
            fill="none"
            stroke="#e1261c"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <circle cx="69" cy="24" r="3" fill="#e1261c" />
          <path
            d="M60 29c5 7 11 10 18 10"
            fill="none"
            stroke="#e1261c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <text
            x="62"
            y="56"
            textAnchor="middle"
            fontSize="18"
            fontWeight="800"
            fill="#34308f"
            fontFamily="Arial, sans-serif"
            transform="rotate(-45 62 50)"
          >
            Caring Of Every Women
          </text>
          <text x="63" y="61" textAnchor="middle" fontSize="28" fontWeight="900" fill="#e1261c" fontFamily="Arial, sans-serif">
            मा
          </text>
          <path
            d="M88 62c4 0 8 1 11 4v11H79c1-4 3-8 9-15z"
            fill="#67bb2e"
            opacity="0.9"
          />
          <text x="84" y="90" textAnchor="middle" fontSize="9" fontWeight="800" fill="#34308f" fontFamily="Arial, sans-serif">
            Exclusive
          </text>
          <path
            d="M78 41c4 7 4 14 2 21"
            fill="none"
            stroke="#b0d312"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </svg>
      </div>

      {showText && (
        <div className="min-w-0">
          <div className={`${compact ? 'text-[1.45rem]' : 'text-[2rem]'} font-display leading-none tracking-[0.3em] text-[#b2466f] uppercase`}>
            MAA
          </div>
          <div className={`${compact ? 'text-[0.58rem]' : 'text-[0.72rem]'} font-body uppercase tracking-[0.45em] text-slate-500 mt-1`}>
            Fashtion Point
          </div>
        </div>
      )}
    </div>
  );
}
