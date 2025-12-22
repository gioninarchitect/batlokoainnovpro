import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Target, Telescope, Shield, Scale, Eye, Heart, Users } from 'lucide-react'
import { Badge, Card } from '@ui'
import handToolsBg from '@/assets/images/products/hand-tools.jpg'
import electricalBg from '@/assets/images/products/electrical.jpg'

const values = [
  { icon: Eye, title: 'Transparency', description: 'Open and honest communication in all our dealings.' },
  { icon: Heart, title: 'Honesty', description: 'Integrity in every transaction and relationship.' },
  { icon: Shield, title: 'Safety', description: 'Prioritizing safety in products and operations.' },
  { icon: Scale, title: 'Integrity', description: 'Upholding the highest ethical standards.' },
  { icon: Users, title: 'Non-Discrimination', description: 'Equal treatment and opportunity for all.' }
]

const services = [
  'Mechanical/Electrical Engineering and Project consulting',
  'Civil Engineering and construction',
  'Supply chain',
  'Mining services',
  'Equipment Repairs Refurbishments',
  'Events management solutions'
]

function About() {
  return (
    <>
      <Helmet>
        <title>About Us | Batlokoa Innovative Projects</title>
        <meta name="description" content="100% Black-Women-Owned, Level 1 BBB-EE Company offering comprehensive Mining, engineering and technical project management services since 2022." />
        <link rel="canonical" href="https://batlokoainnovpro.co.za/about" />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-navy to-deepblue">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <Badge variant="gold" className="mb-4">About Us</Badge>
            <h1 className="font-heading text-h1 mb-4">Our Story</h1>
            <p className="text-gray-300 text-body-lg max-w-3xl mx-auto">
              Batlokoa Innovative Projects represents the power, visions, and aims
              of professional women in mining and engineering sector in Southern Africa.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Company Story */}
      <section className="section-padding bg-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-h2 text-navy mb-6">
                Empowering South Africa's Industries
              </h2>
              <div className="space-y-4 text-gray-600">
                <p>
                  <strong className="text-navy">Batlokoa Innovative Projects (Pty) Ltd</strong> is a
                  100% Black-Women-Owned (BWO), Level 1 BBB-EE Company that offers comprehensive
                  Mining, engineering and technical project management services for both public
                  and private sector clients.
                </p>
                <p>
                  Established in 2022 and based in Gauteng, our aim is to provide the best
                  professional service to all our clients at the best possible costs.
                </p>
                <p>
                  We work with 3 Mining Engineers with vast networks in most major mining houses
                  across South Africa, ensuring we deliver expertise-backed solutions to every project.
                </p>
              </div>

              <div className="flex flex-wrap gap-3 mt-8">
                <Badge variant="gold">100% Black-Women-Owned</Badge>
                <Badge variant="gold">Level 1 BBB-EE</Badge>
                <Badge variant="industrial">Est. 2022</Badge>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="relative"
            >
              <div className="aspect-[4/3] rounded-2xl overflow-hidden bg-gradient-to-br from-industrial to-navy flex items-center justify-center">
                <div className="text-center text-white p-8">
                  <div className="w-20 h-20 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Target size={40} className="text-gold" />
                  </div>
                  <p className="text-2xl font-heading font-bold">Since 2022</p>
                  <p className="text-gray-300">Gauteng, South Africa</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="section-padding relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={handToolsBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gray-50/80" />
        </div>
        <div className="container-custom relative z-10">
          <div className="grid md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Card className="h-full text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-safety to-industrial rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Target size={32} className="text-white" />
                </div>
                <h3 className="font-heading text-h3 text-navy mb-4">Our Mission</h3>
                <p className="text-gray-600">
                  To empower the local community we operate in. We pride ourselves on innovation
                  and continuous improvement on all our customers' production cycles, striving to
                  bring the most efficient, practical, safe strategies and products for our clients.
                </p>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
            >
              <Card className="h-full text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-industrial to-deepblue rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Telescope size={32} className="text-white" />
                </div>
                <h3 className="font-heading text-h3 text-navy mb-4">Our Vision</h3>
                <p className="text-gray-600">
                  To be the leading provider of engineering solutions in Southern Africa,
                  setting the standard for quality, innovation, and customer service while
                  empowering professional women in the mining and engineering sector.
                </p>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="section-padding relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={electricalBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-white/80" />
        </div>
        <div className="container-custom relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-h2 text-navy mb-4">Our Core Values</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              The principles that guide everything we do.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon
              return (
                <motion.div
                  key={value.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center group"
                >
                  <div className="w-16 h-16 bg-gray-100 group-hover:bg-safety/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-colors">
                    <Icon size={28} className="text-industrial group-hover:text-safety transition-colors" />
                  </div>
                  <h3 className="font-heading font-semibold text-navy mb-2">{value.title}</h3>
                  <p className="text-sm text-gray-500">{value.description}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Leadership */}
      <section className="section-padding bg-navy text-white">
        <div className="container-custom">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <Badge variant="gold" className="mb-4">Leadership</Badge>
              <h2 className="font-heading text-h2 mb-2">Cornelia Lethunya</h2>
              <p className="text-gold font-semibold mb-6">Chief Executive Officer</p>

              <div className="space-y-4 text-gray-300">
                <p>
                  Cornelia Lethunya is responsible for the advice and business leadership of
                  Batlokoa Innovative Projects. With Diplomas in Business Management and
                  Certificates in Electrical Engineering, she brings extensive expertise
                  to the role.
                </p>
                <p>
                  Having worked in various manufacturing, mining, and engineering fields
                  across South Africa, Cornelia established this engineering business in 2022
                  to provide professional services to the industry.
                </p>
              </div>

              <div className="mt-8">
                <h4 className="font-semibold text-white mb-3">Professional Services:</h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {services.map((service, i) => (
                    <li key={i} className="flex items-center gap-2 text-gray-300">
                      <span className="w-1.5 h-1.5 bg-safety rounded-full" />
                      {service}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gradient-to-br from-deepblue to-industrial flex items-center justify-center">
                <div className="text-center p-8">
                  <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                    <span className="text-5xl font-heading font-bold text-white">CL</span>
                  </div>
                  <p className="text-white font-heading text-xl">Cornelia Lethunya</p>
                  <p className="text-gold">CEO</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}

export default About
