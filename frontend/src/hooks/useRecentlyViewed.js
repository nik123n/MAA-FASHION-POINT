import { useState, useEffect } from 'react';

const STORAGE_KEY = 'maa_recently_viewed';
const MAX_ITEMS = 10;

/**
 * useRecentlyViewed — persists recently viewed product IDs to localStorage
 * Returns: { recentIds, addToRecent }
 */
export function useRecentlyViewed() {
  const [recentIds, setRecentIds] = useState([]);

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      setRecentIds(stored);
    } catch {
      setRecentIds([]);
    }
  }, []);

  const addToRecent = (productId) => {
    if (!productId) return;
    setRecentIds((prev) => {
      const filtered = prev.filter((id) => id !== productId); // Remove duplicate
      const updated = [productId, ...filtered].slice(0, MAX_ITEMS); // Add to top & cap at 10
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  return { recentIds, addToRecent };
}
