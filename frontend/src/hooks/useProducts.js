import { useCallback, useEffect, useState } from 'react';
import { getProducts } from '../api/products.js';

export default function useProducts() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getProducts();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { products, setProducts, loading, error, refresh };
}

export function uniqueCategories(products) {
  const set = new Set();
  for (const p of products) {
    if (p.category) set.add(p.category);
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
