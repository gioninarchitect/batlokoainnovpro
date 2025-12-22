import Header from './Header'
import Footer from './Footer'
import SkipLink from './SkipLink'

function Layout({ children }) {
  return (
    <div className="flex flex-col min-h-screen">
      <SkipLink />
      <Header />
      <main id="main" className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  )
}

export default Layout
