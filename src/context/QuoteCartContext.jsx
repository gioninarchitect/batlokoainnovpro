import { createContext, useContext, useState, useEffect } from 'react'

const QuoteCartContext = createContext()

export function QuoteCartProvider({ children }) {
  const [items, setItems] = useState(() => {
    // Load from localStorage on init
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('quoteCart')
      return saved ? JSON.parse(saved) : []
    }
    return []
  })
  const [isCartOpen, setIsCartOpen] = useState(false)

  // Persist to localStorage
  useEffect(() => {
    localStorage.setItem('quoteCart', JSON.stringify(items))
  }, [items])

  const addItem = (product, quantity = 1, notes = '') => {
    setItems(prev => {
      const existingIndex = prev.findIndex(item => item.id === product.id)

      if (existingIndex > -1) {
        // Update existing item
        const updated = [...prev]
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          notes: notes || updated[existingIndex].notes
        }
        return updated
      }

      // Add new item
      return [...prev, {
        id: product.id,
        slug: product.slug,
        title: product.title,
        description: product.description,
        image: product.image,
        quantity,
        notes,
        addedAt: new Date().toISOString()
      }]
    })
  }

  const updateItem = (productId, updates) => {
    setItems(prev => prev.map(item =>
      item.id === productId ? { ...item, ...updates } : item
    ))
  }

  const removeItem = (productId) => {
    setItems(prev => prev.filter(item => item.id !== productId))
  }

  const clearCart = () => {
    setItems([])
  }

  const openCart = () => setIsCartOpen(true)
  const closeCart = () => setIsCartOpen(false)
  const toggleCart = () => setIsCartOpen(prev => !prev)

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)

  const value = {
    items,
    itemCount,
    isCartOpen,
    addItem,
    updateItem,
    removeItem,
    clearCart,
    openCart,
    closeCart,
    toggleCart
  }

  return (
    <QuoteCartContext.Provider value={value}>
      {children}
    </QuoteCartContext.Provider>
  )
}

export function useQuoteCart() {
  const context = useContext(QuoteCartContext)
  if (!context) {
    throw new Error('useQuoteCart must be used within QuoteCartProvider')
  }
  return context
}

export default QuoteCartContext
