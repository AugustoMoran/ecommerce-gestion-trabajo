require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');
const { validateConfig } = require('./src/utils/validateConfig');

const PORT = process.env.PORT || 5000;

const start = async () => {
  // Validate configuration before starting
  try {
    validateConfig();
  } catch (configError) {
    logger.error('Configuration validation failed', { error: configError.message });
    process.exit(1);
  }

  await connectDB();

  app.listen(PORT, '0.0.0.0', () => {
    logger.info(`Server running`, { mode: process.env.NODE_ENV, port: PORT });
    logger.info(`API ready at http://localhost:${PORT}/api`);
  });
};

start().catch((err) => {
  logger.error('Failed to start server', { message: err.message });
  process.exit(1);
});
