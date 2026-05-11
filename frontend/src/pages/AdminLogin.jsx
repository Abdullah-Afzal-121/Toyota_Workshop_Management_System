import { useState } from 'react'
import { useNavigate, Navigate } from 'react-router-dom'
import { Eye, EyeOff, Loader2, ShieldCheck, Lock } from 'lucide-react'
import { useAuth, ROLE_HOME } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const TOYOTA_RED = '#EB0A1E'

export default function AdminLogin() {
  const { user, adminLogin } = useAuth()
  const { toast }            = useToast()
  const navigate             = useNavigate()

  const [form, setForm]         = useState({ email: '', password: '' })
  const [showPw, setShowPw]     = useState(false)
  const [loading, setLoading]   = useState(false)

  // Already logged in → go to designated dashboard
  if (user) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!form.email || !form.password) {
      toast.warning('Missing Fields', 'Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const u = await adminLogin(form.email.trim(), form.password)
      toast.success('Access Granted', `Welcome back, ${u.name}.`)
      navigate(ROLE_HOME[u.role] || '/', { replace: true })
    } catch (err) {
      const msg = err.response?.data?.message || 'Authentication failed.'
      toast.error('Access Denied', msg)
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 10,
    padding: '0.85rem 1rem',
    fontSize: '0.875rem',
    color: '#F1F5F9',
    outline: 'none',
    transition: 'border-color 0.2s, background 0.2s',
    boxSizing: 'border-box',
    caretColor: TOYOTA_RED,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0D0F14 0%, #1A1D27 50%, #0D0F14 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      fontFamily: 'inherit',
      position: 'relative',
      overflow: 'hidden',
    }}>

      {/* Background grid pattern */}
      <div style={{
        position: 'absolute', inset: 0, opacity: 0.04,
        backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)',
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
      }} />

      {/* Glow spot */}
      <div style={{
        position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
        width: 500, height: 500, borderRadius: '50%',
        background: `radial-gradient(circle, ${TOYOTA_RED}22 0%, transparent 70%)`,
        pointerEvents: 'none',
      }} />

      {/* Card */}
      <div style={{
        position: 'relative', zIndex: 1,
        width: 'min(420px, 100%)',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 20,
        padding: 'clamp(2rem, 5vw, 2.75rem)',
        backdropFilter: 'blur(16px)',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6)',
      }}>

        {/* Logo area */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '2rem' }}>
          <img src="/toyota-logo.png" alt="Toyota" style={{ width: 70, height: 70, borderRadius: '50%', boxShadow: `0 8px 24px ${TOYOTA_RED}55`, marginBottom: '1rem' }} />
          <h1 style={{ color: '#F1F5F9', fontWeight: 800, fontSize: '1.45rem', margin: 0, letterSpacing: '-0.01em', textAlign: 'center' }}>
            Admin Portal
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.8rem', margin: '0.4rem 0 0', textAlign: 'center' }}>
            Toyota Chenab Motors Tracker — Authorized Access Only
          </p>
        </div>

        {/* Restricted badge */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: '0.5rem',
          background: 'rgba(235,10,30,0.1)', border: '1px solid rgba(235,10,30,0.3)',
          borderRadius: 8, padding: '0.55rem 0.9rem', marginBottom: '1.75rem',
        }}>
          <Lock size={13} color={TOYOTA_RED} />
          <span style={{ color: TOYOTA_RED, fontSize: '0.73rem', fontWeight: 600, letterSpacing: '0.04em' }}>
            RESTRICTED — ADMIN CREDENTIALS REQUIRED
          </span>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Email */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
              ADMIN EMAIL
            </label>
            <input
              type="email"
              placeholder="admin@toyota.com"
              value={form.email}
              onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
              style={inputStyle}
              onFocus={e  => { e.target.style.borderColor = TOYOTA_RED; e.target.style.background = 'rgba(255,255,255,0.1)' }}
              onBlur={e   => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.07)' }}
              autoComplete="username"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label style={{ display: 'block', color: 'rgba(255,255,255,0.55)', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
              PASSWORD
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                style={{ ...inputStyle, paddingRight: '2.8rem' }}
                onFocus={e  => { e.target.style.borderColor = TOYOTA_RED; e.target.style.background = 'rgba(255,255,255,0.1)' }}
                onBlur={e   => { e.target.style.borderColor = 'rgba(255,255,255,0.15)'; e.target.style.background = 'rgba(255,255,255,0.07)' }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', display: 'flex', alignItems: 'center', padding: 0 }}
              >
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: '0.5rem',
              background: loading ? 'rgba(235,10,30,0.5)' : `linear-gradient(135deg, ${TOYOTA_RED} 0%, #c00018 100%)`,
              border: 'none', borderRadius: 10, padding: '0.85rem',
              color: '#fff', fontWeight: 700, fontSize: '0.875rem',
              letterSpacing: '0.08em', cursor: loading ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              boxShadow: loading ? 'none' : `0 6px 20px ${TOYOTA_RED}55`,
              transition: 'all 0.2s',
            }}
          >
            {loading
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Authenticating…</>
              : <><ShieldCheck size={16} /> SIGN IN TO ADMIN</>
            }
          </button>
        </form>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
