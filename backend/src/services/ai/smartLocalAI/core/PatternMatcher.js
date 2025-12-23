/**
 * PatternMatcher - Core pattern matching engine for Smart AI Factory
 * Handles intent detection through regex patterns and keyword matching
 *
 * Zero external API dependency - all processing is local
 * Target response time: <10ms per match operation
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

class PatternMatcher {
  constructor() {
    this.patterns = []
    this.entityPatterns = {}
    this.fallbackPatterns = []
    this.synonymMap = new Map()
    this.isInitialized = false

    // Metrics for performance tracking
    this.metrics = {
      totalMatches: 0,
      avgMatchTime: 0,
      patternHits: {},
      synonymHits: 0
    }
  }

  /**
   * Initialize the pattern matcher with knowledge base data
   * @returns {Promise<void>}
   */
  async initialize() {
    try {
      const knowledgePath = path.join(__dirname, '..', 'knowledge')

      // Load patterns
      const patternsData = JSON.parse(
        fs.readFileSync(path.join(knowledgePath, 'patterns.json'), 'utf8')
      )
      this.patterns = patternsData.patterns || []
      this.entityPatterns = patternsData.entityPatterns || {}
      this.fallbackPatterns = patternsData.fallbackPatterns || []

      // Pre-compile regex patterns for performance
      this.compiledPatterns = this.patterns.map(pattern => ({
        ...pattern,
        compiledRegex: new RegExp(pattern.regex, 'i')
      }))

      this.compiledFallbacks = this.fallbackPatterns.map(pattern => ({
        ...pattern,
        compiledRegex: new RegExp(pattern.regex, 'i')
      }))

      // Load synonyms
      const synonymsData = JSON.parse(
        fs.readFileSync(path.join(knowledgePath, 'synonyms.json'), 'utf8')
      )
      this.buildSynonymMap(synonymsData)

      this.isInitialized = true
      console.log(`PatternMatcher initialized: ${this.patterns.length} patterns, ${this.synonymMap.size} synonyms`)
    } catch (error) {
      console.error('PatternMatcher initialization error:', error)
      throw error
    }
  }

  /**
   * Build a fast lookup map from synonyms data
   * @param {Object} synonymsData - Synonyms JSON data
   */
  buildSynonymMap(synonymsData) {
    const synonyms = synonymsData.synonyms || {}

    for (const [canonical, data] of Object.entries(synonyms)) {
      // Map each variation to canonical term
      if (data.variations) {
        for (const variation of data.variations) {
          this.synonymMap.set(variation.toLowerCase(), canonical)
        }
      }
      // Map typos to canonical term
      if (data.typos) {
        for (const typo of data.typos) {
          this.synonymMap.set(typo.toLowerCase(), canonical)
        }
      }
      // Map canonical to itself
      this.synonymMap.set(canonical.toLowerCase(), canonical)
    }

    // Add location mappings
    const locations = synonymsData.locations || {}
    for (const [key, locData] of Object.entries(locations)) {
      if (locData.variations) {
        for (const variation of locData.variations) {
          this.synonymMap.set(variation.toLowerCase(), locData.canonical)
        }
      }
    }
  }

  /**
   * Normalize input text for matching
   * @param {string} input - Raw user input
   * @returns {string} Normalized input
   */
  normalize(input) {
    if (!input || typeof input !== 'string') return ''

    return input
      .toLowerCase()
      .trim()
      .replace(/[^\w\s\-\.]/g, ' ')  // Keep alphanumeric, spaces, dashes, dots
      .replace(/\s+/g, ' ')           // Collapse multiple spaces
  }

  /**
   * Tokenize input and map through synonyms
   * @param {string} input - Normalized input
   * @returns {Object} Tokens with original and canonical forms
   */
  tokenize(input) {
    const normalized = this.normalize(input)
    const words = normalized.split(' ')

    const tokens = {
      original: words,
      canonical: [],
      mapped: []
    }

    for (const word of words) {
      if (this.synonymMap.has(word)) {
        const canonical = this.synonymMap.get(word)
        tokens.canonical.push(canonical)
        if (word !== canonical.toLowerCase()) {
          tokens.mapped.push({ from: word, to: canonical })
          this.metrics.synonymHits++
        }
      } else {
        tokens.canonical.push(word)
      }
    }

    return tokens
  }

  /**
   * Main matching function - find best matching patterns for input
   * @param {string} input - User input text
   * @returns {Array} Array of matches with scores
   */
  match(input) {
    if (!this.isInitialized) {
      console.warn('PatternMatcher not initialized')
      return []
    }

    const startTime = performance.now()

    if (!input || typeof input !== 'string' || input.trim().length === 0) {
      return []
    }

    // Tokenize and normalize
    const tokens = this.tokenize(input)
    const normalizedInput = this.normalize(input)
    const canonicalInput = tokens.canonical.join(' ')

    const matches = []

    // Test against all patterns
    for (const pattern of this.compiledPatterns) {
      try {
        // Test against both original and canonical forms
        const originalMatch = pattern.compiledRegex.test(normalizedInput)
        const canonicalMatch = pattern.compiledRegex.test(canonicalInput)

        if (originalMatch || canonicalMatch) {
          // Calculate confidence score
          const score = this.calculateScore(
            pattern,
            normalizedInput,
            canonicalInput,
            tokens
          )

          matches.push({
            pattern: {
              id: pattern.id,
              intent: pattern.intent,
              priority: pattern.priority
            },
            score,
            matchType: originalMatch && canonicalMatch ? 'both' :
                       canonicalMatch ? 'canonical' : 'original',
            synonymsUsed: tokens.mapped
          })

          // Track pattern hits
          this.metrics.patternHits[pattern.id] =
            (this.metrics.patternHits[pattern.id] || 0) + 1
        }
      } catch (error) {
        console.error(`Pattern match error for ${pattern.id}:`, error)
      }
    }

    // Sort by score (highest first), then by priority
    matches.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score
      return b.pattern.priority - a.pattern.priority
    })

    // If no matches, try fallback patterns
    if (matches.length === 0) {
      for (const fallback of this.compiledFallbacks) {
        if (fallback.compiledRegex.test(normalizedInput)) {
          matches.push({
            pattern: {
              id: fallback.id,
              intent: fallback.intent,
              priority: fallback.priority
            },
            score: 0.3,
            matchType: 'fallback',
            synonymsUsed: []
          })
        }
      }
    }

    // Update metrics
    const elapsed = performance.now() - startTime
    this.metrics.totalMatches++
    this.metrics.avgMatchTime =
      (this.metrics.avgMatchTime * (this.metrics.totalMatches - 1) + elapsed) /
      this.metrics.totalMatches

    return matches
  }

  /**
   * Calculate confidence score for a match
   * @param {Object} pattern - The matched pattern
   * @param {string} normalizedInput - Normalized input text
   * @param {string} canonicalInput - Input with synonyms resolved
   * @param {Object} tokens - Tokenization result
   * @returns {number} Confidence score 0-1
   */
  calculateScore(pattern, normalizedInput, canonicalInput, tokens) {
    let score = 0.5  // Base score for regex match

    // Keyword overlap bonus
    if (pattern.keywords && pattern.keywords.length > 0) {
      const inputWords = new Set(tokens.canonical)
      let keywordMatches = 0

      for (const keyword of pattern.keywords) {
        if (inputWords.has(keyword.toLowerCase())) {
          keywordMatches++
        }
      }

      score += (keywordMatches / pattern.keywords.length) * 0.3
    }

    // Priority bonus (higher priority = slight score boost)
    score += (pattern.priority / 100) * 0.1

    // Synonym match bonus (rewarding our dictionary matching)
    if (tokens.mapped.length > 0) {
      score += Math.min(tokens.mapped.length * 0.05, 0.1)
    }

    // Exact phrase match bonus
    if (pattern.keywords) {
      const phrase = pattern.keywords.join(' ')
      if (canonicalInput.includes(phrase)) {
        score += 0.15
      }
    }

    return Math.min(score, 1.0)  // Cap at 1.0
  }

  /**
   * Extract entities from input using entity patterns
   * @param {string} input - User input text
   * @returns {Object} Extracted entities
   */
  extractEntities(input) {
    const entities = {
      quantities: [],
      productCodes: [],
      orderNumbers: [],
      locations: [],
      measurements: [],
      sansCodes: []
    }

    const normalizedInput = this.normalize(input)

    // Extract quantities
    if (this.entityPatterns.quantity) {
      const regex = new RegExp(this.entityPatterns.quantity.regex, 'gi')
      let match
      while ((match = regex.exec(normalizedInput)) !== null) {
        entities.quantities.push({
          value: parseFloat(match[1].replace(',', '')),
          unit: match[2] || 'units',
          raw: match[0]
        })
      }
    }

    // Extract product codes (M12, Grade 8.8, etc.)
    if (this.entityPatterns.productCode) {
      const regex = new RegExp(this.entityPatterns.productCode.regex, 'gi')
      let match
      while ((match = regex.exec(input)) !== null) {
        entities.productCodes.push(match[0])
      }
    }

    // Extract order numbers
    if (this.entityPatterns.orderNumber) {
      const regex = new RegExp(this.entityPatterns.orderNumber.regex, 'gi')
      let match
      while ((match = regex.exec(input)) !== null) {
        entities.orderNumbers.push(match[0].toUpperCase())
      }
    }

    // Extract locations
    if (this.entityPatterns.location) {
      const regex = new RegExp(this.entityPatterns.location.regex, 'gi')
      let match
      while ((match = regex.exec(normalizedInput)) !== null) {
        // Map through synonyms to get canonical location name
        const canonical = this.synonymMap.get(match[0].toLowerCase()) || match[0]
        entities.locations.push(canonical)
      }
    }

    // Extract measurements
    if (this.entityPatterns.measurement) {
      const regex = new RegExp(this.entityPatterns.measurement.regex, 'gi')
      let match
      while ((match = regex.exec(normalizedInput)) !== null) {
        entities.measurements.push({
          value: parseFloat(match[1]),
          unit: match[2].toLowerCase(),
          raw: match[0]
        })
      }
    }

    // Extract SANS codes
    if (this.entityPatterns.sansCode) {
      const regex = new RegExp(this.entityPatterns.sansCode.regex, 'gi')
      let match
      while ((match = regex.exec(input)) !== null) {
        entities.sansCodes.push(match[0].toUpperCase())
      }
    }

    return entities
  }

  /**
   * Get performance metrics
   * @returns {Object} Performance metrics
   */
  getMetrics() {
    return {
      ...this.metrics,
      patternCount: this.patterns.length,
      synonymCount: this.synonymMap.size,
      isInitialized: this.isInitialized
    }
  }

  /**
   * Fuzzy match a query against a target string
   * Simple Levenshtein-based similarity
   * @param {string} query - Search query
   * @param {string} target - Target to match against
   * @returns {number} Similarity score 0-1
   */
  fuzzyMatch(query, target) {
    if (!query || !target) return 0

    const q = query.toLowerCase()
    const t = target.toLowerCase()

    if (q === t) return 1
    if (t.includes(q)) return 0.9
    if (q.includes(t)) return 0.8

    // Simple character overlap for basic fuzzy matching
    const qSet = new Set(q.split(''))
    const tSet = new Set(t.split(''))
    const intersection = [...qSet].filter(c => tSet.has(c))

    return intersection.length / Math.max(qSet.size, tSet.size)
  }
}

// Export singleton instance
const patternMatcher = new PatternMatcher()
export default patternMatcher
export { PatternMatcher }
