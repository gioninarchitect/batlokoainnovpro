import { Fragment } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, AlertTriangle, CheckCircle, Info, AlertCircle } from 'lucide-react'

const icons = {
  danger: AlertTriangle,
  success: CheckCircle,
  info: Info,
  warning: AlertCircle
}

const colors = {
  danger: {
    icon: 'text-red-500',
    button: 'bg-red-500 hover:bg-red-600 text-white'
  },
  success: {
    icon: 'text-green-500',
    button: 'bg-green-500 hover:bg-green-600 text-white'
  },
  info: {
    icon: 'text-blue-500',
    button: 'bg-blue-500 hover:bg-blue-600 text-white'
  },
  warning: {
    icon: 'text-amber-500',
    button: 'bg-amber-500 hover:bg-amber-600 text-white'
  }
}

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'info',
  loading = false
}) {
  const Icon = icons[variant] || icons.info
  const color = colors[variant] || colors.info

  const handleConfirm = async () => {
    await onConfirm()
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-navy rounded-2xl shadow-2xl w-full max-w-md overflow-hidden" onClick={e => e.stopPropagation()}>
              {/* Header */}
              <div className="flex items-center gap-4 p-6 border-b border-gray-100 dark:border-navy-light">
                <div className={`w-12 h-12 rounded-full bg-gray-100 dark:bg-navy-light flex items-center justify-center ${color.icon}`}>
                  <Icon size={24} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">{title}</h3>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-navy-light transition-colors"
                >
                  <X size={20} className="text-gray-500" />
                </button>
              </div>

              {/* Body */}
              <div className="p-6">
                <p className="text-gray-600 dark:text-gray-400">{message}</p>
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 pt-0">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-navy-light text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-navy-light transition-colors disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading}
                  className={`flex-1 px-4 py-2.5 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center ${color.button}`}
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    confirmText
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// Alert Modal (for success/error messages)
export function AlertModal({
  isOpen,
  onClose,
  title = 'Alert',
  message = '',
  variant = 'info',
  buttonText = 'OK'
}) {
  const Icon = icons[variant] || icons.info
  const color = colors[variant] || colors.info

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            <div className="bg-white dark:bg-navy rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={e => e.stopPropagation()}>
              <div className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-navy-light flex items-center justify-center ${color.icon}`}>
                  <Icon size={32} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-6">{message}</p>
                <button
                  onClick={onClose}
                  className={`w-full px-4 py-2.5 rounded-xl font-medium transition-colors ${color.button}`}
                >
                  {buttonText}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
