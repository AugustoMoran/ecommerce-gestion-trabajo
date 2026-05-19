/**
 * Detecta la moneda de un producto basado en los campos de precio disponibles
 * Retorna: 'USD' | 'ARS' | null
 */
export const detectProductCurrency = (product) => {
  if (!product) return null;

  // Prioridad: si tiene priceUSD o precioOferta/precio en USD, es USD
  if (product.priceUSD || product.priceOfferUSD) {
    return 'USD';
  }

  // Si tiene pricePesos o precioOferta/precio en pesos, es ARS
  if (product.pricePesos || product.priceOfferPesos) {
    return 'ARS';
  }

  // Si tiene los campos numéricos de USD/ARS
  if (product.priceUSD > 0) {
    return 'USD';
  }
  if (product.pricePesos > 0) {
    return 'ARS';
  }

  // Si solo tiene precio/precioOferta, asumir pesos por defecto
  if (product.precio || product.precioOferta) {
    return 'ARS';
  }

  return null;
};

/**
 * Obtiene el precio del producto en su moneda correspondiente
 */
export const getProductPrice = (product) => {
  if (!product) return 0;

  const currency = detectProductCurrency(product);

  if (currency === 'USD') {
    return Number(product.priceOfferUSD || product.priceUSD || 0) || 0;
  }

  // ARS o default
  return Number(product.precioOferta || product.precio || product.priceOfferPesos || product.pricePesos || 0) || 0;
};

/**
 * Agrupa items del carrito por moneda
 * Retorna: { USD: [...items], ARS: [...items] }
 */
export const groupCartItemsByCurrency = (items) => {
  return items.reduce(
    (acc, item) => {
      const currency = detectProductCurrency(item.producto) || 'ARS';
      if (!acc[currency]) acc[currency] = [];
      acc[currency].push(item);
      return acc;
    },
    {}
  );
};

/**
 * Valida si el carrito tiene mezcla de monedas
 * Retorna: { hasMixedCurrencies: boolean, currencies: string[] }
 */
export const validateCartCurrencies = (items) => {
  const grouped = groupCartItemsByCurrency(items);
  const currencies = Object.keys(grouped).filter(key => grouped[key].length > 0);

  return {
    hasMixedCurrencies: currencies.length > 1,
    currencies,
    groupedByC: grouped,
  };
};
