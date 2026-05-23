const PDFDocument = require('pdfkit');
const nodemailer = require('nodemailer');
const path = require('path');
const fs = require('fs');

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
      console.log('📄 Items count:', quote?.items?.length);
      
      const doc = new PDFDocument({ margin: 40, size: 'A4' });
      const buffers = [];

      doc.on('data', (data) => buffers.push(data));
      doc.on('end', () => {
        const finalBuffer = Buffer.concat(buffers);
        console.log('✅ PDF Generated, size:', finalBuffer.length, 'bytes');
        resolve(finalBuffer);
      });
      doc.on('error', (err) => {
        console.error('❌ PDF Stream Error:', err);
        reject(err);
      });

      // Colores
      const primaryColor = '#2563EB'; // Azul
      const darkColor = '#1F2937'; // Gris oscuro
      const lightColor = '#F3F4F6'; // Gris claro

      // Logo y Header
      const logoPath = path.join(__dirname, '../../../frontend/public/logo-sausansystem.png');
      let logoWidth = 80;
      let yPosition = 30;

      if (fs.existsSync(logoPath)) {
        try {
          doc.image(logoPath, 40, yPosition, { width: logoWidth });
        } catch (logoErr) {
          console.log('⚠️  Logo not found:', logoPath);
        }
      }

      // Título y número a la derecha
      doc.fontSize(28).fillColor(darkColor).font('Helvetica-Bold').text('PRESUPUESTO', 250, yPosition + 10);
      doc.fontSize(11).fillColor(primaryColor).font('Helvetica-Bold').text(`Nº ${quote.numero || 'SIN-NUMERO'}`, 250, yPosition + 40);
      doc.fontSize(9).fillColor('#666666').font('Helvetica').text(`Fecha: ${new Date(quote.createdAt).toLocaleDateString('es-AR')}`, 250, yPosition + 58);

      yPosition = yPosition + 100;

      // Línea separadora
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, yPosition).lineTo(555, yPosition).stroke();
      yPosition += 15;

      // Datos del cliente
      doc.fontSize(10).fillColor(darkColor).font('Helvetica-Bold').text('CLIENTE', 40, yPosition);
      yPosition += 18;
      doc.fontSize(9).fillColor('#374151').font('Helvetica');
      doc.text(quote.client?.nombre || 'SIN NOMBRE', 40, yPosition);
      yPosition += 12;
      doc.text(quote.client?.email || 'SIN EMAIL', 40, yPosition);
      yPosition += 12;
      doc.text(quote.client?.telefono || 'SIN TELÉFONO', 40, yPosition);
      yPosition += 12;

      if (quote.client?.direccion) {
        const { calle, ciudad, provincia } = quote.client.direccion;
        const direccion = [calle, ciudad, provincia].filter(Boolean).join(', ');
        if (direccion) {
          doc.text(direccion, 40, yPosition);
          yPosition += 12;
        }
      }

      yPosition += 10;

      // Tabla de productos
      const tableTop = yPosition;
      const colWidths = { nombre: 200, cantidad: 60, precio: 90, moneda: 50, subtotal: 80 };

      // Header de tabla
      doc.fillColor(primaryColor).rect(40, tableTop, 515, 25).fill();
      doc.fontSize(10).fillColor('white').font('Helvetica-Bold');
      doc.text('PRODUCTO', 50, tableTop + 6);
      doc.text('CANT.', 265, tableTop + 6);
      doc.text('PRECIO UNIT.', 335, tableTop + 6);
      doc.text('TOTAL', 455, tableTop + 6);

      yPosition = tableTop + 30;
      doc.fontSize(9).fillColor('#374151').font('Helvetica');

      // Items de productos
      if (quote.items && Array.isArray(quote.items) && quote.items.length > 0) {
        let rowBg = false;
        quote.items.forEach((item) => {
          // Fondo alterno
          if (rowBg) {
            doc.fillColor(lightColor).rect(40, yPosition - 3, 515, 20).fill();
          }
          rowBg = !rowBg;

          doc.fillColor('#374151').font('Helvetica');
          doc.text(item.nombre || 'SIN NOMBRE', 50, yPosition);
          doc.text((item.cantidad || 0).toString(), 265, yPosition);
          doc.text(`$${(item.precioUnitario || 0).toFixed(2)} ${item.currency || 'USD'}`, 335, yPosition);
          doc.text(`$${(item.subtotal || 0).toFixed(2)} ${item.currency || 'USD'}`, 455, yPosition);
          yPosition += 20;
        });
      } else {
        doc.fillColor('#999999').text('SIN PRODUCTOS', 50, yPosition);
        yPosition += 20;
      }

      // Instalación
      if (quote.instalacion.incluye) {
        if (rowBg) {
          doc.fillColor(lightColor).rect(40, yPosition - 3, 515, 20).fill();
        }
        doc.fillColor('#374151').font('Helvetica');
        doc.text('Instalación' + (quote.instalacion.descripcion ? ` - ${quote.instalacion.descripcion}` : ''), 50, yPosition);
        doc.text('-', 265, yPosition);
        doc.text('-', 335, yPosition);
        doc.text(`$${quote.instalacion.monto.toFixed(2)}`, 455, yPosition);
        yPosition += 20;
      }

      yPosition += 10;

      // Línea separadora
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, yPosition).lineTo(555, yPosition).stroke();
      yPosition += 15;

      // Totales
      const hasUSD = quote.totales.USD && quote.totales.USD.subtotal > 0;
      const hasARS = quote.totales.ARS && quote.totales.ARS.subtotal > 0;
      const isMixed = hasUSD && hasARS;
      
      doc.fontSize(10).fillColor(darkColor).font('Helvetica');
      
      if (hasUSD) {
        doc.text('SUBTOTAL USD:', 350, yPosition);
        doc.text(`$${quote.totales.USD.subtotal.toFixed(2)}`, 470, yPosition, { align: 'right' });
        yPosition += 15;
        
        if (quote.totales.USD.instalacion > 0 && !isMixed) {
          doc.text('INSTALACIÓN:', 350, yPosition);
          doc.text(`$${quote.totales.USD.instalacion.toFixed(2)}`, 470, yPosition, { align: 'right' });
          yPosition += 15;
        }
      }
      
      if (hasARS) {
        doc.text('SUBTOTAL ARS:', 350, yPosition);
        doc.text(`$${quote.totales.ARS.subtotal.toFixed(2)}`, 470, yPosition, { align: 'right' });
        yPosition += 15;
        
        if (quote.totales.ARS.instalacion > 0 && !isMixed) {
          doc.text('INSTALACIÓN:', 350, yPosition);
          doc.text(`$${quote.totales.ARS.instalacion.toFixed(2)}`, 470, yPosition, { align: 'right' });
          yPosition += 15;
        }
      }

      yPosition += 10;

      // Totales finales
      doc.fillColor(primaryColor).fontSize(11).font('Helvetica-Bold');
      
      if (hasUSD) {
        doc.text(isMixed ? 'TOTAL USD:' : 'TOTAL FINAL:', 350, yPosition);
        doc.text(`$${quote.totales.USD.total.toFixed(2)}`, 470, yPosition, { align: 'right' });
        yPosition += 18;
      }
      
      if (hasARS) {
        doc.text(isMixed ? 'TOTAL ARS:' : 'TOTAL FINAL:', 350, yPosition);
        doc.text(`$${quote.totales.ARS.total.toFixed(2)}`, 470, yPosition, { align: 'right' });
        yPosition += 18;
      }

      // Notas internas
      if (quote.notas) {
        yPosition += 30;
        doc.fontSize(9).fillColor('#666666').font('Helvetica-Oblique');
        doc.text(`Notas: ${quote.notas}`, 40, yPosition, { width: 515 });
      }

      // Footer
      const footerY = doc.page.height - 50;
      doc.strokeColor('#E5E7EB').lineWidth(1).moveTo(40, footerY).lineTo(555, footerY).stroke();
      doc.fontSize(8).fillColor('#999999').font('Helvetica');
      doc.text('Válido por 30 días. Para aceptar o consultar, responda este email.', 40, footerY + 10);
      doc.text('SAUSANSYSTEM | info@sausansystem.com | +54 9 11 6839-3582', 40, footerY + 20);

      doc.end();
    } catch (error) {
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
