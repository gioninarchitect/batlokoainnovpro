/**
 * IntentClassifier - Classifies user intent from pattern matches
 * Takes PatternMatcher results and determines the best intent
 *
 * Handles ambiguity resolution and confidence thresholds
 */

import patternMatcher from './PatternMatcher.js'

// Minimum confidence threshold for accepting an intent
const CONFIDENCE_THRESHOLD = 0.6
const AMBIGUITY_THRESHOLD = 0.1  // Max difference between top matches to flag ambiguity

class IntentClassifier {
  constructor() {
    this.isInitialized = false
    this.intentHandlers = new Map()

    // Intent parameter mappings
    this.parameterMaps = {
      PRODUCT_SEARCH: ['query', 'category', 'productCode', 'quantity'],
      PRICE_QUOTE: ['productId', 'quantity', 'location'],
      SPEC_QUERY: ['productId', 'productCode', 'specType'],
      COMPLIANCE_CHECK: ['industry', 'productId', 'standard'],
      DELIVERY_INQUIRY: ['location', 'quantity', 'productId'],
      COMPATIBILITY_CHECK: ['product1', 'product2'],
      BULK_DISCOUNT: ['quantity', 'productId'],
      BBBEE_INQUIRY: ['requestType'],
      PROJECT_ASSISTANCE: ['projectType', 'industry'],
      STOCK_CHECK: ['productId', 'quantity'],
      ORDER_STATUS: ['orderNumber'],
      QUOTE_STATUS: ['quoteNumber'],
      GENERAL_INFO: ['infoType'],
      CONTACT_REQUEST: ['contactType'],
      GREETING: [],
      THANKS: [],
      UNKNOWN: []
    }
  }

  /**
   * Initialize the classifier
   * @returns {Promise<void>}
   */
  async initialize() {
    if (!patternMatcher.isInitialized) {
      await patternMatcher.initialize()
    }
    this.isInitialized = true
    console.log('IntentClassifier initialized')
  }

  /**
   * Classify user input and return intent with parameters
   * @param {string} input - User input text
   * @param {Object} context - Optional conversation context
   * @returns {Object} Classification result
   */
  classify(input, context = {}) {
    if (!this.isInitialized) {
      console.warn('IntentClassifier not initialized')
      return this.createUnknownResult(input)
    }

    // Get pattern matches
    const matches = patternMatcher.match(input)

    // Extract entities regardless of match
    const entities = patternMatcher.extractEntities(input)

    // No matches - return unknown
    if (matches.length === 0) {
      return this.createUnknownResult(input, entities)
    }

    const topMatch = matches[0]

    // Below confidence threshold
    if (topMatch.score < CONFIDENCE_THRESHOLD) {
      return {
        intent: 'UNKNOWN',
        originalIntent: topMatch.pattern.intent,
        confidence: topMatch.score,
        requiresClarification: true,
        entities,
        parameters: {},
        suggestions: this.generateSuggestions(matches),
        raw: {
          input,
          matches: matches.slice(0, 3)
        }
      }
    }

    // Check for ambiguity (multiple high-confidence matches)
    const isAmbiguous = matches.length > 1 &&
      (topMatch.score - matches[1].score) < AMBIGUITY_THRESHOLD

    // Build parameters from entities
    const parameters = this.buildParameters(
      topMatch.pattern.intent,
      entities,
      input,
      context
    )

    return {
      intent: topMatch.pattern.intent,
      confidence: topMatch.score,
      isAmbiguous,
      ambiguousIntents: isAmbiguous ? matches.slice(0, 3).map(m => m.pattern.intent) : [],
      entities,
      parameters,
      synonymsUsed: topMatch.synonymsUsed,
      matchType: topMatch.matchType,
      raw: {
        input,
        patternId: topMatch.pattern.id,
        matches: matches.slice(0, 3)
      }
    }
  }

