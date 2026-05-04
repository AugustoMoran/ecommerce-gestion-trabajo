const cloudinary = require('cloudinary').v2;
const logger = require('../utils/logger');

// Initialize cloudinary with environment variables
const initCloudinary = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true,
    });

    const config = cloudinary.config();
    if (!config.cloud_name || !config.api_key || !config.api_secret) {
      logger.warn('Cloudinary: one or more credentials are missing', {
        cloud_name: !!config.cloud_name,
        api_key: !!config.api_key,
        api_secret: !!config.api_secret,
      });
    } else {
      logger.info('Cloudinary initialized', { cloud_name: config.cloud_name });
    }
  } catch (err) {
    logger.error('Cloudinary initialization error', { message: err.message });
  }

  return cloudinary;
};

// Initialize on module load
initCloudinary();

/**
 * Returns current Cloudinary storage usage in MB and percentage of limit.
 */
const getStorageUsage = async () => {
  logger.debug('Fetching Cloudinary storage usage');

  try {
    const result = await cloudinary.api.usage();

    const usedMB = result.storage.usage / (1024 * 1024);
    const limitMB = result.credits?.limit
      ? Math.round(result.credits.limit * 1024)
      : parseInt(process.env.CLOUDINARY_STORAGE_LIMIT_MB || '25000', 10);
    const percentage = result.credits?.used_percent ?? (usedMB / limitMB) * 100;

    logger.debug('Storage usage retrieved', { usedMB: usedMB.toFixed(2), limitMB, percentage });
    return { usedMB: usedMB.toFixed(2), limitMB, percentage: parseFloat(percentage).toFixed(1) };
  } catch (err) {
    logger.error('Error getting Cloudinary storage usage', { message: err.message, status: err.http_code });

    // Try to verify credentials work with a lighter call
    try {
      await cloudinary.api.resources({ max_results: 1 });
      logger.warn('Cloudinary auth verified but usage() endpoint failed — may require account upgrade');
    } catch (fallbackErr) {
      logger.error('Cloudinary auth failed — check credentials', { message: fallbackErr.message });
    }

    return {
      usedMB: '0.00',
      limitMB: 25000,
      percentage: '0.0',
      error: 'Unable to fetch from Cloudinary API',
      available: false,
    };
  }
};

module.exports = { cloudinary, getStorageUsage, initCloudinary };
