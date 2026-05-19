/**
 * pdf.service.js
 *
 * Generates PDF documents using PDFKit.
 * Three document types:
 *   - presupuesto (PENDIENTE) → before payment
 *   - comprobante (PAGADO)    → after confirmed payment
 *   - whatsapp               → uploaded to Cloudinary, returns public URL
 *
 * This service is DECOUPLED from the order flow — it reads order data
 * passed to it as plain objects and produces a Buffer.
 * It does NOT modify any order or database record.
 */

const PDFDocument = require('pdfkit');
const cloudinary = require('cloudinary').v2;

const STORE_NAME = process.env.STORE_NAME || 'Tienda Online';
const LOGO_URL = process.env.PDF_LOGO_URL || null;
const CURRENCY = process.env.PDF_CURRENCY || 'ARS';

// ─── Helper: format currency ──────────────────────────────────────────────────
const formatCurrency = (amount) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: CURRENCY }).format(amount);

// ─── Helper: format date ──────────────────────────────────────────────────────
const formatDate = (date) =>
  new Date(date).toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

// ─── Build PDF buffer ─────────────────────────────────────────────────────────
/**
 * @param {object} orderData   Plain order object (lean from DB or assembled)
 * @param {'PENDIENTE'|'PAGADO'} estado
 * @returns {Promise<Buffer>}
 */
const buildPDFBuffer = (orderData, estado) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const {
      codigo,
      items = [],
      subtotal = 0,
      descuento = 0,
      total = 0,
      metodoPago = '',
      createdAt,
      usuario,
      guestData,
      instalacion,
    } = orderData;

    // Resolve client name/contact
    const clientName = usuario
      ? `${usuario.nombre} ${usuario.apellido}`
      : `${guestData?.nombre || ''} ${guestData?.apellido || ''}`.trim();
    const clientEmail = usuario?.email || guestData?.email || '';
    const clientPhone = usuario?.telefono || guestData?.telefono || '';
    const clientAddress = usuario
      ? [
          usuario.direccion?.calle,
          usuario.direccion?.ciudad,
          usuario.direccion?.provincia,
        ]
          .filter(Boolean)
          .join(', ')
      : guestData?.direccion || '';

    // ── HEADER ───────────────────────────────────────────────────────────────
    doc.fontSize(20).font('Helvetica-Bold').text(STORE_NAME, { align: 'center' });
    doc.moveDown(0.3);

    const docTitle = estado === 'PAGADO' ? 'COMPROBANTE DE PAGO' : 'PRESUPUESTO';
    doc.fontSize(14).text(docTitle, { align: 'center' });

    // Status badge
    const badgeColor = estado === 'PAGADO' ? '#16a34a' : '#b45309';
    doc
      .fontSize(11)
      .fillColor(badgeColor)
      .text(`Estado: ${estado}`, { align: 'center' });
    doc.fillColor('#000000');

    doc.moveDown(0.5);
    doc
      .fontSize(10)
      .font('Helvetica')
      .text(`Código de pedido: ${codigo || 'N/A'}`, { align: 'right' })
      .text(`Fecha: ${formatDate(createdAt || new Date())}`, { align: 'right' });

    // ── DIVIDER ───────────────────────────────────────────────────────────────
    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ── CLIENT DATA ───────────────────────────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').text('Datos del cliente');
    doc.font('Helvetica').fontSize(10);
    if (clientName) doc.text(`Nombre: ${clientName}`);
    if (clientEmail) doc.text(`Email: ${clientEmail}`);
    if (clientPhone) doc.text(`Teléfono: ${clientPhone}`);
    if (clientAddress) doc.text(`Dirección: ${clientAddress}`);

    doc.moveDown(0.5);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.5);

    // ── ITEMS TABLE ───────────────────────────────────────────────────────────
    doc.fontSize(11).font('Helvetica-Bold').text('Productos');
    doc.moveDown(0.3);

    // Table header
    const col = { item: 50, qty: 340, price: 390, total: 460 };
    doc
      .font('Helvetica-Bold')
      .fontSize(9)
      .text('Producto', col.item, doc.y, { width: 280 })
      .text('Cant.', col.qty, doc.y - doc.currentLineHeight(), { width: 40, align: 'right' })
      .text('Precio', col.price, doc.y - doc.currentLineHeight(), { width: 60, align: 'right' })
      .text('Total', col.total, doc.y - doc.currentLineHeight(), { width: 70, align: 'right' });

    doc.moveDown(0.2);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.2);

    // Table rows
    doc.font('Helvetica').fontSize(9);
    for (const item of items) {
      const attrs = [item.talla && `T: ${item.talla}`, item.color && `C: ${item.color}`]
        .filter(Boolean)
        .join(' / ');
      const label = attrs ? `${item.nombre} (${attrs})` : item.nombre;
      const rowY = doc.y;

      doc.text(label, col.item, rowY, { width: 280 });
      doc.text(String(item.cantidad), col.qty, rowY, { width: 40, align: 'right' });
      doc.text(formatCurrency(item.precio), col.price, rowY, { width: 60, align: 'right' });
      doc.text(formatCurrency(item.precio * item.cantidad), col.total, rowY, {
        width: 70,
        align: 'right',
      });
      doc.moveDown(0.4);
    }

    // Instalación (if present)
    if (instalacion?.descripcion) {
      const rowY = doc.y;
      doc.text(`Instalación: ${instalacion.descripcion}`, col.item, rowY, { width: 280 });
      doc.text('1', col.qty, rowY, { width: 40, align: 'right' });
      doc.text(formatCurrency(instalacion.precio || 0), col.price, rowY, {
        width: 60,
        align: 'right',
      });
      doc.text(formatCurrency(instalacion.precio || 0), col.total, rowY, {
        width: 70,
        align: 'right',
      });
      doc.moveDown(0.4);
    }

    // ── TOTALS ────────────────────────────────────────────────────────────────
    doc.moveDown(0.3);
    doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown(0.3);

    const totalsX = 390;
    doc.font('Helvetica').fontSize(10);
    doc.text(`Subtotal: ${formatCurrency(subtotal)}`, totalsX, doc.y, {
      width: 155,
      align: 'right',
    });
    if (descuento > 0) {
      doc.text(`Descuento: -${formatCurrency(descuento)}`, totalsX, doc.y, {
        width: 155,
        align: 'right',
      });
    }
    doc.font('Helvetica-Bold').fontSize(12);
    doc.text(`TOTAL: ${formatCurrency(total)}`, totalsX, doc.y, { width: 155, align: 'right' });

    // ── FOOTER ────────────────────────────────────────────────────────────────
    doc.moveDown(2);
    doc.font('Helvetica').fontSize(8).fillColor('#64748b');
    doc.text(`Moneda: ${CURRENCY}`, { align: 'center' });
    if (metodoPago) doc.text(`Método de pago: ${metodoPago}`, { align: 'center' });
    doc.text(`Generado el ${formatDate(new Date())} por ${STORE_NAME}`, { align: 'center' });

    doc.end();
  });
};

