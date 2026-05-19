import config from '../config/app';
import { detectProductCurrency, getProductPrice, validateCartCurrencies } from './detectCurrency';

export const generateWhatsAppLink = (items, total, phone) => {
  const number = phone || config.whatsappNumber;
  
  // Detectar monedas en el carrito
  const currencyValidation = validateCartCurrencies(items);
  const currencies = currencyValidation.currencies.length > 0 ? currencyValidation.currencies : ['ARS'];
  
  const itemsList = items
    .map((i) => {
      const currency = detectProductCurrency(i.producto) || 'ARS';
      const price = getProductPrice(i.producto);
      let itemText = `• ${i.producto?.nombre || i.nombre} x${i.cantidad}`;
      if (i.talla) itemText += ` - Talla: ${i.talla}`;
      if (i.color) itemText += ` - Color: ${i.color}`;
      itemText += ` = $${(price * i.cantidad).toFixed(2)} ${currency}`;
      return itemText;
    })
    .join('\n');

  // Compute per-currency totals from items (source of truth)
  const totalsByCurrency = items.reduce((acc, i) => {
    const currency = detectProductCurrency(i.producto) || 'ARS';
    const price = getProductPrice(i.producto);
    acc[currency] = (acc[currency] || 0) + price * i.cantidad;
    return acc;
  }, {});

  const totalLines = Object.entries(totalsByCurrency)
    .map(([cur, amt]) => cur === 'USD' ? `USD $${amt.toFixed(2)}` : `$${amt.toFixed(2)} ARS`)
    .join(' + ');

  // Agregar nota sobre monedas si hay mezcla
  let currencyNote = '';
  if (currencyValidation.hasMixedCurrencies) {
    currencyNote = `\n\n⚠️ *Nota:* Pedido con productos en USD y ARS. Coordinaremos el pago.`;
  } else if (currencyValidation.currencies[0] === 'USD') {
    currencyNote = `\n\n💵 *Moneda:* USD`;
  }

  const message = encodeURIComponent(
    `🛒 *Nuevo pedido desde la tienda*\n\n${itemsList}\n\n*Total: ${totalLines}*${currencyNote}\n\n¡Quiero finalizar mi compra!`
  );

  return `https://wa.me/${number}?text=${message}`;
};
