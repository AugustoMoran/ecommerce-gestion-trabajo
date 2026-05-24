const Quote = require('../models/Quote');
const User = require('../models/User');
const Product = require('../models/Product');
const PDFDocument = require('pdfkit');
const { generateQuotePDF, sendQuoteEmail } = require('../services/quoteService');

// In-memory error log for debugging
const pdfErrorLog = [];
function logPDFError(msg) {
  const log = { timestamp: new Date().toISOString(), msg };
  pdfErrorLog.push(log);
  if (pdfErrorLog.length > 50) pdfErrorLog.shift(); // Keep only last 50
  console.error('📝 [PDF-LOG]', msg);
}

// Función helper para calcular totales por moneda
const calculateTotalsByByCurrency = (items, instalacion) => {
  const currencies = { USD: 0, ARS: 0 };
  
  // Sumar items por moneda
  items.forEach(item => {
    const currency = item.currency || 'USD';
    currencies[currency] = (currencies[currency] || 0) + item.subtotal;
  });

  // Crear objeto de totales sin duplicar instalación
  const totales = {
    USD: {
      subtotal: currencies.USD || 0,
      instalacion: 0,
      total: currencies.USD || 0,
    },
    ARS: {
      subtotal: currencies.ARS || 0,
      instalacion: 0,
      total: currencies.ARS || 0,
    },
  };

  // Asignar instalación a la moneda seleccionada por el usuario
  if (instalacion?.incluye && instalacion.monto > 0) {
    const instCurrency = instalacion.currency || 'USD';
    totales[instCurrency].instalacion = instalacion.monto;
    totales[instCurrency].total = totales[instCurrency].subtotal + instalacion.monto;
  }

  // Total final es suma de ambas monedas
  const total = totales.USD.total + totales.ARS.total;

  return {
    USD: totales.USD,
    ARS: totales.ARS,
    subtotal: currencies.USD + currencies.ARS,
    instalacion: instalacion?.incluye ? instalacion.monto : 0,
    descuento: 0,
    total,
  };
};

const createQuote = async (req, res, next) => {
  try {
    console.log('🔍 CreateQuote - User role:', req.user.role);
    console.log('🔍 CreateQuote - Body received:', JSON.stringify(req.body, null, 2));

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Solo administradores pueden crear presupuestos' });
    }

    const { clientId, items, instalacion, notas } = req.body;
    
    console.log('🔍 ClientId:', clientId);
    console.log('🔍 Items:', JSON.stringify(items, null, 2));

    const client = await User.findById(clientId);
    if (!client) {
      console.log('❌ Cliente no encontrado con ID:', clientId);
      return res.status(404).json({ message: 'Cliente no encontrado' });
    }
    
    console.log('✅ Cliente encontrado:', client.nombre);

    const processedItems = await Promise.all(
      items.map(async (item) => {
        console.log('🔍 Processing item:', item);
        const product = await Product.findById(item.producto);
        console.log('🔍 Product found:', product?.nombre || 'PRODUCTO NO ENCONTRADO', 'para ID:', item.producto);
        return {
          producto: item.producto,
          nombre: item.nombre || product?.nombre,
          cantidad: item.cantidad,
          precioUnitario: item.precioUnitario,
          subtotal: item.cantidad * item.precioUnitario,
          currency: item.currency || 'USD',
        };
      })
    );

    // Calcular totales por moneda
    const totales = calculateTotalsByByCurrency(processedItems, instalacion);

    const lastQuote = await Quote.findOne().sort({ createdAt: -1 });
    const nextNumber = lastQuote ? parseInt(lastQuote.numero.split('-')[1]) + 1 : 1;
    const numero = `PSP-${String(nextNumber).padStart(4, '0')}`;

    const quote = new Quote({
      numero,
      client: {
        _id: client._id,
        nombre: client.nombre,
        email: client.email,
        telefono: client.telefono,
        direccion: client.direccion,
      },
      items: processedItems,
      instalacion: {
        incluye: instalacion?.incluye || false,
        monto: instalacion?.monto || 0,
        descripcion: instalacion?.descripcion,
        currency: instalacion?.currency || 'USD',
      },
      totales,
      notas,
      createdBy: req.user._id,
    });

    await quote.save();
    res.status(201).json(quote);
  } catch (error) {
    next(error);
  }
};

