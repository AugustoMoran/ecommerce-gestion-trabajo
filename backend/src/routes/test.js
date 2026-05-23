const express = require('express');
const router = express.Router();

// Test endpoint - crear preferencia de prueba MP
router.post('/mp-preference', async (req, res, next) => {
  try {
    const MercadoPagoConfig = require('mercadopago').default;
    const { Preference } = require('mercadopago');
    
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(400).json({ error: 'MP_ACCESS_TOKEN not configured' });
    }

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const body = {
      items: [
        {
          id: '1',
          title: 'Test Product',
          quantity: 1,
          unit_price: 100,
          currency_id: 'ARS',
        }
      ],
      external_reference: 'TEST-' + Date.now(),
      back_urls: {
        success: 'http://localhost:3000/success',
        failure: 'http://localhost:3000/failure',
        pending: 'http://localhost:3000/pending',
      },
    };

    const result = await preference.create({ body });
    res.json({
      success: true,
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    });
  } catch (err) {
    console.error('MP Preference Error:', {
      message: err.message,
      status: err.status,
      code: err.code,
      fullError: err.toString(),
      stack: err.stack,
    });
    res.status(400).json({
      error: err.message,
      status: err.status,
      code: err.code,
      details: err.details || 'No additional details',
    });
  }
});

// Test endpoint - GET version para probar desde browser
router.get('/mp-preference', async (req, res, next) => {
  try {
    const MercadoPagoConfig = require('mercadopago').default;
    const { Preference } = require('mercadopago');
    
    const accessToken = process.env.MP_ACCESS_TOKEN;
    if (!accessToken) {
      return res.status(400).json({ error: 'MP_ACCESS_TOKEN not configured' });
    }

    console.log('Token length:', accessToken.length);
    console.log('Token starts with APP_USR:', accessToken.startsWith('APP_USR-'));

    const client = new MercadoPagoConfig({ accessToken });
    const preference = new Preference(client);

    const body = {
      items: [
        {
          id: '1',
          title: 'Test Product',
          quantity: 1,
          unit_price: 100,
          currency_id: 'ARS',
        }
      ],
      external_reference: 'TEST-' + Date.now(),
      back_urls: {
        success: `${process.env.BACKEND_URL}/success`,
        failure: `${process.env.BACKEND_URL}/failure`,
        pending: `${process.env.BACKEND_URL}/pending`,
      },
      auto_return: 'approved',
    };

    console.log('Creating preference with:', { backendUrl: process.env.BACKEND_URL });
    
    const result = await preference.create({ body });
    res.json({
      success: true,
      preferenceId: result.id,
      initPoint: result.init_point,
      sandboxInitPoint: result.sandbox_init_point,
    });
  } catch (err) {
    console.error('MP Preference Error:', {
      message: err.message,
      status: err.status,
      code: err.code,
      fullError: err.toString(),
      stack: err.stack,
    });
    res.status(400).json({
      error: err.message,
      status: err.status,
      code: err.code,
      details: err.toString(),
    });
  }
});

// Test endpoint - ver datos de debug
router.get('/debug', async (req, res, next) => {
  try {
    const Banner = require('../models/Banner');
    const Order = require('../models/Order');
    
    const banners = await Banner.find({ activo: true }).lean();
    const lastOrder = await Order.findOne().sort({ createdAt: -1 }).lean();
    
    res.json({
      banners: {
        count: banners.length,
        data: banners.map(b => ({
          _id: b._id,
          titulo: b.titulo,
          video: b.video,
          imagen: b.imagen,
          mostrarTexto: b.mostrarTexto,
          mostrarBoton: b.mostrarBoton,
          autoplay: b.autoplay,
        }))
      },
      lastOrder: lastOrder ? {
        _id: lastOrder._id,
        codigo: lastOrder.codigo,
        mpPreferenceId: lastOrder.mpPreferenceId,
        mpPaymentId: lastOrder.mpPaymentId,
        estadoPago: lastOrder.estadoPago,
        metodoPago: lastOrder.metodoPago,
      } : null,
      mpEnv: {
        hasAccessToken: !!process.env.MP_ACCESS_TOKEN,
        hasPublicKey: !!process.env.MP_PUBLIC_KEY,
        tokenLength: process.env.MP_ACCESS_TOKEN?.length || 0,
        publicKeyLength: process.env.MP_PUBLIC_KEY?.length || 0,
      }
    });
  } catch (err) {
    next(err);
  }
});

// Test endpoint - verificar configuración de Mercado Pago
router.get('/mp-config', async (req, res, next) => {
  try {
    const token = process.env.MP_ACCESS_TOKEN || '';
    const tokenStart = token.substring(0, 10);
    const tokenEnd = token.substring(Math.max(0, token.length - 10));
    const isValid = token.startsWith('APP_USR-');
    
    res.json({
      mpToken: {
        exists: !!token,
        length: token.length,
        startsWithAPP_USR: isValid,
        preview: `${tokenStart}...${tokenEnd}`,
        fullToken: token,  // Para debugging en Render logs
      },
      backendUrl: {
        exists: !!process.env.BACKEND_URL,
        value: process.env.BACKEND_URL || 'NOT SET',
      },
      nodeEnv: process.env.NODE_ENV,
      timestamp: new Date(),
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
