/**
 * Scorer Module
 * Lead scoring, customer scoring, stock alerts, supplier scoring
 */

import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

class Scorer {
  /**
   * Calculate lead score for a customer (0-100)
   */
  async calculateLeadScore(customerId) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: { orderBy: { createdAt: 'desc' }, take: 10 },
          quotes: { orderBy: { createdAt: 'desc' }, take: 10 }
        }
      })

      if (!customer) return { score: 0, factors: [] }

      let score = 0
      const factors = []

      // Factor 1: Order history (max 30 points)
      const orderCount = customer.orders.length
      if (orderCount >= 10) {
        score += 30
        factors.push({ name: 'Frequent buyer', points: 30 })
      } else if (orderCount >= 5) {
        score += 20
        factors.push({ name: 'Regular buyer', points: 20 })
      } else if (orderCount >= 1) {
        score += 10
        factors.push({ name: 'Has purchased', points: 10 })
      }

      // Factor 2: Order value (max 25 points)
      const totalSpent = customer.orders.reduce((sum, o) => sum + (o.total || 0), 0)
      if (totalSpent >= 100000) {
        score += 25
        factors.push({ name: 'High value (R100k+)', points: 25 })
      } else if (totalSpent >= 50000) {
        score += 20
        factors.push({ name: 'Medium value (R50k+)', points: 20 })
      } else if (totalSpent >= 10000) {
        score += 15
        factors.push({ name: 'Growing value (R10k+)', points: 15 })
      } else if (totalSpent > 0) {
        score += 5
        factors.push({ name: 'Started spending', points: 5 })
      }

      // Factor 3: Recent activity (max 20 points)
      const lastOrder = customer.orders[0]
      if (lastOrder) {
        const daysSinceOrder = Math.floor((Date.now() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24))
        if (daysSinceOrder <= 7) {
          score += 20
          factors.push({ name: 'Active this week', points: 20 })
        } else if (daysSinceOrder <= 30) {
          score += 15
          factors.push({ name: 'Active this month', points: 15 })
        } else if (daysSinceOrder <= 90) {
          score += 10
          factors.push({ name: 'Active this quarter', points: 10 })
        }
      }

      // Factor 4: Quote engagement (max 15 points)
      const approvedQuotes = customer.quotes.filter(q => q.status === 'APPROVED' || q.status === 'CONVERTED')
      if (approvedQuotes.length >= 3) {
        score += 15
        factors.push({ name: 'High quote conversion', points: 15 })
      } else if (approvedQuotes.length >= 1) {
        score += 10
        factors.push({ name: 'Quote converted', points: 10 })
      } else if (customer.quotes.length > 0) {
        score += 5
        factors.push({ name: 'Requested quotes', points: 5 })
      }

      // Factor 5: Profile completeness (max 10 points)
      if (customer.email && customer.phone && customer.company) {
        score += 10
        factors.push({ name: 'Complete profile', points: 10 })
      } else if (customer.email && customer.phone) {
        score += 5
        factors.push({ name: 'Basic profile', points: 5 })
      }

      return {
        score: Math.min(score, 100),
        tier: score >= 80 ? 'HOT' : score >= 50 ? 'WARM' : score >= 25 ? 'COOL' : 'COLD',
        factors,
        totalSpent,
        orderCount
      }
    } catch (error) {
      console.error('Lead scoring error:', error)
      return { score: 0, factors: [], error: error.message }
    }
  }

  /**
   * Detect churn risk (similar to dropout patterns)
   */
  async detectChurnRisk(customerId) {
    try {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        include: {
          orders: { orderBy: { createdAt: 'desc' }, take: 20 }
        }
      })

      if (!customer) return { risk: 'UNKNOWN', score: 0 }

      let riskScore = 0
      const riskFactors = []

      // Factor 1: Days since last order
      if (customer.orders.length > 0) {
        const lastOrder = customer.orders[0]
        const daysSince = Math.floor((Date.now() - new Date(lastOrder.createdAt)) / (1000 * 60 * 60 * 24))

        if (daysSince > 90) {
          riskScore += 40
          riskFactors.push({ name: 'Inactive 90+ days', weight: 40 })
        } else if (daysSince > 60) {
          riskScore += 25
          riskFactors.push({ name: 'Inactive 60+ days', weight: 25 })
        } else if (daysSince > 30) {
          riskScore += 10
          riskFactors.push({ name: 'Inactive 30+ days', weight: 10 })
        }
      } else {
        riskScore += 30
        riskFactors.push({ name: 'Never ordered', weight: 30 })
      }

      // Factor 2: Declining order frequency
      if (customer.orders.length >= 4) {
        const recentOrders = customer.orders.slice(0, 2)
        const olderOrders = customer.orders.slice(2, 4)

        const recentAvgGap = this.calculateAverageGap(recentOrders)
        const olderAvgGap = this.calculateAverageGap(olderOrders)

        if (recentAvgGap > olderAvgGap * 2) {
          riskScore += 25
          riskFactors.push({ name: 'Declining frequency', weight: 25 })
        }
      }

      // Factor 3: Declining order value
      if (customer.orders.length >= 4) {
        const recentAvgValue = customer.orders.slice(0, 2).reduce((sum, o) => sum + (o.total || 0), 0) / 2
        const olderAvgValue = customer.orders.slice(2, 4).reduce((sum, o) => sum + (o.total || 0), 0) / 2

        if (recentAvgValue < olderAvgValue * 0.5) {
          riskScore += 20
          riskFactors.push({ name: 'Declining order value', weight: 20 })
        }
      }

      // Factor 4: Cancelled orders
      const cancelledOrders = customer.orders.filter(o => o.status === 'CANCELLED')
      if (cancelledOrders.length >= 2) {
        riskScore += 15
        riskFactors.push({ name: 'Multiple cancellations', weight: 15 })
      }

      return {
        risk: riskScore >= 60 ? 'HIGH' : riskScore >= 35 ? 'MEDIUM' : 'LOW',
        score: Math.min(riskScore, 100),
        factors: riskFactors,
        recommendation: riskScore >= 60
          ? 'Urgent: Personal outreach recommended'
          : riskScore >= 35
            ? 'Send re-engagement campaign'
            : 'Monitor - customer is healthy'
      }
    } catch (error) {
      console.error('Churn detection error:', error)
      return { risk: 'UNKNOWN', score: 0, error: error.message }
    }
  }

  /**
   * Calculate average gap between orders in days
   */
  calculateAverageGap(orders) {
    if (orders.length < 2) return 0
    let totalGap = 0
    for (let i = 0; i < orders.length - 1; i++) {
      const gap = new Date(orders[i].createdAt) - new Date(orders[i + 1].createdAt)
      totalGap += gap / (1000 * 60 * 60 * 24)
    }
    return totalGap / (orders.length - 1)
  }

  /**
   * Get stock alerts
   */
  async getStockAlerts() {
    try {
      const products = await prisma.product.findMany({
        where: { isActive: true },
        include: { category: true }
      })

      const alerts = {
        outOfStock: [],
        lowStock: [],
        overstocked: []
      }

      for (const product of products) {
        const reorderPoint = product.reorderPoint || 10
        const maxStock = product.maxStock || 1000

        if (product.stockQuantity <= 0) {
          alerts.outOfStock.push({
            id: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category?.name,
            stock: product.stockQuantity,
            priority: 'CRITICAL'
          })
        } else if (product.stockQuantity <= reorderPoint) {
          alerts.lowStock.push({
            id: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category?.name,
            stock: product.stockQuantity,
            reorderPoint,
            priority: product.stockQuantity <= reorderPoint / 2 ? 'HIGH' : 'MEDIUM'
          })
        } else if (product.stockQuantity > maxStock) {
          alerts.overstocked.push({
            id: product.id,
            name: product.name,
            sku: product.sku,
            category: product.category?.name,
            stock: product.stockQuantity,
            maxStock,
            priority: 'LOW'
          })
        }
      }

      return {
        summary: {
          outOfStock: alerts.outOfStock.length,
          lowStock: alerts.lowStock.length,
          overstocked: alerts.overstocked.length,
          totalProducts: products.length
        },
        alerts
      }
    } catch (error) {
      console.error('Stock alerts error:', error)
      return { summary: {}, alerts: {}, error: error.message }
    }
  }

  /**
   * Score supplier performance
   */
  async scoreSupplier(supplierId) {
    try {
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
        include: {
          purchaseOrders: {
            orderBy: { createdAt: 'desc' },
            take: 20
          }
        }
      })

      if (!supplier) return { score: 0, factors: [] }

      let score = 100 // Start at 100, deduct for issues
      const factors = []

      const completedPOs = supplier.purchaseOrders.filter(po =>
        po.status === 'RECEIVED' || po.status === 'COMPLETED'
      )

      // Factor 1: On-time delivery rate
      const onTimeCount = completedPOs.filter(po => {
        if (!po.expectedDate || !po.receivedDate) return true
        return new Date(po.receivedDate) <= new Date(po.expectedDate)
      }).length

      const onTimeRate = completedPOs.length > 0
        ? (onTimeCount / completedPOs.length) * 100
        : 100

      if (onTimeRate < 80) {
        const deduction = Math.round((100 - onTimeRate) / 2)
        score -= deduction
        factors.push({ name: `On-time rate: ${onTimeRate.toFixed(0)}%`, points: -deduction })
      } else {
        factors.push({ name: `On-time rate: ${onTimeRate.toFixed(0)}%`, points: 0 })
      }

      // Factor 2: Order fulfillment rate
      const rejectedPOs = supplier.purchaseOrders.filter(po => po.status === 'REJECTED').length
      const fulfillmentRate = supplier.purchaseOrders.length > 0
        ? ((supplier.purchaseOrders.length - rejectedPOs) / supplier.purchaseOrders.length) * 100
        : 100

      if (fulfillmentRate < 90) {
        const deduction = Math.round((100 - fulfillmentRate) / 3)
        score -= deduction
        factors.push({ name: `Fulfillment rate: ${fulfillmentRate.toFixed(0)}%`, points: -deduction })
      }

      return {
        score: Math.max(0, Math.min(100, score)),
        tier: score >= 90 ? 'EXCELLENT' : score >= 75 ? 'GOOD' : score >= 60 ? 'FAIR' : 'POOR',
        factors,
        stats: {
          totalPOs: supplier.purchaseOrders.length,
          completedPOs: completedPOs.length,
          onTimeRate,
          fulfillmentRate
        }
      }
    } catch (error) {
      console.error('Supplier scoring error:', error)
      return { score: 0, factors: [], error: error.message }
    }
  }

  /**
   * Get reorder suggestions based on stock and sales velocity
   */
  async getReorderSuggestions() {
    try {
      // Get products with low stock
      const products = await prisma.product.findMany({
        where: {
          isActive: true
        },
        include: {
          category: true
        }
      })

      // Filter products at or below reorder point
      const lowStockProducts = products.filter(p =>
        p.stockQuantity <= (p.reorderPoint || 10)
      )

      const suggestions = lowStockProducts.map(product => {
        const dailyVelocity = 1 // Placeholder - would calculate from order history
        const daysOfStock = dailyVelocity > 0
          ? Math.floor(product.stockQuantity / dailyVelocity)
          : 999

        const suggestedQuantity = Math.max(
          (product.reorderPoint || 10) * 2,
          Math.ceil(dailyVelocity * 30) // 30 days of stock
        )

        return {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category?.name,
          currentStock: product.stockQuantity,
          reorderPoint: product.reorderPoint || 10,
          dailyVelocity: dailyVelocity.toFixed(1),
          daysOfStock,
          suggestedQuantity,
          urgency: daysOfStock <= 3 ? 'CRITICAL' : daysOfStock <= 7 ? 'HIGH' : 'MEDIUM'
        }
      })

      return suggestions.sort((a, b) => a.daysOfStock - b.daysOfStock)
    } catch (error) {
      console.error('Reorder suggestions error:', error)
      return []
    }
  }
}

export default new Scorer()
