import nodemailer from 'nodemailer';
import config from '../config/index.js';
import prisma from '../config/database.js';

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

// Helper to get customer display name
const getCustomerName = (customer) => {
  if (!customer) return 'Valued Customer';
  return customer.company || `${customer.firstName || ''} ${customer.lastName || ''}`.trim() || 'Valued Customer';
};

// Email templates
export const emailTemplates = {
  orderConfirmation: (order) => {
    const customerName = getCustomerName(order.customer);
    const subtotal = Number(order.subtotal) || 0;
    const vat = Number(order.vatAmount) || subtotal * 0.15;
    const total = Number(order.total) || subtotal + vat;

    return {
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
            .highlight { background: #e94560; color: white; padding: 15px; border-radius: 4px; margin: 20px 0; text-align: center; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Confirmation</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Thank you for your order. Your order <strong>${order.orderNumber}</strong> has been received and is being processed.</p>

              <h3>Order Details</h3>
              <table>
                <tr><th>Product</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                ${(order.items || []).map(item => `
                  <tr>
                    <td>${item.description || item.product?.name || 'Product'}</td>
                    <td>${item.quantity}</td>
                    <td>R${Number(item.unitPrice).toFixed(2)}</td>
                    <td>R${Number(item.total).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </table>

              <p><strong>Subtotal:</strong> R${subtotal.toFixed(2)}</p>
              <p><strong>VAT (15%):</strong> R${vat.toFixed(2)}</p>
              <p><strong>Total:</strong> R${total.toFixed(2)}</p>

              <div class="highlight">
                <p style="margin:0;"><strong>Payment Reference:</strong> ${order.orderNumber}</p>
              </div>

              <p>Please make payment using the reference above. We will notify you when your order is dispatched.</p>

              <h3>Payment Details</h3>
              <p><strong>Bank:</strong> First National Bank</p>
              <p><strong>Account Name:</strong> Batlokoa Innovative Projects</p>
              <p><strong>Reference:</strong> ${order.orderNumber}</p>
            </div>
            <div class="footer">
              <p>Batlokoa Innovative Projects</p>
              <p>+27 73 974 8317 | info@batlokoainnovpro.co.za</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },

  orderDispatched: (order, dispatchInfo = {}) => {
    const customerName = getCustomerName(order.customer);
    return {
      subject: `Your Order ${order.orderNumber} Has Been Dispatched`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #28a745; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background: #f9f9f9; }
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .tracking { background: #1a1a2e; color: white; padding: 15px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Order Dispatched</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Great news! Your order <strong>${order.orderNumber}</strong> has been dispatched and is on its way to you.</p>

              ${dispatchInfo.courier || dispatchInfo.trackingNumber ? `
                <div class="tracking">
                  <h3 style="margin-top:0;">Delivery Information</h3>
                  ${dispatchInfo.courier ? `<p><strong>Courier:</strong> ${dispatchInfo.courier}</p>` : ''}
                  ${dispatchInfo.trackingNumber ? `<p><strong>Tracking Number:</strong> ${dispatchInfo.trackingNumber}</p>` : ''}
                </div>
              ` : ''}

              <h3>Delivery Address</h3>
              <p>${order.deliveryAddress || 'As per order details'}</p>
              ${order.deliveryCity ? `<p>${order.deliveryCity}</p>` : ''}

              <p>If you have any questions about your delivery, please contact us.</p>
            </div>
            <div class="footer">
              <p>Batlokoa Innovative Projects</p>
              <p>+27 73 974 8317 | info@batlokoainnovpro.co.za</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },

  invoiceSent: (invoice) => {
    const customerName = getCustomerName(invoice.customer);
    const amountDue = Number(invoice.amountDue) || Number(invoice.balance) || 0;
    return {
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
              <p>Dear ${customerName},</p>
              <p>Please find attached your invoice <strong>${invoice.invoiceNumber}</strong>.</p>

              <div class="highlight">
                <p><strong>Amount Due:</strong> R${amountDue.toFixed(2)}</p>
                <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-ZA')}</p>
              </div>

              <h3>Payment Details</h3>
              <p><strong>Bank:</strong> First National Bank</p>
              <p><strong>Account Name:</strong> Batlokoa Innovative Projects</p>
              <p><strong>Reference:</strong> ${invoice.invoiceNumber}</p>

              <p>Please ensure payment is made by the due date to avoid any delays in future orders.</p>
            </div>
            <div class="footer">
              <p>Batlokoa Innovative Projects</p>
              <p>+27 73 974 8317 | info@batlokoainnovpro.co.za</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },

  paymentReceived: (invoice, payment) => {
    const customerName = getCustomerName(invoice.customer);
    const paymentAmount = Number(payment.amount) || 0;
    return {
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
              <p>Dear ${customerName},</p>

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
    };
  },

  lowStockAlert: (products) => ({
    subject: `Low Stock Alert - ${products.length} Product${products.length > 1 ? 's' : ''} Need Attention`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #e94560; color: white; padding: 20px; text-align: center; }
          .content { padding: 20px; background: #f9f9f9; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background: #1a1a2e; color: white; }
          .low { color: #dc3545; font-weight: bold; }
          .out { color: #fff; background: #dc3545; padding: 2px 8px; border-radius: 4px; }
          .button { display: inline-block; padding: 12px 24px; background: #0f3460; color: white; text-decoration: none; border-radius: 4px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Low Stock Alert</h1>
          </div>
          <div class="content">
            <p>The following products are running low on stock and need attention:</p>

            <table>
              <tr><th>SKU</th><th>Product</th><th>Stock</th><th>Threshold</th></tr>
              ${products.map(p => `
                <tr>
                  <td>${p.sku || 'N/A'}</td>
                  <td>${p.name}</td>
                  <td class="${p.stockQty <= 0 ? 'out' : 'low'}">${p.stockQty}</td>
                  <td>${p.lowStockThreshold}</td>
                </tr>
              `).join('')}
            </table>

            <p>Please reorder these items to avoid stockouts.</p>

            <a href="${process.env.FRONTEND_URL || 'https://batlokoa.cleva-ai.co.za'}/admin/products" class="button">View Inventory</a>
          </div>
        </div>
      </body>
      </html>
    `,
  }),

  quoteSent: (quote) => {
    const customerName = quote.customerName || quote.customer?.company ||
      `${quote.customer?.firstName || ''} ${quote.customer?.lastName || ''}`.trim() || 'Valued Customer';
    const subtotal = Number(quote.subtotal) || 0;
    const discount = Number(quote.discountAmount) || Number(quote.discount) || 0;
    const vat = Number(quote.tax) || Number(quote.vatAmount) || 0;
    const total = Number(quote.total) || 0;

    return {
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
            .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
            th { background: #1a1a2e; color: white; }
            .warning { background: #ffc107; padding: 10px; border-radius: 4px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Quotation</h1>
            </div>
            <div class="content">
              <p>Dear ${customerName},</p>
              <p>Thank you for your enquiry. Please find our quotation below:</p>

              <p><strong>Quote Number:</strong> ${quote.quoteNumber}</p>

              <table>
                <tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>
                ${(quote.items || []).map(item => `
                  <tr>
                    <td>${item.description || item.product?.name || 'Item'}</td>
                    <td>${item.quantity}</td>
                    <td>R${Number(item.unitPrice).toFixed(2)}</td>
                    <td>R${Number(item.total).toFixed(2)}</td>
                  </tr>
                `).join('')}
              </table>

              <p><strong>Subtotal:</strong> R${subtotal.toFixed(2)}</p>
              ${discount > 0 ? `<p><strong>Discount:</strong> -R${discount.toFixed(2)}</p>` : ''}
              <p><strong>VAT (15%):</strong> R${vat.toFixed(2)}</p>
              <p><strong>Total:</strong> R${total.toFixed(2)}</p>

              <div class="warning">
                <p><strong>Valid Until:</strong> ${new Date(quote.validUntil).toLocaleDateString('en-ZA')}</p>
              </div>

              ${quote.terms ? `<p><strong>Terms:</strong> ${quote.terms}</p>` : ''}

              <p>To proceed with this quote, please reply to this email or contact us directly.</p>
            </div>
            <div class="footer">
              <p>Batlokoa Innovative Projects</p>
              <p>+27 73 974 8317 | info@batlokoainnovpro.co.za</p>
            </div>
          </div>
        </body>
        </html>
      `,
    };
  },
};

// Check for low stock products and send alert
export const checkAndSendLowStockAlert = async () => {
  try {
    // Find products where stock is at or below threshold
    const lowStockProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        stockQty: { lte: prisma.product.fields.lowStockThreshold }
      },
      select: {
        id: true,
        name: true,
        sku: true,
        stockQty: true,
        lowStockThreshold: true
      },
      orderBy: { stockQty: 'asc' }
    });

    // Alternative query if the above doesn't work with Prisma
    const lowStock = await prisma.$queryRaw`
      SELECT id, name, sku, "stockQty", "lowStockThreshold"
      FROM products
      WHERE "isActive" = true AND "stockQty" <= "lowStockThreshold"
      ORDER BY "stockQty" ASC
    `;

    if (lowStock.length === 0) {
      return { sent: false, message: 'No low stock products found' };
    }

    // Get admin email from config or env
    const adminEmail = process.env.ADMIN_EMAIL || config.email.user || 'admin@batlokoainnovpro.co.za';

    const template = emailTemplates.lowStockAlert(lowStock);
    await sendEmail({
      to: adminEmail,
      subject: template.subject,
      html: template.html
    });

    return { sent: true, count: lowStock.length, products: lowStock };
  } catch (error) {
    console.error('Low stock alert error:', error);
    throw error;
  }
};
