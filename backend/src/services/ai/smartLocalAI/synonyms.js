/**
 * Synonym Mapping
 * Maps common variations to canonical intent names
 */

export default {
  // Order synonyms
  'purchase': 'order_status',
  'bought': 'order_status',
  'ordered': 'order_status',
  'delivery': 'order_status',
  'shipping': 'order_status',
  'tracking': 'order_status',
  'dispatch': 'order_status',

  // Quote synonyms
  'quotation': 'quote_request',
  'estimate': 'quote_request',
  'pricing': 'quote_request',
  'cost': 'product_price',
  'price': 'product_price',
  'expensive': 'product_price',
  'cheap': 'product_price',

  // Product synonyms
  'item': 'product_search',
  'items': 'product_search',
  'product': 'product_search',
  'products': 'product_search',
  'stock': 'product_availability',
  'available': 'product_availability',
  'availability': 'product_availability',
  'inventory': 'product_availability',

  // Invoice synonyms
  'bill': 'invoice_status',
  'payment': 'invoice_payment',
  'pay': 'invoice_payment',
  'owe': 'account_balance',
  'owing': 'account_balance',
  'balance': 'account_balance',
  'outstanding': 'invoice_list',

  // Supplier synonyms
  'vendor': 'supplier_orders',
  'supplier': 'supplier_orders',
  'po': 'supplier_po_status',
  'purchase order': 'supplier_po_status',

  // Support synonyms
  'help': 'help',
  'assist': 'help',
  'support': 'help',
  'human': 'contact_support',
  'agent': 'contact_support',
  'person': 'contact_support',
  'call': 'contact_support',
  'phone': 'contact_support',

  // Report synonyms
  'sales': 'report_sales',
  'revenue': 'report_sales',
  'analytics': 'report_sales',
  'report': 'report_sales',

  // Account synonyms
  'account': 'account_info',
  'profile': 'account_info',
  'settings': 'account_info',

  // Category synonyms
  'category': 'product_category',
  'categories': 'product_category',
  'browse': 'product_category',
  'catalog': 'product_category'
}
