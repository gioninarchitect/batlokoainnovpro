import { Link } from 'react-router-dom'
import { Phone, Mail, MapPin } from 'lucide-react'
import { Badge } from '@ui'

const quickLinks = [
  { name: 'Home', path: '/' },
  { name: 'Services', path: '/services' },
  { name: 'About', path: '/about' },
  { name: 'Blog', path: '/blog' },
  { name: 'Contact', path: '/contact' }
]

const services = [
  'Bolts & Nuts',
  'Steel Pipes',
  'Electrical Supplies',
  'Mechanical Engineering',
  'Pipe Fittings',
  'PPE Products'
]

function Footer() {
  const currentYear = 2026

  return (
    <footer className="bg-navy text-white">
      {/* Main Footer */}
      <div className="container-custom py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* About Column */}
          <div className="space-y-4">
            <h3 className="font-heading font-bold text-2xl">BATLOKOA</h3>
            <p className="text-gray-300 text-sm leading-relaxed">
              Your trusted partner for mining, construction & engineering supplies.
              Quality products delivered right to your doorstep.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Badge variant="gold">100% BWO</Badge>
              <Badge variant="gold">Level 1 BBB-EE</Badge>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Quick Links</h4>
            <ul className="space-y-2">
              {quickLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Our Services</h4>
            <ul className="space-y-2">
              {services.map((service) => (
                <li key={service}>
                  <Link
                    to="/services"
                    className="text-gray-300 hover:text-white transition-colors duration-200"
                  >
                    {service}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-heading font-semibold text-lg mb-4">Contact Us</h4>
            <ul className="space-y-3">
              <li>
                <a
                  href="tel:0739748317"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                >
                  <Phone size={18} className="text-safety" />
                  <span>073 974 8317</span>
                </a>
              </li>
              <li>
                <a
                  href="mailto:info@batlokoainnovpro.co.za"
                  className="flex items-center gap-3 text-gray-300 hover:text-white transition-colors"
                >
                  <Mail size={18} className="text-safety" />
                  <span>info@batlokoainnovpro.co.za</span>
                </a>
              </li>
              <li className="flex items-start gap-3 text-gray-300">
                <MapPin size={18} className="text-safety flex-shrink-0 mt-1" />
                <span>
                  12 A Bussing Rd, Aureus Ext 1,<br />
                  Randfontein, Gauteng
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-white/10">
        <div className="container-custom py-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-gray-400">
            <p>&copy; {currentYear} Batlokoa Innovative Projects. All rights reserved.</p>
            <p>
              Website by{' '}
              <a
                href="https://lulonkesolutions.co.za"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gold hover:text-gold-light transition-colors"
              >
                Lulonke Solutions
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
