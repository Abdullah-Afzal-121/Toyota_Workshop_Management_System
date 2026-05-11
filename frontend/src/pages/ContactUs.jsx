import { useState } from 'react'
import { Mail, Phone, MapPin, Clock, Send } from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TOYOTA_RED = '#EB0A1E'

const INFO_CARDS = [
  {
    icon: Mail,    color: '#2563EB', bg: '#EFF6FF',
    title: 'Email Us',
    detail: 'support@toyotachenabmotors.com',
    sub: 'We reply within 24 hours',
  },
  {
    icon: Phone,   color: '#16A34A', bg: '#F0FDF4',
    title: 'Call Us',
    detail: '+60 3-1234 5678',
    sub: 'Mon – Fri, 8 AM – 6 PM',
  },
  {
    icon: MapPin,  color: TOYOTA_RED, bg: '#FFF0F1',
    title: 'Visit Us',
    detail: '25 Jalan Workshop, KL',
    sub: 'Toyota Authorised Service Centre',
  },
  {
    icon: Clock,   color: '#D97706', bg: '#FFFBEB',
    title: 'Hours',
    detail: 'Mon – Sat: 8 AM – 6 PM',
    sub: 'Closed on Sundays & Public Holidays',
  },
]

export default function ContactUs() {
  const [form,    setForm]    = useState({ name: '', email: '', subject: '', message: '' })
  const [sent,    setSent]    = useState(false)

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.name || !form.email || !form.message) return
    setSent(true)
  }

  return (
    <div style={{ background: '#F4F7FE', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 1100, margin: '0 auto', width: '100%', padding: '3.5rem 1.5rem' }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.75rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: TOYOTA_RED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
            Get In Touch
          </span>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', color: '#0F172A', marginBottom: 10 }}>
            Contact Us
          </h1>
          <p style={{ color: '#64748B', maxWidth: 480, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.7 }}>
            Have a question, complaint, or just want to say hello? We're here for you.
          </p>
        </div>

        {/* Info cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
            gap: '1rem',
            marginBottom: '2.5rem',
          }}
        >
          {INFO_CARDS.map(({ icon: Icon, color, bg, title, detail, sub }) => (
            <div key={title} style={{ background: '#fff', borderRadius: 14, padding: '1.25rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)' }}>
              <div style={{ width: 42, height: 42, borderRadius: 10, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0.85rem' }}>
                <Icon size={19} color={color} />
              </div>
              <div style={{ fontWeight: 700, color: '#1E293B', fontSize: '0.875rem', marginBottom: 4 }}>{title}</div>
              <div style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.875rem' }}>{detail}</div>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', marginTop: 3 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Contact form */}
        <div style={{ background: '#fff', borderRadius: 16, padding: 'clamp(1.5rem, 4vw, 2.5rem)', border: '1px solid #E2E8F0', boxShadow: '0 1px 4px rgba(0,0,0,0.05)', maxWidth: 680, margin: '0 auto' }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
              <div style={{ width: 56, height: 56, background: '#F0FDF4', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
                <Send size={24} color="#16A34A" />
              </div>
              <h3 style={{ fontWeight: 800, color: '#1E293B', marginBottom: 8 }}>Message Sent!</h3>
              <p style={{ color: '#64748B', fontSize: '0.9rem' }}>Thanks for reaching out. We'll get back to you within 24 hours.</p>
              <button
                onClick={() => { setSent(false); setForm({ name: '', email: '', subject: '', message: '' }) }}
                style={{ marginTop: '1.25rem', background: TOYOTA_RED, border: 'none', borderRadius: 9, padding: '0.6rem 1.5rem', color: '#fff', fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer' }}
              >
                Send Another
              </button>
            </div>
          ) : (
            <>
              <h2 style={{ fontWeight: 800, fontSize: '1.15rem', color: '#0F172A', marginBottom: '1.5rem' }}>Send a Message</h2>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div className="row g-3">
                  <div className="col-sm-6">
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Full Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} placeholder="John Doe" required className="tw-input w-100" />
                  </div>
                  <div className="col-sm-6">
                    <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Email Address *</label>
                    <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="john@example.com" required className="tw-input w-100" />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Subject</label>
                  <input name="subject" value={form.subject} onChange={handleChange} placeholder="e.g. Service stage not updating" className="tw-input w-100" />
                </div>
                <div>
                  <label style={{ fontSize: '0.78rem', fontWeight: 600, color: '#374151', display: 'block', marginBottom: 5 }}>Message *</label>
                  <textarea
                    name="message" value={form.message} onChange={handleChange}
                    placeholder="Describe your issue or question..." required
                    rows={5}
                    style={{ width: '100%', resize: 'vertical', minHeight: 110 }}
                    className="tw-input"
                  />
                </div>
                <button
                  type="submit"
                  style={{ background: TOYOTA_RED, border: 'none', borderRadius: 9, padding: '0.7rem', fontSize: '0.9rem', fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#C4081A' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = TOYOTA_RED }}
                >
                  <Send size={15} /> Send Message
                </button>
              </form>
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
