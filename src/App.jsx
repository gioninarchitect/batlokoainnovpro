import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from '@layout/Layout'
import Home from '@pages/Home'
import Services from '@pages/Services'
import About from '@pages/About'
import Blog from '@pages/Blog'
import Contact from '@pages/Contact'
import NotFound from '@pages/NotFound'
import { QuoteCartProvider } from '@/context/QuoteCartContext'
import { AuthProvider } from '@/context/AuthContext'
import { ThemeProvider } from '@/context/ThemeContext'
import { QuoteCart, QuoteCartButton } from '@ui'

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
  Categories as AdminCategories,
  CategoryEdit as AdminCategoryEdit,
  Settings as AdminSettings
} from '@pages/admin'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QuoteCartProvider>
          <Router>
            <Routes>
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
                        <Route path="/categories" element={<AdminCategories />} />
                        <Route path="/categories/new" element={<AdminCategoryEdit />} />
                        <Route path="/categories/:id" element={<AdminCategoryEdit />} />
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
          </Router>
        </QuoteCartProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

export default App
