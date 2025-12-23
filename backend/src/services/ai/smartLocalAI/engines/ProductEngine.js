/**
 * ProductEngine - Product search and recommendation engine
 * Uses database for product data with intelligent search
 *
 * Features:
 * - Fuzzy search with relevance scoring
 * - Category-based filtering
 * - Compatibility checking
 * - Product recommendations
 */

import { PrismaClient } from '@prisma/client'
import patternMatcher from '../core/PatternMatcher.js'

const prisma = new PrismaClient()

class ProductEngine {
  constructor() {
    this.isInitialized = false
    this.productIndex = new Map()  // Search index for fast lookups
    this.categoryIndex = new Map()
  }

  /**
   * Initialize the product engine
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      // Build search indices from database
      await this.buildSearchIndex()
      this.isInitialized = true
      console.log(`ProductEngine initialized: ${this.productIndex.size} terms indexed`)
    } catch (error) {
      console.error('ProductEngine initialization error:', error)
      this.isInitialized = true  // Continue with degraded mode
    }
  }

  /**
   * Build search index from database products
   * @returns {Promise<void>}
   */
  async buildSearchIndex() {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: { category: true }
    })

    for (const product of products) {
      // Index by product name words
      const nameWords = product.name.toLowerCase().split(/\s+/)
      for (const word of nameWords) {
        this.addToIndex(word, product.id)
      }

      // Index by SKU
      this.addToIndex(product.sku.toLowerCase(), product.id)

      // Index by category
      if (product.category) {
        this.addToIndex(product.category.slug, product.id)
        this.categoryIndex.set(product.category.slug, product.category.id)
      }

      // Index specifications if available
      if (product.specifications) {
        const specs = product.specifications
        if (specs.size) this.addToIndex(specs.size.toLowerCase(), product.id)
        if (specs.grade) this.addToIndex(specs.grade.toLowerCase(), product.id)
        if (specs.material) this.addToIndex(specs.material.toLowerCase(), product.id)
      }
    }
  }

  /**
   * Add a term to the search index
   * @param {string} term - Search term
   * @param {string} productId - Product ID
   */
  addToIndex(term, productId) {
    if (!this.productIndex.has(term)) {
      this.productIndex.set(term, new Set())
    }
    this.productIndex.get(term).add(productId)
  }

  /**
   * Search for products
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results
   */
  async search(params) {
    const {
      query = '',
      category = null,
      productCode = null,
      maxResults = 10,
      includeOutOfStock = false
    } = params

    try {
      // Build where clause
      const whereClause = {
        isActive: true
      }

      if (!includeOutOfStock) {
        whereClause.OR = [
          { trackStock: false },
          { stockQty: { gt: 0 } }
        ]
      }

      if (category) {
        const catId = this.categoryIndex.get(category)
        if (catId) {
          whereClause.categoryId = catId
        }
      }

      // Get products
      let products = await prisma.product.findMany({
        where: whereClause,
        include: { category: true },
        take: 100  // Get more for scoring
      })

      // Score and rank results
      const scoredResults = products.map(product => ({
        product,
        score: this.scoreProduct(product, query, productCode)
      }))

      // Filter by minimum score and sort
      const results = scoredResults
        .filter(r => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults)

      return {
        success: true,
        count: results.length,
        totalMatched: scoredResults.filter(r => r.score > 0).length,
        products: results.map(r => this.formatProduct(r.product, r.score))
      }
    } catch (error) {
      console.error('ProductEngine search error:', error)
      return { success: false, error: error.message, products: [] }
    }
  }

  /**
   * Score a product against search criteria
   * @param {Object} product - Product object
   * @param {string} query - Search query
   * @param {string} productCode - Optional product code
   * @returns {number} Relevance score
   */
  scoreProduct(product, query, productCode) {
    let score = 0
    const queryLower = query.toLowerCase()
    const nameLower = product.name.toLowerCase()
    const skuLower = product.sku.toLowerCase()

    // Exact name match
    if (nameLower === queryLower) {
      score += 1.0
    } else if (nameLower.includes(queryLower)) {
      score += 0.7
    }

    // SKU match
    if (skuLower === queryLower || skuLower.includes(queryLower)) {
      score += 0.9
    }

    // Product code match (e.g., M12, Grade 8.8)
    if (productCode) {
      const codeLower = productCode.toLowerCase()
      if (nameLower.includes(codeLower) || skuLower.includes(codeLower)) {
        score += 0.8
      }
      if (product.specifications) {
        const specs = product.specifications
        if (specs.size?.toLowerCase() === codeLower) score += 0.9
        if (specs.grade?.toLowerCase() === codeLower) score += 0.9
      }
    }

    // Word-by-word matching
    const queryWords = queryLower.split(/\s+/)
    for (const word of queryWords) {
      if (word.length < 2) continue

      if (nameLower.includes(word)) {
        score += 0.3
      }
      if (product.description?.toLowerCase().includes(word)) {
        score += 0.1
      }
    }

    // Fuzzy match using pattern matcher
    const fuzzyScore = patternMatcher.fuzzyMatch(query, product.name)
    score += fuzzyScore * 0.2

    // Featured products get a small boost
    if (product.isFeatured) {
      score += 0.1
    }

    // In-stock products get priority
    if (product.stockQty > 0) {
      score += 0.05
    }

    return Math.min(score, 2.0)  // Cap at 2.0
  }

  /**
   * Format product for response
   * @param {Object} product - Product object
   * @param {number} score - Relevance score
   * @returns {Object} Formatted product
   */
  formatProduct(product, score = 0) {
    return {
      id: product.id,
      name: product.name,
      sku: product.sku,
      price: Number(product.price),
      unit: product.unit,
      category: product.category?.name || 'General',
      categorySlug: product.category?.slug,
      inStock: !product.trackStock || product.stockQty > 0,
      stockQty: product.trackStock ? product.stockQty : null,
      specifications: product.specifications || {},
      description: product.description,
      images: product.images || [],
      bulkPrice: product.bulkPrice ? Number(product.bulkPrice) : null,
      bulkMinQty: product.bulkMinQty,
      relevanceScore: score
    }
  }

  /**
   * Get product by ID
   * @param {string} productId - Product ID
   * @returns {Promise<Object|null>} Product or null
   */
  async getProductById(productId) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true }
      })

      if (!product) return null

      return this.formatProduct(product)
    } catch (error) {
      console.error('ProductEngine getProductById error:', error)
      return null
    }
  }

  /**
   * Get product by SKU
   * @param {string} sku - Product SKU
   * @returns {Promise<Object|null>} Product or null
   */
  async getProductBySku(sku) {
    try {
      const product = await prisma.product.findUnique({
        where: { sku },
        include: { category: true }
      })

      if (!product) return null

      return this.formatProduct(product)
    } catch (error) {
      console.error('ProductEngine getProductBySku error:', error)
      return null
    }
  }

  /**
   * Check product compatibility
   * @param {string} productId1 - First product ID
   * @param {string} productId2 - Second product ID
   * @returns {Promise<Object>} Compatibility result
   */
  async checkCompatibility(productId1, productId2) {
    try {
      const [product1, product2] = await Promise.all([
        prisma.product.findUnique({
          where: { id: productId1 },
          include: { category: true }
        }),
        prisma.product.findUnique({
          where: { id: productId2 },
          include: { category: true }
        })
      ])

      if (!product1 || !product2) {
        return {
          compatible: null,
          reason: 'One or both products not found',
          error: true
        }
      }

      // Check specifications for compatibility
      const specs1 = product1.specifications || {}
      const specs2 = product2.specifications || {}

      const result = {
        product1: this.formatProduct(product1),
        product2: this.formatProduct(product2),
        compatible: true,
        matchType: 'unknown',
        warnings: [],
        recommendations: []
      }

      // Size compatibility (e.g., M12 bolt with M12 nut)
      if (specs1.size && specs2.size) {
        if (specs1.size === specs2.size) {
          result.matchType = 'size_match'
          result.sizeMatch = true
        } else {
          result.compatible = false
          result.matchType = 'size_mismatch'
          result.sizeMatch = false
          result.warnings.push(`Size mismatch: ${specs1.size} vs ${specs2.size}`)
        }
      }

      // Grade compatibility
      if (specs1.grade && specs2.grade) {
        result.gradeMatch = specs1.grade === specs2.grade
        if (!result.gradeMatch) {
          result.warnings.push(`Different grades: ${specs1.grade} vs ${specs2.grade}`)
        }
      }

      // Material compatibility
      if (specs1.material && specs2.material) {
        result.materialMatch = specs1.material === specs2.material
        if (!result.materialMatch) {
          result.warnings.push(`Different materials: ${specs1.material} vs ${specs2.material}`)
        }
      }

      // Add recommendations
      if (result.compatible) {
        result.recommendations.push('These products can be used together')
      } else {
        result.recommendations.push('Consider products with matching specifications')
      }

      return result
    } catch (error) {
      console.error('ProductEngine checkCompatibility error:', error)
      return { compatible: null, error: error.message }
    }
  }

  /**
   * Get product recommendations
   * @param {string} productId - Product ID
   * @param {string} type - Recommendation type (complementary, alternative, upgrade)
   * @param {number} limit - Maximum recommendations
   * @returns {Promise<Array>} Recommended products
   */
  async getRecommendations(productId, type = 'complementary', limit = 5) {
    try {
      const product = await prisma.product.findUnique({
        where: { id: productId },
        include: { category: true }
      })

      if (!product) return []

      let recommendations = []

      switch (type) {
        case 'complementary':
          // Products from same category that work together
          recommendations = await this.getComplementaryProducts(product, limit)
          break

        case 'alternative':
          // Similar products at different price points
          recommendations = await this.getAlternativeProducts(product, limit)
          break

        case 'upgrade':
          // Higher spec versions of the same type
          recommendations = await this.getUpgradeProducts(product, limit)
          break

        default:
          recommendations = await this.getComplementaryProducts(product, limit)
      }

      return recommendations.map(p => this.formatProduct(p))
    } catch (error) {
      console.error('ProductEngine getRecommendations error:', error)
      return []
    }
  }

  /**
   * Get complementary products
   * @param {Object} product - Source product
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Products
   */
  async getComplementaryProducts(product, limit) {
    // For bolts, suggest nuts and washers
    // For pipes, suggest fittings
    const complementaryCategories = {
      'bolts-nuts': ['bolts-nuts', 'washers'],
      'pipes-fittings': ['pipes-fittings', 'valves'],
      'electrical': ['electrical', 'switches']
    }

    const catSlug = product.category?.slug || ''
    const targetCategories = complementaryCategories[catSlug] || []

    if (targetCategories.length === 0) {
      return prisma.product.findMany({
        where: {
          categoryId: product.categoryId,
          id: { not: product.id },
          isActive: true
        },
        take: limit,
        include: { category: true }
      })
    }

    return prisma.product.findMany({
      where: {
        category: {
          slug: { in: targetCategories }
        },
        id: { not: product.id },
        isActive: true
      },
      take: limit,
      include: { category: true }
    })
  }

  /**
   * Get alternative products
   * @param {Object} product - Source product
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Products
   */
  async getAlternativeProducts(product, limit) {
    return prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
        price: {
          gte: Number(product.price) * 0.5,
          lte: Number(product.price) * 1.5
        }
      },
      orderBy: { price: 'asc' },
      take: limit,
      include: { category: true }
    })
  }

  /**
   * Get upgrade products
   * @param {Object} product - Source product
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Products
   */
  async getUpgradeProducts(product, limit) {
    return prisma.product.findMany({
      where: {
        categoryId: product.categoryId,
        id: { not: product.id },
        isActive: true,
        price: { gt: Number(product.price) }
      },
      orderBy: { price: 'asc' },
      take: limit,
      include: { category: true }
    })
  }

  /**
   * Get products by category
   * @param {string} categorySlug - Category slug
   * @param {number} limit - Maximum results
   * @returns {Promise<Array>} Products
   */
  async getByCategory(categorySlug, limit = 20) {
    try {
      const products = await prisma.product.findMany({
        where: {
          category: { slug: categorySlug },
          isActive: true
        },
        orderBy: [
          { isFeatured: 'desc' },
          { name: 'asc' }
        ],
        take: limit,
        include: { category: true }
      })

      return products.map(p => this.formatProduct(p))
    } catch (error) {
      console.error('ProductEngine getByCategory error:', error)
      return []
    }
  }

  /**
   * Get all categories
   * @returns {Promise<Array>} Categories
   */
  async getCategories() {
    try {
      const categories = await prisma.category.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' },
        include: {
          _count: {
            select: { products: true }
          }
        }
      })

      return categories.map(cat => ({
        id: cat.id,
        name: cat.name,
        slug: cat.slug,
        description: cat.description,
        icon: cat.icon,
        productCount: cat._count.products
      }))
    } catch (error) {
      console.error('ProductEngine getCategories error:', error)
      return []
    }
  }
}

// Export singleton instance
const productEngine = new ProductEngine()
export default productEngine
export { ProductEngine }
