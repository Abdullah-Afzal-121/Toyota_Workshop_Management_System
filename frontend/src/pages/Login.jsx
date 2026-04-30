import { useState } from 'react'
import { useNavigate, useLocation, Navigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { GoogleLogin } from '@react-oauth/google'
import { useAuth, ROLE_HOME } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'

const GRAD = 'linear-gradient(135deg, #f5316f 0%, #eb0a1e 100%)'

export default function Login() {
  const { user, login, register, googleLogin } = useAuth()
  const { toast }  = useToast()
  const navigate   = useNavigate()
  const location   = useLocation()

  const [mode, setMode]           = useState('signin')   // 'signin' | 'signup'
  const [inForm,  setInForm]       = useState({ email: '', password: '' })
  const [upForm,  setUpForm]       = useState({ name: '', email: '', password: '' })
  const [showInPw,  setShowInPw]   = useState(false)
  const [showUpPw,  setShowUpPw]   = useState(false)
  const [loading, setLoading]      = useState(false)

  if (user) return <Navigate to={ROLE_HOME[user.role] || '/'} replace />

  const dest = location.state?.from?.pathname

  const switchMode = (m) => { setMode(m) }

  const handleSignIn = async (e) => {
    e.preventDefault()
    if (!inForm.email || !inForm.password) {
      toast.warning('Missing Fields', 'Please enter your email and password.')
      return
    }
    setLoading(true)
    try {
      const u = await login(inForm.email.trim(), inForm.password)
      toast.success('Welcome Back!', `Signed in as ${u.name}.`)
      navigate(dest || ROLE_HOME[u.role] || '/', { replace: true })
    } catch (err) {
      const serverMsg = err.response?.data?.message
      toast.error('Login Failed', serverMsg || 'Incorrect email or password.')
    } finally { setLoading(false) }
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    if (!upForm.name || !upForm.email || !upForm.password) {
      toast.warning('Missing Fields', 'Please fill in all fields.')
      return
    }
    if (upForm.password.length < 6) {
      toast.warning('Weak Password', 'Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const u = await register(upForm.name.trim(), upForm.email.trim(), upForm.password)
      toast.success('Account Created!', `Welcome, ${u.name}! You\'re now signed in.`)
      navigate(dest || ROLE_HOME[u.role] || '/', { replace: true })
    } catch (err) {
      toast.error('Registration Failed', err.response?.data?.message || 'Could not create account.')
    } finally { setLoading(false) }
  }

  const inputStyle = {
    width: '100%',
    background: '#f0f2f5',
    border: '1px solid transparent',
    borderRadius: 8,
    padding: '0.75rem 1rem',
    fontSize: '0.875rem',
    color: '#1E293B',
    outline: 'none',
    transition: 'border-color 0.15s',
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
        position: 'relative',
        overflow: 'hidden',
        width: 'min(820px, 100%)',
        minHeight: 540,
        borderRadius: 20,
        boxShadow: '0 24px 80px rgba(0,0,0,0.15)',
        background: '#fff',
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
      }}>

        {/* ── SIGN IN FORM (left half) ── */}
        <div style={{
          padding: 'clamp(2rem,5vw,3rem) clamp(1.5rem,4vw,2.75rem)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 540,
        }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#0F172A', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>Sign in</h2>

          <form onSubmit={handleSignIn} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="email"
              placeholder="Email"
              value={inForm.email}
              onChange={e => setInForm(f => ({ ...f, email: e.target.value }))}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#eb0a1e'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f0f2f5' }}
              required
            />
            <div style={{ position: 'relative' }}>
              <input
                type={showInPw ? 'text' : 'password'}
                placeholder="Password"
                value={inForm.password}
                onChange={e => setInForm(f => ({ ...f, password: e.target.value }))}
                style={{ ...inputStyle, paddingRight: '2.6rem' }}
                onFocus={e => { e.target.style.borderColor = '#eb0a1e'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f0f2f5' }}
                required
              />
              <button type="button" onClick={() => setShowInPw(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 0 }}>
                {showInPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <div style={{ textAlign: 'right' }}>
              <Link to="/forgot-password" style={{ fontSize: '0.78rem', color: '#eb0a1e', textDecoration: 'none', fontWeight: 600 }}>Forgot your password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: GRAD, border: 'none', borderRadius: 25, padding: '0.72rem', color: '#fff', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '0.25rem', boxShadow: '0 4px 14px rgba(235,10,30,0.35)', transition: 'opacity 0.15s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {loading && mode === 'signin' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              SIGN IN
            </button>
          </form>

          {/* Divider */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '1rem 0 0.75rem', width: '100%' }}>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
            <span style={{ fontSize: '0.72rem', color: '#94A3B8', flexShrink: 0 }}>or continue with</span>
            <div style={{ flex: 1, height: 1, background: '#E2E8F0' }} />
          </div>

          {/* Google Sign-In (customers only) */}
          <div style={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                try {
                  const u = await googleLogin(credentialResponse.credential)
                  toast.success('Welcome!', `Signed in as ${u.name}.`)
                  navigate(dest || ROLE_HOME[u.role] || '/', { replace: true })
                } catch (err) {
                  toast.error('Google Sign-In Failed', err.response?.data?.message || 'Could not sign in with Google.')
                }
              }}
              onError={() => toast.error('Google Sign-In Failed', 'Please try again.')}
              useOneTap={false}
              theme="outline"
              size="large"
              text="signin_with"
              shape="pill"
              width="300"
            />
          </div>

          {/* Mobile-only toggle */}
          <p className="d-md-none" style={{ marginTop: '1rem', fontSize: '0.82rem', color: '#64748B', textAlign: 'center' }}>
            No account?{' '}
            <span onClick={() => switchMode('signup')} style={{ color: '#eb0a1e', fontWeight: 700, cursor: 'pointer' }}>Sign up</span>
          </p>
        </div>

        {/* ── SIGN UP FORM (right half) ── */}
        <div style={{
          padding: 'clamp(2rem,5vw,3rem) clamp(1.5rem,4vw,2.75rem)',
          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          minHeight: 540,
        }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.75rem', color: '#0F172A', marginBottom: '1.25rem', letterSpacing: '-0.01em' }}>Create Account</h2>

          <form onSubmit={handleSignUp} style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <input
              type="text"
              placeholder="Name"
              value={upForm.name}
              onChange={e => setUpForm(f => ({ ...f, name: e.target.value }))}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#eb0a1e'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f0f2f5' }}
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={upForm.email}
              onChange={e => setUpForm(f => ({ ...f, email: e.target.value }))}
              style={inputStyle}
              onFocus={e => { e.target.style.borderColor = '#eb0a1e'; e.target.style.background = '#fff' }}
              onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f0f2f5' }}
              required
            />
            <div style={{ position: 'relative' }}>
              <input
                type={showUpPw ? 'text' : 'password'}
                placeholder="Password"
                value={upForm.password}
                onChange={e => setUpForm(f => ({ ...f, password: e.target.value }))}
                style={{ ...inputStyle, paddingRight: '2.6rem' }}
                onFocus={e => { e.target.style.borderColor = '#eb0a1e'; e.target.style.background = '#fff' }}
                onBlur={e => { e.target.style.borderColor = 'transparent'; e.target.style.background = '#f0f2f5' }}
                required
              />
              <button type="button" onClick={() => setShowUpPw(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', display: 'flex', alignItems: 'center', padding: 0 }}>
                {showUpPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{ background: GRAD, border: 'none', borderRadius: 25, padding: '0.72rem', color: '#fff', fontWeight: 700, fontSize: '0.85rem', letterSpacing: '0.1em', cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: '0.25rem', boxShadow: '0 4px 14px rgba(235,10,30,0.35)', transition: 'opacity 0.15s' }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.opacity = '0.9' }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '1' }}
            >
              {loading && mode === 'signup' ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : null}
              SIGN UP
            </button>
          </form>

          {/* Mobile-only toggle */}
          <p className="d-md-none" style={{ marginTop: '1.25rem', fontSize: '0.82rem', color: '#64748B', textAlign: 'center' }}>
            Have an account?{' '}
            <span onClick={() => switchMode('signin')} style={{ color: '#eb0a1e', fontWeight: 700, cursor: 'pointer' }}>Sign in</span>
          </p>
        </div>

        {/* ── SLIDING GRADIENT OVERLAY (desktop only) ── */}
        <div
          className="d-none d-md-flex"
          style={{
            position: 'absolute',
            top: 0,
            left: mode === 'signin' ? '50%' : '0%',
            width: '50%',
            height: '100%',
            background: GRAD,
            transition: 'left 0.65s cubic-bezier(0.65, 0, 0.35, 1)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2.5rem 2rem',
            zIndex: 10,
            textAlign: 'center',
          }}
        >
          {/* Decorative circles */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, borderRadius: '50%', background: 'rgba(255,255,255,0.1)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -80, left: -80, width: 260, height: 260, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', pointerEvents: 'none' }} />

          {mode === 'signin' ? (
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.75rem', marginBottom: '1rem', lineHeight: 1.2 }}>Hello, Friend!</h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 240 }}>
                Enter your personal details and start your journey with us
              </p>
              <button
                onClick={() => switchMode('signup')}
                style={{ border: '2px solid #fff', borderRadius: 25, padding: '0.65rem 2.75rem', background: 'transparent', color: '#fff', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.12em', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                SIGN UP
              </button>
            </div>
          ) : (
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h2 style={{ color: '#fff', fontWeight: 800, fontSize: '1.75rem', marginBottom: '1rem', lineHeight: 1.2 }}>Welcome Back!</h2>
              <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem', lineHeight: 1.7, marginBottom: '2rem', maxWidth: 240 }}>
                To keep connected with us please login with your personal info
              </p>
              <button
                onClick={() => switchMode('signin')}
                style={{ border: '2px solid #fff', borderRadius: 25, padding: '0.65rem 2.75rem', background: 'transparent', color: '#fff', fontWeight: 700, fontSize: '0.82rem', letterSpacing: '0.12em', cursor: 'pointer', transition: 'background 0.2s, color 0.2s' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent' }}
              >
                SIGN IN
              </button>
            </div>
          )}
        </div>

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  )
}
