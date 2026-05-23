/**
 * Configuration Validation Utility
 * Checks that all required environment variables are set correctly
 */

const logger = require('./logger');

const REQUIRED_VARS = [
  { name: 'PORT', default: '5000' },
  { name: 'NODE_ENV', required: true },
  { name: 'MONGO_URI', required: true },
  { name: 'JWT_SECRET', required: true },
  { name: 'CLOUDINARY_CLOUD_NAME', required: true },
  { name: 'CLOUDINARY_API_KEY', required: true },
  { name: 'CLOUDINARY_API_SECRET', required: true },
  { name: 'MP_ACCESS_TOKEN', required: true, critical: true }, // ← Mercado Pago
  { name: 'FRONTEND_URL', required: true },
  { name: 'BACKEND_URL', required: true },
  { name: 'SMTP_HOST', required: true },
  { name: 'SMTP_USER', required: true },
  { name: 'SMTP_PASS', required: true },
];

const validateConfig = () => {
  logger.info('━━━ VALIDATING CONFIGURATION ━━━');
  
  const missingVars = [];
  const invalidVars = [];
  const validVars = [];

  REQUIRED_VARS.forEach(({ name, required, critical, default: defaultVal }) => {
    const value = process.env[name];
    
    if (!value) {
      if (required || critical) {
        missingVars.push({
          name,
          critical: critical || false,
        });
        logger.error(`❌ MISSING: ${name}`, { critical });
      }
      return;
    }

    // Specific validations
    if (name === 'MP_ACCESS_TOKEN') {
      if (!value.startsWith('APP_USR-')) {
        invalidVars.push({
          name,
          reason: 'Should start with APP_USR-',
          value: value.substring(0, 20) + '...',
        });
        logger.error(`❌ INVALID: ${name} - Should start with APP_USR-`, {
          actual: value.substring(0, 30) + '...',
        });
        return;
      }
      if (value.length < 50) {
        invalidVars.push({
          name,
          reason: 'Token too short',
          value: value.substring(0, 20) + '...',
        });
        logger.error(`❌ INVALID: ${name} - Token appears too short (${value.length} chars)`, {});
        return;
      }
    }

    if (name === 'MONGO_URI') {
      if (!value.includes('mongodb')) {
        invalidVars.push({
          name,
          reason: 'Not a valid MongoDB URI',
        });
        logger.error(`❌ INVALID: ${name} - Should contain 'mongodb'`, {});
        return;
      }
    }

    if (name === 'FRONTEND_URL' || name === 'BACKEND_URL') {
      if (!value.startsWith('http://') && !value.startsWith('https://')) {
        invalidVars.push({
          name,
          reason: 'Should start with http:// or https://',
          value,
        });
        logger.error(`❌ INVALID: ${name} - Should start with http:// or https://`, {
          actual: value,
        });
        return;
      }
    }

    validVars.push(name);
    logger.info(`✅ ${name}: ${value.substring(0, 30)}${value.length > 30 ? '...' : ''}`);
  });

  // Summary
  logger.info('━━━ CONFIGURATION SUMMARY ━━━');
  logger.info(`✅ Valid variables: ${validVars.length}/${REQUIRED_VARS.filter(v => v.required).length}`, {
    vars: validVars.slice(0, 5).join(', ') + (validVars.length > 5 ? '...' : ''),
  });

  if (missingVars.length > 0) {
    logger.error(`❌ Missing variables: ${missingVars.length}`, {
      critical: missingVars.filter(v => v.critical).length,
      variables: missingVars.map(v => v.name),
    });
  }

  if (invalidVars.length > 0) {
    logger.error(`❌ Invalid variables: ${invalidVars.length}`, {
      variables: invalidVars.map(v => `${v.name} (${v.reason})`),
    });
  }

  const criticalMissing = missingVars.filter(v => v.critical);
  if (criticalMissing.length > 0) {
    const error = `❌ CRITICAL CONFIG ERROR: Missing ${criticalMissing.map(v => v.name).join(', ')}`;
    logger.error(error, { critical: true });
    throw new Error(error);
  }

  if (invalidVars.length > 0) {
    const error = `❌ CONFIG ERROR: Invalid variables - ${invalidVars.map(v => v.name).join(', ')}`;
    logger.error(error);
    throw new Error(error);
  }

  logger.info('✅ Configuration validation passed!');
};

module.exports = { validateConfig };
