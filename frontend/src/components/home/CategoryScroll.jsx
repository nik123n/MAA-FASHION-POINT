import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

const categories = [
  { name: '3 Piece', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=120&h=120&fit=crop' },
  { name: '3 Piece Pair', image: 'https://images.unsplash.com/photo-1583391733981-8498408ee4b6?w=120&h=120&fit=crop' },
  { name: 'Short Top', image: 'https://images.unsplash.com/photo-1485462537746-965f33f7f6a7?w=120&h=120&fit=crop' },
  { name: '2 Piece', image: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=120&h=120&fit=crop' },
  { name: 'Tunic Top', image: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=120&h=120&fit=crop' },
  { name: 'Cotton Tunic Top', image: 'https://images.unsplash.com/photo-1496747611176-843222e1e57c?w=120&h=120&fit=crop' },
  { name: 'Long Top', image: 'https://images.unsplash.com/photo-1529139574466-a303027c1d8b?w=120&h=120&fit=crop' },
  { name: 'Cord Set', image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=120&h=120&fit=crop' },
  { name: 'Plazo Pair', image: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=120&h=120&fit=crop' },
  { name: 'Kurti Plazo Dupata', image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=120&h=120&fit=crop' },
  { name: 'Kurti Pent Dupata', image: 'https://images.unsplash.com/photo-1583391733981-8498408ee4b6?w=120&h=120&fit=crop' },
  { name: 'Cotton Straight Pent', image: 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?w=120&h=120&fit=crop' },
];

export default function CategoryScroll() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category');

  return (
    <div className="bg-white py-4 mb-2 shadow-sm border-b border-gray-100">
      <div className="flex overflow-x-auto scrollbar-hide px-4 gap-4 items-start pb-2">
        {categories.map((cat, index) => {
          const isActive = currentCategory === cat.name;
          return (
            <button
              key={index}
              onClick={() => navigate(`/products?category=${encodeURIComponent(cat.name)}`)}
              className="flex flex-col items-center min-w-[72px] max-w-[72px] gap-2 group outline-none"
            >
              <div className={`w-16 h-16 rounded-full overflow-hidden border-2 shadow-sm p-0.5 transition-colors ${isActive ? 'border-accent-500 bg-accent-50' : 'border-gray-200 group-hover:border-accent-300'}`}>
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover rounded-full"
                />
              </div>
              <span className={`text-[11px] font-medium text-center leading-tight transition-colors ${isActive ? 'text-accent-600 font-bold' : 'text-gray-700 group-hover:text-accent-600'}`}>
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
