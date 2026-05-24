const express = require('express');
const router = express.Router();

router.get('/debug', async (req, res) => {
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
  const key = process.env.SENDGRID_API_KEY || '';
  res.json({
    sendgrid: {
      apiKeyExists: !!key,
      apiKeyLength: key.length,
      apiKeyPrefix: key ? key.substring(0, 10) + '...' : 'NOT SET',
    },
    emailFrom: process.env.EMAIL_FROM || 'NOT SET',
    adminEmail: process.env.ADMIN_EMAIL || 'NOT SET',
    sendgridFromEmail: process.env.SENDGRID_FROM_EMAIL || 'NOT SET',
  });
});

router.post('/send-test-email', async (req, res) => {
  try {
    const sgMail = require('@sendgrid/mail');
    const key = process.env.SENDGRID_API_KEY;
    
    if (!key) {
      return res.status(500).json({ error: 'SENDGRID_API_KEY not set' });
    }
    
    sgMail.setApiKey(key);
    
    const msg = {
      to: req.body.to || 'augusto.moran.informatica@gmail.com',
      from: req.body.from || 'administracion@sausansystem.com.ar',
      subject: 'Test email from Render',
      html: '<p>Este es un email de prueba desde Render usando SendGrid.</p>',
    };
    
    console.log('🧪 Test email sending to:', msg.to, 'from:', msg.from);
    await sgMail.send(msg);
    res.json({ success: true, message: 'Email enviado', to: msg.to, from: msg.from });
  } catch (error) {
    console.error('🧪 Test email error:', error);
    console.error('🧪 Test email error body:', error.response?.body);
    res.status(500).json({
      error: error.message,
      status: error.code,
      details: error.response?.body || null,
    });
  }
});

module.exports = router;
