/**
 * Centralized frontend configuration.
 *
 * All VITE_ environment variables are read here once.
 * Import from this file instead of using import.meta.env directly across components.
 *
 * To customize for a new client, only the .env.local file needs to change.
 */

const config = {
  // API
  apiUrl: import.meta.env.VITE_API_URL || '/api',

  // Store branding
  storeName: import.meta.env.VITE_STORE_NAME || 'Tienda Online',

  // Social media / contact (random defaults until configured)
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000',
  instagramUrl: import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'contacto@tienda.com',
  contactPhone: import.meta.env.VITE_CONTACT_PHONE || '+54 9 11 0000-0000',

  // Store info
  sucursal1Nombre: import.meta.env.VITE_SUCURSAL_1_NOMBRE || 'Sucursal 1',
  sucursal1Direccion: import.meta.env.VITE_SUCURSAL_1_DIRECCION || 'Dirección por configurar',
  sucursal1Detalles: import.meta.env.VITE_SUCURSAL_1_DETALLES || '',

  sucursal2Nombre: import.meta.env.VITE_SUCURSAL_2_NOMBRE || 'Sucursal 2',
  sucursal2Direccion: import.meta.env.VITE_SUCURSAL_2_DIRECCION || 'Dirección por configurar',
  sucursal2Detalles: import.meta.env.VITE_SUCURSAL_2_DETALLES || '',

  // Logo (optional - null if not configured)
  logoUrl: import.meta.env.VITE_LOGO_URL || null,
};

export default config;