const getAllQuotes = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }
    const quotes = await Quote.find().sort({ createdAt: -1 }).populate('createdBy', 'nombre');
    res.json(quotes);
  } catch (error) {
    next(error);
  }
};

const getQuoteById = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('createdBy', 'nombre');
    if (!quote) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    if (req.user.role !== 'admin' && quote.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    res.json(quote);
  } catch (error) {
    next(error);
  }
};

const getMyQuotes = async (req, res, next) => {
  try {
    const quotes = await Quote.find({ 'client._id': req.user._id }).sort({ createdAt: -1 });
    res.json(quotes);
  } catch (error) {
    next(error);
  }
};

const updateQuote = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    if (quote.estado !== 'borrador') {
      return res.status(400).json({ message: 'Solo se pueden editar presupuestos en borrador' });
    }

    const { items, instalacion, notas } = req.body;

    if (items) {
      const processedItems = await Promise.all(
        items.map(async (item) => {
          const product = await Product.findById(item.producto);
          return {
            producto: item.producto,
            nombre: item.nombre || product?.nombre,
            cantidad: item.cantidad,
            precioUnitario: item.precioUnitario,
            subtotal: item.cantidad * item.precioUnitario,
            currency: item.currency || 'USD',
          };
        })
      );
      quote.items = processedItems;
    }

    if (instalacion) {
      quote.instalacion = {
        incluye: instalacion.incluye || false,
        monto: instalacion.monto || 0,
        descripcion: instalacion.descripcion,
        currency: instalacion.currency || 'USD',
      };
    }

    if (notas !== undefined) {
      quote.notas = notas;
    }

    // Calcular totales por moneda
    quote.totales = calculateTotalsByByCurrency(quote.items, quote.instalacion);

    await quote.save();
    res.json(quote);
  } catch (error) {
    next(error);
  }
};

const sendQuote = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    try {
      const pdfBuffer = await generateQuotePDF(quote);
      
      // Intentar enviar email sin bloquear
      sendQuoteEmail(quote, pdfBuffer)
        .then((result) => {
          console.log('✅ Email enviado exitosamente:', result.messageId, 'to:', quote.client.email);
        })
        .catch((emailError) => {
          console.error('❌ Error enviando email a:', quote.client.email);
          console.error('Error detalles:', {
            message: emailError.message,
            code: emailError.code,
            command: emailError.command,
            response: emailError.response,
          });
        });
    } catch (pdfError) {
      console.error('PDF generation error:', pdfError);
      // Continuar incluso si el PDF falla
    }

    quote.estado = 'enviado';
    quote.enviado = {
      fecha: new Date(),
      email: quote.client.email,
      visto: false,
    };

    await quote.save();
    res.json({ message: 'Presupuesto enviado', quote });
  } catch (error) {
    next(error);
  }
};

