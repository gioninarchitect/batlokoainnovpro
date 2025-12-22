import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, User } from 'lucide-react'
import { Badge, Card } from '@ui'
import { blogPosts } from '@data/blogPosts'

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

function BlogCard({ post, index, featured = false }) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className={featured ? 'md:col-span-2' : ''}
    >
      <Card className="h-full group overflow-hidden" padding="none">
        {/* Image */}
        <div className={`relative overflow-hidden bg-gradient-to-br from-industrial to-navy ${featured ? 'aspect-[2/1]' : 'aspect-video'}`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-white/20 font-heading text-6xl">B</span>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <Badge variant="safety" className="absolute top-4 left-4">
            {post.category}
          </Badge>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
            <span className="flex items-center gap-1.5">
              <User size={14} />
              {post.author.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {formatDate(post.publishedAt)}
            </span>
          </div>

          {/* Title */}
          <h3 className={`font-heading text-navy mb-3 group-hover:text-safety transition-colors ${featured ? 'text-h3' : 'text-h4'}`}>
            {post.title}
          </h3>

          {/* Excerpt */}
          <p className="text-gray-600 mb-4 line-clamp-3">
            {post.excerpt}
          </p>

          {/* Link */}
          <Link
            to={`/blog/${post.slug}`}
            className="inline-flex items-center gap-2 text-industrial font-semibold group-hover:text-safety transition-colors"
          >
            Read More
            <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </Card>
    </motion.article>
  )
}

function Blog() {
  return (
    <>
      <Helmet>
        <title>Latest News & Insights | Batlokoa Innovative Projects</title>
        <meta name="description" content="Stay updated with the latest trends in engineering, industrial supplies, and innovations shaping the South African industry." />
        <link rel="canonical" href="https://batlokoainnovpro.co.za/blog" />
      </Helmet>

      {/* Hero */}
      <section className="pt-32 pb-16 bg-gradient-to-b from-navy to-deepblue">
        <div className="container-custom">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center text-white"
          >
            <Badge variant="gold" className="mb-4">Latest News</Badge>
            <h1 className="font-heading text-h1 mb-4">Insights & Updates</h1>
            <p className="text-gray-300 text-body-lg max-w-2xl mx-auto">
              Stay informed with the latest trends, innovations, and news from the
              engineering and industrial supply sector.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="section-padding bg-gray-50">
        <div className="container-custom">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {blogPosts.map((post, index) => (
              <BlogCard
                key={post.id}
                post={post}
                index={index}
                featured={index === 0}
              />
            ))}
          </div>
        </div>
      </section>
    </>
  )
}

export default Blog
