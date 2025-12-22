import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Menu, X, Phone } from 'lucide-react'
import { Button } from '@ui'
import MobileMenu from './MobileMenu'

const navLinks = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
  { name: 'About', path: '/about' },
  { name: 'Blog', path: '/blog' },
  { name: 'Contact', path: '/contact' }
]

function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [location])

  return (
    <>
      <header
        className={`
          fixed top-0 left-0 right-0 z-40
          transition-all duration-300
          ${isScrolled
            ? 'bg-white shadow-nav py-3'
            : 'bg-transparent py-5'
          }
        `}
      >
        <div className="container-custom">
          <nav className="flex items-center justify-between" aria-label="Main navigation">
            {/* Logo */}
            <Link
              to="/"
              className="relative z-50"
              aria-label="Batlokoa Innovative Projects - Home"
            >
              <span className={`
                font-heading font-bold text-xl md:text-2xl
                transition-colors duration-300
                ${isScrolled ? 'text-navy' : 'text-white'}
              `}>
                BATLOKOA
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-8">
              <ul className="flex items-center gap-6">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={`
                        font-medium transition-colors duration-200
                        hover:text-safety
                        ${location.pathname === link.path
                          ? 'text-safety'
                          : isScrolled ? 'text-gray-700' : 'text-white'
                        }
                      `}
                    >
                      {link.name}
                    </Link>
                  </li>
                ))}
              </ul>

              {/* Contact Info */}
              <a
                href="tel:0739748317"
                className={`
                  flex items-center gap-2 font-semibold
                  transition-colors duration-200
                  ${isScrolled ? 'text-navy' : 'text-white'}
                `}
              >
                <Phone size={18} />
                <span className="hidden xl:inline">073 974 8317</span>
              </a>

              <Button to="/contact" size="sm">
                Get Quote
              </Button>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className={`
                lg:hidden p-2 rounded-lg
                transition-colors duration-200
                ${isScrolled ? 'text-navy' : 'text-white'}
              `}
              aria-label="Open menu"
              aria-expanded={isMobileMenuOpen}
            >
              <Menu size={28} />
            </button>
          </nav>
        </div>
      </header>

      {/* Mobile Menu */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        links={navLinks}
        currentPath={location.pathname}
      />
    </>
  )
}

export default Header
