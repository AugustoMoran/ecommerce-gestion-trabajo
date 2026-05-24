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
  storeName: import.meta.env.VITE_STORE_NAME || 'Sausansystem',

  // Social media / contact (random defaults until configured)
  whatsappNumber: import.meta.env.VITE_WHATSAPP_NUMBER || '5491100000000',
  instagramUrl: import.meta.env.VITE_INSTAGRAM_URL || 'https://instagram.com/sausansystem',
  contactEmail: import.meta.env.VITE_CONTACT_EMAIL || 'sausansystem@gmail.com',
  contactPhone: import.meta.env.VITE_CONTACT_PHONE || '+54 9 11 0000-0000',

  // Logo (optional - null if not configured)
  logoUrl: import.meta.env.VITE_LOGO_URL || '/logoparventana.png',
};

export default config;
