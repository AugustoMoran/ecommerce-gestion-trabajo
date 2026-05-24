const express = require('express');
const router = express.Router();

// Global email logs storage
global.emailLogs = global.emailLogs || [];

function addEmailLog(type, message, details = {}) {
  const log = {
    timestamp: new Date().toISOString(),
    type, // 'info', 'error', 'success'
    message,
    details,
  };
  global.emailLogs.unshift(log);
  // Keep only last 20 logs
  if (global.emailLogs.length > 20) {
    global.emailLogs = global.emailLogs.slice(0, 20);
  }
  console.log(`[${type.toUpperCase()}]`, message, details);
}

router.get('/debug', (req, res) => {
  res.json({ status: 'ok', message: 'Debug endpoint' });
});

router.get('/mp-config', async (req, res) => {
  const token = process.env.MP_ACCESS_TOKEN || '';
  res.json({
    mpToken: {
      exists: !!token,
      length: token.length,
    },
    backendUrl: process.env.BACKEND_URL || 'NOT SET',
  });
});

router.get('/email-config', async (req, res) => {
  res.json({
    smtp: {
      host: process.env.SMTP_HOST || 'NOT SET',
      port: process.env.SMTP_PORT || 'NOT SET',
      user: process.env.SMTP_USER || 'NOT SET',
      passExists: !!process.env.SMTP_PASS,
      passLength: process.env.SMTP_PASS ? process.env.SMTP_PASS.length : 0,
    },
    emailFrom: process.env.EMAIL_FROM || 'NOT SET',
    adminEmail: process.env.ADMIN_EMAIL || 'NOT SET',
    storeName: process.env.STORE_NAME || 'NOT SET',
  });
});

router.get('/email-logs', async (req, res) => {
  res.json({
    logs: global.emailLogs || [],
    totalLogs: (global.emailLogs || []).length,
  });
});

router.post('/send-test-email', async (req, res) => {
  try {
    const transporter = require('../config/mailer');
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      addEmailLog('error', 'Missing SMTP credentials');
      return res.status(500).json({ error: 'SMTP_USER or SMTP_PASS not set' });
    }
    
    const mailOptions = {
      to: req.body.to || 'augusto@gmail.com',
      from: process.env.EMAIL_FROM || process.env.SMTP_USER,
      subject: 'Test email from Render',
      html: `
        <html>
          <body>
            <h2>Test Email - Gmail SMTP</h2>
            <p>This is a test email sent from Render backend.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p><strong>Environment:</strong> Render Production</p>
            <hr/>
            <p>If you received this, Gmail SMTP is working! ✅</p>
          </body>
        </html>
      `,
    };
    
    addEmailLog('info', `Test email queued: ${mailOptions.to}`, { from: mailOptions.from });
    
    // Send email in background - don't wait
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        addEmailLog('error', 'Email send failed', {
          message: error.message,
          code: error.code,
          response: error.response,
          to: mailOptions.to,
        });
      } else {
        addEmailLog('success', 'Email sent successfully', {
          messageId: info.messageId,
          to: mailOptions.to,
        });
      }
    });
    
    // Respond immediately (don't wait for email)
    res.json({ 
      message: 'Email queued for sending',
      status: 'pending',
      to: mailOptions.to,
      note: 'Check /api/test/email-logs for result'
    });
  } catch (error) {
    addEmailLog('error', 'Test email setup error', { message: error.message });
    res.status(500).json({
      error: error.message,
      code: error.code,
    });
  }
});

module.exports = router;
