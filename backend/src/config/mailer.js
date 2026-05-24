const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Gmail configuration with app password
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: 'sausansystem@gmail.com',
    pass: 'eflo zqxv fyft yvct', // Gmail app password
  },
});

console.log('🔑 [Mailer Init] Gmail SMTP configured for sausansystem@gmail.com');

// Verify transporter
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ [Gmail] Verification failed:', error);
    logger.error('Gmail mailer verification failed', { message: error.message });
  } else {
    console.log('✅ [Gmail] Server is ready to send emails from sausansystem@gmail.com');
    logger.info('Gmail mailer ready');
  }
});

// Export transporter with enhanced methods
const enhancedTransporter = {
  sendMail: async (options) => {
    try {
      console.log('📧 [Gmail] Preparing email to:', options.to);
      
      const fromEmail = options.from || 'sausansystem@gmail.com';
      
      const mailOptions = {
        from: `Sausansystem <${fromEmail}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        replyTo: fromEmail,
      };

      if (options.cc) mailOptions.cc = options.cc;
      if (options.bcc) mailOptions.bcc = options.bcc;

      // Handle attachments if present
      if (options.attachments && options.attachments.length > 0) {
        console.log(`📎 [Gmail] Processing ${options.attachments.length} attachment(s)`);
        mailOptions.attachments = options.attachments.map((att) => {
          const content = typeof att.content === 'string' 
            ? att.content 
            : att.content.toString('base64');
          
          return {
            content: content,
            filename: att.filename,
            contentType: att.contentType || 'application/octet-stream',
          };
        });
      }

      console.log('📧 [Gmail] Sending email...');
      const info = await transporter.sendMail(mailOptions);
      console.log('✅ [Gmail] Email sent:', info.messageId);
      
      return {
        messageId: info.messageId,
        response: info,
      };
    } catch (error) {
      console.error('❌ [Gmail] Send error:', error.message);
      console.error('❌ [Gmail] Full error:', JSON.stringify(error, null, 2));
      
      logger.error('Gmail send error', { 
        message: error.message,
        code: error.code,
        to: options.to,
      });
      throw error;
    }
  },

  verify: (callback) => {
    transporter.verify((error, success) => {
      if (error) {
        console.error('⚠️ Gmail verification failed:', error.message);
        logger.warn('Gmail verification failed', { message: error.message });
        callback(error);
      } else {
        console.log('✅ Gmail mailer is ready');
        callback(null, true);
      }
    });
  },
};

// Run verification
enhancedTransporter.verify((error) => {
  if (error) {
    console.warn('⚠️ Mailer config error:', error.message);
    logger.warn('Mailer config error', { message: error.message });
  } else {
    console.log('✅ Mailer ready - using Gmail SMTP');
    logger.info('Mailer ready - using Gmail SMTP');
  }
});

module.exports = enhancedTransporter;
