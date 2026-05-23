const Quote = require('../models/Quote');
const User = require('../models/User');
const Product = require('../models/Product');
const PDFDocument = require('pdfkit');
const { generateQuotePDF, sendQuoteEmail } = require('../services/quoteService');

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

  // Asignar instalación a la moneda que tenga productos (prioridad USD)
  if (instalacion?.incluye && instalacion.monto > 0) {
    if (totales.USD.subtotal > 0) {
      totales.USD.instalacion = instalacion.monto;
      totales.USD.total = totales.USD.subtotal + instalacion.monto;
    } else if (totales.ARS.subtotal > 0) {
      totales.ARS.instalacion = instalacion.monto;
      totales.ARS.total = totales.ARS.subtotal + instalacion.monto;
    } else {
      // Si no hay productos, asignar a USD por defecto
      totales.USD.instalacion = instalacion.monto;
      totales.USD.total = instalacion.monto;
    }
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
      sendQuoteEmail(quote, pdfBuffer).catch((emailError) => {
        console.error('Email send error:', emailError);
        // No fallar la request si el email falla
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
    console.log('📥 [PDF] Download request for quote ID:', req.params.id);
    
    // Get quote - try lean first, fallback to full document
    let quote = await Quote.findById(req.params.id).lean();
    if (!quote) {
      quote = await Quote.findById(req.params.id);
    }
    
    if (!quote) {
      console.log('❌ [PDF] Quote not found');
      return res.status(404).json({ message: 'Presupuesto no encontrado' });
    }

    console.log('✅ [PDF] Quote found:', quote.numero);
    console.log('📊 [PDF] Quote data - items:', quote.items?.length, 'client:', quote.client?.nombre);

    // Check authorization - safely handle both string and ObjectId
    const clientId = quote.client?._id?.toString?.() || quote.client?._id;
    const userId = req.user._id?.toString?.() || req.user._id;
    
    if (req.user.role !== 'admin' && clientId !== userId) {
      console.log('❌ [PDF] Unauthorized - role:', req.user.role, 'clientId:', clientId, 'userId:', userId);
      return res.status(403).json({ message: 'No autorizado' });
    }

    // Set headers BEFORE writing to response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="presupuesto-${quote.numero}.pdf"`);
    
    try {
      // Generate minimal PDF to test PDF generation works
      console.log('📄 [PDF] Starting minimal PDF generation');
      
      const chunks = [];
      const doc = new PDFDocument({
        margin: 50,
        size: 'A4'
      });

      // Collect data
      doc.on('data', (chunk) => {
        console.log('📥 [PDF] Received chunk:', chunk.length, 'bytes');
        chunks.push(chunk);
      });

      doc.on('error', (err) => {
        console.error('❌ [PDF] Document error event:', err.message, err);
      });

      doc.on('finish', () => {
        try {
          console.log('✅ [PDF] Document finish event triggered');
          const pdfBuffer = Buffer.concat(chunks);
          console.log('✅ [PDF] Buffer concatenated, size:', pdfBuffer.length, 'bytes');
          
          if (pdfBuffer.length === 0) {
            console.error('❌ [PDF] Buffer is empty!');
            if (!res.headersSent) {
              return res.status(500).json({ message: 'PDF buffer is empty', error: 'No data generated' });
            }
            return;
          }
          
          // Send response
          if (!res.headersSent) {
            console.log('📤 [PDF] Sending PDF response with', pdfBuffer.length, 'bytes');
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="presupuesto-${quote.numero}.pdf"`);
            res.setHeader('Content-Length', pdfBuffer.length);
            res.write(pdfBuffer);
            res.end();
            console.log('✅ [PDF] Response sent successfully');
          } else {
            console.error('❌ [PDF] Headers already sent, cannot send PDF');
          }
        } catch (finishErr) {
          console.error('❌ [PDF] Error in finish handler:', finishErr.message);
          if (!res.headersSent) {
            res.status(500).json({ message: 'Error sending PDF', error: finishErr.message });
          }
        }
      });

      // Generate content - start with absolute minimal
      try {
        console.log('📝 [PDF] Adding title');
        doc.fontSize(16).text('PRESUPUESTO', { align: 'center' });
        console.log('✅ [PDF] Title added');
      } catch (titleErr) {
        console.error('❌ [PDF] Title error:', titleErr.message);
        doc.fontSize(12).text('PRESUPUESTO');
      }

      try {
        console.log('📝 [PDF] Adding quote number');
        doc.fontSize(12).text(`Nº: ${quote.numero || 'N/A'}`);
        console.log('✅ [PDF] Quote number added');
      } catch (numErr) {
        console.error('❌ [PDF] Number error:', numErr.message);
      }

      try {
        console.log('📝 [PDF] Adding client info');
        doc.text(`Cliente: ${quote.client?.nombre || 'N/A'}`);
        console.log('✅ [PDF] Client info added');
      } catch (clientErr) {
        console.error('❌ [PDF] Client error:', clientErr.message);
      }

      try {
        console.log('📝 [PDF] Adding items');
        if (quote.items && Array.isArray(quote.items)) {
          doc.text(`Productos: ${quote.items.length} items`);
          quote.items.forEach((item, idx) => {
            const desc = `${item.nombre || 'Producto'} x${item.cantidad || 1}`;
            doc.text(`  ${idx + 1}. ${desc}`);
          });
        } else {
          doc.text('(Sin productos)');
        }
        console.log('✅ [PDF] Items added');
      } catch (itemsErr) {
        console.error('❌ [PDF] Items error:', itemsErr.message);
        doc.text('(Error al mostrar productos)');
      }

      try {
        console.log('📝 [PDF] Adding total');
        const total = quote.totales?.USD?.total || quote.totales?.ARS?.total || 0;
        doc.fontSize(14).text(`TOTAL: $${parseFloat(total).toFixed(2)}`);
        console.log('✅ [PDF] Total added');
      } catch (totalErr) {
        console.error('❌ [PDF] Total error:', totalErr.message);
        doc.text('Total: N/A');
      }

      // End the document
      console.log('📝 [PDF] Calling doc.end()');
      doc.end();
      console.log('✅ [PDF] doc.end() called, waiting for finish event');
      
    } catch (pdfError) {
      console.error('❌ [PDF] Outer try-catch error:', pdfError.message, pdfError.stack);
      if (!res.headersSent) {
        res.status(500).json({ message: 'PDF generation failed', error: pdfError.message });
      }
    }
    
  } catch (error) {
    console.error('❌ [PDF] Download Error:', error.message, error.stack);
    next(error);
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
  testPDF,
};
