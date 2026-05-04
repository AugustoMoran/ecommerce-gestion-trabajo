const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

transporter.verify((error) => {
  if (error) {
    logger.warn('Mailer config error', { message: error.message });
  } else {
    logger.info('Mailer ready');
  }
});

module.exports = transporter;
