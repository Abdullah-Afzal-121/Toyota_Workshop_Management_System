import { useEffect, useState } from 'react'
import { X, ChevronDown, ChevronUp, Send, Mail, Phone, MapPin, Clock, ArrowRight } from 'lucide-react'

const TOYOTA_RED = '#EB0A1E'

/* ─── FAQ data ──────────────────────────────────────────── */
const FAQS = [
  { q: 'How do I track my car?', a: "On the homepage, enter your vehicle registration number in the \"Track Live\" box and click the button. You'll see a real-time breakdown of every service stage — no account required." },
  { q: 'Do I need an account to track my vehicle?', a: 'No. Customers can track their vehicle using only the registration number — completely free, no sign-up needed.' },
  { q: 'What does each service stage mean?', a: "Stages are set by the workshop (e.g. Initial Inspection, Parts Replacement, Final QC). Each one shows whether it's pending, in progress, or completed, along with a time estimate." },
  { q: 'How accurate are the time estimates?', a: 'Estimates are set by the assigned mechanic and updated in real time. They reflect expected completion time for each individual stage, not the full service.' },
  { q: "I'm a mechanic — how do I log in?", a: 'Click "Workshop Portal" in the navigation bar or go to /login. Use the credentials provided by your workshop administrator.' },
  { q: "What if my registration number isn't found?", a: 'Your vehicle may not have been added to the system yet. Contact your workshop directly or visit the service desk for an update.' },
  { q: 'Can I leave feedback after my service?', a: 'Yes. Once your service is completed, a feedback form appears on your tracking page where you can rate the experience and leave a comment.' },
  { q: 'Is my data secure?', a: 'All data is stored securely in an encrypted cloud database. We never share personal vehicle or customer data with third parties.' },
]

const PRIVACY_SECTIONS = [
  { title: '1. Information We Collect', body: `We collect only the minimum information necessary:\n• Vehicle registration numbers entered for tracking\n• Account credentials (email + hashed password) for workshop staff\n• Service stage data and timestamps\n• Optional feedback ratings and comments\n\nWe do not collect personally identifiable information from customers using the public tracker.` },
  { title: '2. How We Use Your Information', body: `Information is used exclusively to:\n• Display real-time service status to the vehicle owner\n• Allow workshop staff to manage service stages\n• Generate aggregate analytics for workshop performance\n• Send optional email updates if you subscribe\n\nWe do not sell or distribute your data to third parties.` },
  { title: '3. Data Storage & Security', body: `All data is stored in a secure, encrypted cloud database (MongoDB Atlas).\n• Bcrypt password hashing for all user accounts\n• JWT-based authentication with expiring tokens\n• HTTPS encryption for all data in transit\n• Role-based access control (customer, mechanic, admin)` },
  { title: '4. Cookies', body: 'We use minimal, functional cookies only to maintain authenticated sessions for logged-in workshop users. We do not use tracking, advertising, or analytics cookies. Customers using the public tracker are not tracked via cookies.' },
  { title: '5. Your Rights', body: `You have the right to:\n• Request access to any personal data we hold\n• Request correction or deletion of your data\n• Withdraw consent for newsletter communications at any time\n\nContact us at privacy@toyotaworkshop.com to exercise these rights.` },
  { title: '6. Changes to This Policy', body: 'We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated date. Continued use of the service after changes constitutes acceptance.' },
]

const TERMS_SECTIONS = [
  { title: '1. Acceptance of Terms', body: 'By accessing or using the Toyota Workshop Service Tracker, you agree to be bound by these Terms. If you do not agree, please discontinue use immediately.' },
  { title: '2. Description of Service', body: `The Service provides:\n• A public vehicle tracking interface for customers\n• An authenticated portal for mechanics to update service stages\n• An admin panel for workshop managers\n\nThe Service is provided "as is" and may be updated or discontinued at any time.` },
  { title: '3. User Accounts', body: `Workshop staff must maintain the confidentiality of login credentials. You agree not to:\n• Share credentials with unauthorised individuals\n• Use another user's account without permission\n• Attempt to access admin functionality without authorisation` },
  { title: '4. Acceptable Use', body: `You agree not to:\n• Provide false registration numbers or misleading information\n• Attempt to gain unauthorised access to protected routes\n• Use automated bots or scripts to scrape the application\n• Engage in any activity that violates applicable laws` },
  { title: '5. Limitation of Liability', body: `To the fullest extent permitted by law, we shall not be liable for:\n• Inaccurate service time estimates\n• Service delays or vehicle damage at the workshop\n• Data loss due to cloud outages or circumstances beyond our control\n• Any indirect or consequential damages` },
  { title: '6. Governing Law', body: 'These Terms shall be governed by the laws of Malaysia. Any disputes shall be subject to the exclusive jurisdiction of courts in Kuala Lumpur.' },
]

