const MercadoPagoConfig = require('mercadopago').default;
const { Preference } = require('mercadopago');
const logger = require('../utils/logger');

let mpClient;

const getClient = () => {
  if (!mpClient) {
    if (!process.env.MP_ACCESS_TOKEN) {
      throw new Error('MP_ACCESS_TOKEN no configurado en variables de entorno');
    }
    logger.info('Initializing Mercado Pago client');
    mpClient = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN });
  }
  return mpClient;
};

const createPreference = async (order) => {
  try {
    logger.info('Creating Mercado Pago preference', { orderId: order._id });

    const client = getClient();
    const preference = new Preference(client);

    const items = order.items.map((item) => ({
      id: item.producto.toString(),
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: Number(item.precio),
      currency_id: 'ARS',
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

    // auto_return requires publicly accessible back_urls (not localhost)
    if (!isLocalhost) {
      body.auto_return = 'approved';
    }

    if (process.env.BACKEND_URL) {
      body.notification_url = `${process.env.BACKEND_URL}/api/webhook/mercadopago`;
    }

    const result = await preference.create({ body });
    logger.info('Mercado Pago preference created', { preferenceId: result.id, orderId: order._id });

    return result;
  } catch (error) {
    logger.error('Error creating Mercado Pago preference', {
      message: error.message,
      status: error.status,
      orderId: order._id,
    });
    throw error;
  }
};

module.exports = { createPreference };