const downloadQuotePDF = async (req, res, next) => {
  try {
    logPDFError(`📥 Download request: ${req.params.id}`);
    
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      logPDFError(`❌ Quote not found: ${req.params.id}`);
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    // Check auth
    const clientId = quote.client?._id?.toString?.() || quote.client?._id;
    const userId = req.user._id?.toString?.() || req.user._id;
    
    if (req.user.role !== 'admin' && clientId !== userId) {
      logPDFError(`❌ Unauthorized: role=${req.user.role} clientId=${clientId} userId=${userId}`);
      return res.status(403).json({ message: 'No autorizado' });
    }

    logPDFError(`📄 Creating professional PDF for ${quote.numero}`);
    
    // Generate PDF using Promise wrapper
    const pdfPromise = new Promise(async (resolve, reject) => {
      try {
        const chunks = [];
        const doc = new PDFDocument({ margin: 50, size: 'A4', autoFirstPage: true });
        
        doc.on('data', (chunk) => {
          chunks.push(chunk);
        });
        
        doc.on('end', () => {
          try {
            const pdfBuffer = Buffer.concat(chunks);
            resolve(pdfBuffer);
          } catch (err) {
            reject(err);
          }
        });
        
        doc.on('error', (err) => {
          reject(err);
        });

        // Try to download and add logo
        try {
          const http = require('http');
          const https = require('https');
          
          await new Promise((logoResolve, logoReject) => {
            const logoUrl = 'https://www.sausansystem.com.ar/logo-sausansystem.png';
            const protocol = logoUrl.startsWith('https') ? https : http;
            
            const request = protocol.get(logoUrl, { timeout: 5000 }, (response) => {
              if (response.statusCode !== 200) {
                logoReject(new Error('Logo download failed'));
                return;
              }
              
              const chunks = [];
              response.on('data', chunk => chunks.push(chunk));
              response.on('end', () => {
                try {
                  const logoBuffer = Buffer.concat(chunks);
                  // Add logo to PDF (60px wide, positioned at top)
                  doc.image(logoBuffer, 50, 30, { width: 100 });
                } catch (e) {
                  console.warn('⚠️ Logo add warning:', e.message);
                }
                logoResolve();
              });
            });
            
            request.on('error', () => {
              console.warn('⚠️ Logo download failed, continuing without logo');
              logoResolve(); // Continue without logo
            });
            
            request.on('timeout', () => {
              request.destroy();
              logoResolve(); // Continue without logo if timeout
            });
          });
        } catch (logoError) {
          console.warn('⚠️ Logo handling error:', logoError.message);
          // Continue without logo
        }

        // Header with company name
        doc.moveTo(170, 40).lineTo(550, 40).stroke('#0066cc');
        doc.fontSize(24).font('Helvetica-Bold').fillColor('#0066cc').text('PRESUPUESTO', 170, 50);
        doc.fontSize(10).fillColor('#666').text(`Nº ${quote.numero}`, 170, 80);
        
        // Reset position after logo
        doc.y = 160;
        doc.fillColor('#000');

        // Date only (no status)
        const createdDate = new Date(quote.createdAt).toLocaleDateString('es-AR', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        });
        doc.fontSize(10).font('Helvetica')
          .text(`Fecha: ${createdDate}`);
        
        doc.moveTo(50, doc.y + 5).lineTo(550, doc.y + 5).stroke('#ddd');
        doc.moveDown();

        // Client section
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#0066cc').text('DATOS DEL CLIENTE');
        doc.fontSize(10).font('Helvetica').fillColor('#000')
          .text(`Nombre: ${quote.client?.nombre || 'N/A'}`)
          .text(`Email: ${quote.client?.email || 'N/A'}`)
          .text(`Teléfono: ${quote.client?.telefono || 'N/A'}`);
        doc.moveDown();

        // Items table header
        const tableTop = doc.y;
        const col1 = 60;
        const col2 = 280;
        const col3 = 380;
        const col4 = 480;
        const rowHeight = 25;

        doc.fontSize(10).font('Helvetica-Bold').fillColor('#fff').fillColor('#fff');
        doc.rect(50, tableTop, 500, rowHeight).fill('#0066cc');
        doc.fillColor('#fff').text('Descripción', col1, tableTop + 7);
        doc.text('Cantidad', col2, tableTop + 7);
        doc.text('Precio Unit.', col3, tableTop + 7);
        doc.text('Subtotal', col4, tableTop + 7);

        // Items rows
        doc.fontSize(9).font('Helvetica').fillColor('#000');
        let rowY = tableTop + rowHeight;
        let itemCount = 0;

        if (quote.items && Array.isArray(quote.items) && quote.items.length > 0) {
          quote.items.forEach((item) => {
            const qty = parseFloat(item.cantidad) || 0;
            const price = parseFloat(item.precioUnitario) || 0;
            const subtotal = qty * price;
            
            // Alternate row colors
            if (itemCount % 2 === 0) {
              doc.rect(50, rowY, 500, rowHeight).fill('#f5f5f5');
              doc.fillColor('#000');
            }
            
            doc.text(item.nombre || 'Producto', col1, rowY + 7);
            doc.text(qty.toString(), col2, rowY + 7);
            doc.text(`$${price.toFixed(2)}`, col3, rowY + 7);
            doc.text(`$${subtotal.toFixed(2)}`, col4, rowY + 7);
            
            rowY += rowHeight;
            itemCount++;
          });
        }

        // Installation line if included
        const hasInstalacion = quote.instalacion?.incluye && quote.instalacion?.monto > 0;
        if (hasInstalacion) {
          if (itemCount % 2 === 0) {
            doc.rect(50, rowY, 500, rowHeight).fill('#f5f5f5');
            doc.fillColor('#000');
          }
          
          const instMonto = parseFloat(quote.instalacion.monto) || 0;
          const instCurrency = quote.instalacion.currency || 'USD';
          const instDesc = quote.instalacion.descripcion || 'Instalación';
          
          doc.text(instDesc, col1, rowY + 7);
          doc.text('1', col2, rowY + 7);
          doc.text(`$${instMonto.toFixed(2)} ${instCurrency}`, col3, rowY + 7);
          doc.text(`$${instMonto.toFixed(2)} ${instCurrency}`, col4, rowY + 7);
          
          rowY += rowHeight;
          itemCount++;
        }

        // Totals section
        doc.moveTo(50, rowY).lineTo(550, rowY).stroke('#ddd');
        rowY += 15;

        const totalUSD = parseFloat(quote.totales?.USD?.total || 0);
        const totalARS = parseFloat(quote.totales?.ARS?.total || 0);
        
        // Show installation breakdown if exists
        if (hasInstalacion) {
          const instMonto = parseFloat(quote.instalacion.monto) || 0;
          const instCurrency = quote.instalacion.currency || 'USD';
          
          doc.fontSize(9).font('Helvetica').fillColor('#666');
          if (instCurrency === 'USD') {
            doc.text(`(incluye instalación: $${instMonto.toFixed(2)} USD)`, 380, rowY);
          } else {
            doc.text(`(incluye instalación: $${instMonto.toFixed(2)} ARS)`, 380, rowY);
          }
          rowY += 15;
        }

        // Totals by currency
        const totalGeneral = totalUSD + totalARS;

        // Totals box
        doc.fontSize(11).font('Helvetica-Bold').fillColor('#0066cc');
        if (totalUSD > 0) {
          doc.text(`TOTAL USD: $${totalUSD.toFixed(2)}`, 380, rowY);
          rowY += 20;
        }
        if (totalARS > 0) {
          doc.text(`TOTAL ARS: $${totalARS.toFixed(2)}`, 380, rowY);
          rowY += 20;
        }

        // Grand total highlight
        doc.rect(350, rowY - 5, 150, 35).fill('#0066cc');
        doc.fontSize(14).font('Helvetica-Bold').fillColor('#fff')
          .text(`TOTAL: $${totalGeneral.toFixed(2)}`, 360, rowY + 5);

        // Footer
        doc.moveDown(3);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke('#ddd');
        doc.fontSize(8).font('Helvetica').fillColor('#999')
          .text('SAUSAN SYSTEM - Gestión Integral de Trabajos', 50, doc.y + 10, { align: 'center' })
          .text('www.sausansystem.com.ar', { align: 'center' })
          .text('Presupuesto válido por 30 días desde su emisión', { align: 'center' });

        // End document
        doc.end();
      } catch (err) {
        reject(err);
      }
    });
    
    // Wait for PDF generation
    const pdfBuffer = await pdfPromise;
    const base64PDF = pdfBuffer.toString('base64');
    
    logPDFError(`✅ PDF generated: ${pdfBuffer.length} bytes`);
    
    // Send as JSON with base64
    res.json({
      success: true,
      pdf: base64PDF,
      filename: `presupuesto-${quote.numero}.pdf`,
      size: pdfBuffer.length
    });
    
  } catch (error) {
    logPDFError(`❌ PDF Generation Error: ${error.message}`);
    logPDFError(`STACK: ${error.stack}`);
    
    if (!res.headersSent) {
      res.status(500).json({ 
        message: 'Error al generar PDF', 
        error: error.message 
      });
    }
  }
};

