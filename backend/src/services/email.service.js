import nodemailer from 'nodemailer';
import config from '../config/index.js';

// Create transporter
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.port === 465,
  auth: {
    user: config.email.user,
    pass: config.email.pass,
  },
});

// Send email
export const sendEmail = async ({ to, subject, html, text, attachments }) => {
  try {
    if (!config.email.host || !config.email.user) {
      console.warn('Email not configured, skipping send');
      return { skipped: true };
    }

    const info = await transporter.sendMail({
      from: config.email.from || `"Batlokoa Innovative Projects" <${config.email.user}>`,
      to,
      subject,
      html,
      text,
      attachments,
    });

    console.log('Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('Email send error:', error);
    throw error;
  }
};

// Email templates
export const emailTemplates = {
  orderConfirmation: (order) => ({
    subject: `Order Confirmation - ${order.orderNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .button { display: inline-block; padding: 12px 24px; background: #e94560; color: white; text-decoration: none; border-radius: 4px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #1a1a2e; color: white; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Order Confirmation</h1>
          </div>
          <div class="content">
            <p>Dear ${order.customer.companyName},</p>
            <p>Thank you for your order. Your order <strong>${order.orderNumber}</strong> has been confirmed.</p>

            <h3>Order Details</h3>
            <table>
              <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
              ${order.items.map(item => `
                <tr>
                  <td>${item.product?.name || 'Product'}</td>
                  <td>${item.quantity}</td>
                  <td>R${item.unitPrice.toFixed(2)}</td>
                  <td>R${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>

            <p><strong>Subtotal:</strong> R${order.subtotal.toFixed(2)}</p>
            <p><strong>VAT (15%):</strong> R${order.tax.toFixed(2)}</p>
            <p><strong>Total:</strong> R${order.total.toFixed(2)}</p>

            <p>We will notify you when your order ships.</p>
          </div>
          <div class="footer">
            <p>Batlokoa Innovative Projects</p>
            <p>Industrial Engineering Supplies</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  invoiceSent: (invoice) => ({
    subject: `Invoice ${invoice.invoiceNumber} - Batlokoa Innovative Projects`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
          .highlight { background: #e94560; color: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Invoice</h1>
          </div>
          <div class="content">
            <p>Dear ${invoice.customer.companyName},</p>
            <p>Please find attached your invoice <strong>${invoice.invoiceNumber}</strong>.</p>

            <div class="highlight">
              <p><strong>Amount Due:</strong> R${invoice.amountDue.toFixed(2)}</p>
              <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-ZA')}</p>
            </div>

            <h3>Payment Details</h3>
            <p><strong>Bank:</strong> First National Bank</p>
            <p><strong>Account Name:</strong> Batlokoa Innovative Projects</p>
            <p><strong>Account Number:</strong> XXXXXXXXXX</p>
            <p><strong>Branch Code:</strong> 250655</p>
            <p><strong>Reference:</strong> ${invoice.invoiceNumber}</p>

            <p>Please ensure payment is made by the due date to avoid any delays in future orders.</p>
          </div>
          <div class="footer">
            <p>Batlokoa Innovative Projects</p>
            <p>Questions? Contact us at accounts@batlokoa.co.za</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  paymentReceived: (invoice, payment) => ({
    subject: `Payment Received - Invoice ${invoice.invoiceNumber}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          .success { background: #28a745; color: white; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Payment Received</h1>
          </div>
          <div class="content">
            <p>Dear ${invoice.customer.companyName},</p>

            <div class="success">
              <h2>Thank You!</h2>
              <p>We have received your payment of <strong>R${payment.amount.toFixed(2)}</strong></p>
            </div>

            <p><strong>Invoice:</strong> ${invoice.invoiceNumber}</p>
            <p><strong>Payment Date:</strong> ${new Date(payment.paymentDate).toLocaleDateString('en-ZA')}</p>
            <p><strong>Reference:</strong> ${payment.reference || 'N/A'}</p>

            ${invoice.amountDue > 0 ? `
              <p><strong>Remaining Balance:</strong> R${invoice.amountDue.toFixed(2)}</p>
            ` : `
              <p>Your invoice has been paid in full.</p>
            `}

            <p>Thank you for your business!</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  quoteSent: (quote) => ({
    subject: `Quote ${quote.quoteNumber} - Batlokoa Innovative Projects`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #1a1a2e; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #1a1a2e; color: white; }
          .button { display: inline-block; padding: 12px 24px; background: #e94560; color: white; text-decoration: none; border-radius: 4px; }
          .warning { background: #ffc107; padding: 10px; border-radius: 4px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Quotation</h1>
          </div>
          <div class="content">
            <p>Dear ${quote.customer.companyName},</p>
            <p>Thank you for your enquiry. Please find our quotation below:</p>

            <p><strong>Quote Number:</strong> ${quote.quoteNumber}</p>

            <table>
              <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
              ${quote.items.map(item => `
                <tr>
                  <td>${item.description || item.product?.name || 'Item'}</td>
                  <td>${item.quantity}</td>
                  <td>R${item.unitPrice.toFixed(2)}</td>
                  <td>R${item.total.toFixed(2)}</td>
                </tr>
              `).join('')}
            </table>

            <p><strong>Subtotal:</strong> R${quote.subtotal.toFixed(2)}</p>
            ${quote.discountAmount > 0 ? `<p><strong>Discount:</strong> -R${quote.discountAmount.toFixed(2)}</p>` : ''}
            <p><strong>VAT (15%):</strong> R${quote.tax.toFixed(2)}</p>
            <p><strong>Total:</strong> R${quote.total.toFixed(2)}</p>

            <div class="warning">
              <p><strong>Valid Until:</strong> ${new Date(quote.validUntil).toLocaleDateString('en-ZA')}</p>
            </div>

            ${quote.terms ? `<p><strong>Terms:</strong> ${quote.terms}</p>` : ''}

            <p>To proceed with this quote, please reply to this email or contact us directly.</p>
          </div>
        </div>
      </body>
      </html>
    `,
  }),
};
