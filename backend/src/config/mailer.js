const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

// Initialize SendGrid
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Create a compatible transporter interface for nodemailer compatibility
const transporter = {
  sendMail: async (options) => {
    try {
      const msg = {
        to: options.to,
        from: options.from || process.env.SENDGRID_FROM_EMAIL || 'administracion@sausansystem.com.ar',
        subject: options.subject,
        html: options.html,
      };

      // Handle attachments if present
      if (options.attachments && options.attachments.length > 0) {
        msg.attachments = options.attachments.map((att) => ({
          content: att.content.toString('base64'),
          filename: att.filename,
          type: att.contentType || 'application/octet-stream',
          disposition: 'attachment',
        }));
      }

      const result = await sgMail.send(msg);

      return {
        messageId: result[0]?.headers?.['x-message-id'] || 'sendgrid-sent',
        response: result,
      };
    } catch (error) {
      logger.error('SendGrid error', { 
        message: error.message,
        to: options.to,
      });
      throw error;
    }
  },

  verify: (callback) => {
    if (process.env.SENDGRID_API_KEY) {
      callback(null, true);
      logger.info('SendGrid mailer ready');
    } else {
      const error = new Error('SENDGRID_API_KEY not configured');
      callback(error);
      logger.warn('SendGrid mailer config error', { message: error.message });
    }
  },
};

// Run verification
transporter.verify((error) => {
  if (error) {
    logger.warn('Mailer config error', { message: error.message });
  } else {
    logger.info('Mailer ready - using SendGrid');
  }
});

module.exports = transporter;
