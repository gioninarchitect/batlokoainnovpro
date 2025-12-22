import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Phone, Mail, MapPin, Clock, Send, CheckCircle } from 'lucide-react'
import { Button, Badge, Card } from '@ui'
import { useState } from 'react'
import pipeFittingsBg from '@/assets/images/products/pipe-fittings.jpg'

const schema = z.object({
  firstName: z.string().min(2, 'First name is required'),
  lastName: z.string().min(2, 'Last name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  service: z.string().optional(),
  message: z.string().min(10, 'Please provide more details')
})

const contactInfo = [
  {
    icon: Phone,
    title: 'Phone',
    content: '073 974 8317',
    link: 'tel:0739748317',
    linkText: 'Call Now'
  },
  {
    icon: Mail,
    title: 'Email',
    content: 'info@batlokoainnovpro.co.za',
    link: 'mailto:info@batlokoainnovpro.co.za',
    linkText: 'Send Email'
  },
  {
    icon: MapPin,
    title: 'Location',
    content: '12 A Bussing Rd, Aureus Ext 1, Randfontein, Gauteng',
    link: 'https://maps.google.com/?q=12+A+Bussing+Rd+Aureus+Ext+1+Randfontein',
    linkText: 'Get Directions'
  }
]

function Contact() {
  const [isSubmitted, setIsSubmitted] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data) => {
    console.log('Form data:', data)
    // TODO: Integrate with Formspree
    await new Promise(r => setTimeout(r, 1000))
    setIsSubmitted(true)
    reset()
  }

  return (
    <>
      <Helmet>
        <title>Contact Us | Batlokoa Innovative Projects</title>
        <meta name="description" content="Get in touch with Batlokoa Innovative Projects for quotes, consultations, or inquiries. Based in Randfontein, Gauteng." />
        <link rel="canonical" href="https://batlokoainnovpro.co.za/contact" />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-navy to-deepblue">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <Badge variant="gold" className="mb-4">Contact Us</Badge>
            <h1 className="font-heading text-h1 mb-4">Let's Build Together</h1>
            <p className="text-gray-300 text-body-lg max-w-2xl mx-auto">
              Reach out for quotes, consultations, or inquiries. We're here to support
              your success every step of the way.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Info Cards */}
      <section className="py-12 bg-white">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 -mt-20">
            {contactInfo.map((info, index) => {
              const Icon = info.icon
              return (
                <motion.div
                  key={info.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="text-center h-full">
                    <div className="w-14 h-14 bg-gradient-to-br from-industrial to-safety rounded-xl flex items-center justify-center mx-auto mb-4">
                      <Icon size={28} className="text-white" />
                    </div>
                    <h3 className="font-heading text-h4 text-navy mb-2">{info.title}</h3>
                    <p className="text-gray-600 mb-4">{info.content}</p>
                    <a
                      href={info.link}
                      target={info.icon === MapPin ? '_blank' : undefined}
                      rel={info.icon === MapPin ? 'noopener noreferrer' : undefined}
                      className="inline-flex items-center gap-2 text-industrial hover:text-safety font-semibold transition-colors"
                    >
                      {info.linkText}
                    </a>
                  </Card>
                </motion.div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <section className="section-padding relative overflow-hidden">
        {/* Background Image */}
        <div className="absolute inset-0">
          <img src={pipeFittingsBg} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gray-50/80" />
        </div>
        <div className="container-custom relative z-10">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Form */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
            >
              <h2 className="font-heading text-h2 text-navy mb-6">Get in Touch</h2>

              {isSubmitted ? (
                <Card className="text-center py-12">
                  <CheckCircle size={64} className="text-green-500 mx-auto mb-4" />
                  <h3 className="font-heading text-h3 text-navy mb-2">Message Sent!</h3>
                  <p className="text-gray-600 mb-6">
                    Thank you for reaching out. We'll get back to you within 24 hours.
                  </p>
                  <Button onClick={() => setIsSubmitted(false)}>Send Another Message</Button>
                </Card>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                        First Name *
                      </label>
                      <input
                        id="firstName"
                        type="text"
                        {...register('firstName')}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-safety focus:border-transparent"
                      />
                      {errors.firstName && (
                        <p className="text-safety text-sm mt-1">{errors.firstName.message}</p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        id="lastName"
                        type="text"
                        {...register('lastName')}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-safety focus:border-transparent"
                      />
                      {errors.lastName && (
                        <p className="text-safety text-sm mt-1">{errors.lastName.message}</p>
                      )}
                    </div>
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      id="email"
                      type="email"
                      {...register('email')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-safety focus:border-transparent"
                    />
                    {errors.email && (
                      <p className="text-safety text-sm mt-1">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        id="phone"
                        type="tel"
                        {...register('phone')}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-safety focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
                        Company Name
                      </label>
                      <input
                        id="company"
                        type="text"
                        {...register('company')}
                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-safety focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
                      Service Interest
                    </label>
                    <select
                      id="service"
                      {...register('service')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-safety focus:border-transparent"
                    >
                      <option value="">Select a service...</option>
                      <option value="bolts-nuts">Bolts & Nuts</option>
                      <option value="steel-pipes">Steel Pipes</option>
                      <option value="electrical">Electrical Supplies</option>
                      <option value="mechanical">Mechanical Engineering</option>
                      <option value="ppe">PPE Products</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      id="message"
                      rows={5}
                      {...register('message')}
                      className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-safety focus:border-transparent resize-none"
                      placeholder="Tell us about your project requirements..."
                    />
                    {errors.message && (
                      <p className="text-safety text-sm mt-1">{errors.message.message}</p>
                    )}
                  </div>

                  <Button type="submit" size="lg" className="w-full sm:w-auto" disabled={isSubmitting}>
                    {isSubmitting ? 'Sending...' : 'Submit Inquiry'}
                    <Send size={18} />
                  </Button>
                </form>
              )}
            </motion.div>

            {/* Map & Hours */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="space-y-6"
            >
              {/* Map Placeholder */}
              <div className="aspect-video rounded-2xl overflow-hidden bg-gray-200">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3580.1234567890123!2d27.6987654!3d-26.1234567!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMjbCsDA3JzI0LjQiUyAyN8KwNDEnNTUuNiJF!5e0!3m2!1sen!2sza!4v1234567890123"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen=""
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  title="Batlokoa Innovative Projects Location"
                />
              </div>

              {/* Business Hours */}
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-industrial/10 rounded-lg flex items-center justify-center">
                    <Clock size={20} className="text-industrial" />
                  </div>
                  <h3 className="font-heading text-h4 text-navy">Business Hours</h3>
                </div>
                <div className="space-y-2 text-gray-600">
                  <div className="flex justify-between">
                    <span>Monday - Friday</span>
                    <span className="font-semibold text-navy">9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Saturday - Sunday</span>
                    <span className="text-gray-400">Closed</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
        </div>
      </section>
    </>
  )
}

export default Contact
