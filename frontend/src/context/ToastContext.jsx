import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext(null)

/**
 * Toast types: 'success' | 'error' | 'warning' | 'info'
 * Each toast: { id, type, title, message }
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((type, title, message, duration = 4000) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type, title, message }])
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), duration)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Convenient shorthand methods
  const toast = {
    success: (title, msg, dur)  => addToast('success', title, msg, dur),
    error:   (title, msg, dur)  => addToast('error',   title, msg, dur),
    warning: (title, msg, dur)  => addToast('warning', title, msg, dur),
    info:    (title, msg, dur)  => addToast('info',    title, msg, dur),
  }

  return (
    <ToastContext.Provider value={{ toast, toasts, removeToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export const useToast = () => {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>')
  return ctx
}