  /**
   * Build parameters object based on intent type and entities
   * @param {string} intent - The classified intent
   * @param {Object} entities - Extracted entities
   * @param {string} input - Original input
   * @param {Object} context - Conversation context
   * @returns {Object} Parameters for the intent
   */
  buildParameters(intent, entities, input, context) {
    const params = {}
    const paramMap = this.parameterMaps[intent] || []

    // Common parameter mappings
    if (paramMap.includes('quantity') && entities.quantities.length > 0) {
      params.quantity = entities.quantities[0].value
      params.unit = entities.quantities[0].unit
    }

    if (paramMap.includes('productCode') && entities.productCodes.length > 0) {
      params.productCode = entities.productCodes[0]
    }

    if (paramMap.includes('location') && entities.locations.length > 0) {
      params.location = entities.locations[0]
    }

    if (paramMap.includes('orderNumber') && entities.orderNumbers.length > 0) {
      params.orderNumber = entities.orderNumbers[0]
    }

    if (paramMap.includes('standard') && entities.sansCodes.length > 0) {
      params.standard = entities.sansCodes[0]
    }

    // Intent-specific parameter extraction
    switch (intent) {
      case 'PRODUCT_SEARCH':
        params.query = this.extractProductQuery(input, entities)
        params.category = this.inferCategory(input, entities)
        break

      case 'PRICE_QUOTE':
        params.query = this.extractProductQuery(input, entities)
        if (!params.quantity) {
          params.quantity = 1  // Default to 1 if not specified
        }
        break

      case 'SPEC_QUERY':
        params.query = this.extractProductQuery(input, entities)
        params.specType = this.inferSpecType(input)
        break

      case 'COMPLIANCE_CHECK':
        params.industry = this.inferIndustry(input)
        params.query = this.extractProductQuery(input, entities)
        break

      case 'DELIVERY_INQUIRY':
        if (!params.location) {
          // Try to get location from context
          params.location = context.lastLocation || null
        }
        break

      case 'COMPATIBILITY_CHECK':
        const products = this.extractProductPair(input, entities)
        params.product1 = products[0]
        params.product2 = products[1]
        break

      case 'BBBEE_INQUIRY':
        params.requestType = this.inferBBBEERequestType(input)
        break

      case 'PROJECT_ASSISTANCE':
        params.projectType = this.inferProjectType(input)
        params.industry = this.inferIndustry(input)
        break

      case 'ORDER_STATUS':
      case 'QUOTE_STATUS':
        // Already extracted via entity patterns
        break

      case 'CONTACT_REQUEST':
        params.contactType = this.inferContactType(input)
        break
    }

    // Merge with context parameters if available
    if (context.lastProductId && !params.productId) {
      params.productId = context.lastProductId
    }

    return params
  }

  /**
   * Extract product query from input
   * @param {string} input - User input
   * @param {Object} entities - Extracted entities
   * @returns {string} Product query string
   */
  extractProductQuery(input, entities) {
    // Start with product codes if found
    if (entities.productCodes.length > 0) {
      return entities.productCodes.join(' ')
    }

    // Remove common noise words
    const noiseWords = [
      'i', 'need', 'want', 'looking', 'for', 'show', 'me', 'find',
      'the', 'a', 'an', 'some', 'any', 'please', 'can', 'you',
      'do', 'have', 'get', 'search', 'price', 'quote', 'cost'
    ]

    const words = input.toLowerCase().split(/\s+/)
    const queryWords = words.filter(word => !noiseWords.includes(word))

    return queryWords.join(' ')
  }

  /**
   * Infer product category from input
   * @param {string} input - User input
   * @param {Object} entities - Extracted entities
   * @returns {string|null} Category name or null
   */
  inferCategory(input, entities) {
    const categoryKeywords = {
      'bolts-nuts': ['bolt', 'nut', 'washer', 'fastener', 'screw'],
      'pipes-fittings': ['pipe', 'fitting', 'valve', 'coupling', 'elbow', 'tee'],
      'electrical': ['cable', 'wire', 'switch', 'socket', 'breaker', 'electrical'],
      'ppe': ['helmet', 'gloves', 'boots', 'safety', 'ppe', 'protective'],
      'pumps-motors': ['pump', 'motor', 'compressor', 'blower'],
      'bearings': ['bearing', 'bush', 'sleeve']
    }

    const normalizedInput = input.toLowerCase()

    for (const [category, keywords] of Object.entries(categoryKeywords)) {
      for (const keyword of keywords) {
        if (normalizedInput.includes(keyword)) {
          return category
        }
      }
    }

    return null
  }

  /**
   * Infer specification type from input
   * @param {string} input - User input
   * @returns {string} Spec type
   */
  inferSpecType(input) {
    const specKeywords = {
      dimensions: ['size', 'dimension', 'length', 'width', 'height', 'diameter'],
      material: ['material', 'steel', 'stainless', 'galvanized'],
      performance: ['tensile', 'strength', 'pressure', 'rating', 'capacity'],
      compliance: ['sans', 'standard', 'certified', 'compliant']
    }

    const normalizedInput = input.toLowerCase()

    for (const [specType, keywords] of Object.entries(specKeywords)) {
      for (const keyword of keywords) {
        if (normalizedInput.includes(keyword)) {
          return specType
        }
      }
    }

    return 'general'
  }

