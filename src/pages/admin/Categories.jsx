import { useState, useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'
import ConfirmModal from '@/components/ui/ConfirmModal'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function Categories() {
  const { token, user } = useAuth()
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [formData, setFormData] = useState({ name: '', description: '', slug: '' })
  const [saving, setSaving] = useState(false)
  const [deleteModal, setDeleteModal] = useState({ open: false, categoryId: null })

  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_URL}/categories`)
      const data = await res.json()
      setCategories(Array.isArray(data) ? data : (data.categories || []))
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category)
      setFormData({ name: category.name, description: category.description || '', slug: category.slug })
    } else {
      setEditingCategory(null)
      setFormData({ name: '', description: '', slug: '' })
    }
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const url = editingCategory
        ? `${API_URL}/categories/${editingCategory.id}`
        : `${API_URL}/categories`
      const method = editingCategory ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setShowModal(false)
        setEditingCategory(null)
        setFormData({ name: '', description: '', slug: '' })
        fetchCategories()
      }
    } catch (error) {
      console.error('Failed to save category:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = (categoryId) => {
    setDeleteModal({ open: true, categoryId })
  }

  const doDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/categories/${deleteModal.categoryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      setDeleteModal({ open: false, categoryId: null })
      if (res.ok) {
        fetchCategories()
      }
    } catch (error) {
      console.error('Failed to delete category:', error)
      setDeleteModal({ open: false, categoryId: null })
    }
  }

  const generateSlug = (name) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
  }

  const handleNameChange = (name) => {
    setFormData(prev => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name)
    }))
  }

  const isAdmin = user?.role === 'ADMIN'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">Categories</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">{categories.length} categories</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center justify-center px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety-dark transition-colors"
        >
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Category
        </button>
      </div>

      {/* Categories Grid */}
      <div className="bg-white dark:bg-navy rounded-xl shadow-card overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
          </div>
        ) : categories.length === 0 ? (
          <div className="p-8 text-center text-gray-500 dark:text-gray-400">
            No categories found
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="border border-gray-200 dark:border-navy-light rounded-lg p-4 hover:shadow-card transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900 dark:text-white">{category.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{category.slug}</p>
                    {category.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 line-clamp-2">
                        {category.description}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                      {category._count?.products || 0} products
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button
                      onClick={() => handleOpenModal(category)}
                      className="p-2 text-gray-500 hover:text-industrial dark:text-gray-400 dark:hover:text-industrial-light rounded"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-gray-500 hover:text-red-500 dark:text-gray-400 dark:hover:text-red-400 rounded"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-navy rounded-xl shadow-xl w-full max-w-md">
            <div className="p-4 border-b border-gray-200 dark:border-navy-light flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Slug *</label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 px-4 py-2 bg-safety text-white rounded-lg hover:bg-safety-dark disabled:opacity-50"
                >
                  {saving ? 'Saving...' : editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      <ConfirmModal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, categoryId: null })}
        onConfirm={doDelete}
        title="Delete Category"
        message="Are you sure you want to delete this category? This action cannot be undone."
        confirmText="Delete"
        variant="danger"
      />
    </div>
  )
}
