import { useGetCurrentQuoteQuery } from '../services/quoteApi';
import { useSelector } from 'react-redux';

/**
 * Hook para conversión de precios según rol del usuario
 * Uso: const displayPrice = usePriceConversion(product.priceUSD, product.price)
 */
export const usePriceConversion = (priceUSD, priceARS = null) => {
  const { data: quoteData } = useGetCurrentQuoteQuery();
  const user = useSelector((state) => state.auth.user);

  if (!priceUSD && !priceARS) {
    return { formatted: 'N/A', raw: 0, currency: 'ARS' };
  }

  // Roles que ven en USD
  const usdRoles = ['admin', 'tecnico', 'despachante', 'gremio'];
  
  if (usdRoles.includes(user?.role)) {
    return {
      formatted: `$${priceUSD.toFixed(2)} USD`,
      raw: priceUSD,
      currency: 'USD',
    };
  }

  // User normal: convertir a ARS
  if (user?.role === 'user' || !user) {
    const quote = quoteData?.quotePesosPerDollar || 1;
    const priceInARS = priceUSD * quote;

    return {
      formatted: `$${priceInARS.toLocaleString('es-AR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })} ARS`,
      raw: priceInARS,
      currency: 'ARS',
    };
  }

  // Fallback
  return {
    formatted: `$${priceUSD.toFixed(2)} USD`,
    raw: priceUSD,
    currency: 'USD',
  };
};

/**
 * Hook para obtener solo el valor numérico convertido
 */
export const usePriceValue = (priceUSD) => {
  const { data: quoteData } = useGetCurrentQuoteQuery();
  const user = useSelector((state) => state.auth.user);

  const usdRoles = ['admin', 'tecnico', 'despachante', 'gremio'];

  if (usdRoles.includes(user?.role)) {
    return priceUSD;
  }

  if (user?.role === 'user' || !user) {
    const quote = quoteData?.quotePesosPerDollar || 1;
    return priceUSD * quote;
  }

  return priceUSD;
};

export default usePriceConversion;
