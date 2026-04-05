import React, { useState } from 'react';

export default function BrandLogoNew({ className = '', showText = true, compact = false }) {
  const sizeClass = compact ? 'w-14 h-14' : 'w-20 h-20';
  const [imageFailed, setImageFailed] = useState(false);
  const imageSrc = '/MAA.svg';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClass} rounded-full bg-white shadow-[0_14px_40px_rgba(31,50,122,0.16)] ring-1 ring-[#d7def7] overflow-hidden shrink-0`}>
        {!imageFailed ? (
          <img
            src={imageSrc}
            alt="MAA Fashion Point logo"
            className="w-full h-full object-contain bg-white"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <svg viewBox="0 0 120 120" className="w-full h-full" role="img" aria-label="MAA Fashion Point logo">
            <rect width="120" height="120" fill="#ffffff" />
            <path
              d="M18 33c5-8 13-12 22-12 5 0 9 2 12 6 3 3 3 8 0 12-4 5-6 10-6 15v18c0 16-8 30-25 42-4 3-8-1-7-6l6-13-1-14c-1-16 0-31-1-48z"
              fill="#79bf22"
            />
            <path
              d="M28 38c5 10 6 19 4 30-3 17-8 31-15 44-8-7-12-17-12-31 0-17 8-31 23-43z"
              fill="#b8d10b"
            />
            <path
              d="M29 23c5-4 10-5 15-3 5 2 8 6 10 11 1 5 0 10-4 15-2-6-7-10-14-13-4-1-7-5-7-10z"
              fill="#34308f"
            />
            <path d="M35 36c-4 24-16 43-36 58" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <path d="M49 36c-2 28-9 53-22 76" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinecap="round" />
            <circle cx="73" cy="56" r="38" fill="none" stroke="#34308f" strokeWidth="8" />
            <path d="M102 48c4 10 4 22 0 33" fill="none" stroke="#67bb2e" strokeWidth="3" strokeLinecap="round" />
            <path
              d="M44 58c0-10 7-17 19-17h9v8h-7c-8 0-12 4-12 11 0 8 4 12 12 12h7v8h-9c-12 0-19-7-19-22z"
              fill="#e1261c"
            />
            <rect x="74" y="42" width="11" height="37" fill="#e1261c" />
            <rect x="87" y="42" width="11" height="37" fill="#e1261c" />
            <path d="M69 33c4 7 8 10 13 10 5 0 9-3 13-10" fill="none" stroke="#e1261c" strokeWidth="3" strokeLinecap="round" />
            <circle cx="82" cy="36" r="4" fill="#e1261c" />
            <text
              x="72"
              y="35"
              textAnchor="middle"
              fontSize="9"
              fontWeight="800"
              fill="#34308f"
              fontFamily="Arial, sans-serif"
              transform="rotate(-20 72 35)"
            >
              Caring of Every Women
            </text>
          </svg>
        )}
      </div>

      {showText && (
        <div className="min-w-0">
          <div className={`${compact ? 'text-[1.05rem]' : 'text-[1.6rem]'} font-display leading-none tracking-[0.06em] text-[#e1261c]`}>
            MAA <span className="text-[#58a90a]">Fashion Point</span>
          </div>
          <div className={`${compact ? 'text-[0.55rem]' : 'text-[0.78rem]'} font-body font-semibold tracking-[0.02em] text-[#34308f] mt-1`}>
            Exclusive for Women
          </div>
        </div>
      )}
    </div>
  );
}
