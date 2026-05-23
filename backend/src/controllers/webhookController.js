const crypto = require('crypto');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Cart = require('../models/Cart');
const { sendOrderConfirmationToUser, sendOrderNotificationToAdmin } = require('../utils/sendNotifications');
const logger = require('../utils/logger');

const mercadopagoWebhook = async (req, res, next) => {
  try {
    console.log('🔔 Webhook recibido:', { type: req.body?.type, data: req.body?.data?.id });

    // Validate signature if secret is set
    if (process.env.MP_WEBHOOK_SECRET) {
      const signature = req.headers['x-signature'] || '';
      const xRequestId = req.headers['x-request-id'] || '';
      const manifest = `id:${req.query['data.id']};request-id:${xRequestId};ts:${req.query.ts};`;
      const hmac = crypto.createHmac('sha256', process.env.MP_WEBHOOK_SECRET).update(manifest).digest('hex');
      if (hmac !== signature.split('=')[1]) {
        console.error('❌ Firma inválida en webhook');
        return res.status(401).json({ message: 'Firma inválida.' });
      }
    }

    const { type, data } = req.body;

    if (type === 'payment') {
      const paymentId = data?.id;
      if (!paymentId) {
        console.log('⚠️  Sin paymentId, ignorando webhook');
        return res.sendStatus(200);
      }

      console.log(`📊 Procesando pago ID: ${paymentId}`);

      // Fetch payment from MP API
      const MercadoPagoConfig = require('mercadopago').default;
      const { Payment } = require('mercadopago');
      
      const token = process.env.MP_ACCESS_TOKEN?.trim();
      if (!token) {
        logger.error('❌ MP_ACCESS_TOKEN no configurado en webhook', {
          paymentId,
          tokenExists: !!process.env.MP_ACCESS_TOKEN,
        });
        return res.sendStatus(500);
      }
      
      logger.debug('Initializing MP client in webhook', {
        tokenLength: token.length,
        paymentId,
      });

      const client = new MercadoPagoConfig({ accessToken: token });
      const payment = new Payment(client);
      
      let paymentData;
      try {
        logger.debug('Fetching payment data from Mercado Pago', { paymentId });
        paymentData = await payment.get({ id: paymentId });
        logger.debug('✅ Payment data fetched successfully', {
          paymentId,
          status: paymentData.status,
        });
      } catch (error) {
        logger.error('❌ Error obteniendo datos de pago desde MP', {
          message: error.message,
          paymentId,
          status: error.status,
          code: error.code,
          tokenConfigured: !!token,
        });
        return res.sendStatus(500);
      }

      const externalRef = paymentData.external_reference;
      const status = paymentData.status; // approved, pending, rejected

      console.log(`🔍 Pago ${paymentId}: status=${status}, externalRef=${externalRef}`);

      const statusMap = { approved: 'aprobado', pending: 'pendiente', rejected: 'rechazado' };
      const estadoPago = statusMap[status] || 'pendiente';

      const order = await Order.findById(externalRef);
      if (!order) {
        console.error(`❌ Orden no encontrada: ${externalRef}`);
        return res.sendStatus(200);
      }

      console.log(`📦 Orden encontrada: ${order.codigo}`);

      order.estadoPago = estadoPago;
      order.mpPaymentId = paymentId;
      if (estadoPago === 'aprobado') {
        console.log(`✅ Pago aprobado para orden ${order.codigo}`);
        order.metodoPago = 'mercadopago';
        // When payment approved, ensure envio is 'pendiente' for admin to dispatch
        if (!order.estadoEnvio || order.estadoEnvio === 'pendiente') {
          order.estadoEnvio = 'pendiente';
        }
        // Clear the user's cart in DB
        if (order.usuario) {
          await Cart.findOneAndUpdate({ usuario: order.usuario }, { items: [] });
          console.log(`🛒 Carrito limpiado para usuario ${order.usuario}`);
        }
      }
      await order.save();
      console.log(`💾 Orden actualizada: ${order.codigo}`);

      // Send confirmation emails when payment is approved (both customer and admin)
      if (estadoPago === 'aprobado') {
        let emailRecipient = null;
        if (order.usuario) {
          // For logged-in users, fetch their email
          const User = require('../models/User');
          const user = await User.findById(order.usuario);
          emailRecipient = user?.email;
        } else {
          // For guests, use stored email
          emailRecipient = order.guestData?.email;
        }

        console.log(`📧 Enviando emails para orden aprobada: ${order.codigo}`);

        // Send to customer
        if (emailRecipient) {
          sendOrderConfirmationToUser(emailRecipient, order)
            .then(() => console.log(`✅ Email de confirmación enviado a cliente: ${emailRecipient}`))
            .catch(err => console.error(`❌ Error enviando email a cliente ${emailRecipient}:`, err.message));
        } else {
          console.error(`❌ Sin emailRecipient para orden ${order.codigo}`);
        }

        // Send to admin
        const populatedOrder = await Order.findById(order._id).populate('usuario');
        sendOrderNotificationToAdmin(populatedOrder)
          .then(() => console.log(`✅ Notificación admin enviada para orden ${order.codigo}`))
          .catch(err => console.error(`❌ Error en notificación admin para ${order.codigo}:`, err.message));
      }

      // IMPORTANT: Stock is deducted ONLY when admin finalizes the order via finalizeOrder endpoint,
      // NOT when payment is approved. This allows admin control over the dispatch process.

      // ── Non-blocking PDF receipt generation (does not affect webhook flow) ──
      if (estadoPago === 'aprobado') {
        const { generateAndUploadPDF } = require('../../modules/pdf/pdf.service');
        const populatedOrder = await Order.findById(order._id).populate(
          'usuario',
          'nombre apellido email telefono direccion'
        );
        if (populatedOrder) {
          generateAndUploadPDF(populatedOrder.toObject(), 'PAGADO')
            .then((url) => console.log(`📄 PDF comprobante generado: ${url}`))
            .catch((err) => console.error('❌ Error generando PDF comprobante:', err.message));
        }
      }
    }

    res.sendStatus(200);
  } catch (error) {
    console.error('❌ Webhook error:', error.message, error.stack);
    res.sendStatus(200); // Always return 200 to MP
  }
};

module.exports = { mercadopagoWebhook };
