/**
 * Intent Detection Patterns
 * Regex patterns for detecting user intent from messages
 */

export default {
  // ORDER QUERIES
  order_status: [
    /where(?:'?s| is) my order/i,
    /order status/i,
    /track(?:ing)? (?:my )?order/i,
    /(?:ord[- ]?|#)(\d{4,})/i,
    /what(?:'?s| is) (?:the )?status of (?:my )?order/i,
    /check (?:my )?order/i,
    /order (?:update|progress)/i,
    /has my order (?:shipped|been sent|dispatched)/i,
    /when will (?:my )?order (?:arrive|be delivered)/i
  ],

  order_list: [
    /(?:show|list|view|see) (?:my |all )?orders/i,
    /my orders/i,
    /order history/i,
    /past orders/i,
    /recent orders/i,
    /pending orders/i
  ],

  order_cancel: [
    /cancel (?:my )?order/i,
    /want to cancel/i,
    /stop (?:my )?order/i
  ],

  // QUOTE QUERIES
  quote_request: [
    /(?:request|get|need|want) (?:a )?quote/i,
    /quote (?:for|on)/i,
    /pricing (?:for|on)/i,
    /how much (?:for|is|does|would)/i,
    /what(?:'?s| is) the price/i,
    /can (?:i|you) (?:get|have) (?:a )?quot/i
  ],

  quote_status: [
    /quote status/i,
    /(?:quo[- ]?)(\\d{4,})/i,
    /check (?:my )?quote/i,
    /where(?:'?s| is) my quote/i,
    /quote (?:update|progress)/i
  ],

  quote_list: [
    /(?:show|list|view|see) (?:my |all )?quotes/i,
    /my quotes/i,
    /pending quotes/i
  ],

  // PRODUCT QUERIES
  product_search: [
    /(?:search|find|look for|looking for) (?:a )?product/i,
    /do you (?:have|sell|stock)/i,
    /(?:show|list) products/i,
    /product (?:search|lookup)/i,
    /(?:is|are) .+ (?:in stock|available)/i,
    /what products/i,
    /browse (?:products|catalog)/i
  ],

  product_price: [
    /(?:price|cost) (?:of|for)/i,
    /how much (?:is|does|for)/i,
    /what(?:'?s| is) the price/i,
    /pricing (?:for|on)/i
  ],

  product_availability: [
    /(?:is|are) .+ (?:in stock|available)/i,
    /stock (?:level|status|availability)/i,
    /do you have .+ in stock/i,
    /availability of/i,
    /check stock/i
  ],

  product_category: [
    /(?:show|list|browse) categor/i,
    /what categor/i,
    /product categor/i
  ],

  // INVOICE QUERIES
  invoice_status: [
    /invoice status/i,
    /(?:inv[- ]?)(\\d{4,})/i,
    /check (?:my )?invoice/i,
    /where(?:'?s| is) my invoice/i
  ],

  invoice_list: [
    /(?:show|list|view|see) (?:my |all )?invoices/i,
    /my invoices/i,
    /unpaid invoices/i,
    /outstanding invoices/i,
    /payment history/i
  ],

  invoice_payment: [
    /(?:pay|make payment|settle) (?:my )?invoice/i,
    /how (?:do i|to) pay/i,
    /payment (?:options|methods)/i,
    /banking details/i,
    /bank account/i
  ],

  // SUPPLIER QUERIES (For Supplier Portal)
  supplier_orders: [
    /(?:show|list|view) (?:my |purchase )?orders/i,
    /orders (?:for|from) me/i,
    /pending (?:purchase )?orders/i,
    /new orders/i
  ],

  supplier_po_status: [
    /(?:po|purchase order)[- ]?(\\d{4,})/i,
    /update (?:po|purchase order)/i,
    /accept (?:po|purchase order|order)/i,
    /reject (?:po|purchase order|order)/i
  ],

  supplier_delivery: [
    /(?:confirm|update) delivery/i,
    /delivery status/i,
    /dispatch(?:ed)?/i,
    /shipping update/i,
    /mark as (?:shipped|delivered|dispatched)/i
  ],

  supplier_stock: [
    /(?:update|change) (?:my )?stock/i,
    /stock update/i,
    /inventory (?:update|change)/i,
    /out of stock/i,
    /back in stock/i
  ],

  // PURCHASE ORDER QUERIES (Admin)
  po_create: [
    /create (?:a )?(?:po|purchase order)/i,
    /new (?:po|purchase order)/i,
    /order from supplier/i,
    /restock/i,
    /need to order/i
  ],

  po_status: [
    /(?:po|purchase order) status/i,
    /check (?:po|purchase order)/i,
    /pending (?:po|purchase order)s/i
  ],

  po_list: [
    /(?:show|list|view) (?:all )?(?:po|purchase order)s/i,
    /my (?:po|purchase order)s/i
  ],

  // CUSTOMER QUERIES
  customer_search: [
    /(?:search|find|look up) customer/i,
    /customer (?:info|details|profile)/i,
    /who is customer/i
  ],

  customer_history: [
    /customer (?:order )?history/i,
    /what has .+ ordered/i,
    /orders (?:from|by) customer/i
  ],

  // REPORT QUERIES
  report_sales: [
    /sales report/i,
    /(?:show|get) (?:me )?sales/i,
    /how (?:much|many) (?:did we|have we) (?:sold|sell)/i,
    /revenue/i,
    /top (?:selling|products|customers)/i
  ],

  report_inventory: [
    /(?:stock|inventory) report/i,
    /low stock/i,
    /out of stock items/i,
    /stock levels/i
  ],

  report_customers: [
    /customer report/i,
    /customer analytics/i,
    /new customers/i,
    /customer growth/i
  ],

  // HELP & SUPPORT
  help: [
    /help/i,
    /what can you do/i,
    /how (?:do i|to)/i,
    /assist(?:ance)?/i,
    /support/i,
    /guide/i
  ],

  contact_support: [
    /(?:contact|speak|talk) (?:to )?(?:support|someone|human|agent)/i,
    /need (?:help|assistance)/i,
    /escalate/i,
    /manager/i
  ],

  // ACCOUNT QUERIES
  account_info: [
    /my account/i,
    /account (?:info|details|settings)/i,
    /profile/i,
    /update (?:my )?(?:details|info|profile)/i
  ],

  account_balance: [
    /(?:my )?(?:account )?balance/i,
    /how much do i owe/i,
    /outstanding (?:amount|balance)/i,
    /credit limit/i
  ]
}