const updateQuoteStatus = async (req, res, next) => {
  try {
    const { estado } = req.body;

    if (!['aceptado', 'rechazado'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    if (quote.client._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'No autorizado' });
    }

    quote.estado = estado;
    await quote.save();

    // 📧 Enviar notificación al admin cuando se acepte
    if (estado === 'aceptado') {
      const { sendQuoteAcceptanceToAdmin } = require('../utils/sendNotifications');
      sendQuoteAcceptanceToAdmin(quote)
        .catch(err => console.error('Error enviando notificación de aceptación:', err.message));
    }

    res.json({ message: `Presupuesto marcado como ${estado}`, quote });
  } catch (error) {
    next(error);
  }
};

// DELETE /api/quotes/:id - eliminar presupuesto (solo admin, solo borrador o enviado)
const deleteQuote = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    // Permitir eliminar presupuestos en estado borrador o enviado
    if (!['borrador', 'enviado'].includes(quote.estado)) {
      return res.status(400).json({ message: 'Solo se pueden eliminar presupuestos en estado borrador o enviado' });
    }

    await Quote.findByIdAndDelete(req.params.id);

    res.json({ message: 'Presupuesto eliminado correctamente' });
  } catch (error) {
    next(error);
  }
};

// TEST ENDPOINT - Generate simple PDF to test PDFKit
const testPDF = async (req, res, next) => {
  try {
    console.log('🧪 [TEST-PDF] Starting test PDF generation');
    const chunks = [];
    
    const doc = new PDFDocument({
      margin: 50,
      size: 'A4'
    });

    console.log('🧪 [TEST-PDF] PDFDocument created');

    doc.on('data', (chunk) => {
      console.log('🧪 [TEST-PDF] Chunk received:', chunk.length, 'bytes');
      chunks.push(chunk);
    });

    doc.on('error', (err) => {
      console.error('🧪 [TEST-PDF] Error event:', err.message);
    });

    doc.on('finish', () => {
      try {
        console.log('🧪 [TEST-PDF] Finish event triggered');
        const pdfBuffer = Buffer.concat(chunks);
        console.log('🧪 [TEST-PDF] Buffer size:', pdfBuffer.length, 'bytes');
        
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename="test.pdf"');
        res.write(pdfBuffer);
        res.end();
        console.log('🧪 [TEST-PDF] Response sent');
      } catch (err) {
        console.error('🧪 [TEST-PDF] Finish error:', err.message);
        if (!res.headersSent) {
          res.status(500).json({ error: err.message });
        }
      }
    });

    // Add minimal content
    console.log('🧪 [TEST-PDF] Adding content');
    doc.fontSize(20).text('TEST PDF', { align: 'center' });
    doc.text('This is a test PDF to verify PDFKit works in Render');
    doc.text('If you see this, PDF generation is working!');
    
    console.log('🧪 [TEST-PDF] Calling doc.end()');
    doc.end();
    console.log('🧪 [TEST-PDF] doc.end() called');
  } catch (error) {
    console.error('🧪 [TEST-PDF] Outer error:', error.message);
    res.status(500).json({ error: error.message });
  }
};

