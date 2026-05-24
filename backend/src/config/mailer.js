const sgMail = require('@sendgrid/mail');
const logger = require('../utils/logger');

// Verify API key is set
if (!process.env.SENDGRID_API_KEY) {
  console.warn('⚠️ WARNING: SENDGRID_API_KEY not configured');
} else {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  console.log('✅ SendGrid API Key loaded');
}

// Create a compatible transporter interface for nodemailer compatibility
const transporter = {
  sendMail: async (options) => {
    try {
      console.log('📧 [SendGrid] Preparing email to:', options.to);
      
      const fromEmail = options.from || process.env.SENDGRID_FROM_EMAIL || 'administracion@sausansystem.com.ar';
      
      const msg = {
        to: options.to,
        from: fromEmail,
        subject: options.subject,
        html: options.html,
        replyTo: fromEmail,
      };

      console.log('📧 [SendGrid] Message config:', { to: msg.to, from: msg.from, subject: msg.subject });

      // Handle attachments if present
      if (options.attachments && options.attachments.length > 0) {
        console.log(`📎 [SendGrid] Processing ${options.attachments.length} attachment(s)`);
        msg.attachments = options.attachments.map((att) => {
          const content = typeof att.content === 'string' 
            ? att.content 
            : att.content.toString('base64');
          
          return {
            content: content,
            filename: att.filename,
            type: att.contentType || 'application/octet-stream',
            disposition: 'attachment',
          };
        });
      }

      console.log('📧 [SendGrid] Sending email...');
      const result = await sgMail.send(msg);
      console.log('✅ [SendGrid] Email sent successfully');
      
      return {
        messageId: result[0]?.headers?.['x-message-id'] || 'sendgrid-sent',
        response: result,
      };
    } catch (error) {
      console.error('❌ [SendGrid] Send error:', error);
      console.error('❌ [SendGrid] Error code:', error.code);
      console.error('❌ [SendGrid] Error response:', error.response?.body || error.response || 'No response');
      console.error('❌ [SendGrid] Full error:', JSON.stringify(error, null, 2));
      
      logger.error('SendGrid error', { 
        message: error.message,
        code: error.code,
        response: error.response?.body || error.response,
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
    console.warn('⚠️ Mailer config error:', error.message);
    logger.warn('Mailer config error', { message: error.message });
  } else {
    console.log('✅ Mailer ready - using SendGrid');
    logger.info('Mailer ready - using SendGrid');
  }
});

module.exports = transporter;
