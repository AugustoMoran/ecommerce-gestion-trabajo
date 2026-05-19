import { useState, useEffect } from 'react';

/**
 * Hook para obtener la cotización del dólar desde el backend
 */
export const useExchangeRate = () => {
  const [rate, setRate] = useState(1000);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/settings/exchange-rate');
        if (!response.ok) throw new Error('Error fetching exchange rate');
        const data = await response.json();
        setRate(data.rate || 1000);
      } catch (err) {
        console.error('Error fetching exchange rate:', err);
        setError(err.message);
        setRate(1000); // Default rate
      } finally {
        setLoading(false);
      }
    };

    fetchRate();
  }, []);

  return { rate, loading, error };
};