  /**
   * Infer industry from input
   * @param {string} input - User input
   * @returns {string} Industry name
   */
  inferIndustry(input) {
    const industryKeywords = {
      mining: ['mine', 'mining', 'underground', 'surface', 'shaft', 'dmr'],
      construction: ['construction', 'building', 'site', 'contractor', 'civil'],
      electrical: ['electrical', 'wiring', 'installation', 'power'],
      manufacturing: ['factory', 'manufacturing', 'production', 'plant']
    }

    const normalizedInput = input.toLowerCase()

    for (const [industry, keywords] of Object.entries(industryKeywords)) {
      for (const keyword of keywords) {
        if (normalizedInput.includes(keyword)) {
          return industry
        }
      }
    }

    return 'general'
  }

  /**
   * Extract product pair for compatibility check
   * @param {string} input - User input
   * @param {Object} entities - Extracted entities
   * @returns {Array} Array of two product identifiers
   */
  extractProductPair(input, entities) {
    // Look for pattern like "X with Y" or "X and Y"
    const pairPatterns = [
      /(.+?)\s+(with|and|to)\s+(.+)/i,
      /compatible\s+(.+?)\s+(with|and)\s+(.+)/i
    ]

    for (const pattern of pairPatterns) {
      const match = input.match(pattern)
      if (match) {
        return [match[1].trim(), match[3].trim()]
      }
    }

    // Fall back to product codes if found
    if (entities.productCodes.length >= 2) {
      return [entities.productCodes[0], entities.productCodes[1]]
    }

    return [null, null]
  }

  /**
   * Infer BBB-EE request type
   * @param {string} input - User input
   * @returns {string} Request type
   */
  inferBBBEERequestType(input) {
    const normalizedInput = input.toLowerCase()

    if (normalizedInput.includes('certificate') || normalizedInput.includes('cert')) {
      return 'certificate'
    }
    if (normalizedInput.includes('level')) {
      return 'level'
    }
    if (normalizedInput.includes('benefit') || normalizedInput.includes('procurement')) {
      return 'benefits'
    }
    if (normalizedInput.includes('download') || normalizedInput.includes('send')) {
      return 'certificate'
    }

    return 'info'
  }

  /**
   * Infer project type
   * @param {string} input - User input
   * @returns {string} Project type
   */
  inferProjectType(input) {
    const projectKeywords = {
      construction: ['building', 'construct', 'erect', 'foundation'],
      installation: ['install', 'setup', 'fit', 'connect'],
      maintenance: ['repair', 'fix', 'maintain', 'replace', 'service'],
      expansion: ['expand', 'upgrade', 'extend']
    }

    const normalizedInput = input.toLowerCase()

    for (const [projectType, keywords] of Object.entries(projectKeywords)) {
      for (const keyword of keywords) {
        if (normalizedInput.includes(keyword)) {
          return projectType
        }
      }
    }

    return 'general'
  }

  /**
   * Infer contact type from input
   * @param {string} input - User input
   * @returns {string} Contact type
   */
  inferContactType(input) {
    const normalizedInput = input.toLowerCase()

    if (normalizedInput.includes('call') || normalizedInput.includes('phone')) {
      return 'call'
    }
    if (normalizedInput.includes('email')) {
      return 'email'
    }
    if (normalizedInput.includes('whatsapp')) {
      return 'whatsapp'
    }
    if (normalizedInput.includes('human') || normalizedInput.includes('person')) {
      return 'human'
    }

    return 'general'
  }

  /**
   * Generate suggestions based on partial matches
   * @param {Array} matches - Pattern matches
   * @returns {Array} Suggestion strings
   */
  generateSuggestions(matches) {
    const suggestions = []
    const seenIntents = new Set()

    for (const match of matches.slice(0, 3)) {
      const intent = match.pattern.intent
      if (!seenIntents.has(intent)) {
        seenIntents.add(intent)

        switch (intent) {
          case 'PRODUCT_SEARCH':
            suggestions.push('Search for products?')
            break
          case 'PRICE_QUOTE':
            suggestions.push('Get pricing?')
            break
          case 'DELIVERY_INQUIRY':
            suggestions.push('Check delivery times?')
            break
          case 'COMPLIANCE_CHECK':
            suggestions.push('Verify compliance?')
            break
          default:
            suggestions.push(`Did you mean: ${intent.toLowerCase().replace('_', ' ')}?`)
        }
      }
    }

    return suggestions
  }

  /**
   * Create an unknown intent result
   * @param {string} input - User input
   * @param {Object} entities - Extracted entities (optional)
   * @returns {Object} Unknown intent result
   */
  createUnknownResult(input, entities = {}) {
    return {
      intent: 'UNKNOWN',
      confidence: 0,
      requiresClarification: true,
      entities,
      parameters: {},
      suggestions: [
        'Search for products?',
        'Get a quote?',
        'Check delivery?',
        'Talk to sales?'
      ],
      raw: { input }
    }
  }
}

// Export singleton instance
const intentClassifier = new IntentClassifier()
export default intentClassifier
export { IntentClassifier }
