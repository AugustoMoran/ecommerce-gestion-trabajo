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

  // Agregar nota sobre monedas si hay mezcla
  let currencyNote = '';
  if (currencyValidation.hasMixedCurrencies) {
    currencyNote = `\n\n⚠️ *Nota:* Este pedido tiene productos en USD y ARS. Acordaremos el pago en WhatsApp.`;
  } else if (currencies.length === 1 && currencies[0] === 'USD') {
    currencyNote = `\n\n💵 *Moneda:* USD`;
  }

  const message = encodeURIComponent(
    `🛒 *Nuevo pedido desde la tienda*\n\n${itemsList}\n\n*Total: $${total.toFixed(2)}*${currencyNote}\n\n¡Quiero finalizar mi compra!`
  );

  return `https://wa.me/${number}?text=${message}`;
};
