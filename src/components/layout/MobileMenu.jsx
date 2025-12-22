import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { X, Phone, Mail, MapPin } from 'lucide-react'
import { Button } from '@ui'

function MobileMenu({ isOpen, onClose, links, currentPath }) {
  const menuRef = useRef(null)
  const firstFocusableRef = useRef(null)

  // Trap focus within modal
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      firstFocusableRef.current?.focus()
    } else {
      document.body.style.overflow = ''
    }

    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }

    if (isOpen) {
      window.addEventListener('keydown', handleEscape)
      return () => window.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      role="dialog"
      aria-modal="true"
      aria-label="Mobile navigation"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Menu Panel */}
      <div
        ref={menuRef}
        className="
          absolute right-0 top-0 h-full w-full max-w-sm
          bg-navy text-white
          transform transition-transform duration-300
          flex flex-col
        "
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/10">
          <span className="font-heading font-bold text-xl">BATLOKOA</span>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-6">
          <ul className="space-y-4">
            {links.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`
                    block py-3 px-4 rounded-lg text-lg font-medium
                    transition-colors duration-200
                    ${currentPath === link.path
                      ? 'bg-safety text-white'
                      : 'hover:bg-white/10'
                    }
                  `}
                  onClick={onClose}
                >
                  {link.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Contact Info */}
        <div className="p-6 border-t border-white/10 space-y-4">
          <a
            href="tel:0739748317"
            className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
          >
            <Phone size={20} />
            <span>073 974 8317</span>
          </a>
          <a
            href="mailto:info@batlokoainnovpro.co.za"
            className="flex items-center gap-3 text-white/80 hover:text-white transition-colors"
          >
            <Mail size={20} />
            <span>info@batlokoainnovpro.co.za</span>
          </a>
          <div className="flex items-start gap-3 text-white/80">
            <MapPin size={20} className="flex-shrink-0 mt-0.5" />
            <span>12 A Bussing Rd, Aureus Ext 1, Randfontein</span>
          </div>

          <Button to="/contact" className="w-full mt-4" onClick={onClose}>
            Get Quote
          </Button>
        </div>
      </div>
    </div>
  )
}

export default MobileMenu