const INFO_CARDS = [
  { icon: Mail,    color: '#2563EB', bg: '#EFF6FF', title: 'Email Us',   detail: 'support@toyotaworkshop.com', sub: 'We reply within 24 hours' },
  { icon: Phone,   color: '#16A34A', bg: '#F0FDF4', title: 'Call Us',    detail: '+60 3-1234 5678',             sub: 'Mon – Fri, 8 AM – 6 PM' },
  { icon: MapPin,  color: TOYOTA_RED,bg: '#FFF0F1', title: 'Visit Us',   detail: '25 Jalan Workshop, KL',       sub: 'Toyota Authorised Centre' },
  { icon: Clock,   color: '#D97706', bg: '#FFFBEB', title: 'Hours',      detail: 'Mon – Sat: 8 AM – 6 PM',      sub: 'Closed Sundays & PH' },
]

/* ─── Sub-components ─────────────────────────────────────── */
function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ background: '#F8FAFC', borderRadius: 10, border: '1px solid #E2E8F0', overflow: 'hidden', marginBottom: 8 }}>
      <button onClick={() => setOpen(v => !v)} style={{ width: '100%', background: 'none', border: 'none', padding: '0.95rem 1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, cursor: 'pointer', textAlign: 'left' }}>
        <span style={{ fontSize: '0.9rem', fontWeight: 600, color: '#1E293B', lineHeight: 1.5 }}>{q}</span>
        <span style={{ flexShrink: 0, color: open ? TOYOTA_RED : '#94A3B8' }}>{open ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}</span>
      </button>
      {open && <div style={{ padding: '0 1.2rem 0.95rem', fontSize: '0.85rem', color: '#475569', lineHeight: 1.75, borderTop: '1px solid #E2E8F0', paddingTop: '0.75rem' }}>{a}</div>}
    </div>
  )
}

