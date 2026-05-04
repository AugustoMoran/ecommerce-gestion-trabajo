require('dotenv').config();
const app = require('./app');
const connectDB = require('./src/config/db');
const logger = require('./src/utils/logger');

const PORT = process.env.PORT || 5000;

const start = async () => {
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
