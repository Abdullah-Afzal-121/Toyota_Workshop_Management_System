import { X, CheckCircle, XCircle, AlertTriangle, Info } from 'lucide-react'
import { useToast } from '../context/ToastContext'

const CONFIG = {
  success: { icon: CheckCircle, bg: '#F0FAF4', border: '#34C759', text: '#166534', iconColor: '#22C55E', title: 'Success' },
  error:   { icon: XCircle,     bg: '#FEF2F2', border: '#F87171', text: '#991B1B', iconColor: '#EF4444', title: 'Error'   },
  warning: { icon: AlertTriangle, bg: '#FFFBEB', border: '#FBBF24', text: '#92400E', iconColor: '#F59E0B', title: 'Warning' },
  info:    { icon: Info,        bg: '#EFF6FF', border: '#60A5FA', text: '#1E40AF', iconColor: '#3B82F6', title: 'Info'    },
}

function ToastItem({ id, type, title, message }) {
  const { removeToast } = useToast()
  const c = CONFIG[type] || CONFIG.info
  const Icon = c.icon

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderLeft: `4px solid ${c.iconColor}`,
        borderRadius: 12,
        padding: '0.9rem 1rem',
        minWidth: 300,
        maxWidth: 380,
        boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
        animation: 'toastSlideIn 0.3s cubic-bezier(0.21, 1.02, 0.73, 1) forwards',
        fontFamily: 'inherit',
      }}
    >
      <Icon size={20} color={c.iconColor} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontWeight: 700, fontSize: '0.85rem', color: c.text, lineHeight: 1.3 }}>
          {title}
        </p>
        {message && (
          <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: c.text, opacity: 0.85, lineHeight: 1.4 }}>
            {message}
          </p>
        )}
      </div>
      <button
        onClick={() => removeToast(id)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: c.text, opacity: 0.5, padding: 0, flexShrink: 0, display: 'flex', alignItems: 'center', marginTop: 1 }}
      >
        <X size={15} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const { toasts } = useToast()

  return (
    <>
      <style>{`
        @keyframes toastSlideIn {
          from { opacity: 0; transform: translateX(100%) scale(0.9); }
          to   { opacity: 1; transform: translateX(0)   scale(1);   }
        }
      `}</style>
      <div
        style={{
          position: 'fixed',
          top: '1.25rem',
          right: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '0.6rem',
          zIndex: 9999,
          pointerEvents: 'none',
        }}
      >
        {toasts.map(t => (
          <div key={t.id} style={{ pointerEvents: 'all' }}>
            <ToastItem {...t} />
          </div>
        ))}
      </div>
    </>
  )
}
