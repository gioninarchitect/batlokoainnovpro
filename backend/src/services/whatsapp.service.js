import config from '../config/index.js';

// Admin dashboard URL for deep linking
const ADMIN_URL = process.env.ADMIN_URL || 'https://admin.batlokoa.co.za';

// Send WhatsApp message using Cloud API
export const sendWhatsAppMessage = async (phone, data) => {
  try {
    if (!config.whatsapp.apiUrl || !config.whatsapp.apiToken) {
      console.warn('WhatsApp not configured, skipping send');
      return { skipped: true };
    }

    // Format phone number (remove spaces, ensure country code)
    let formattedPhone = phone.replace(/\s+/g, '').replace(/^0/, '27');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.startsWith('27') ? formattedPhone : `27${formattedPhone}`;
    }

    let message;
    switch (data.type) {
      case 'order_confirmation':
        message = `Thank you for your order!\n\nOrder: ${data.orderNumber}\nTotal: R${data.total.toFixed(2)}\n\nWe will notify you when your order is ready.\n\n- Batlokoa Innovative Projects`;
        break;

      case 'order_status':
        message = `${data.message}\n\n- Batlokoa Innovative Projects`;
        break;

      case 'invoice_sent':
        message = `Invoice ${data.invoiceNumber} has been sent to your email.\n\nAmount: R${data.amount.toFixed(2)}\nDue: ${new Date(data.dueDate).toLocaleDateString('en-ZA')}\n\n- Batlokoa Innovative Projects`;
        break;

      case 'quote_sent':
        message = `Quote ${data.quoteNumber} has been sent to your email.\n\nTotal: R${data.total.toFixed(2)}\nValid until: ${new Date(data.validUntil).toLocaleDateString('en-ZA')}\n\n- Batlokoa Innovative Projects`;
        break;

      default:
        message = data.message || 'Message from Batlokoa Innovative Projects';
    }

    const response = await fetch(
      `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.whatsapp.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp API error:', error);
      throw new Error(`WhatsApp send failed: ${error.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('WhatsApp message sent:', result.messages?.[0]?.id);
    return result;
  } catch (error) {
    console.error('WhatsApp send error:', error);
    // Don't throw - WhatsApp failing shouldn't break the flow
    return { error: error.message };
  }
};

// Send WhatsApp template message
export const sendWhatsAppTemplate = async (phone, templateName, components) => {
  try {
    if (!config.whatsapp.apiUrl || !config.whatsapp.apiToken) {
      console.warn('WhatsApp not configured, skipping send');
      return { skipped: true };
    }

    let formattedPhone = phone.replace(/\s+/g, '').replace(/^0/, '27');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.startsWith('27') ? formattedPhone : `27${formattedPhone}`;
    }

    const response = await fetch(
      `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.whatsapp.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'template',
          template: {
            name: templateName,
            language: { code: 'en' },
            components,
          },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp template error:', error);
      throw new Error(`WhatsApp template send failed: ${error.error?.message || 'Unknown error'}`);
    }

    return await response.json();
  } catch (error) {
    console.error('WhatsApp template error:', error);
    return { error: error.message };
  }
};

// Send admin alert with deep link to dashboard
export const sendAdminAlert = async (data) => {
  try {
    const adminPhone = process.env.ADMIN_PHONE;

    if (!adminPhone) {
      console.warn('Admin phone not configured, skipping alert');
      return { skipped: true };
    }

    if (!config.whatsapp.apiUrl || !config.whatsapp.apiToken) {
      console.warn('WhatsApp not configured, skipping admin alert');
      return { skipped: true };
    }

    let formattedPhone = adminPhone.replace(/\s+/g, '').replace(/^0/, '27');
    if (!formattedPhone.startsWith('+')) {
      formattedPhone = formattedPhone.startsWith('27') ? formattedPhone : `27${formattedPhone}`;
    }

    let message;
    switch (data.type) {
      case 'new_order':
        message = `NEW ORDER\n\n` +
          `Order: ${data.orderNumber}\n` +
          `Customer: ${data.customerName}\n` +
          `Total: R${data.total.toFixed(2)}\n` +
          `Items: ${data.itemCount}\n\n` +
          `View Order:\n${ADMIN_URL}/orders/${data.orderId}\n\n` +
          `Customer Details:\n${ADMIN_URL}/customers/${data.customerId}`;
        break;

      case 'new_quote_request':
        message = `QUOTE REQUEST\n\n` +
          `Customer: ${data.customerName}\n` +
          `Email: ${data.email}\n` +
          `Phone: ${data.phone || 'Not provided'}\n\n` +
          `Message:\n${data.message}\n\n` +
          `Action:\n${ADMIN_URL}/quotes/new?customerId=${data.customerId || ''}`;
        break;

      case 'payment_received':
        message = `PAYMENT RECEIVED\n\n` +
          `Invoice: ${data.invoiceNumber}\n` +
          `Customer: ${data.customerName}\n` +
          `Amount: R${data.amount.toFixed(2)}\n` +
          `Method: ${data.paymentMethod}\n\n` +
          `View Invoice:\n${ADMIN_URL}/invoices/${data.invoiceId}`;
        break;

      case 'low_stock':
        message = `LOW STOCK ALERT\n\n` +
          `${data.products.map(p => `${p.name}: ${p.stockQuantity} (min: ${p.reorderLevel})`).join('\n')}\n\n` +
          `View Stock:\n${ADMIN_URL}/products/stock`;
        break;

      case 'overdue_invoice':
        message = `OVERDUE INVOICE\n\n` +
          `Invoice: ${data.invoiceNumber}\n` +
          `Customer: ${data.customerName}\n` +
          `Amount Due: R${data.amountDue.toFixed(2)}\n` +
          `Days Overdue: ${data.daysOverdue}\n\n` +
          `View Invoice:\n${ADMIN_URL}/invoices/${data.invoiceId}`;
        break;

      default:
        message = data.message || 'Alert from Batlokoa System';
        if (data.link) {
          message += `\n\nView Details:\n${data.link}`;
        }
    }

    const response = await fetch(
      `${config.whatsapp.apiUrl}/${config.whatsapp.phoneNumberId}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${config.whatsapp.apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: formattedPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('WhatsApp admin alert error:', error);
      throw new Error(`Admin alert failed: ${error.error?.message || 'Unknown error'}`);
    }

    const result = await response.json();
    console.log('Admin alert sent:', result.messages?.[0]?.id);
    return result;
  } catch (error) {
    console.error('Admin alert error:', error);
    return { error: error.message };
  }
};

// Webhook handler for incoming WhatsApp messages
export const handleWhatsAppWebhook = async (payload) => {
  try {
    const entry = payload.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;

    if (value?.messages) {
      for (const message of value.messages) {
        console.log('Received WhatsApp message:', {
          from: message.from,
          type: message.type,
          text: message.text?.body,
          timestamp: message.timestamp,
        });

        // TODO: Handle incoming messages
        // - Auto-reply
        // - Create support ticket
        // - Forward to staff
      }
    }

    if (value?.statuses) {
      for (const status of value.statuses) {
        console.log('WhatsApp status update:', {
          messageId: status.id,
          status: status.status,
          recipientId: status.recipient_id,
        });
      }
    }

    return { success: true };
  } catch (error) {
    console.error('WhatsApp webhook error:', error);
    throw error;
  }
};
