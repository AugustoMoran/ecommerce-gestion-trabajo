const PDFDocument = require('pdfkit');
const transporter = require('../config/mailer');
const path = require('path');
const fs = require('fs');
const { PassThrough } = require('stream');

const generateQuotePDF = (quote) => {
  return new Promise((resolve, reject) => {
    try {
      console.log('📄 Starting PDF generation for:', quote?.numero);
      
      const chunks = [];
      const doc = new PDFDocument();
      
      // Collect data chunks from the document
      doc.on('data', (chunk) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        const buffer = Buffer.concat(chunks);
        console.log('✅ PDF ready, size:', buffer.length);
        resolve(buffer);
      });

      doc.on('error', (err) => {
        console.error('❌ PDF error:', err);
        reject(err);
      });

      // Add content - very simple
      doc.fontSize(16).text('PRESUPUESTO', { align: 'center' });
      doc.text('');
      doc.fontSize(12).text(`Nº: ${quote.numero}`);
      doc.text(`Cliente: ${quote.client?.nombre || 'N/A'}`);
      doc.text('');
      doc.fontSize(11).text('Productos:');
      
      if (quote.items && quote.items.length > 0) {
        quote.items.forEach((item) => {
          doc.text(`- ${item.nombre}: $${(Number(item.subtotal) || 0).toFixed(2)} ${item.currency || 'USD'}`);
        });
      }
      
      doc.text('');
      const totalUSD = Number(quote.totales?.USD?.total) || 0;
      const totalARS = Number(quote.totales?.ARS?.total) || 0;

      doc.fontSize(14);
      if (totalUSD > 0) {
        doc.text(`TOTAL USD: $${totalUSD.toFixed(2)}`);
      }
      if (totalARS > 0) {
        doc.text(`TOTAL ARS: $${totalARS.toFixed(2)}`);
      }

      // End document - THIS IS CRITICAL
      doc.end();
      
    } catch (error) {
      console.error('❌ Error:', error.message);
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
                  <td>$${quote.instalacion.monto.toFixed(2)} ${quote.instalacion.currency || 'USD'}</td>
                </tr>
              ` : ''}
            </tbody>
          </table>
          
          <div class="total">
            ${(() => {
              const hasUSD = quote.totales?.USD && quote.totales.USD.total > 0;
              const hasARS = quote.totales?.ARS && quote.totales.ARS.total > 0;
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
    from: process.env.EMAIL_FROM || process.env.SMTP_USER || 'noreply@sausansystem.com',
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

  try {
    console.log('📧 Email config:', { from: mailOptions.from, to: mailOptions.to, subject: mailOptions.subject });
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Email send failed:', error.message);
    console.error('Error details:', error);
    throw error;
  }
};

module.exports = {
  generateQuotePDF,
  sendQuoteEmail,
};
