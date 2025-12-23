/**
 * ComplianceEngine - Compliance verification engine
 * Checks products against SANS standards and industry regulations
 *
 * Features:
 * - SANS standard verification
 * - Industry-specific requirements
 * - DMR/OHSA regulation checking
 * - Compliance certificate handling
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { PrismaClient } from '@prisma/client'
import productEngine from './ProductEngine.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const prisma = new PrismaClient()

class ComplianceEngine {
  constructor() {
    this.isInitialized = false
    this.standards = {}
    this.regulations = {}
    this.industryCompliance = {}
    this.productCompliance = {}
  }

  /**
   * Initialize the compliance engine
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const knowledgePath = path.join(__dirname, '..', 'knowledge')

      // Load compliance data
      const complianceData = JSON.parse(
        fs.readFileSync(path.join(knowledgePath, 'compliance.json'), 'utf8')
      )

      this.standards = complianceData.standards || {}
      this.regulations = complianceData.regulations || {}
      this.industryCompliance = complianceData.industryCompliance || {}
      this.productCompliance = complianceData.productCompliance || {}

      // Also load any compliance standards from database
      await this.loadDatabaseStandards()

      this.isInitialized = true
      console.log(`ComplianceEngine initialized: ${Object.keys(this.standards).length} standards`)
    } catch (error) {
      console.error('ComplianceEngine initialization error:', error)
      this.isInitialized = true  // Continue with degraded mode
    }
  }

  /**
   * Load compliance standards from database
   * @returns {Promise<void>}
   */
  async loadDatabaseStandards() {
    try {
      const dbStandards = await prisma.complianceStandard.findMany({
        where: { isActive: true }
      })

      for (const std of dbStandards) {
        this.standards[std.code] = {
          id: std.code,
          name: std.name,
          fullName: std.description || std.name,
          category: std.category,
          issuingBody: std.issuingBody,
          industries: std.industries,
          requirements: std.requirements
        }
      }
    } catch (error) {
      console.error('ComplianceEngine loadDatabaseStandards error:', error)
    }
  }

  /**
   * Check product compliance for an industry
   * @param {string} productId - Product ID
   * @param {string} industry - Industry name
   * @returns {Promise<Object>} Compliance result
   */
  async checkProductCompliance(productId, industry) {
    try {
      const product = await productEngine.getProductById(productId)

      if (!product) {
        return {
          success: false,
          error: 'Product not found'
        }
      }

      // Get product's compliance info from specifications
      const productStandards = this.getProductStandards(product)

      // Get industry requirements
      const industryReqs = this.industryCompliance[industry.toLowerCase()] ||
                          this.industryCompliance.general

      if (!industryReqs) {
        return {
          success: false,
          error: `Unknown industry: ${industry}`
        }
      }

      // Check which requirements are met
      const mandatoryMet = []
      const mandatoryMissing = []
      const recommendedMet = []
      const recommendedMissing = []

      // Check mandatory standards
      for (const stdId of industryReqs.mandatory) {
        const standard = this.standards[stdId]
        if (!standard) continue

        if (productStandards.includes(stdId)) {
          mandatoryMet.push({
            id: stdId,
            name: standard.name,
            status: 'compliant'
          })
        } else {
          mandatoryMissing.push({
            id: stdId,
            name: standard.name,
            status: 'required'
          })
        }
      }

      // Check recommended standards
      for (const stdId of industryReqs.recommended || []) {
        const standard = this.standards[stdId]
        if (!standard) continue

        if (productStandards.includes(stdId)) {
          recommendedMet.push({
            id: stdId,
            name: standard.name,
            status: 'compliant'
          })
        } else {
          recommendedMissing.push({
            id: stdId,
            name: standard.name,
            status: 'recommended'
          })
        }
      }

      // Determine overall compliance
      const isCompliant = mandatoryMissing.length === 0

      // Build warnings
      const warnings = []
      if (mandatoryMissing.length > 0) {
        warnings.push(`Missing ${mandatoryMissing.length} mandatory certification(s)`)
      }
      if (recommendedMissing.length > 0) {
        warnings.push(`Missing ${recommendedMissing.length} recommended certification(s)`)
      }

      // Add industry-specific warnings
      if (industryReqs.specificRequirements) {
        for (const req of industryReqs.specificRequirements) {
          warnings.push(req)
        }
      }

      return {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku
        },
        industry,
        industryDisplayName: industryReqs.displayName || industry,
        compliant: isCompliant,
        standards: {
          met: [...mandatoryMet, ...recommendedMet],
          missing: [...mandatoryMissing, ...recommendedMissing]
        },
        regulations: industryReqs.regulations?.map(regId => ({
          id: regId,
          name: this.regulations[regId]?.name || regId,
          description: this.regulations[regId]?.description
        })) || [],
        warnings,
        notes: industryReqs.notes,
        productStandards
      }
    } catch (error) {
      console.error('ComplianceEngine checkProductCompliance error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get standards that a product claims to meet
   * @param {Object} product - Product object
   * @returns {Array} Array of standard IDs
   */
  getProductStandards(product) {
    const standards = []

    // Check product specifications for compliance info
    const specs = product.specifications || {}

    if (specs.compliance && Array.isArray(specs.compliance)) {
      standards.push(...specs.compliance)
    }

    if (specs.standards && Array.isArray(specs.standards)) {
      standards.push(...specs.standards)
    }

    if (specs.sans) {
      standards.push(specs.sans)
    }

    // Infer standards from product category
    const catSlug = product.categorySlug || ''
    const catCompliance = this.productCompliance[catSlug] ||
                         this.productCompliance[product.category?.toLowerCase()]

    if (catCompliance?.standards) {
      standards.push(...catCompliance.standards)
    }

    return [...new Set(standards)]  // Remove duplicates
  }

  /**
   * Get standard details
   * @param {string} standardId - Standard ID (e.g., 'SANS-1700')
   * @returns {Object|null} Standard details
   */
  getStandard(standardId) {
    return this.standards[standardId] || null
  }

  /**
   * Get regulation details
   * @param {string} regulationId - Regulation ID (e.g., 'OHSA')
   * @returns {Object|null} Regulation details
   */
  getRegulation(regulationId) {
    return this.regulations[regulationId] || null
  }

  /**
   * Get industry requirements
   * @param {string} industry - Industry name
   * @returns {Object|null} Industry requirements
   */
  getIndustryRequirements(industry) {
    return this.industryCompliance[industry.toLowerCase()] || null
  }

  /**
   * Get all available standards
   * @returns {Array} Array of standards
   */
  getAllStandards() {
    return Object.values(this.standards).map(std => ({
      id: std.id,
      name: std.name,
      category: std.category,
      industries: std.industries,
      issuingBody: std.issuingBody
    }))
  }

  /**
   * Get all industries
   * @returns {Array} Array of industries
   */
  getAllIndustries() {
    return Object.entries(this.industryCompliance).map(([key, data]) => ({
      id: key,
      name: data.displayName || key,
      mandatoryCount: data.mandatory?.length || 0,
      regulations: data.regulations || []
    }))
  }

  /**
   * Check if product meets specific standard
   * @param {string} productId - Product ID
   * @param {string} standardId - Standard ID
   * @returns {Promise<Object>} Compliance result
   */
  async checkStandard(productId, standardId) {
    try {
      const product = await productEngine.getProductById(productId)

      if (!product) {
        return { success: false, error: 'Product not found' }
      }

      const standard = this.standards[standardId]
      if (!standard) {
        return { success: false, error: `Unknown standard: ${standardId}` }
      }

      const productStandards = this.getProductStandards(product)
      const isCompliant = productStandards.includes(standardId)

      return {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku
        },
        standard: {
          id: standard.id,
          name: standard.name,
          fullName: standard.fullName,
          category: standard.category
        },
        compliant: isCompliant,
        message: isCompliant
          ? `${product.name} meets ${standard.name} requirements`
          : `${product.name} does not have ${standard.name} certification`,
        requirements: standard.requirements,
        relatedStandards: standard.relatedStandards || []
      }
    } catch (error) {
      console.error('ComplianceEngine checkStandard error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get compliance summary for a product
   * @param {string} productId - Product ID
   * @returns {Promise<Object>} Compliance summary
   */
  async getProductComplianceSummary(productId) {
    try {
      const product = await productEngine.getProductById(productId)

      if (!product) {
        return { success: false, error: 'Product not found' }
      }

      const productStandards = this.getProductStandards(product)

      // Get details for each standard
      const certifications = productStandards.map(stdId => {
        const standard = this.standards[stdId]
        return {
          id: stdId,
          name: standard?.name || stdId,
          category: standard?.category,
          issuingBody: standard?.issuingBody
        }
      })

      // Determine suitable industries
      const suitableIndustries = []
      for (const [industry, reqs] of Object.entries(this.industryCompliance)) {
        const mandatoryMet = reqs.mandatory?.every(stdId =>
          productStandards.includes(stdId)
        ) ?? true

        if (mandatoryMet) {
          suitableIndustries.push({
            id: industry,
            name: reqs.displayName || industry,
            fullCompliance: true
          })
        } else {
          const metCount = reqs.mandatory?.filter(stdId =>
            productStandards.includes(stdId)
          ).length || 0
          const totalRequired = reqs.mandatory?.length || 0

          if (metCount > 0) {
            suitableIndustries.push({
              id: industry,
              name: reqs.displayName || industry,
              fullCompliance: false,
              compliancePercent: Math.round((metCount / totalRequired) * 100)
            })
          }
        }
      }

      return {
        success: true,
        product: {
          id: product.id,
          name: product.name,
          sku: product.sku,
          category: product.category
        },
        certifications,
        suitableIndustries: suitableIndustries.sort((a, b) =>
          (b.fullCompliance ? 1 : 0) - (a.fullCompliance ? 1 : 0) ||
          (b.compliancePercent || 100) - (a.compliancePercent || 100)
        ),
        note: 'Suitability based on SANS/OHSA/DMR requirements'
      }
    } catch (error) {
      console.error('ComplianceEngine getProductComplianceSummary error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get BBB-EE information
   * @returns {Object} BBB-EE info
   */
  getBBBEEInfo() {
    return {
      level: 1,
      status: 'Level 1 BBB-EE Contributor',
      ownership: '100% Black Women-Owned',
      recognitionLevel: 135,
      benefits: [
        '135% procurement recognition for clients',
        'Maximum points on BEE scorecards',
        'Supports transformation goals',
        'Preferential procurement benefits'
      ],
      certificate: {
        available: true,
        downloadUrl: '/api/v1/documents/bbbee-certificate',
        validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      },
      verification: {
        body: 'Empowerlogic',
        verificationNumber: 'EMP-2024-XXXX'
      }
    }
  }
}

// Export singleton instance
const complianceEngine = new ComplianceEngine()
export default complianceEngine
export { ComplianceEngine }
