/**
 * Centralized frontend configuration.
 *
 * All VITE_ environment variables are read here once.
 * Import from this file instead of using import.meta.env directly across components.
 *
 * To customize for a new client, only the .env file needs to change.
 */

const config = {
  // API
  apiUrl: import.meta.env.VITE_API_URL || '/api',

  // Store branding
  storeName: import.meta.env.VITE_STORE_NAME || 'Mi Tienda',

  // Social media / contact
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000',
  instagramUrl: import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/tutienda',
  tiktokUrl: import.meta.env.VITE_TIKTOK_URL || '',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || '',
  contactPhone: import.meta.env.VITE_CONTACT_PHONE || '',
};

export default config;