function Section({ title, body }) {
  return (
    <div style={{ marginBottom: '1.25rem' }}>
      <h3 style={{ fontWeight: 700, fontSize: '0.95rem', color: '#0F172A', marginBottom: '0.5rem' }}>{title}</h3>
      <p style={{ fontSize: '0.85rem', color: '#475569', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{body}</p>
    </div>
  )
}

/* ─── TABS ───────────────────────────────────────────────── */
const TABS = ['FAQ', 'Contact Us', 'Privacy Policy', 'Terms of Service']

export default function SupportModal({ which, onClose }) {
  const initialTab = which === 'faq' ? 'FAQ' : which === 'contact' ? 'Contact Us' : which === 'privacy' ? 'Privacy Policy' : 'Terms of Service'
  const [activeTab, setActiveTab] = useState(initialTab)

  // contact form state
  const [form,  setForm]  = useState({ name: '', email: '', subject: '', message: '' })
  const [sent,  setSent]  = useState(false)

  // Sync tab when `which` changes (e.g. user closes and re-opens to a different link)
  useEffect(() => { setActiveTab(initialTab) }, [which])

  // Lock body scroll while open
  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    /* Backdrop */
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, zIndex: 2000, background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '1rem' }}
    >
      {/* Sheet */}
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: '16px 16px 12px 12px',
          width: '100%', maxWidth: 740,
          maxHeight: '90vh', display: 'flex', flexDirection: 'column',
          boxShadow: '0 -8px 48px rgba(0,0,0,0.18)',
          animation: 'slideUp 0.28s ease-out',
        }}
      >
        {/* Handle bar */}
        <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0 0' }}>
          <div style={{ width: 40, height: 4, borderRadius: 99, background: '#E2E8F0' }} />
        </div>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.75rem 1.5rem 0' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: TOYOTA_RED, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Support</span>
          <button onClick={onClose} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={16} color="#475569" />
          </button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 4, padding: '0.75rem 1.5rem', overflowX: 'auto', borderBottom: '1px solid #F1F5F9' }}>
          {TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? TOYOTA_RED : '#F4F7FE',
                color: activeTab === tab ? '#fff' : '#475569',
                border: 'none', borderRadius: 8,
                padding: '0.45rem 1rem', fontSize: '0.8rem', fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap', transition: 'all 0.15s',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Scrollable body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>

          {/* ── FAQ ── */}
          {activeTab === 'FAQ' && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A', marginBottom: '1.25rem' }}>Frequently Asked Questions</h2>
              {FAQS.map((item, i) => <FAQItem key={i} {...item} />)}
              <div style={{ marginTop: '1.5rem', background: '#FFF0F1', borderRadius: 12, padding: '1rem 1.25rem', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8, border: '1px solid rgba(235,10,30,0.15)' }}>
                <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>Still have questions?</span>
                <button onClick={() => setActiveTab('Contact Us')} style={{ background: TOYOTA_RED, border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Contact Us</button>
              </div>
            </div>
          )}

          {/* ── Contact Us ── */}
          {activeTab === 'Contact Us' && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A', marginBottom: '1.25rem' }}>Contact Us</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px,1fr))', gap: '0.75rem', marginBottom: '1.5rem' }}>
                {INFO_CARDS.map(({ icon: Icon, color, bg, title, detail, sub }) => (
                  <div key={title} style={{ background: '#F8FAFC', borderRadius: 12, padding: '1rem', border: '1px solid #E2E8F0' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 9, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.7rem' }}>
                      <Icon size={17} color={color} />
                    </div>
                    <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.8rem', marginBottom: 3 }}>{title}</div>
                    <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.8rem' }}>{detail}</div>
                    <div style={{ fontSize: '0.7rem', color: '#94A3B8', marginTop: 2 }}>{sub}</div>
                  </div>
                ))}
              </div>

              {sent ? (
                <div style={{ textAlign: 'center', padding: '2rem', background: '#F0FDF4', borderRadius: 12, border: '1px solid #BBF7D0' }}>
                  <div style={{ fontSize: '2rem', marginBottom: 8 }}>✓</div>
                  <div style={{ fontWeight: 800, color: '#15803D', marginBottom: 6 }}>Message Sent!</div>
                  <div style={{ fontSize: '0.85rem', color: '#166534' }}>We'll get back to you within 24 hours.</div>
                  <button onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }} style={{ marginTop: '1rem', background: TOYOTA_RED, border: 'none', borderRadius: 8, padding: '0.5rem 1.2rem', color: '#fff', fontWeight: 700, fontSize: '0.85rem', cursor: 'pointer' }}>Send Another</button>
                </div>
              ) : (
                <form onSubmit={e => { e.preventDefault(); if (form.name && form.email && form.message) setSent(true) }} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <div className="row g-2">
                    <div className="col-sm-6">
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Full Name *</label>
                      <input name="name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="John Doe" required className="tw-input w-100" />
                    </div>
                    <div className="col-sm-6">
                      <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Email Address *</label>
                      <input type="email" name="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required className="tw-input w-100" />
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Subject</label>
                    <input name="subject" value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Stage not updating" className="tw-input w-100" />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Message *</label>
                    <textarea name="message" value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Describe your question..." required rows={4} className="tw-input w-100" style={{ resize: 'vertical' }} />
                  </div>
                  <button type="submit" style={{ background: TOYOTA_RED, border: 'none', borderRadius: 9, padding: '0.65rem', fontSize: '0.9rem', fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
                    <Send size={14} /> Send Message
                  </button>
                </form>
              )}
            </div>
          )}

          {/* ── Privacy Policy ── */}
          {activeTab === 'Privacy Policy' && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A', marginBottom: 4 }}>Privacy Policy</h2>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '1.25rem' }}>Last revised: March 2026</p>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                Toyota Workshop Service Tracker is committed to protecting your privacy. This policy explains what information we collect, how we use it, and your rights.
              </p>
              {PRIVACY_SECTIONS.map((s, i) => <Section key={i} {...s} />)}
              <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: '#FFF0F1', borderRadius: 12, border: '1px solid rgba(235,10,30,0.15)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: '0.85rem', color: '#374151' }}>Questions about this policy?</span>
                <a href="mailto:privacy@toyotaworkshop.com" style={{ fontSize: '0.85rem', fontWeight: 700, color: TOYOTA_RED, textDecoration: 'none' }}>privacy@toyotaworkshop.com</a>
              </div>
            </div>
          )}

          {/* ── Terms of Service ── */}
          {activeTab === 'Terms of Service' && (
            <div>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A', marginBottom: 4 }}>Terms of Service</h2>
              <p style={{ fontSize: '0.75rem', color: '#94A3B8', marginBottom: '1.25rem' }}>Effective date: March 2026</p>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.75, marginBottom: '1.5rem' }}>
                Please read these Terms carefully before using the Toyota Workshop Service Tracker. By using the platform, you agree to be bound by these terms.
              </p>
              {TERMS_SECTIONS.map((s, i) => <Section key={i} {...s} />)}
              <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: '#FFF0F1', borderRadius: 12, border: '1px solid rgba(235,10,30,0.15)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ fontSize: '0.85rem', color: '#374151' }}>Questions about these terms?</span>
                <a href="mailto:legal@toyotaworkshop.com" style={{ fontSize: '0.85rem', fontWeight: 700, color: TOYOTA_RED, textDecoration: 'none' }}>legal@toyotaworkshop.com</a>
              </div>
            </div>
          )}

        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { transform: translateY(40px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
      `}</style>
    </div>
  )
}
