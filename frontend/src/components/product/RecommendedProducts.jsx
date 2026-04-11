import React, { useState, useEffect, useRef, useCallback } from 'react';
import api from '../../utils/api';
import ProductCard from './ProductCard'; // Existing card

const RecommendedProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [limit, setLimit] = useState(10); // initial limit
  const observer = useRef();
  
  const fetchRecommendations = async (currentLimit) => {
    try {
      setLoading(true);
      const response = await api.get(`/recommendations?limit=${currentLimit}`);
      
      if (response.data.success) {
        const fetchedProducts = response.data.data;
        // Check if we didn't get any NEW products
        if (fetchedProducts.length === products.length) {
          setHasMore(false);
        }
        setProducts(fetchedProducts);
      }
    } catch (error) {
      console.error('Failed to load recommendations', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations(limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  const lastProductElementRef = useCallback(node => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setLimit(prev => prev + 10);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  if (!loading && products.length === 0) return null;

  return (
    <div className="w-full py-8 mt-12 border-t border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          Recommended For You
        </h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {products.map((product, index) => {
            if (products.length === index + 1) {
              return (
                <div ref={lastProductElementRef} key={product.id}>
                  <ProductCard product={product} />
                </div>
              );
            } else {
              return (
                <div key={product.id}>
                  <ProductCard product={product} />
                </div>
              );
            }
          })}
        </div>
        
        {loading && (
          <div className="flex justify-center items-center py-6">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecommendedProducts;
