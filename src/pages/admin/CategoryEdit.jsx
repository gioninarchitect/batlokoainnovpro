import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

const API_URL = import.meta.env.VITE_API_URL || (
  window.location.hostname === 'localhost' ? 'http://localhost:3016/api/v1' : `${window.location.origin}/api/v1`
)

export default function CategoryEdit() {
  const { id } = useParams()
  const isNew = !id || id === 'new'
  const navigate = useNavigate()
  const { token } = useAuth()

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    sortOrder: '0'
  })

  useEffect(() => {
    if (!isNew) fetchCategory()
  }, [id])

  const fetchCategory = async () => {
    try {
      const res = await fetch(`${API_URL}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) throw new Error('Category not found')
      const category = await res.json()
      setForm({
        name: category.name || '',
        description: category.description || '',
        sortOrder: category.sortOrder?.toString() || '0'
      })
    } catch (error) {
      setError('Failed to load category')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSaving(true)

    try {
      const slug = form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
      const payload = {
        name: form.name,
        slug,
        description: form.description,
        sortOrder: parseInt(form.sortOrder) || 0
      }

      const url = isNew ? `${API_URL}/categories` : `${API_URL}/categories/${id}`
      const method = isNew ? 'POST' : 'PUT'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to save category')
      }

      navigate('/admin/categories')
    } catch (error) {
      setError(error.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-safety"></div>
      </div>
    )
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/categories" className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
          {isNew ? 'Add Category' : 'Edit Category'}
        </h1>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white dark:bg-navy rounded-xl shadow-card p-4 sm:p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Category Name *</label>
          <input type="text" name="name" value={form.name} onChange={handleChange} required
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent"
            placeholder="e.g., Fasteners" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
          <textarea name="description" value={form.description} onChange={handleChange} rows={3}
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent resize-none"
            placeholder="Category description..." />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sort Order</label>
          <input type="number" name="sortOrder" value={form.sortOrder} onChange={handleChange} min="0"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-navy-light bg-white dark:bg-navy-light text-gray-900 dark:text-white focus:ring-2 focus:ring-safety focus:border-transparent"
            placeholder="0" />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Lower numbers appear first</p>
        </div>

        <div className="border-t border-gray-200 dark:border-navy-light pt-5 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <Link to="/admin/categories" className="px-4 py-2.5 text-center border border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light transition-colors">
            Cancel
          </Link>
          <button type="submit" disabled={saving} className="px-6 py-2.5 bg-safety text-white rounded-lg hover:bg-safety-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center">
            {saving ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Saving...
              </>
            ) : (
              isNew ? 'Create Category' : 'Save Changes'
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
