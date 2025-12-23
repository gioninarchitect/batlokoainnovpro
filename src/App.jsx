import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@layout/Layout'
import Home from '@pages/Home'
import Services from '@pages/Services'
import About from '@pages/About'
import Blog from '@pages/Blog'
import Contact from '@pages/Contact'
import NotFound from '@pages/NotFound'
import OrderPayment from '@pages/OrderPayment'
import { QuoteCartProvider } from '@/context/QuoteCartContext'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { CustomerAuthProvider } from '@/context/CustomerAuthContext'
import { SupplierAuthProvider } from '@/context/SupplierAuthContext'
import { ChatProvider } from '@/context/ChatContext'
import { QuoteCart, QuoteCartButton } from '@ui'
import ChatWidget from '@ui/ChatWidget'

// Admin imports
import AdminLayout from '@/components/admin/AdminLayout'
import ProtectedRoute from '@/components/admin/ProtectedRoute'
import {
  Login as AdminLogin,
  Dashboard as AdminDashboard,
  Orders as AdminOrders,
  OrderEdit as AdminOrderEdit,
  Products as AdminProducts,
  ProductEdit as AdminProductEdit,
  Customers as AdminCustomers,
  CustomerEdit as AdminCustomerEdit,
  Quotes as AdminQuotes,
  QuoteEdit as AdminQuoteEdit,
  Invoices as AdminInvoices,
  InvoiceView as AdminInvoiceView,
  Categories as AdminCategories,
  CategoryEdit as AdminCategoryEdit,
  Settings as AdminSettings,
  Reports as AdminReports,
  AuditLog as AdminAuditLog,
  Suppliers as AdminSuppliers,
  SupplierEdit as AdminSupplierEdit,
  PurchaseOrders as AdminPurchaseOrders,
  PurchaseOrderEdit as AdminPurchaseOrderEdit,
  ReceiveStock as AdminReceiveStock
} from '@pages/admin'

// Portal imports
import PortalLayout from '@/components/portal/PortalLayout'
import PortalProtectedRoute from '@/components/portal/ProtectedRoute'
import {
  Login as PortalLogin,
  Register as PortalRegister,
  Dashboard as PortalDashboard,
  Orders as PortalOrders,
  Quotes as PortalQuotes,
  Invoices as PortalInvoices,
  Profile as PortalProfile
} from '@pages/portal'

// Supplier Portal imports
import SupplierProtectedRoute from '@/components/supplier/SupplierProtectedRoute'
import {
  SupplierLogin,
  SupplierDashboard,
  SupplierOrders,
  SupplierProfile
} from '@pages/supplier'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CustomerAuthProvider>
          <SupplierAuthProvider>
            <QuoteCartProvider>
              <ChatProvider>
              <Router>
                <Routes>
                  {/* Order Payment Page (standalone, no layout) */}
                  <Route path="/pay/:orderNumber" element={<OrderPayment />} />

                  {/* Supplier Portal Routes */}
                  <Route path="/supplier/login" element={<SupplierLogin />} />
                  <Route
                    path="/supplier/*"
                    element={
                      <SupplierProtectedRoute>
                        <Routes>
                          <Route path="/" element={<SupplierDashboard />} />
                          <Route path="/orders" element={<SupplierOrders />} />
                          <Route path="/orders/:id" element={<SupplierOrders />} />
                          <Route path="/profile" element={<SupplierProfile />} />
                        </Routes>
                      </SupplierProtectedRoute>
                    }
                  />

                  {/* Customer Portal Routes */}
                  <Route path="/portal/login" element={<PortalLogin />} />
                  <Route path="/portal/register" element={<PortalRegister />} />
                <Route
                  path="/portal/*"
                  element={
                    <PortalProtectedRoute>
                      <PortalLayout>
                        <Routes>
                          <Route path="/" element={<PortalDashboard />} />
                          <Route path="/orders" element={<PortalOrders />} />
                          <Route path="/orders/:id" element={<PortalOrders />} />
                          <Route path="/quotes" element={<PortalQuotes />} />
                          <Route path="/quotes/:id" element={<PortalQuotes />} />
                          <Route path="/invoices" element={<PortalInvoices />} />
                          <Route path="/invoices/:id" element={<PortalInvoices />} />
                          <Route path="/profile" element={<PortalProfile />} />
                        </Routes>
                      </PortalLayout>
                    </PortalProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route path="/admin/login" element={<AdminLogin />} />
              <Route
                path="/admin/*"
                element={
                  <ProtectedRoute>
                    <AdminLayout>
                      <Routes>
                        <Route path="/" element={<AdminDashboard />} />
                        <Route path="/orders" element={<AdminOrders />} />
                        <Route path="/orders/new" element={<AdminOrderEdit />} />
                        <Route path="/orders/:id" element={<AdminOrderEdit />} />
                        <Route path="/products" element={<AdminProducts />} />
                        <Route path="/products/new" element={<AdminProductEdit />} />
                        <Route path="/products/:id" element={<AdminProductEdit />} />
                        <Route path="/customers" element={<AdminCustomers />} />
                        <Route path="/customers/new" element={<AdminCustomerEdit />} />
                        <Route path="/customers/:id" element={<AdminCustomerEdit />} />
                        <Route path="/quotes" element={<AdminQuotes />} />
                        <Route path="/quotes/new" element={<AdminQuoteEdit />} />
                        <Route path="/quotes/:id" element={<AdminQuoteEdit />} />
                        <Route path="/invoices" element={<AdminInvoices />} />
                        <Route path="/invoices/:id" element={<AdminInvoiceView />} />
                        <Route path="/reports" element={<AdminReports />} />
                        <Route path="/audit" element={<AdminAuditLog />} />
                        <Route path="/categories" element={<AdminCategories />} />
                        <Route path="/categories/new" element={<AdminCategoryEdit />} />
                        <Route path="/categories/:id" element={<AdminCategoryEdit />} />
                        <Route path="/suppliers" element={<AdminSuppliers />} />
                        <Route path="/suppliers/new" element={<AdminSupplierEdit />} />
                        <Route path="/suppliers/:id" element={<AdminSupplierEdit />} />
                        <Route path="/purchase-orders" element={<AdminPurchaseOrders />} />
                        <Route path="/purchase-orders/new" element={<AdminPurchaseOrderEdit />} />
                        <Route path="/purchase-orders/:id" element={<AdminPurchaseOrderEdit />} />
                        <Route path="/purchase-orders/:id/receive" element={<AdminReceiveStock />} />
                        <Route path="/settings" element={<AdminSettings />} />
                      </Routes>
                    </AdminLayout>
                  </ProtectedRoute>
                }
              />

              {/* Public Routes */}
              <Route
                path="/*"
                element={
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/services" element={<Services />} />
                      <Route path="/about" element={<About />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/latest-news" element={<Blog />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Layout>
                }
              />
            </Routes>
                {/* Quote Cart - Global (only for public site) */}
                <QuoteCart />
                <QuoteCartButton />
                {/* Smart AI Chat Widget - Global */}
                <ChatWidget />
              </Router>
              </ChatProvider>
            </QuoteCartProvider>
          </SupplierAuthProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
