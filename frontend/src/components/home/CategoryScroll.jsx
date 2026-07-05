import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

// ─── CATEGORY IMAGES ─────────────────────────────────────────────────────────
// All images are from the uploaded product photos stored in /categories/
// Same sequence as category cards: 3 Piece → Cotton Straight Pent
const CATEGORIES = [
  { name: '3 Piece',             image: '/categories/3-piece.png',      link: '3 Piece'             },
  { name: '3 Piece Pair',        image: '/categories/3-piece-pair.png', link: '3 Piece Pair'        },
  { name: 'Short Top',           image: '/categories/short-top.png',    link: 'Short Top'           },
  { name: '2 Piece',             image: '/categories/2-piece.png',      link: '2 Piece'             },
  { name: 'Tunic Top',           image: '/categories/tunic-top.png',    link: 'Tunic Top'           },
  { name: 'Cotton Tunic Top',    image: '/categories/cotton-tunic.png', link: 'Cotton Tunic Top'    },
  { name: 'Long Top',            image: '/categories/long-top.png',     link: 'Long Top'            },
  { name: 'Cord Set',            image: '/categories/cord-set.png',     link: 'Cord Set'            },
  { name: 'Plazo Pair',          image: '/categories/plazo-pair.png',   link: 'Plazo Pair'          },
  { name: 'Kurti Plaza Dupata',  image: '/categories/kurti-plazo.png',  link: 'Kurti Plaza Dupata'  },
  { name: 'Kurti Pent Dupata',   image: '/categories/kurti-pent.png',   link: 'Kurti Pent Dupata'   },
  { name: 'Cotton Straight Pent',image: '/categories/cotton-pent.png',  link: 'Cotton Straight Pent'},
];

export default function CategoryScroll() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const currentCategory = searchParams.get('category');

  return (
    <div className="bg-white py-4 mb-2 shadow-sm border-b border-gray-100">
      <div className="flex overflow-x-auto scrollbar-hide px-4 gap-5 items-start pb-2">
        {CATEGORIES.map((cat) => {
          const isActive = currentCategory === cat.link;
          return (
            <button
              key={cat.name}
              onClick={() => navigate(`/products?category=${encodeURIComponent(cat.link)}`)}
              className="flex flex-col items-center min-w-[76px] max-w-[76px] gap-1.5 group outline-none"
              aria-label={`Browse ${cat.name}`}
            >
              {/* ── CIRCLE ── */}
              <div
                className={`
                  w-[72px] h-[72px] rounded-full overflow-hidden shrink-0
                  border-[2.5px] shadow-md
                  transition-all duration-300 ease-out
                  group-hover:scale-105 group-hover:shadow-lg
                  ${isActive
                    ? 'border-violet-500 ring-2 ring-violet-200 ring-offset-1'
                    : 'border-gray-200 group-hover:border-violet-400'
                  }
                `}
              >
                <img
                  src={cat.image}
                  alt={cat.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover object-top"
                  style={{ display: 'block' }}
                />
              </div>

              {/* ── LABEL ── */}
              <span
                className={`
                  text-[10.5px] font-medium text-center leading-tight
                  transition-colors duration-200 line-clamp-2
                  ${isActive
                    ? 'text-violet-600 font-semibold'
                    : 'text-gray-600 group-hover:text-violet-500'
                  }
                `}
              >
                {cat.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