// GET PDF error log for debugging
const getPDFErrorLog = (req, res) => {
  res.json({ errors: pdfErrorLog, totalErrors: pdfErrorLog.length });
};

// POST /api/quotes/:id/create-payment - Crear pago MP para presupuesto aceptado
const createQuotePayment = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id);
    if (!quote) {
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    // Solo cliente dueño o admin puede crear pago
    if (req.user._id.toString() !== quote.client._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'No autorizado' });
    }

    // Solo presupuestos aceptados pueden ir a pago
    if (quote.estado !== 'aceptado') {
      return res.status(400).json({ message: 'El presupuesto debe estar aceptado para proceder al pago' });
    }

    const MercadoPagoConfig = require('mercadopago').default;
    const { Preference } = require('mercadopago');
    
    const token = process.env.MP_ACCESS_TOKEN?.trim();
    if (!token) {
      console.error('❌ MP_ACCESS_TOKEN no configurado');
      return res.status(500).json({ message: 'Mercado Pago no configurado' });
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    // Preparar items para MP
    const items = (quote.items || []).map(item => ({
      title: item.nombre,
      quantity: item.cantidad,
      unit_price: item.precioUnitario,
    }));

    // Agregar instalación si aplica
    if (quote.instalacion?.incluye) {
      items.push({
        title: `Instalación${quote.instalacion.descripcion ? ` - ${quote.instalacion.descripcion}` : ''}`,
        quantity: 1,
        unit_price: quote.instalacion.monto,
      });
    }

    // Calcular total
    const usdTotal = quote.totales?.USD?.total || 0;
    const arsTotal = quote.totales?.ARS?.total || 0;
    const totalAmount = usdTotal + arsTotal; // Si es mixto, sumar ambos

    const preferenceData = {
      items: items,
      external_reference: quote._id.toString(), // Usar ID del presupuesto
      notification_url: `${process.env.BACKEND_URL}/api/webhooks/mercadopago`,
      back_urls: {
        success: `${process.env.FRONTEND_URL}/presupuestos/${quote._id}/pago-exitoso`,
        failure: `${process.env.FRONTEND_URL}/presupuestos/${quote._id}/pago-fallido`,
        pending: `${process.env.FRONTEND_URL}/presupuestos/${quote._id}/pago-pendiente`,
      },
      auto_return: 'approved',
      payer: {
        name: quote.client.nombre?.split(' ')[0] || 'Cliente',
        surname: quote.client.nombre?.split(' ')[1] || '',
        email: quote.client.email,
        phone: { number: quote.client.telefono || '' },
        address: {
          street_name: quote.client.direccion?.calle || '',
          street_number: 0,
          zip_code: quote.client.direccion?.codigoPostal || '',
        },
      },
      metadata: {
        quoteNumber: quote.numero,
        quoteType: 'presupuesto',
      },
    };

    const createdPreference = await preference.create({ body: preferenceData });

    // Guardar preference ID en presupuesto
    quote.preferenceId = createdPreference.id;
    await quote.save();

    console.log(`✅ Preference creada para presupuesto ${quote.numero}:`, createdPreference.id);

    res.json({
      success: true,
      preferenceId: createdPreference.id,
      initPoint: createdPreference.init_point,
      message: 'Preference de Mercado Pago creada exitosamente',
    });
  } catch (error) {
    console.error('❌ Error creando pago MP:', error.message);
    next(error);
  }
};

