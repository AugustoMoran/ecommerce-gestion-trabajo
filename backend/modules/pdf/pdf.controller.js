const Order = require('../../src/models/Order');
const { generateBudgetPDF, generateReceiptPDF, generateAndUploadPDF } = require('./pdf.service');

/**
 * POST /api/pdf/presupuesto
 *
 * Generates a PENDIENTE (budget) PDF from raw order data
 * sent by the client (pre-payment, not yet persisted, or from an existing order).
 *
 * Accepts either:
 *   - { orderId } to fetch from DB
 *   - a raw order object in the body
 *
 * Returns the PDF as an octet-stream download.
 */
const downloadBudget = async (req, res, next) => {
  try {
    let orderData;

    if (req.body.orderId) {
      const order = await Order.findById(req.body.orderId).populate('usuario', 'nombre apellido email telefono direccion');
      if (!order) return res.status(404).json({ message: 'Orden no encontrada' });
      orderData = order.toObject();
    } else {
      // Allow passing a raw order object (e.g., from frontend cart before saving)
      orderData = req.body;
    }

    const buffer = await generateBudgetPDF(orderData);

    const filename = `presupuesto_${orderData.codigo || 'draft'}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/pdf/comprobante/:orderId
 *
 * Generates a PAGADO (receipt) PDF for a confirmed order.
 * Returns the PDF as an octet-stream download.
 */
const downloadReceipt = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      'usuario',
      'nombre apellido email telefono direccion'
    );
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

    const buffer = await generateReceiptPDF(order.toObject());

    const filename = `comprobante_${order.codigo}.pdf`;
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': buffer.length,
    });
    res.send(buffer);
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/pdf/whatsapp/:orderId
 *
 * Generates a PDF for a given order, uploads it to Cloudinary,
 * and returns the public URL so it can be appended to a WhatsApp message.
 *
 * Does NOT send the WhatsApp message — just returns the link.
 * The frontend/chatbot builds the final wa.me link.
 */
const generateWhatsAppPDF = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.orderId).populate(
      'usuario',
      'nombre apellido email telefono direccion'
    );
    if (!order) return res.status(404).json({ message: 'Orden no encontrada' });

    const estado = order.estadoPago === 'aprobado' ? 'PAGADO' : 'PENDIENTE';
    const url = await generateAndUploadPDF(order.toObject(), estado);

    // Build a wa.me link pointing to the configured admin WhatsApp
    const adminPhone = process.env.WHATSAPP_PHONE || '';
    const mensaje = encodeURIComponent(
      `Hola! Te comparto el PDF de tu pedido #${order.codigo}: ${url}`
    );
    const waLink = adminPhone
      ? `https://wa.me/${adminPhone}?text=${mensaje}`
      : null;

    res.json({ pdfUrl: url, waLink });
  } catch (err) {
    next(err);
  }
};

module.exports = { downloadBudget, downloadReceipt, generateWhatsAppPDF };
