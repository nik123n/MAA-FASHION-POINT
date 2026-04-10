import { useState, useEffect } from 'react';

/**
 * useDebounce — delays propagating a value change until after `delay` ms
 * Usage: const debouncedSearch = useDebounce(searchInput, 400);
 */
export function useDebounce(value, delay = 400) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer); // Cleanup on every new keystroke
  }, [value, delay]);

  return debouncedValue;
}
