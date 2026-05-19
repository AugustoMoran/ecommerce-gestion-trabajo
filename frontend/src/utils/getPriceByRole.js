/**
 * Obtiene la moneda que debe ver el usuario según su rol
 * Admin, Tecnico, Despachante, Gremio: USD
 * Usuarios normales: ARS
 */
export const getCurrencyByRole = (userRole) => {
  const usdRoles = ['admin', 'tecnico', 'despachante', 'gremio'];
  return userRole && usdRoles.includes(userRole) ? 'USD' : 'ARS';
};

/**
 * Obtiene el precio a mostrar según el rol del usuario CON CONVERSIÓN automática
 * Admin, Tecnico, Despachante: ven precios en USD
 * Usuarios normales (gremio, user): ven precios en ARS
 */
export const getPriceByRole = (product, userRole, exchangeRate = 1000) => {
  if (!product) return 0;
  
  const currency = getCurrencyByRole(userRole);
  const isUSD = currency === 'USD';
  
  if (isUSD) {
    // Mostrar en USD: prioridad oferta > precio normal > conversión
    if (product.priceOfferUSD && product.priceOfferUSD > 0) {
      return product.priceOfferUSD;
    }
    if (product.priceUSD && product.priceUSD > 0) {
      return product.priceUSD;
    }
    // Fallback: convertir ARS a USD
    if (product.pricePesos && product.pricePesos > 0) {
      return Math.round((product.pricePesos / exchangeRate) * 100) / 100;
    }
    return 0;
  } else {
    // Mostrar en ARS: prioridad oferta > precio normal > conversión
    if (product.priceOfferPesos && product.priceOfferPesos > 0) {
      return product.priceOfferPesos;
    }
    if (product.pricePesos && product.pricePesos > 0) {
      return product.pricePesos;
    }
    // Fallback: convertir USD a ARS
    if (product.priceUSD && product.priceUSD > 0) {
      return Math.round(product.priceUSD * exchangeRate * 100) / 100;
    }
    return 0;
  }
};

/**
 * Retorna precio + moneda
 */
export const getPriceWithCurrency = (product, userRole, exchangeRate = 1000) => {
  return {
    price: getPriceByRole(product, userRole, exchangeRate),
    currency: getCurrencyByRole(userRole)
  };
};

/**
 * Obtiene el precio original (sin oferta) para cálculo de descuento
 */
export const getOriginalPriceByRole = (product, userRole, exchangeRate = 1000) => {
  if (!product) return 0;
  
  const usdRoles = ['admin', 'tecnico', 'despachante'];
  
  if (userRole && usdRoles.includes(userRole)) {
    // Precio original en USD
    if (product.priceUSD && product.priceUSD > 0) {
      return product.priceUSD;
    }
    if (product.pricePesos && product.pricePesos > 0) {
      return Math.round((product.pricePesos / exchangeRate) * 100) / 100;
    }
    return 0;
  } else {
    // Precio original en ARS
    if (product.pricePesos && product.pricePesos > 0) {
      return product.pricePesos;
    }
    if (product.priceUSD && product.priceUSD > 0) {
      return Math.round(product.priceUSD * exchangeRate * 100) / 100;
    }
    return 0;
  }
};

/**
 * Para admin: obtiene ambos precios
 */
export const getBothPrices = (product, exchangeRate = 1000) => {
  if (!product) return { usd: 0, ars: 0 };
  
  let usd = 0;
  let ars = 0;
  
  // USD
  if (product.priceOfferUSD && product.priceOfferUSD > 0) {
    usd = product.priceOfferUSD;
  } else if (product.priceUSD && product.priceUSD > 0) {
    usd = product.priceUSD;
  } else if (product.pricePesos && product.pricePesos > 0) {
    usd = Math.round((product.pricePesos / exchangeRate) * 100) / 100;
  }
  
  // ARS
  if (product.priceOfferPesos && product.priceOfferPesos > 0) {
    ars = product.priceOfferPesos;
  } else if (product.pricePesos && product.pricePesos > 0) {
    ars = product.pricePesos;
  } else if (product.priceUSD && product.priceUSD > 0) {
    ars = Math.round(product.priceUSD * exchangeRate * 100) / 100;
  }
  
  return { usd, ars };
};

/**
 * Obtiene label del precio (USD o ARS)
 */
export const getPriceLabelByRole = (userRole) => {
  const usdRoles = ['admin', 'tecnico', 'despachante'];
  if (userRole && usdRoles.includes(userRole)) {
    return 'USD';
  }
  return 'ARS';
};

