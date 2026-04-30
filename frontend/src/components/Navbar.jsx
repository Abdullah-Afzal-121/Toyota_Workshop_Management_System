import { useState, useEffect } from 'react'
import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { Car, Menu, X, ArrowRight } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const TOYOTA_RED = '#EB0A1E'

const NAV_LINKS = [
  { label: 'Home',         to: '/',      anchor: null      },
  { label: 'Track My Car', to: '/login', anchor: null      },
  { label: 'About',        to: '/',      anchor: 'about'   },
  { label: 'Service',      to: '/',      anchor: 'service' },
]

export default function Navbar() {
  const navigate  = useNavigate()
  const location  = useLocation()
  const { user, logout } = useAuth()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [scrolled,   setScrolled]   = useState(false)

  const handleSignIn = () => {
    if (user) logout()
    navigate('/login')
  }

  const scrollTo = (anchor) => {
    if (location.pathname === '/') {
      document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' })
    } else {
      navigate('/')
      setTimeout(() => document.getElementById(anchor)?.scrollIntoView({ behavior: 'smooth' }), 350)
    }
  }

  const handleLogoClick = (e) => {
    if (location.pathname === '/') {
      e.preventDefault()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close drawer on resize to desktop
  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <>
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 1050,
          background: scrolled ? 'rgba(255,255,255,0.88)' : 'rgba(255,255,255,0.98)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: `1px solid ${scrolled ? '#E2E8F0' : '#F1F5F9'}`,
          boxShadow: scrolled ? '0 2px 16px rgba(0,0,0,0.07)' : 'none',
          transition: 'all 0.25s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            padding: '0 1.5rem',
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
          }}
        >
          {/* ── Logo ── */}
          <NavLink to="/" onClick={handleLogoClick} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/toyota-logo.png" alt="Toyota" style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, boxShadow: '0 2px 8px rgba(235,10,30,0.35)' }} />
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>
                Toyota Workshop
              </div>
              <div style={{ fontSize: '0.62rem', color: '#94A3B8', lineHeight: 1, fontWeight: 500 }}>
                Service Tracker
              </div>
            </div>
          </NavLink>

          {/* ── Desktop nav links ── */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: 2 }} className="d-none d-md-flex">
            {NAV_LINKS.map(({ label, to, anchor }) => (
              anchor ? (
                <button
                  key={label}
                  onClick={() => scrollTo(anchor)}
                  style={{ padding: '0.45rem 0.9rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, color: '#475569', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.15s' }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.background = '#F4F7FE' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent' }}
                >
                  {label}
                </button>
              ) : (
                <NavLink
                  key={label}
                  to={to}
                  style={({ isActive }) => ({ padding: '0.45rem 0.9rem', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, color: isActive && to === '/' ? TOYOTA_RED : '#475569', textDecoration: 'none', transition: 'all 0.15s', background: 'transparent' })}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#0F172A'; e.currentTarget.style.background = '#F4F7FE' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#475569'; e.currentTarget.style.background = 'transparent' }}
                >
                  {label}
                </NavLink>
              )
            ))}
          </nav>

          {/* ── Desktop CTAs ── */}
          <div className="d-none d-md-flex align-items-center gap-2">
            <button
              onClick={() => handleSignIn()}
              style={{
                background: 'transparent',
                border: '1.5px solid #E2E8F0',
                borderRadius: 8,
                padding: '0.45rem 1.1rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#374151',
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#CBD5E1'; e.currentTarget.style.background = '#F8FAFC' }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#E2E8F0'; e.currentTarget.style.background = 'transparent' }}
            >
              Sign In
            </button>
            <button
              onClick={() => handleSignIn()}
              style={{
                background: TOYOTA_RED,
                border: 'none',
                borderRadius: 8,
                padding: '0.45rem 1.1rem',
                fontSize: '0.875rem',
                fontWeight: 700,
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(235,10,30,0.3)',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = '#C4081A'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(235,10,30,0.4)' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = TOYOTA_RED; e.currentTarget.style.boxShadow = '0 2px 8px rgba(235,10,30,0.3)' }}
            >
              Get Started <ArrowRight size={14} />
            </button>
          </div>

          {/* ── Mobile hamburger ── */}
          <button
            className="d-md-none"
            onClick={() => setMobileOpen((v) => !v)}
            style={{
              background: 'none', border: '1.5px solid #E2E8F0',
              borderRadius: 8, padding: '6px 8px',
              cursor: 'pointer', display: 'flex', alignItems: 'center',
            }}
          >
            {mobileOpen ? <X size={20} color="#374151" /> : <Menu size={20} color="#374151" />}
          </button>
        </div>
      </header>

      {/* ── Mobile drawer ── */}
      {mobileOpen && (
        <div
          style={{
            position: 'fixed', top: 64, left: 0, right: 0,
            background: '#fff',
            borderBottom: '1px solid #E2E8F0',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            zIndex: 1049,
            padding: '1rem 1.5rem 1.25rem',
            display: 'flex', flexDirection: 'column', gap: 4,
          }}
        >
          {NAV_LINKS.map(({ label, to, anchor }) => (
            anchor ? (
              <button
                key={label}
                onClick={() => { scrollTo(anchor); setMobileOpen(false) }}
                style={{ padding: '0.65rem 0.9rem', borderRadius: 8, fontSize: '0.95rem', fontWeight: 500, color: '#374151', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left', width: '100%' }}
              >
                {label}
              </button>
            ) : (
              <NavLink
                key={label}
                to={to}
                onClick={() => setMobileOpen(false)}
                style={{ padding: '0.65rem 0.9rem', borderRadius: 8, fontSize: '0.95rem', fontWeight: 500, color: '#374151', textDecoration: 'none', display: 'block' }}
              >
                {label}
              </NavLink>
            )
          ))}
          <div style={{ borderTop: '1px solid #F1F5F9', marginTop: 8, paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button
              onClick={() => { handleSignIn(); setMobileOpen(false) }}
              style={{
                background: 'transparent', border: '1.5px solid #E2E8F0',
                borderRadius: 8, padding: '0.6rem', fontSize: '0.9rem',
                fontWeight: 600, color: '#374151', cursor: 'pointer', width: '100%',
              }}
            >
              Sign In
            </button>
            <button
              onClick={() => { handleSignIn(); setMobileOpen(false) }}
              style={{
                background: TOYOTA_RED, border: 'none',
                borderRadius: 8, padding: '0.6rem', fontSize: '0.9rem',
                fontWeight: 700, color: '#fff', cursor: 'pointer', width: '100%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
              }}
            >
              Get Started <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Overlay to close drawer */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed', inset: 0, zIndex: 1048,
            background: 'rgba(0,0,0,0.15)',
          }}
        />
      )}
    </>
  )
}
