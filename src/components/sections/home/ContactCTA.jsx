import { useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Phone, Send } from 'lucide-react'
import { Button } from '@ui'

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Valid email required'),
  phone: z.string().optional(),
  message: z.string().min(10, 'Please provide more details')
})

function ContactCTA() {
  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-100px' })

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm({
    resolver: zodResolver(schema)
  })

  const onSubmit = async (data) => {
    // Form submission logic (Formspree integration)
    console.log('Form data:', data)
    // TODO: Integrate with Formspree
    reset()
    alert('Thank you! We will contact you soon.')
  }

  return (
    <section ref={ref} className="section-padding bg-gradient-to-br from-industrial via-deepblue to-navy relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }} />
      </div>

      <div className="container-custom relative z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6 }}
            className="text-white"
          >
            <h2 className="font-heading text-h2 mb-4">
              Ready to Start Your Project?
            </h2>
            <p className="text-gray-300 text-body-lg mb-8">
              Get in touch with our team for quotes, consultations, or inquiries.
              We're here to help you succeed.
            </p>

            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-safety/20 rounded-full flex items-center justify-center">
                <Phone className="text-safety" size={24} />
              </div>
              <div>
                <p className="text-gray-400 text-sm">Call us directly</p>
                <a href="tel:0739748317" className="text-xl font-semibold hover:text-safety transition-colors">
                  073 974 8317
                </a>
              </div>
            </div>

            <p className="text-gray-400 text-sm">
              Monday - Friday: 9am - 5pm
            </p>
          </motion.div>

          {/* Right: Form */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <form
              onSubmit={handleSubmit(onSubmit)}
              className="bg-white rounded-2xl p-8 shadow-xl"
            >
              <h3 className="font-heading text-h4 text-navy mb-6">
                Request a Quote
              </h3>

              <div className="space-y-4">
                {/* Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                    Full Name *
                  </label>
                  <input
                    id="name"
                    type="text"
                    {...register('name')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-safety focus:border-transparent transition-all"
                    placeholder="Your name"
                  />
                  {errors.name && (
                    <p className="text-safety text-sm mt-1">{errors.name.message}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    id="email"
                    type="email"
                    {...register('email')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-safety focus:border-transparent transition-all"
                    placeholder="you@company.com"
                  />
                  {errors.email && (
                    <p className="text-safety text-sm mt-1">{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-safety focus:border-transparent transition-all"
                    placeholder="073 000 0000"
                  />
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    {...register('message')}
                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-safety focus:border-transparent transition-all resize-none"
                    placeholder="Tell us about your project..."
                  />
                  {errors.message && (
                    <p className="text-safety text-sm mt-1">{errors.message.message}</p>
                  )}
                </div>

                {/* Submit */}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? 'Sending...' : 'Send Message'}
                  <Send size={18} />
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default ContactCTA
