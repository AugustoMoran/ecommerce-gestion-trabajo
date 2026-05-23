const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');
const { PassThrough } = require('stream');

// Configurar transporter de email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.GMAIL_USER || 'tu-email@gmail.com',
    pass: process.env.GMAIL_PASSWORD || 'tu-password',
  },
});

const generateQuotePDF = (quote) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('📄 PDF Generation started for quote:', quote?.numero);
      
      // Use /tmp for Render environment, or temp dir for local
      const tmpDir = process.env.NODE_ENV === 'production' ? '/tmp' : path.join(__dirname, '../../');
      const pdfPath = path.join(tmpDir, `pdf_${Date.now()}_${quote._id}.pdf`);
      console.log('📄 Temporary PDF file path:', pdfPath);
      
      // Create write stream to file
      const writeStream = fs.createWriteStream(pdfPath);
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      
      // Pipe PDF document to file
      doc.pipe(writeStream);
      
      console.log('📄 Document piped to file stream');
      
      // Render content
      try {
        doc.fontSize(24).text('PRESUPUESTO');
        doc.fontSize(12).text(`Nº ${quote.numero || 'N/A'}`);
        doc.fontSize(10).text('Cliente: ' + (quote.client?.nombre || 'N/A'));
        
        // Items section
        if (quote.items && quote.items.length > 0) {
          doc.fontSize(11).text('\nProductos:');
          quote.items.forEach((item, i) => {
            doc.fontSize(10).text(
              `${i+1}. ${item.nombre || 'N/A'} - Cantidad: ${item.cantidad} - $${item.subtotal || 0}`
            );
          });
        }
        
        // Total section
        const total = quote.totales?.USD?.total || quote.totales?.ARS?.total || 0;
        doc.fontSize(14).text('\n─────────────────');
        doc.fontSize(14).text(`TOTAL: $${total.toFixed(2)}`);
        
        console.log('📄 Content rendered successfully');
      } catch (renderErr) {
        console.error('❌ Error rendering PDF content:', renderErr.message);
        writeStream.destroy();
        fs.unlink(pdfPath, () => {}); // Delete temp file on error
        reject(renderErr);
        return;
      }
      
      // Listen for file write completion
      writeStream.on('finish', () => {
        console.log('📄 PDF file written successfully');
        
        // Read file and convert to buffer
        fs.readFile(pdfPath, (err, data) => {
          // Clean up temp file
          fs.unlink(pdfPath, (delErr) => {
            if (delErr) console.error('⚠️  Failed to delete temp file:', delErr);
          });
          
          if (err) {
            console.error('❌ Error reading PDF file:', err.message);
            reject(err);
            return;
          }
          
          console.log('✅ PDF buffer created from file, size:', data.length, 'bytes');
          if (data.length === 0) {
            console.warn('⚠️  WARNING: PDF buffer is empty!');
          }
          resolve(data);
        });
      });
      
      // Listen for write errors
      writeStream.on('error', (err) => {
        console.error('❌ Write stream error:', err.message);
        fs.unlink(pdfPath, () => {}); // Delete temp file on error
        reject(err);
      });
      
      // End the document (this triggers the write stream to flush)
      console.log('📄 Finalizing document...');
      doc.end();
      console.log('📄 doc.end() called');
      
    } catch (error) {
      console.error('❌ PDF Generation Error:', error.message);
      reject(error);
    }
  });
};

      console.log('📄 About to call doc.end()');
      doc.end();
      console.log('📄 doc.end() called, waiting for stream events');
    } catch (error) {
      console.error('❌ PDF Generation Error in try-catch:', error);
      reject(error);
    }
  });
};

const sendQuoteEmail = async (quote, pdfBuffer) => {
  const emailTemplate = `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 8px; }
        .header { text-align: center; border-bottom: 2px solid #007bff; padding-bottom: 20px; margin-bottom: 20px; }
        .logo { max-width: 200px; margin-bottom: 10px; }
        .title { font-size: 24px; font-weight: bold; color: #333; }
        .numero { color: #007bff; font-size: 14px; }
        .content { margin: 20px 0; }
        .content p { margin: 10px 0; line-height: 1.6; color: #666; }
        .cta { text-align: center; margin: 30px 0; }
        .cta a { background: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block; }
        .footer { text-align: center; font-size: 12px; color: #999; border-top: 1px solid #ddd; padding-top: 20px; margin-top: 30px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #007bff; color: white; padding: 10px; text-align: left; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .total { font-size: 16px; font-weight: bold; text-align: right; margin-top: 20px; color: #007bff; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="title">PRESUPUESTO</div>
          <div class="numero">Nº ${quote.numero}</div>
        </div>
        
        <div class="content">
          <p>Estimado ${quote.client.nombre},</p>
          <p>Le enviamos el presupuesto solicitado. Por favor revise los detalles abajo y el PDF adjunto.</p>
          
          <table>
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cantidad</th>
                <th>Precio Unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${quote.items.map(item => `
                <tr>
                  <td>${item.nombre}</td>
                  <td>${item.cantidad}</td>
                  <td>$${item.precioUnitario.toFixed(2)} ${item.currency || 'USD'}</td>
                  <td>$${item.subtotal.toFixed(2)} ${item.currency || 'USD'}</td>
                </tr>
              `).join('')}
              ${quote.instalacion.incluye ? `
                <tr>
                  <td>Instalación${quote.instalacion.descripcion ? ` - ${quote.instalacion.descripcion}` : ''}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>$${quote.instalacion.monto.toFixed(2)}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
          
          <div class="total">
            ${(() => {
              const hasUSD = quote.totales.USD && quote.totales.USD.subtotal > 0;
              const hasARS = quote.totales.ARS && quote.totales.ARS.subtotal > 0;
              const isMixed = hasUSD && hasARS;
              
              let html = '';
              if (hasUSD) {
                html += `<strong>${isMixed ? 'USD Total' : 'Total Final'}: $${quote.totales.USD.total.toFixed(2)}</strong><br/>`;
              }
              if (hasARS) {
                html += `<strong>${isMixed ? 'ARS Total' : 'Total Final'}: $${quote.totales.ARS.total.toFixed(2)}</strong><br/>`;
              }
              return html;
            })()}
          </div>
          
          <p>El presupuesto es válido por <strong>30 días</strong>. Para aceptar o consultar, simplemente responda este email.</p>
        </div>
        
        <div class="footer">
          <p>SAUSANSYSTEM</p>
          <p>info@sausansystem.com | +54 9 11 6839-3582</p>
          <p>© 2026 SAUSANSYSTEM. Todos los derechos reservados.</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const mailOptions = {
    from: process.env.GMAIL_USER || 'noreply@sausansystem.com',
    to: quote.client.email,
    subject: `Presupuesto #${quote.numero} - SAUSANSYSTEM`,
    html: emailTemplate,
    attachments: [
      {
        filename: `presupuesto-${quote.numero}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  return transporter.sendMail(mailOptions);
};

module.exports = {
  generateQuotePDF,
  sendQuoteEmail,
};
