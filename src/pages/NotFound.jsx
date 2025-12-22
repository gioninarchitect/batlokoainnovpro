import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Home, ArrowLeft } from 'lucide-react'
import { Button } from '@ui'

function NotFound() {
  return (
    <>
      <Helmet>
        <title>Page Not Found | Batlokoa Innovative Projects</title>
        <meta name="robots" content="noindex" />
      </Helmet>

      <section className="min-h-screen flex items-center justify-center bg-gradient-to-b from-navy to-deepblue">
        <div className="container-custom text-center text-white">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h1 className="font-display text-9xl font-bold text-safety mb-4">404</h1>
            <h2 className="font-heading text-h2 mb-4">Page Not Found</h2>
            <p className="text-gray-300 text-body-lg mb-8 max-w-md mx-auto">
              The page you're looking for doesn't exist or has been moved.
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button to="/">
                <Home size={18} />
                Back to Home
              </Button>
              <Button onClick={() => window.history.back()} variant="outline" className="border-white text-white hover:bg-white hover:text-navy">
                <ArrowLeft size={18} />
                Go Back
              </Button>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  )
}

export default NotFound
