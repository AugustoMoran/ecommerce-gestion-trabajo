const express = require('express');
const router = express.Router();

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
    const isValid = token.startsWith('APP_USR_') || token.startsWith('APP_USR-');
    
    res.json({
      mpToken: {
        exists: !!token,
        length: token.length,
        startsWithAPP_USR: isValid,
        preview: `${tokenStart}...${tokenEnd}`,
        fullToken: token,
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
