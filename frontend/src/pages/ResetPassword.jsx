import { useState } from 'react'
import { Link, useSearchParams, useNavigate } from 'react-router-dom'
import { KeyRound, Eye, EyeOff, Loader2, CheckCircle2, ArrowLeft } from 'lucide-react'
import axios from 'axios'

const GRAD = 'linear-gradient(135deg, #f5316f 0%, #eb0a1e 100%)'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate       = useNavigate()
  const token  = searchParams.get('token')  || ''
  const email  = searchParams.get('email')  || ''

  const [password,  setPassword]  = useState('')
  const [confirm,   setConfirm]   = useState('')
  const [showPw,    setShowPw]    = useState(false)
  const [showCf,    setShowCf]    = useState(false)
  const [loading,   setLoading]   = useState(false)
  const [done,      setDone]      = useState(false)
  const [error,     setError]     = useState('')

  const inputStyle = {
    width: '100%',
    background: '#f0f2f5',
    border: '1px solid transparent',
    borderRadius: 8,
    padding: '0.75rem 2.6rem 0.75rem 1rem',
    fontSize: '0.875rem',
    color: '#1E293B',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
    boxSizing: 'border-box',
  }

  if (!token || !email) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '1rem' }}>
        <div style={{ textAlign: 'center', background: '#fff', padding: '2.5rem', borderRadius: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.1)' }}>
          <p style={{ color: '#ef4444', fontSize: '1rem', fontWeight: 600, marginBottom: '1.25rem' }}>
            Invalid or missing reset link.
          </p>
          <Link to="/forgot-password" style={{ color: '#eb0a1e', fontWeight: 700, fontSize: '0.875rem' }}>
            Request a new link →
          </Link>
        </div>
      </div>
    )
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password.length < 6) { setError('Password must be at least 6 characters.'); return }
    if (password !== confirm) { setError('Passwords do not match.'); return }
    setLoading(true)
    try {
      await axios.post('/api/auth/reset-password', { token, email, password })
      setDone(true)
      setTimeout(() => navigate('/login'), 3500)
    } catch (err) {
      setError(err.response?.data?.message || 'Reset failed. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f0f2f5',
      padding: '1rem',
      fontFamily: 'inherit',
    }}>
      <div style={{
        width: 'min(440px, 100%)',
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 24px 80px rgba(0,0,0,0.12)',
        padding: 'clamp(2rem,6vw,3rem)',
      }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 60, height: 60, borderRadius: '50%',
            background: GRAD,
            boxShadow: '0 6px 20px rgba(235,10,30,0.3)',
            marginBottom: '1rem',
          }}>
            <KeyRound size={26} color="#fff" />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '1.6rem', color: '#0F172A', margin: '0 0 0.4rem', letterSpacing: '-0.01em' }}>
            Set New Password
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
            Create a new password for <strong style={{ color: '#0F172A' }}>{decodeURIComponent(email)}</strong>
          </p>
        </div>

        {done ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)', marginBottom: '1.25rem',
            }}>
              <CheckCircle2 size={32} color="#10B981" />
            </div>
            <h2 style={{ fontWeight: 700, fontSize: '1.2rem', color: '#0F172A', margin: '0 0 0.6rem' }}>
              Password Updated!
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.7, margin: '0 0 0.5rem' }}>
              Your password has been changed successfully.
            </p>
            <p style={{ color: '#94A3B8', fontSize: '0.78rem' }}>Redirecting to Sign In…</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
            {/* New password */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                New Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPw ? 'text' : 'password'}
                  placeholder="At least 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#eb0a1e'; e.target.style.background = '#fff' }}
                  onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f0f2f5' }}
                  required
                />
                <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 0 }}>
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm password */}
            <div>
              <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#475569', display: 'block', marginBottom: 6 }}>
                Confirm Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showCf ? 'text' : 'password'}
                  placeholder="Repeat your new password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                  style={inputStyle}
                  onFocus={e => { e.target.style.borderColor = '#eb0a1e'; e.target.style.background = '#fff' }}
                  onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f0f2f5' }}
                  required
                />
                <button type="button" onClick={() => setShowCf(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 0 }}>
                  {showCf ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Password strength hint */}
            {password.length > 0 && (
              <div style={{ display: 'flex', gap: 4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{
                    flex: 1, height: 3, borderRadius: 4,
                    background: password.length >= i * 3
                      ? (password.length < 6 ? '#f59e0b' : password.length < 10 ? '#3b82f6' : '#10b981')
                      : '#e2e8f0',
                    transition: 'background 0.2s',
                  }} />
                ))}
              </div>
            )}

            {error && (
              <p style={{ margin: 0, fontSize: '0.78rem', color: '#ef4444', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, padding: '0.6rem 0.875rem' }}>
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                background: GRAD,
                border: 'none',
                borderRadius: 25,
                padding: '0.75rem',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.85rem',
                letterSpacing: '0.1em',
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                marginTop: '0.25rem',
                boxShadow: '0 4px 14px rgba(235,10,30,0.35)',
                transition: 'opacity 0.15s',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              UPDATE PASSWORD
            </button>

            <Link to="/login" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: '#64748B', fontSize: '0.82rem', textDecoration: 'none', marginTop: '0.25rem',
            }}
              onMouseEnter={e => e.currentTarget.style.color = '#eb0a1e'}
              onMouseLeave={e => e.currentTarget.style.color = '#64748B'}
            >
              <ArrowLeft size={14} /> Back to Sign In
            </Link>
          </form>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
