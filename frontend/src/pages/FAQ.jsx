import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TOYOTA_RED = '#EB0A1E'

const FAQS = [
  {
    q: 'How do I track my car?',
    a: 'On the homepage, enter your vehicle registration number in the "Track Live" box and click the button. You\'ll see a real-time breakdown of every service stage — no account required.',
  },
  {
    q: 'Do I need an account to track my vehicle?',
    a: 'No. Customers can track their vehicle using only the registration number — completely free, no sign-up needed.',
  },
  {
    q: 'What does each service stage mean?',
    a: 'Stages are set by the workshop (e.g. Initial Inspection, Parts Replacement, Final QC). Each one shows whether it\'s pending, in progress, or completed, along with a time estimate.',
  },
  {
    q: 'How accurate are the time estimates?',
    a: 'Estimates are set by the assigned mechanic and updated in real time. They reflect expected completion time for each individual stage, not the full service.',
  },
  {
    q: 'I\'m a mechanic — how do I log in?',
    a: 'Click "Workshop Portal" in the navigation bar or go to /login. Use the credentials provided by your workshop administrator.',
  },
  {
    q: 'What if my registration number isn\'t found?',
    a: 'Your vehicle may not have been added to the system yet. Contact your workshop directly or visit the service desk for an update.',
  },
  {
    q: 'Can I leave feedback after my service?',
    a: 'Yes. Once your service is completed, a feedback form appears on your tracking page where you can rate the experience and leave a comment.',
  },
  {
    q: 'Is my data secure?',
    a: 'All data is stored securely in an encrypted cloud database. We never share personal vehicle or customer data with third parties.',
  },
]

function FAQItem({ q, a }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        transition: 'box-shadow 0.15s',
        boxShadow: open ? '0 4px 20px rgba(0,0,0,0.07)' : '0 1px 3px rgba(0,0,0,0.04)',
      }}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          width: '100%', background: 'none', border: 'none',
          padding: '1.1rem 1.4rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16,
          cursor: 'pointer', textAlign: 'left',
        }}
      >
        <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#1E293B', lineHeight: 1.5 }}>{q}</span>
        <span style={{ flexShrink: 0, color: open ? TOYOTA_RED : '#94A3B8', transition: 'color 0.15s' }}>
          {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </span>
      </button>
      {open && (
        <div style={{ padding: '0 1.4rem 1.1rem', fontSize: '0.875rem', color: '#475569', lineHeight: 1.75, borderTop: '1px solid #F1F5F9' }}>
          <div style={{ paddingTop: '0.8rem' }}>{a}</div>
        </div>
      )}
    </div>
  )
}

export default function FAQ() {
  return (
    <div style={{ background: '#F4F7FE', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 740, margin: '0 auto', width: '100%', padding: '3.5rem 1.5rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: TOYOTA_RED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
            Help Centre
          </span>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', color: '#0F172A', marginBottom: 10 }}>
            Frequently Asked Questions
          </h1>
          <p style={{ color: '#64748B', maxWidth: 480, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Everything you need to know about the Toyota Chenab Motors Service Tracker.
          </p>
        </div>

        {/* Accordion */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {FAQS.map((item, i) => <FAQItem key={i} {...item} />)}
        </div>

        {/* Still have questions */}
        <div
          style={{
            marginTop: '2.5rem', background: '#fff',
            borderRadius: 14, padding: '1.5rem 1.75rem',
            border: '1px solid #E2E8F0',
            display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem',
          }}
        >
          <div>
            <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: 4 }}>Still have questions?</div>
            <div style={{ fontSize: '0.875rem', color: '#64748B' }}>Our team is happy to help you directly.</div>
          </div>
          <a
            href="mailto:support@toyotachenabmotors.com"
            style={{
              background: TOYOTA_RED, color: '#fff',
              padding: '0.6rem 1.4rem', borderRadius: 9,
              fontSize: '0.875rem', fontWeight: 700, textDecoration: 'none',
            }}
          >
            Contact Us
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}
