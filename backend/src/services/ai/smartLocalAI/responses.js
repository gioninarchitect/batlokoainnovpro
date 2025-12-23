/**
 * Response Templates
 * Pre-built responses for each intent
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export default {
  // ORDER RESPONSES
  order_status: async (entities, context) => {
    if (entities.orderNumber) {
      try {
        const order = await prisma.order.findFirst({
          where: {
            OR: [
              { orderNumber: { contains: entities.orderNumber } },
              { id: parseInt(entities.orderNumber) || 0 }
            ]
          },
          include: { customer: true }
        })

        if (order) {
          const statusMessages = {
            PENDING: 'is pending confirmation',
            CONFIRMED: 'has been confirmed and is being processed',
            PROCESSING: 'is being prepared for dispatch',
            AWAITING_PAYMENT: 'is awaiting payment',
            PAID: 'payment received, preparing for dispatch',
            DISPATCHED: 'has been dispatched',
            DELIVERED: 'has been delivered',
            CANCELLED: 'has been cancelled'
          }
          return `Order #${order.orderNumber} ${statusMessages[order.status] || 'status: ' + order.status}. Total: R${order.total?.toFixed(2) || '0.00'}`
        }
      } catch (e) {
        console.error('Order lookup error:', e)
      }
      return `I couldn't find order #${entities.orderNumber}. Please check the order number and try again.`
    }
    return "Please provide your order number. You can say something like 'Check order ORD-1234' or 'Where is order #5678'"
  },

  order_list: async (entities, context) => {
    if (context.customerId) {
      try {
        const orders = await prisma.order.findMany({
          where: { customerId: context.customerId },
          orderBy: { createdAt: 'desc' },
          take: 5
        })

        if (orders.length > 0) {
          const orderList = orders.map(o =>
            `- #${o.orderNumber}: ${o.status} (R${o.total?.toFixed(2) || '0.00'})`
          ).join('\n')
          return `Your recent orders:\n${orderList}`
        }
        return "You don't have any orders yet."
      } catch (e) {
        console.error('Order list error:', e)
      }
    }
    return "To view your orders, please log in to your account or provide your customer ID."
  },

  order_cancel: async (entities, context) => {
    if (entities.orderNumber) {
      return `To cancel order #${entities.orderNumber}, please contact our support team or use the 'Cancel Order' button in your order details. Note: Orders that have been dispatched cannot be cancelled.`
    }
    return "Which order would you like to cancel? Please provide the order number."
  },

  // QUOTE RESPONSES
  quote_request: async (entities, context) => {
    let response = "I can help you request a quote! "
    if (entities.productName) {
      response += `For "${entities.productName}"${entities.quantity ? ` (${entities.quantity} units)` : ''}, `
    }
    response += "please visit the Products page and click 'Add to Quote' on the items you need, then submit your quote request. Alternatively, contact our sales team directly."
    return response
  },

  quote_status: async (entities, context) => {
    if (entities.quoteNumber) {
      try {
        const quote = await prisma.quote.findFirst({
          where: {
            OR: [
              { quoteNumber: { contains: entities.quoteNumber } },
              { id: parseInt(entities.quoteNumber) || 0 }
            ]
          }
        })

        if (quote) {
          const statusMessages = {
            DRAFT: 'is being prepared',
            PENDING: 'is pending review',
            SENT: 'has been sent - please check your email',
            APPROVED: 'has been approved',
            REJECTED: 'was not approved',
            EXPIRED: 'has expired',
            CONVERTED: 'has been converted to an order'
          }
          return `Quote #${quote.quoteNumber} ${statusMessages[quote.status] || 'status: ' + quote.status}. Total: R${quote.total?.toFixed(2) || '0.00'}. Valid until: ${quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'N/A'}`
        }
      } catch (e) {
        console.error('Quote lookup error:', e)
      }
      return `I couldn't find quote #${entities.quoteNumber}. Please check the quote number.`
    }
    return "Please provide your quote number. Example: 'Check quote QUO-1234'"
  },

  quote_list: async (entities, context) => {
    if (context.customerId) {
      try {
        const quotes = await prisma.quote.findMany({
          where: { customerId: context.customerId },
          orderBy: { createdAt: 'desc' },
          take: 5
        })

        if (quotes.length > 0) {
          const quoteList = quotes.map(q =>
            `- #${q.quoteNumber}: ${q.status} (R${q.total?.toFixed(2) || '0.00'})`
          ).join('\n')
          return `Your recent quotes:\n${quoteList}`
        }
        return "You don't have any quotes yet. Browse our products to request a quote!"
      } catch (e) {
        console.error('Quote list error:', e)
      }
    }
    return "To view your quotes, please log in to your account."
  },

  // PRODUCT RESPONSES
  product_search: async (entities, context) => {
    if (entities.productName) {
      try {
        const products = await prisma.product.findMany({
          where: {
            OR: [
              { name: { contains: entities.productName, mode: 'insensitive' } },
              { description: { contains: entities.productName, mode: 'insensitive' } },
              { sku: { contains: entities.productName, mode: 'insensitive' } }
            ],
            isActive: true
          },
          take: 5
        })

        if (products.length > 0) {
          const productList = products.map(p =>
            `- ${p.name}: R${p.price?.toFixed(2) || 'TBC'} ${p.stockQuantity > 0 ? '(In Stock)' : '(Out of Stock)'}`
          ).join('\n')
          return `Found ${products.length} product(s) matching "${entities.productName}":\n${productList}\n\nVisit the Products page for more details.`
        }
        return `No products found matching "${entities.productName}". Try a different search term or browse our categories.`
      } catch (e) {
        console.error('Product search error:', e)
      }
    }
    return "What product are you looking for? Try: 'Search for bolts' or 'Do you have safety gear?'"
  },

  product_price: async (entities, context) => {
    if (entities.productName) {
      try {
        const product = await prisma.product.findFirst({
          where: {
            OR: [
              { name: { contains: entities.productName, mode: 'insensitive' } },
              { sku: { contains: entities.productName, mode: 'insensitive' } }
            ]
          }
        })

        if (product) {
          return `${product.name} is priced at R${product.price?.toFixed(2) || 'TBC'}${entities.quantity ? `. For ${entities.quantity} units: R${(product.price * entities.quantity).toFixed(2)}` : ''}. For bulk pricing, please request a quote.`
        }
      } catch (e) {
        console.error('Price lookup error:', e)
      }
      return `I couldn't find pricing for "${entities.productName}". Please check the product name or browse our catalog.`
    }
    return "Which product would you like pricing for?"
  },

  product_availability: async (entities, context) => {
    if (entities.productName) {
      try {
        const product = await prisma.product.findFirst({
          where: {
            OR: [
              { name: { contains: entities.productName, mode: 'insensitive' } },
              { sku: { contains: entities.productName, mode: 'insensitive' } }
            ]
          }
        })

        if (product) {
          if (product.stockQuantity > 10) {
            return `${product.name} is IN STOCK (${product.stockQuantity} available).`
          } else if (product.stockQuantity > 0) {
            return `${product.name} is LOW STOCK (only ${product.stockQuantity} left). Order soon!`
          } else {
            return `${product.name} is currently OUT OF STOCK. Contact us for backorder options.`
          }
        }
      } catch (e) {
        console.error('Availability check error:', e)
      }
      return `I couldn't find "${entities.productName}". Please check the product name.`
    }
    return "Which product would you like to check availability for?"
  },

  product_category: async (entities, context) => {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        select: { name: true, _count: { select: { products: true } } }
      })

      if (categories.length > 0) {
        const catList = categories.map(c => `- ${c.name} (${c._count.products} products)`).join('\n')
        return `Our product categories:\n${catList}\n\nBrowse the Products page to see items in each category.`
      }
      return "Browse our Products page to see all available categories."
    } catch (e) {
      console.error('Category list error:', e)
      return "Visit the Products page to browse our categories."
    }
  },

  // INVOICE RESPONSES
  invoice_status: async (entities, context) => {
    if (entities.invoiceNumber) {
      try {
        const invoice = await prisma.invoice.findFirst({
          where: {
            OR: [
              { invoiceNumber: { contains: entities.invoiceNumber } },
              { id: parseInt(entities.invoiceNumber) || 0 }
            ]
          }
        })

        if (invoice) {
          const statusMessages = {
            DRAFT: 'is being prepared',
            SENT: 'has been sent - please check your email',
            PAID: 'has been paid - thank you!',
            OVERDUE: 'is OVERDUE - please make payment as soon as possible',
            CANCELLED: 'has been cancelled'
          }
          return `Invoice #${invoice.invoiceNumber} ${statusMessages[invoice.status] || 'status: ' + invoice.status}. Amount: R${invoice.total?.toFixed(2) || '0.00'}. Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : 'N/A'}`
        }
      } catch (e) {
        console.error('Invoice lookup error:', e)
      }
      return `I couldn't find invoice #${entities.invoiceNumber}. Please check the invoice number.`
    }
    return "Please provide your invoice number. Example: 'Check invoice INV-1234'"
  },

  invoice_list: async (entities, context) => {
    if (context.customerId) {
      try {
        const invoices = await prisma.invoice.findMany({
          where: { customerId: context.customerId },
          orderBy: { createdAt: 'desc' },
          take: 5
        })

        if (invoices.length > 0) {
          const invoiceList = invoices.map(i =>
            `- #${i.invoiceNumber}: ${i.status} (R${i.total?.toFixed(2) || '0.00'})`
          ).join('\n')
          return `Your recent invoices:\n${invoiceList}`
        }
        return "You don't have any invoices yet."
      } catch (e) {
        console.error('Invoice list error:', e)
      }
    }
    return "To view your invoices, please log in to your account."
  },

  invoice_payment: "To make a payment:\n1. Log in to your account\n2. Go to Invoices\n3. Click 'Pay Now' on the invoice\n4. Upload your proof of payment\n\nOur banking details are available on each invoice. For assistance, contact our accounts team.",

  // SUPPLIER PORTAL RESPONSES
  supplier_orders: async (entities, context) => {
    if (context.supplierId) {
      try {
        const orders = await prisma.purchaseOrder.findMany({
          where: { supplierId: context.supplierId },
          orderBy: { createdAt: 'desc' },
          take: 5
        })

        if (orders.length > 0) {
          const orderList = orders.map(o =>
            `- PO#${o.poNumber}: ${o.status} (R${o.total?.toFixed(2) || '0.00'})`
          ).join('\n')
          return `Your recent purchase orders:\n${orderList}\n\nClick on any order to view details or update status.`
        }
        return "You don't have any purchase orders at the moment."
      } catch (e) {
        console.error('Supplier orders error:', e)
      }
    }
    return "To view your orders, please log in to the Supplier Portal."
  },

  supplier_po_status: async (entities, context) => {
    return "To update a purchase order status:\n1. Go to your Orders dashboard\n2. Find the PO you want to update\n3. Click 'Accept' to confirm or 'Reject' to decline\n4. Add delivery details when ready to ship"
  },

  supplier_delivery: "To confirm a delivery:\n1. Go to your Orders dashboard\n2. Find the accepted PO\n3. Click 'Mark as Dispatched'\n4. Enter tracking number (if available)\n5. We'll notify the buyer automatically",

  supplier_stock: "To update your stock levels:\n1. Go to Products in your dashboard\n2. Find the product to update\n3. Click 'Edit' and adjust the quantity\n4. Save changes\n\nWe recommend keeping stock levels accurate to avoid order issues.",

  // PURCHASE ORDER RESPONSES (Admin)
  po_create: "To create a new purchase order:\n1. Go to Purchase Orders in the admin menu\n2. Click 'New Purchase Order'\n3. Select the supplier\n4. Add products and quantities\n5. Review and send to supplier",

  po_status: async (entities, context) => {
    if (entities.orderNumber) {
      return `To check PO #${entities.orderNumber}, go to Purchase Orders in the admin menu and search for it.`
    }
    return "Go to Purchase Orders in the admin menu to see all PO statuses."
  },

  po_list: "View all purchase orders in Admin > Purchase Orders. You can filter by status, supplier, or date range.",

  // CUSTOMER RESPONSES
  customer_search: "To search for a customer:\n1. Go to Customers in the admin menu\n2. Use the search bar to find by name, email, or company\n3. Click on a customer to view their full profile",

  customer_history: async (entities, context) => {
    return "To view customer order history:\n1. Go to Customers\n2. Click on the customer\n3. View the 'Orders' tab for their complete history"
  },

  // REPORT RESPONSES
  report_sales: async (entities, context) => {
    let timeframe = 'this month'
    if (entities.dateRef === 'today') timeframe = 'today'
    if (entities.dateRef === 'this_week') timeframe = 'this week'

    return `For ${timeframe}'s sales report, go to Admin > Reports > Sales. You'll see total revenue, order count, top products, and trends.`
  },

  report_inventory: "For inventory reports:\n1. Go to Admin > Reports > Inventory\n2. View low stock alerts, out of stock items\n3. Export for reordering",

  report_customers: "For customer reports:\n1. Go to Admin > Reports > Customers\n2. See new customers, top buyers, and activity trends",

  // HELP RESPONSES
  help: `I can help you with:

**Orders** - Track status, view history, cancel orders
**Quotes** - Request quotes, check status
**Products** - Search, check prices and availability
**Invoices** - View invoices, payment info
**Suppliers** - Manage POs, deliveries (Supplier Portal)
**Reports** - Sales, inventory, customer analytics

Just ask me something like:
- "Where is my order ORD-1234?"
- "Do you have safety helmets in stock?"
- "Show me my invoices"`,

  contact_support: "To speak with our team:\n- Phone: [Configure in Settings]\n- Email: [Configure in Settings]\n- Hours: Monday-Friday, 9am-5pm\n\nFor urgent orders, please call us directly.",

  // ACCOUNT RESPONSES
  account_info: "To manage your account:\n1. Click on your profile icon\n2. Go to 'My Account' or 'Settings'\n3. Update your details, address, or password",

  account_balance: async (entities, context) => {
    if (context.customerId) {
      try {
        const unpaidInvoices = await prisma.invoice.findMany({
          where: {
            customerId: context.customerId,
            status: { in: ['SENT', 'OVERDUE'] }
          }
        })

        const total = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
        if (unpaidInvoices.length > 0) {
          return `You have ${unpaidInvoices.length} outstanding invoice(s) totaling R${total.toFixed(2)}. View your Invoices page for details.`
        }
        return "You have no outstanding balance. All invoices are paid!"
      } catch (e) {
        console.error('Balance check error:', e)
      }
    }
    return "To check your balance, please log in and view your Invoices page."
  }
}
