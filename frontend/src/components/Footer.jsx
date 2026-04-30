import { useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Car, Mail, ArrowRight, Github } from 'lucide-react'
import SupportModal from './SupportModal'

const TOYOTA_RED = '#EB0A1E'

const QUICK_LINKS = [
  { label: 'Home',             to: '/' },
  { label: 'Track My Car',     to: '/login' },
  { label: 'Workshop Portal',  to: '/login' },
  { label: 'Mechanic Panel',   to: '/login' },
]

const SUPPORT_LINKS = [
  { label: 'FAQ',              modal: 'faq'     },
  { label: 'Contact Us',       modal: 'contact' },
  { label: 'Privacy Policy',   modal: 'privacy' },
  { label: 'Terms of Service', modal: 'terms'   },
]

export default function Footer() {
  const navigate    = useNavigate()
  const [email,     setEmail]    = useState('')
  const [subDone,   setSubDone]  = useState(false)
  const [openModal, setOpenModal] = useState(null)  // 'faq' | 'contact' | 'privacy' | 'terms'

  const handleSubscribe = (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setSubDone(true)
    setEmail('')
  }

  return (
    <>
    <footer
      style={{
        background: '#0F172A',
        color: '#94A3B8',
        marginTop: 'auto',
      }}
    >
      {/* ── Main columns ── */}
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '4rem 1.5rem 2.5rem',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
          gap: '2.5rem',
        }}
      >
        {/* ── Col 1: Brand ── */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: '1rem' }}>
            <img src="/toyota-logo.png" alt="Toyota" style={{ width: 42, height: 42, borderRadius: 10, boxShadow: '0 2px 8px rgba(235,10,30,0.4)', flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#F1F5F9', lineHeight: 1.2 }}>
                Toyota Workshop
              </div>
              <div style={{ fontSize: '0.62rem', color: '#64748B', lineHeight: 1 }}>Service Tracker</div>
            </div>
          </div>
          <p style={{ fontSize: '0.83rem', lineHeight: 1.75, color: '#64748B', maxWidth: 240 }}>
            Real-time workshop transparency for customers and technicians.
            Know every stage — no waiting, no phone calls.
          </p>
          {/* Social */}
          <div style={{ display: 'flex', gap: 8, marginTop: '1.25rem' }}>
            {[Github, Mail].map((Icon, i) => (
              <button
                key={i}
                style={{
                  width: 34, height: 34, borderRadius: 8,
                  background: '#1E293B', border: '1px solid #334155',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = TOYOTA_RED; e.currentTarget.style.borderColor = TOYOTA_RED }}
                onMouseLeave={(e) => { e.currentTarget.style.background = '#1E293B'; e.currentTarget.style.borderColor = '#334155' }}
              >
                <Icon size={15} color="#94A3B8" />
              </button>
            ))}
          </div>
        </div>

        {/* ── Col 2: Quick Links ── */}
        <div>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.1rem' }}>
            Quick Links
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {QUICK_LINKS.map(({ label, to }) => (
              <li key={label}>
                <button
                  onClick={() => navigate(to)}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    fontSize: '0.875rem', color: '#64748B', cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#F1F5F9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B' }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Col 3: Support ── */}
        <div>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.1rem' }}>
            Support
          </h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SUPPORT_LINKS.map(({ label, modal }) => (
              <li key={label}>
                <button
                  onClick={() => setOpenModal(modal)}
                  style={{
                    background: 'none', border: 'none', padding: 0,
                    fontSize: '0.875rem', color: '#64748B', cursor: 'pointer',
                    transition: 'color 0.15s',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = '#F1F5F9' }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = '#64748B' }}
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* ── Col 4: Newsletter ── */}
        <div>
          <h4 style={{ fontSize: '0.78rem', fontWeight: 700, color: '#F1F5F9', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
            Stay Updated
          </h4>
          <p style={{ fontSize: '0.83rem', color: '#64748B', lineHeight: 1.6, marginBottom: '1rem' }}>
            Get workshop updates and product news delivered to your inbox.
          </p>
          {subDone ? (
            <div
              style={{
                padding: '0.75rem 1rem',
                background: '#052e16',
                border: '1px solid #166534',
                borderRadius: 10,
                color: '#86efac',
                fontSize: '0.83rem',
                fontWeight: 600,
              }}
            >
              ✓ Thanks! You're subscribed.
            </div>
          ) : (
            <form onSubmit={handleSubscribe} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                style={{
                  background: '#1E293B',
                  border: '1px solid #334155',
                  borderRadius: 9,
                  padding: '0.6rem 0.9rem',
                  fontSize: '0.875rem',
                  color: '#F1F5F9',
                  outline: 'none',
                  width: '100%',
                  transition: 'border-color 0.15s',
                }}
                onFocus={(e) => { e.target.style.borderColor = TOYOTA_RED }}
                onBlur={(e) => { e.target.style.borderColor = '#334155' }}
              />
              <button
                type="submit"
                style={{
                  background: TOYOTA_RED,
                  border: 'none', borderRadius: 9,
                  padding: '0.6rem',
                  fontSize: '0.875rem', fontWeight: 700,
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#C4081A' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = TOYOTA_RED }}
              >
                Subscribe <ArrowRight size={14} />
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div
        style={{
          borderTop: '1px solid #1E293B',
          maxWidth: 1200,
          margin: '0 auto',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <span style={{ fontSize: '0.8rem', color: '#475569' }}>
          © {new Date().getFullYear()} Toyota Workshop Tracker. All rights reserved.
        </span>
        <span style={{ fontSize: '0.8rem', color: '#334155' }}>
          Built for modern workshops
        </span>
      </div>
    </footer>

    {/* Support modal — rendered in-page, no navigation */}
    {openModal && <SupportModal which={openModal} onClose={() => setOpenModal(null)} />}
    </>
  )
}
