const MercadoPagoConfig = require('mercadopago').default;
const { Preference } = require('mercadopago');
const logger = require('../utils/logger');

/**
 * Create a fresh Mercado Pago client instance
 * IMPORTANT: Don't cache the client - create new instance each time to avoid
 * issues in serverless environments like Render
 */
const getClient = () => {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  
  if (!token) {
    const errorMsg = 'MP_ACCESS_TOKEN no configurado en variables de entorno';
    logger.error(errorMsg, {
      envVars: {
        MP_ACCESS_TOKEN: process.env.MP_ACCESS_TOKEN ? '***' : 'UNDEFINED',
        NODE_ENV: process.env.NODE_ENV,
      },
    });
    throw new Error(errorMsg);
  }
  
  if (!token.startsWith('APP_USR_') && !token.startsWith('APP_USR-')) {
    logger.warn('MP_ACCESS_TOKEN has unexpected format', {
      token: token.substring(0, 20) + '...',
    });
  }
  
  logger.debug('Creating fresh Mercado Pago client instance', {
    tokenLength: token.length,
    tokenPrefix: token.substring(0, 15) + '...',
  });
  
  return new MercadoPagoConfig({ accessToken: token });
};

const createPreference = async (order) => {
  let client;
  try {
    logger.info('Creating Mercado Pago preference', { 
      orderId: order._id,
      total: order.total,
      moneda: order.moneda,
      itemsCount: order.items?.length || 0,
    });

    // Create a fresh client instance each time
    client = getClient();
    const preference = new Preference(client);

    const currency_id = order.moneda === 'USD' ? 'USD' : 'ARS';
    const items = order.items.map((item) => ({
      id: item.producto.toString(),
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: Number(item.precio),
      currency_id,
      picture_url: item.imagen || undefined,
    }));

    const isLocalhost = process.env.FRONTEND_URL?.includes('localhost');

    const body = {
      items,
      external_reference: order._id.toString(),
      back_urls: {
        success: `${process.env.FRONTEND_URL}/orden/confirmacion?status=success&order=${order._id}`,
        failure: `${process.env.FRONTEND_URL}/orden/confirmacion?status=failure&order=${order._id}`,
        pending: `${process.env.FRONTEND_URL}/orden/confirmacion?status=pending&order=${order._id}`,
      },
    };

    logger.debug('Preference URLs configured', {
      success: body.back_urls.success.substring(0, 50) + '...',
      backendUrl: process.env.BACKEND_URL,
    });

    // auto_return requires publicly accessible back_urls (not localhost)
    if (!isLocalhost) {
      body.auto_return = 'approved';
    }

    if (process.env.BACKEND_URL) {
      body.notification_url = `${process.env.BACKEND_URL}/api/webhook/mercadopago`;
      logger.debug('Webhook notification URL', { 
        url: body.notification_url,
      });
    } else {
      logger.warn('BACKEND_URL not configured - webhooks may not work');
    }

    logger.debug('Creating preference with body', { 
      itemsCount: items.length,
      currency: currency_id,
      autoReturn: body.auto_return,
      hasNotificationUrl: !!body.notification_url,
    });

    const result = await preference.create({ body });
    logger.info('✅ Mercado Pago preference created successfully', { 
      preferenceId: result.id,
      initPoint: result.init_point?.substring(0, 50) + '...',
      orderId: order._id,
    });

    return result;
  } catch (error) {
    logger.error('❌ Error creating Mercado Pago preference', {
      message: error.message,
      status: error.status,
      code: error.code,
      name: error.name,
      orderId: order._id,
      tokenConfigured: !!process.env.MP_ACCESS_TOKEN,
    });
    
    // Re-throw with additional context
    const enhancedError = new Error(`Mercado Pago Error: ${error.message}`);
    enhancedError.originalError = error;
    throw enhancedError;
  }
};

module.exports = { createPreference };