const testResendQuote = async (req, res, next) => {
  try {
    const { numero } = req.params;
    console.log(`\n🔄 TEST: Intentando reenviar presupuesto ${numero}...`);

    const quote = await Quote.findOne({ numero });
    if (!quote) {
      console.log(`❌ TEST: Presupuesto ${numero} no encontrado`);
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    console.log(`✅ TEST: Presupuesto encontrado`);
    console.log(`  - Cliente: ${quote.client.nombre} (${quote.client.email})`);
    console.log(`  - Items: ${quote.items.length}`);

    try {
      console.log(`📄 TEST: Generando PDF...`);
      const pdfBuffer = await generateQuotePDF(quote);
      console.log(`✅ TEST: PDF generado (${pdfBuffer.length} bytes)`);

      console.log(`📧 TEST: Enviando email con Resend...`);
      const result = await sendQuoteEmail(quote, pdfBuffer);
      console.log(`✅ TEST: Email enviado a ${quote.client.email}`);
      console.log(`  - Message ID: ${result.messageId}`);

      res.json({
        message: 'Presupuesto reenviado exitosamente',
        numero: quote.numero,
        email: quote.client.email,
        messageId: result.messageId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error(`❌ TEST ERROR:`, {
        message: error.message,
        code: error.code,
        response: error.response,
      });

      res.status(500).json({
        message: 'Error al enviar presupuesto',
        error: error.message,
        provider: 'resend',
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error) {
    console.error('TEST: Error general:', error);
    res.status(500).json({ message: 'Error', error: error.message });
  }
};

module.exports = {
  createQuote,
  getAllQuotes,
  getQuoteById,
  getMyQuotes,
  updateQuote,
  sendQuote,
  downloadQuotePDF,
  updateQuoteStatus,
  deleteQuote,
  createQuotePayment,
  testPDF,
  getPDFErrorLog,
  testResendQuote,
};
