import React from 'react';
import { HiOutlinePhone } from 'react-icons/hi2';

/**
 * Botón WhatsApp para contactar sobre instalación
 * Abre WhatsApp con mensaje pre-compilado
 */
const WhatsAppInstallationButton = ({ product, userZone }) => {
  const whatsappNumber = process.env.REACT_APP_WHATSAPP_PHONE || process.env.REACT_APP_WHATSAPP_NUMBER;

  if (!whatsappNumber) {
    console.warn('WhatsApp number not configured in .env');
    return null;
  }

  const message = `Hola 👋 Me interesa el producto *${product.nombre}* (${product.priceUSD} USD) ${
    product.hasInstallation && userZone
      ? `con el servicio de instalación en ${userZone}. ¿Cuál sería el presupuesto?`
      : '. ¿Puedo obtener más información?'
  }`;

  const whatsappLink = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
    >
      <HiOutlinePhone size={18} />
      Consultar por WhatsApp
    </a>
  );
};

export default WhatsAppInstallationButton;
