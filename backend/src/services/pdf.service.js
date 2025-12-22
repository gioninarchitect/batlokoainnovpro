import PDFDocument from 'pdfkit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGO_PATH = path.join(__dirname, '../../assets/logo.png');

// Company details
const COMPANY = {
  name: 'Batlokoa Innovative Projects',
  contactPerson: 'Cornelia Lethunya',
  address: '12 A Bussing Rd, Aureus Ext 1, Randfontein, Gauteng',
  phone: '+27 73 974 8317',
  email: 'info@batlokoainnovpro.co.za',
  website: 'www.batlokoainnovpro.co.za',
  vatNumber: '', // Add VAT number when registered
  regNumber: '', // Add company registration number
  bankName: 'First National Bank',
  accountNumber: '', // Add bank account details
  branchCode: '',
};

// Generate Invoice PDF
export const generateInvoicePDF = async (invoice) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Logo and Header
      try {
        doc.image(LOGO_PATH, 50, 40, { width: 80 });
      } catch (e) {
        // Logo not found, continue without it
      }
      doc.fontSize(18).text(COMPANY.name, 140, 50);
      doc.fontSize(9).text(COMPANY.address, 140, 72);
      doc.text(`Phone: ${COMPANY.phone} | Email: ${COMPANY.email}`, 140, 84);
      doc.text(`VAT: ${COMPANY.vatNumber || 'N/A'} | Reg: ${COMPANY.regNumber || 'N/A'}`, 140, 96);

      // Invoice title
      doc.fontSize(24).text('TAX INVOICE', 400, 50, { align: 'right' });
      doc.fontSize(12).text(invoice.invoiceNumber, 400, 85, { align: 'right' });

      // Status badge
      const statusColors = {
        DRAFT: '#6c757d',
        SENT: '#007bff',
        PAID: '#28a745',
        PARTIALLY_PAID: '#ffc107',
        OVERDUE: '#dc3545',
        CANCELLED: '#dc3545',
      };
      doc.fillColor(statusColors[invoice.status] || '#6c757d')
         .text(invoice.status, 400, 105, { align: 'right' });
      doc.fillColor('#000000');

      // Line separator
      doc.moveTo(50, 130).lineTo(550, 130).stroke();

      // Bill To section
      doc.fontSize(12).text('BILL TO:', 50, 150);
      doc.fontSize(10);
      doc.text(invoice.customer.companyName, 50, 170);
      if (invoice.customer.addresses?.[0]) {
        const addr = invoice.customer.addresses[0];
        doc.text(addr.line1);
        if (addr.line2) doc.text(addr.line2);
        doc.text(`${addr.city}, ${addr.province} ${addr.postalCode}`);
      }
      if (invoice.customer.vatNumber) {
        doc.text(`VAT: ${invoice.customer.vatNumber}`);
      }

      // Invoice details
      doc.fontSize(10);
      doc.text('Invoice Date:', 350, 150);
      doc.text(new Date(invoice.issueDate).toLocaleDateString('en-ZA'), 450, 150);
      doc.text('Due Date:', 350, 165);
      doc.text(new Date(invoice.dueDate).toLocaleDateString('en-ZA'), 450, 165);
      doc.text('Payment Terms:', 350, 180);
      doc.text(`${invoice.paymentTerms} days`, 450, 180);

      if (invoice.order) {
        doc.text('Order Ref:', 350, 195);
        doc.text(invoice.order.orderNumber, 450, 195);
      }

      // Items table
      const tableTop = 250;
      const tableHeaders = ['Description', 'Qty', 'Unit Price', 'Total'];
      const colWidths = [250, 50, 100, 100];
      let xPos = 50;

      // Table header
      doc.fillColor('#1a1a2e').rect(50, tableTop, 500, 25).fill();
      doc.fillColor('#ffffff').fontSize(10);
      tableHeaders.forEach((header, i) => {
        doc.text(header, xPos + 5, tableTop + 8, { width: colWidths[i] - 10 });
        xPos += colWidths[i];
      });

      // Table rows
      doc.fillColor('#000000');
      let yPos = tableTop + 30;
      const items = invoice.order?.items || [];

      items.forEach((item, index) => {
        const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
        doc.fillColor(rowColor).rect(50, yPos, 500, 25).fill();
        doc.fillColor('#000000');

        xPos = 50;
        const productName = item.product?.name || 'Product';
        doc.text(productName, xPos + 5, yPos + 8, { width: colWidths[0] - 10 });
        xPos += colWidths[0];
        doc.text(item.quantity.toString(), xPos + 5, yPos + 8, { width: colWidths[1] - 10 });
        xPos += colWidths[1];
        doc.text(`R ${item.unitPrice.toFixed(2)}`, xPos + 5, yPos + 8, { width: colWidths[2] - 10 });
        xPos += colWidths[2];
        doc.text(`R ${item.total.toFixed(2)}`, xPos + 5, yPos + 8, { width: colWidths[3] - 10 });

        yPos += 25;
      });

      // Totals
      yPos += 20;
      const totalsX = 350;

      doc.text('Subtotal:', totalsX, yPos);
      doc.text(`R ${invoice.subtotal.toFixed(2)}`, totalsX + 100, yPos, { align: 'right', width: 100 });
      yPos += 20;

      doc.text('VAT (15%):', totalsX, yPos);
      doc.text(`R ${invoice.tax.toFixed(2)}`, totalsX + 100, yPos, { align: 'right', width: 100 });
      yPos += 20;

      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('TOTAL:', totalsX, yPos);
      doc.text(`R ${invoice.total.toFixed(2)}`, totalsX + 100, yPos, { align: 'right', width: 100 });
      doc.font('Helvetica').fontSize(10);

      // Amount paid/due
      if (invoice.amountPaid > 0) {
        yPos += 25;
        doc.text('Amount Paid:', totalsX, yPos);
        doc.text(`R ${invoice.amountPaid.toFixed(2)}`, totalsX + 100, yPos, { align: 'right', width: 100 });
        yPos += 20;
        doc.fontSize(12).fillColor('#dc3545');
        doc.text('Amount Due:', totalsX, yPos);
        doc.text(`R ${invoice.amountDue.toFixed(2)}`, totalsX + 100, yPos, { align: 'right', width: 100 });
        doc.fillColor('#000000').fontSize(10);
      }

      // Payment details
      yPos = Math.max(yPos + 50, 500);
      doc.fontSize(12).text('Payment Details', 50, yPos);
      doc.fontSize(10);
      yPos += 20;
      doc.text(`Bank: ${COMPANY.bankName}`, 50, yPos);
      yPos += 15;
      doc.text(`Account Name: ${COMPANY.name}`, 50, yPos);
      yPos += 15;
      doc.text(`Account Number: ${COMPANY.accountNumber}`, 50, yPos);
      yPos += 15;
      doc.text(`Branch Code: ${COMPANY.branchCode}`, 50, yPos);
      yPos += 15;
      doc.text(`Reference: ${invoice.invoiceNumber}`, 50, yPos);

      // Notes
      if (invoice.notes) {
        yPos += 30;
        doc.fontSize(12).text('Notes', 50, yPos);
        doc.fontSize(10).text(invoice.notes, 50, yPos + 20, { width: 500 });
      }

      // Footer
      const footerY = doc.page.height - 50;
      doc.fontSize(8).fillColor('#666666');
      doc.text(
        'Thank you for your business. Please ensure payment is made by the due date.',
        50,
        footerY,
        { align: 'center', width: 500 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Generate Quote PDF
export const generateQuotePDF = async (quote) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Logo and Header
      try {
        doc.image(LOGO_PATH, 50, 40, { width: 80 });
      } catch (e) {
        // Logo not found, continue without it
      }
      doc.fontSize(18).text(COMPANY.name, 140, 50);
      doc.fontSize(9).text(COMPANY.address, 140, 72);
      doc.text(`Phone: ${COMPANY.phone} | Email: ${COMPANY.email}`, 140, 84);

      // Quote title
      doc.fontSize(24).text('QUOTATION', 400, 50, { align: 'right' });
      doc.fontSize(12).text(quote.quoteNumber, 400, 85, { align: 'right' });

      // Valid until
      doc.fontSize(10).fillColor('#dc3545');
      doc.text(`Valid until: ${new Date(quote.validUntil).toLocaleDateString('en-ZA')}`, 400, 105, { align: 'right' });
      doc.fillColor('#000000');

      // Line separator
      doc.moveTo(50, 130).lineTo(550, 130).stroke();

      // Customer details
      doc.fontSize(12).text('PREPARED FOR:', 50, 150);
      doc.fontSize(10);
      doc.text(quote.customer.companyName, 50, 170);
      doc.text(quote.customer.email);
      if (quote.customer.phone) doc.text(quote.customer.phone);

      // Quote date
      doc.text('Date:', 350, 150);
      doc.text(new Date(quote.createdAt).toLocaleDateString('en-ZA'), 450, 150);

      // Items table
      const tableTop = 230;
      const tableHeaders = ['Description', 'Qty', 'Unit Price', 'Total'];
      const colWidths = [250, 50, 100, 100];
      let xPos = 50;

      // Table header
      doc.fillColor('#1a1a2e').rect(50, tableTop, 500, 25).fill();
      doc.fillColor('#ffffff').fontSize(10);
      tableHeaders.forEach((header, i) => {
        doc.text(header, xPos + 5, tableTop + 8, { width: colWidths[i] - 10 });
        xPos += colWidths[i];
      });

      // Table rows
      doc.fillColor('#000000');
      let yPos = tableTop + 30;

      quote.items.forEach((item, index) => {
        const rowColor = index % 2 === 0 ? '#f8f9fa' : '#ffffff';
        doc.fillColor(rowColor).rect(50, yPos, 500, 25).fill();
        doc.fillColor('#000000');

        xPos = 50;
        doc.text(item.description || item.product?.name || 'Item', xPos + 5, yPos + 8, { width: colWidths[0] - 10 });
        xPos += colWidths[0];
        doc.text(item.quantity.toString(), xPos + 5, yPos + 8, { width: colWidths[1] - 10 });
        xPos += colWidths[1];
        doc.text(`R ${item.unitPrice.toFixed(2)}`, xPos + 5, yPos + 8, { width: colWidths[2] - 10 });
        xPos += colWidths[2];
        doc.text(`R ${item.total.toFixed(2)}`, xPos + 5, yPos + 8, { width: colWidths[3] - 10 });

        yPos += 25;
      });

      // Totals
      yPos += 20;
      const totalsX = 350;

      doc.text('Subtotal:', totalsX, yPos);
      doc.text(`R ${quote.subtotal.toFixed(2)}`, totalsX + 100, yPos, { align: 'right', width: 100 });
      yPos += 20;

      if (quote.discountAmount > 0) {
        doc.text(`Discount (${quote.discountPercent}%):`, totalsX, yPos);
        doc.text(`-R ${quote.discountAmount.toFixed(2)}`, totalsX + 100, yPos, { align: 'right', width: 100 });
        yPos += 20;
      }

      doc.text('VAT (15%):', totalsX, yPos);
      doc.text(`R ${quote.tax.toFixed(2)}`, totalsX + 100, yPos, { align: 'right', width: 100 });
      yPos += 20;

      doc.fontSize(14).font('Helvetica-Bold');
      doc.text('TOTAL:', totalsX, yPos);
      doc.text(`R ${quote.total.toFixed(2)}`, totalsX + 100, yPos, { align: 'right', width: 100 });
      doc.font('Helvetica').fontSize(10);

      // Terms and conditions
      if (quote.terms) {
        yPos += 50;
        doc.fontSize(12).text('Terms & Conditions', 50, yPos);
        doc.fontSize(9).text(quote.terms, 50, yPos + 20, { width: 500 });
      }

      // Notes
      if (quote.notes) {
        yPos += 80;
        doc.fontSize(12).text('Notes', 50, yPos);
        doc.fontSize(10).text(quote.notes, 50, yPos + 20, { width: 500 });
      }

      // Footer
      const footerY = doc.page.height - 50;
      doc.fontSize(8).fillColor('#666666');
      doc.text(
        'To accept this quotation, please reply to this email or contact us directly.',
        50,
        footerY,
        { align: 'center', width: 500 }
      );

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};
