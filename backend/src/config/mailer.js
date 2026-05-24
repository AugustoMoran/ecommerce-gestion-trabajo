const { Resend } = require('resend');
const logger = require('../utils/logger');

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Create a compatible transporter interface
const transporter = {
  sendMail: async (options) => {
    try {
      // Map nodemailer options to Resend format
      const result = await resend.emails.send({
        from: options.from || `noreply@sausansystem.com`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        // Attachments support (if needed)
        ...(options.attachments && options.attachments.length > 0 && {
          attachments: options.attachments.map(att => ({
            filename: att.filename,
            content: att.content.toString('base64'),
            contentType: att.contentType || 'application/octet-stream',
          })),
        }),
      });

      if (result.error) {
        throw new Error(`Resend error: ${result.error.message}`);
      }

      return {
        messageId: result.data?.id || 'unknown',
        response: result.data,
      };
    } catch (error) {
      logger.error('Resend send error', { 
        message: error.message,
        to: options.to,
      });
      throw error;
    }
  },

  verify: (callback) => {
    // Simple verification - just check if API key exists
    if (process.env.RESEND_API_KEY) {
      callback(null, true);
      logger.info('Resend mailer ready');
    } else {
      const error = new Error('RESEND_API_KEY not configured');
      callback(error);
      logger.warn('Resend mailer config error', { message: error.message });
    }
  },
};

// Run verification
transporter.verify((error) => {
  if (error) {
    logger.warn('Mailer config error', { message: error.message });
  } else {
    logger.info('Mailer ready');
  }
});

module.exports = transporter;