// ─── Upload PDF buffer to Cloudinary ─────────────────────────────────────────
/**
 * Uploads a PDF buffer to Cloudinary and returns the secure URL.
 * Uses raw resource_type so Cloudinary stores it as a file.
 *
 * @param {Buffer} buffer
 * @param {string} publicId   Unique identifier (e.g. order code)
 * @returns {Promise<string>} Secure URL
 */
const uploadPDFToCloudinary = (buffer, publicId) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        resource_type: 'raw',
        folder: 'pdfs',
        public_id: publicId,
        format: 'pdf',
        overwrite: true,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    stream.end(buffer);
  });
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Generate a budget PDF (PENDIENTE) and return as Buffer.
 */
const generateBudgetPDF = (orderData) => buildPDFBuffer(orderData, 'PENDIENTE');

/**
 * Generate a payment receipt PDF (PAGADO) and return as Buffer.
 */
const generateReceiptPDF = (orderData) => buildPDFBuffer(orderData, 'PAGADO');

/**
 * Generate a PDF, upload it to Cloudinary, and return the public URL.
 * Used by the WhatsApp flow.
 *
 * @param {object} orderData
 * @param {'PENDIENTE'|'PAGADO'} estado
 * @returns {Promise<string>} Cloudinary URL
 */
const generateAndUploadPDF = async (orderData, estado = 'PENDIENTE') => {
  const buffer = await buildPDFBuffer(orderData, estado);
  const publicId = `order_${orderData.codigo || Date.now()}`;
  return uploadPDFToCloudinary(buffer, publicId);
};

module.exports = {
  generateBudgetPDF,
  generateReceiptPDF,
  generateAndUploadPDF,
};
