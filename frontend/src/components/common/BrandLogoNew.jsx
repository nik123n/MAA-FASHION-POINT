import React from 'react';

export default function BrandLogoNew({ className = '', showText = true, compact = false }) {
  // Adjust logo size naturally based on whether we are in a compact navbar or a larger hero section.
  const sizeClass = compact ? 'w-14 h-14' : 'w-24 h-24';
  
  // Use Vite's base URL variable to dynamically correctly route to the public assets folder
  const logoUrl = `${import.meta.env.BASE_URL}MAA.svg`;

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`${sizeClass} rounded-full bg-white shadow-[0_4px_12px_rgba(31,50,122,0.12)] shrink-0 overflow-hidden`}>
        <img
          src={logoUrl}
          alt="MAA Fashion Point logo"
          className="w-full h-full object-contain bg-white p-1"
        />
      </div>

      {showText && (
        <div className="min-w-0 flex flex-col justify-center">
          <div className={`${compact ? 'text-[1.1rem] sm:text-[1.3rem]' : 'text-[1.5rem] sm:text-[2rem]'} font-bold leading-none text-[#e1261c] tracking-tight`}>
            MAA <span className="text-[#58a90a]">FASHION POINT</span>
          </div>
          <div className={`${compact ? 'text-[0.65rem] sm:text-[0.8rem]' : 'text-[0.9rem] sm:text-[1rem]'} font-semibold text-[#34308f] mt-1`}>
            Exclusive for Women
          </div>
        </div>
      )}
    </div>
  );
}
