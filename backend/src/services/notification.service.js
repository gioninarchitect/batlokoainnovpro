import { sendEmail, emailTemplates } from './email.service.js';
import { sendWhatsAppMessage, sendAdminAlert } from './whatsapp.service.js';

// Send order notification
export const sendOrderNotification = async (order, type, data = {}) => {
  try {
    const notifications = [];

    switch (type) {
      case 'created':
      case 'confirmed':
        // Send email confirmation to customer
        const emailTemplate = emailTemplates.orderConfirmation(order);
        notifications.push(
          sendEmail({
            to: order.customer.email,
            ...emailTemplate,
          })
        );

        // Send WhatsApp to customer if phone available
        if (order.customer.phone) {
          notifications.push(
            sendWhatsAppMessage(order.customer.phone, {
              type: 'order_confirmation',
              orderNumber: order.orderNumber,
              total: order.total,
              customerName: order.customer.companyName,
            })
          );
        }

        // ADMIN ALERT: New order with deep links
        notifications.push(
          sendAdminAlert({
            type: 'new_order',
            orderNumber: order.orderNumber,
            orderId: order.id,
            customerName: order.customer.companyName,
            customerId: order.customerId,
            total: order.total,
            itemCount: order.items?.length || 0,
          })
        );
        break;

      case 'status_changed':
        const statusMessages = {
          PROCESSING: `Your order ${order.orderNumber} is being processed.`,
          READY: `Your order ${order.orderNumber} is ready for collection/shipping.`,
          SHIPPED: `Your order ${order.orderNumber} has been shipped.`,
          DELIVERED: `Your order ${order.orderNumber} has been delivered.`,
          CANCELLED: `Your order ${order.orderNumber} has been cancelled.`,
        };

        const message = statusMessages[data.newStatus];
        if (message && order.customer.email) {
          notifications.push(
            sendEmail({
              to: order.customer.email,
              subject: `Order ${order.orderNumber} - Status Update`,
              html: `
                <p>Dear ${order.customer.companyName},</p>
                <p>${message}</p>
                <p>Thank you for your business.</p>
                <p>Batlokoa Innovative Projects</p>
              `,
            })
          );
        }

        if (message && order.customer.phone) {
          notifications.push(
            sendWhatsAppMessage(order.customer.phone, {
              type: 'order_status',
              message,
            })
          );
        }
        break;
    }

    await Promise.allSettled(notifications);
    console.log(`Order notifications sent for ${order.orderNumber}`);
  } catch (error) {
    console.error('Order notification error:', error);
    // Don't throw - notifications failing shouldn't break the flow
  }
};

// Send invoice notification
export const sendInvoiceNotification = async (invoice, type, data = {}) => {
  try {
    switch (type) {
      case 'sent':
        const invoiceTemplate = emailTemplates.invoiceSent(invoice);
        await sendEmail({
          to: invoice.customer.email,
          ...invoiceTemplate,
          // TODO: Attach PDF
        });

        if (invoice.customer.phone) {
          await sendWhatsAppMessage(invoice.customer.phone, {
            type: 'invoice_sent',
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.total,
            dueDate: invoice.dueDate,
          });
        }
        break;

      case 'paid':
        const paidTemplate = emailTemplates.paymentReceived(invoice, data.payment || { amount: invoice.amountPaid, paymentDate: new Date() });
        await sendEmail({
          to: invoice.customer.email,
          ...paidTemplate,
        });
        break;

      case 'overdue':
        await sendEmail({
          to: invoice.customer.email,
          subject: `Payment Reminder - Invoice ${invoice.invoiceNumber} is Overdue`,
          html: `
            <p>Dear ${invoice.customer.companyName},</p>
            <p>This is a friendly reminder that invoice <strong>${invoice.invoiceNumber}</strong> is now overdue.</p>
            <p><strong>Amount Due:</strong> R${invoice.amountDue.toFixed(2)}</p>
            <p><strong>Due Date:</strong> ${new Date(invoice.dueDate).toLocaleDateString('en-ZA')}</p>
            <p>Please arrange payment as soon as possible.</p>
            <p>If you have already made payment, please disregard this notice.</p>
            <p>Batlokoa Innovative Projects</p>
          `,
        });
        break;
    }

    console.log(`Invoice notification sent for ${invoice.invoiceNumber}`);
  } catch (error) {
    console.error('Invoice notification error:', error);
  }
};

// Send quote notification
export const sendQuoteNotification = async (quote, type) => {
  try {
    switch (type) {
      case 'sent':
        const quoteTemplate = emailTemplates.quoteSent(quote);
        await sendEmail({
          to: quote.customer.email,
          ...quoteTemplate,
        });

        if (quote.customer.phone) {
          await sendWhatsAppMessage(quote.customer.phone, {
            type: 'quote_sent',
            quoteNumber: quote.quoteNumber,
            total: quote.total,
            validUntil: quote.validUntil,
          });
        }
        break;
    }

    console.log(`Quote notification sent for ${quote.quoteNumber}`);
  } catch (error) {
    console.error('Quote notification error:', error);
  }
};

// Send low stock alert
export const sendLowStockAlert = async (products) => {
  try {
    // TODO: Get admin emails from settings
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@batlokoa.co.za';

    await sendEmail({
      to: adminEmail,
      subject: 'Low Stock Alert - Action Required',
      html: `
        <h2>Low Stock Alert</h2>
        <p>The following products are running low on stock:</p>
        <table border="1" cellpadding="10" style="border-collapse: collapse;">
          <tr>
            <th>SKU</th>
            <th>Product</th>
            <th>Current Stock</th>
            <th>Reorder Level</th>
          </tr>
          ${products.map(p => `
            <tr>
              <td>${p.sku}</td>
              <td>${p.name}</td>
              <td style="color: red;">${p.stockQuantity}</td>
              <td>${p.reorderLevel}</td>
            </tr>
          `).join('')}
        </table>
        <p>Please review and reorder stock as needed.</p>
      `,
    });

    console.log('Low stock alert sent');
  } catch (error) {
    console.error('Low stock alert error:', error);
  }
};
