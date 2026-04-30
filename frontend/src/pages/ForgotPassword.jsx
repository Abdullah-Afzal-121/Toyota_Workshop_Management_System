import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import axios from 'axios'

const GRAD = 'linear-gradient(135deg, #f5316f 0%, #eb0a1e 100%)'

export default function ForgotPassword() {
  const [email,   setEmail]   = useState('')
  const [loading, setLoading] = useState(false)
  const [sent,    setSent]    = useState(false)
  const [error,   setError]   = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!email.trim()) { setError('Please enter your email address.'); return }
    setLoading(true)
    try {
      await axios.post('/api/auth/forgot-password', { email: email.trim() })
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = {
    width: '100%',
    background: '#f0f2f5',
    border: '1px solid transparent',
    borderRadius: 8,
    padding: '0.75rem 1rem 0.75rem 2.8rem',
    fontSize: '0.875rem',
    color: '#1E293B',
    outline: 'none',
    transition: 'border-color 0.15s, background 0.15s',
    boxSizing: 'border-box',
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
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 60,
            height: 60,
            borderRadius: '50%',
            background: GRAD,
            boxShadow: '0 6px 20px rgba(235,10,30,0.3)',
            marginBottom: '1rem',
          }}>
            <Mail size={26} color="#fff" />
          </div>
          <h1 style={{ fontWeight: 800, fontSize: '1.6rem', color: '#0F172A', margin: '0 0 0.4rem', letterSpacing: '-0.01em' }}>
            Forgot Password?
          </h1>
          <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.6, margin: 0 }}>
            No worries! Enter your email and we'll send you a reset link.
          </p>
        </div>

        {sent ? (
          /* ── Success state ── */
          <div style={{ textAlign: 'center' }}>
            <div style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 64, height: 64, borderRadius: '50%',
              background: 'rgba(16,185,129,0.1)', marginBottom: '1.25rem',
            }}>
              <CheckCircle2 size={32} color="#10B981" />
            </div>
            <h2 style={{ fontWeight: 700, fontSize: '1.2rem', color: '#0F172A', margin: '0 0 0.6rem' }}>
              Check your inbox!
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.875rem', lineHeight: 1.7, margin: '0 0 1.75rem' }}>
              We sent a password reset link to <strong style={{ color: '#0F172A' }}>{email}</strong>.
              The link expires in <strong>1 hour</strong>.
            </p>
            <p style={{ color: '#94A3B8', fontSize: '0.78rem', marginBottom: '1.5rem' }}>
              Didn't receive it? Check your spam folder or{' '}
              <span
                onClick={() => { setSent(false); setEmail('') }}
                style={{ color: '#eb0a1e', cursor: 'pointer', fontWeight: 600 }}
              >
                try again
              </span>.
            </p>
            <Link to="/login" style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              color: '#eb0a1e', fontSize: '0.85rem', fontWeight: 700, textDecoration: 'none',
            }}>
              <ArrowLeft size={15} /> Back to Sign In
            </Link>
          </div>
        ) : (
          /* ── Form state ── */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Email field */}
            <div style={{ position: 'relative' }}>
              <Mail
                size={16}
                style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }}
              />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={inputStyle}
                onFocus={e => { e.target.style.borderColor = '#eb0a1e'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f0f2f5' }}
                required
              />
            </div>

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
                boxShadow: '0 4px 14px rgba(235,10,30,0.35)',
                transition: 'opacity 0.15s',
                opacity: loading ? 0.75 : 1,
              }}
            >
              {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              SEND RESET LINK
            </button>

            <Link to="/login" style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              color: '#64748B', fontSize: '0.82rem', textDecoration: 'none', marginTop: '0.25rem',
              transition: 'color 0.15s',
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
