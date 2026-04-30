import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  Car, ArrowRight, PlayCircle, ShieldCheck, Zap, BarChart2,
  CheckCircle2, Clock, Search, Star,
} from 'lucide-react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TOYOTA_RED = '#EB0A1E'

const HERO_STATS = [
  { value: '2,400+', label: 'Cars Serviced',      sub: 'This month' },
  { value: '99.2%',  label: 'Satisfaction Rate',  sub: 'Customer reviews' },
  { value: '< 2 min', label: 'Live Update Speed', sub: 'Real-time tracking' },
]

const FEATURES = [
  {
    icon: Search,     color: '#2563EB', bg: '#EFF6FF',
    title: 'Live Tracking',
    desc: 'Know exactly where your car is in the service pipeline — no waiting, no guessing.',
  },
  {
    icon: Zap,        color: '#D97706', bg: '#FFFBEB',
    title: 'Instant Notifications',
    desc: 'Get notified the moment your vehicle moves to a new stage or is ready for collection.',
  },
  {
    icon: ShieldCheck, color: '#16A34A', bg: '#F0FDF4',
    title: 'Secure & Reliable',
    desc: 'End-to-end encrypted records for every service, stored securely in the cloud.',
  },
  {
    icon: BarChart2,  color: '#9333EA', bg: '#FAF5FF',
    title: 'Analytics Dashboard',
    desc: 'Deep operational insights for workshop managers — throughput, SLA, and more.',
  },
]

const fadeUp = {
  hidden:  { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.55, ease: 'easeOut' } },
}

const slideRight = {
  hidden:  { opacity: 0, x: 60 },
  visible: { opacity: 1, x: 0,  transition: { duration: 0.65, ease: 'easeOut' } },
}

const staggerContainer = {
  hidden:  {},
  visible: { transition: { staggerChildren: 0.12 } },
}

export default function Home() {
  const navigate = useNavigate()
  const [regInput, setRegInput] = useState('')

  const handleTrack = (e) => {
    e.preventDefault()
    const trimmed = regInput.trim().toUpperCase()
    if (!trimmed) return
    navigate(`/track?reg=${trimmed}`)
  }

  return (
    <div style={{ background: '#F4F7FE', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>

      <Navbar />

      {/* HERO */}
      <section style={{ padding: 'clamp(3rem,6vw,5rem) 1.5rem clamp(2rem,4vw,3.5rem)', maxWidth: 1200, margin: '0 auto', width: '100%' }}>
        <div className="row align-items-center g-5">

          {/* Left */}
          <div className="col-lg-5">
            <motion.div variants={fadeUp} initial="hidden" animate="visible">
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: '#FFF0F1', color: TOYOTA_RED, padding: '5px 14px', borderRadius: 999, fontSize: '0.74rem', fontWeight: 700, marginBottom: '1.1rem', border: '1px solid rgba(235,10,30,0.15)' }}>
                <span style={{ width: 7, height: 7, background: TOYOTA_RED, borderRadius: '50%', display: 'inline-block', animation: 'pulse 2s infinite' }} />
                Live Workshop Updates
              </span>

              <h1 style={{ fontSize: 'clamp(1.9rem, 4vw, 2.75rem)', fontWeight: 800, color: '#0F172A', lineHeight: 1.18, marginBottom: '1.1rem' }}>
                Toyota Service Tracking{' '}
                <span style={{ color: TOYOTA_RED }}>Real-time</span>{' '}
                Workshop Transparency
              </h1>

              <p style={{ fontSize: '1rem', color: '#475569', lineHeight: 1.75, marginBottom: '2rem' }}>
                Track your vehicle's service progress instantly. From intake to final inspection —
                know every stage without a single phone call.
              </p>

              {/* Track form */}
              <div style={{ background: '#fff', borderRadius: 14, padding: '1.1rem 1.2rem', boxShadow: '0 4px 24px rgba(235,10,30,0.08)', border: '1px solid #F1F5F9', marginBottom: '1.5rem' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.6rem' }}>
                  Enter your registration number
                </p>
                <form onSubmit={handleTrack} style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94A3B8', pointerEvents: 'none' }} />
                    <input
                      className="tw-input w-100"
                      placeholder="e.g. ABC-1234"
                      value={regInput}
                      onChange={(e) => setRegInput(e.target.value)}
                      style={{ paddingLeft: '2.4rem', textTransform: 'uppercase', fontSize: '0.95rem', fontWeight: 600, letterSpacing: '0.05em' }}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    style={{ background: TOYOTA_RED, border: 'none', borderRadius: 8, padding: '0 1.1rem', fontSize: '0.875rem', fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(235,10,30,0.3)' }}
                  >
                    Track Live <ArrowRight size={14} />
                  </motion.button>
                </form>
                <p style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: '0.45rem', marginBottom: 0 }}>
                  Free · No account needed · Results in seconds
                </p>
              </div>

              {/* CTAs */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                <button
                  onClick={() => navigate('/login')}
                  style={{ background: '#0F172A', border: 'none', borderRadius: 9, padding: '0.65rem 1.4rem', fontSize: '0.875rem', fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = '#1E3A5F' }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = '#0F172A' }}
                >
                  Workshop Portal <ArrowRight size={14} />
                </button>
                <button style={{ background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: 8, color: '#1E293B', fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', padding: 0 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#F1F5F9', border: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PlayCircle size={16} color={TOYOTA_RED} />
                  </div>
                  Watch Demo
                </button>
              </div>
            </motion.div>
          </div>

          {/* Right — animated card */}
          <div className="col-lg-7 d-none d-lg-block">
            <motion.div variants={slideRight} initial="hidden" animate="visible" style={{ position: 'relative' }}>
              <div style={{ background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)', borderRadius: 22, padding: '1.8rem 2rem', position: 'relative', overflow: 'hidden', minHeight: 340, boxShadow: '0 24px 64px rgba(15,23,42,0.35)' }}>
                <div style={{ position: 'absolute', right: -60, top: -60, width: 240, height: 240, borderRadius: '50%', background: 'rgba(235,10,30,0.12)', pointerEvents: 'none' }} />
                <div style={{ position: 'absolute', right: 20, bottom: -80, width: 180, height: 180, borderRadius: '50%', background: 'rgba(235,10,30,0.07)', pointerEvents: 'none' }} />

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', position: 'relative' }}>
                  <div>
                    <p style={{ color: '#94A3B8', fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 }}>Current Vehicle</p>
                    <h3 style={{ color: '#fff', fontWeight: 700, margin: '4px 0 4px', fontSize: '1.2rem' }}>Toyota Camry 2024</h3>
                    <span style={{ background: 'rgba(235,10,30,0.2)', color: '#FF8A94', padding: '2px 10px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 600 }}>ABC-1234</span>
                  </div>
                  <span style={{ background: '#DCFCE7', color: '#15803D', padding: '4px 12px', borderRadius: 999, fontSize: '0.7rem', fontWeight: 700 }}>● In Service</span>
                </div>

                {[
                  { stage: 'Initial Inspection',   done: true  },
                  { stage: 'Parts Replacement',     done: true  },
                  { stage: 'Engine & Fluid Check',  done: false, active: true },
                  { stage: 'Final Quality Check',   done: false },
                ].map((s, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + idx * 0.12, duration: 0.4 }} style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0, background: s.done ? '#22C55E' : s.active ? TOYOTA_RED : 'rgba(255,255,255,0.08)', border: s.active ? `2px solid ${TOYOTA_RED}` : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {s.done ? <CheckCircle2 size={13} color="#fff" /> : s.active ? <Clock size={12} color="#fff" /> : <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'rgba(255,255,255,0.25)', display: 'block' }} />}
                    </div>
                    <span style={{ color: s.done ? '#86EFAC' : s.active ? '#fff' : 'rgba(255,255,255,0.35)', fontSize: '0.85rem', fontWeight: s.active ? 600 : 400, flex: 1 }}>{s.stage}</span>
                    {s.active && <span style={{ background: 'rgba(235,10,30,0.25)', color: '#FF8A94', padding: '1px 9px', borderRadius: 999, fontSize: '0.67rem', fontWeight: 700 }}>In Progress</span>}
                  </motion.div>
                ))}

                <div style={{ marginTop: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                    <span style={{ color: '#94A3B8', fontSize: '0.7rem' }}>Overall Progress</span>
                    <span style={{ color: '#fff', fontSize: '0.7rem', fontWeight: 700 }}>50%</span>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.1)', borderRadius: 99, height: 6 }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: '50%' }} transition={{ delay: 0.8, duration: 0.7, ease: 'easeOut' }} style={{ height: '100%', borderRadius: 99, background: `linear-gradient(90deg, ${TOYOTA_RED}, #FF6B6B)` }} />
                  </div>
                </div>
              </div>

              {/* Floating chip top-left */}
              <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9, duration: 0.4 }} style={{ position: 'absolute', top: -18, left: -18, background: '#fff', borderRadius: 12, padding: '8px 12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 32, height: 32, background: '#F0FDF4', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircle2 size={16} color="#16A34A" />
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#1E293B' }}>Ready for Pickup</div>
                  <div style={{ fontSize: '0.65rem', color: '#94A3B8' }}>DEF-5678 · just now</div>
                </div>
              </motion.div>

              {/* Floating chip bottom-right */}
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 1.05, duration: 0.4 }} style={{ position: 'absolute', bottom: -18, right: -18, background: '#fff', borderRadius: 12, padding: '9px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', minWidth: 164 }}>
                <div style={{ fontSize: '0.63rem', color: '#94A3B8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>Today's Stats</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  {[{ n: 24, l: 'Serviced', c: TOYOTA_RED }, { n: 8, l: 'Ready', c: '#16A34A' }, { n: 5, l: 'In Work', c: '#D97706' }].map(({ n, l, c }) => (
                    <div key={l}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: c, lineHeight: 1 }}>{n}</div>
                      <div style={{ fontSize: '0.63rem', color: '#64748B', marginTop: 2 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* STATS ROW */}
      <motion.section id="service" variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 3.5rem', width: '100%' }}>
        <div style={{ background: '#fff', borderRadius: 16, padding: '1.5rem 2rem', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', border: '1px solid #E2E8F0', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
          {HERO_STATS.map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: 'clamp(1.5rem, 2.5vw, 2rem)', fontWeight: 800, color: TOYOTA_RED, lineHeight: 1 }}>{stat.value}</div>
              <div style={{ fontSize: '0.875rem', fontWeight: 600, color: '#1E293B', marginTop: 3 }}>{stat.label}</div>
              <div style={{ fontSize: '0.72rem', color: '#94A3B8', marginTop: 1 }}>{stat.sub}</div>
            </div>
          ))}
        </div>
      </motion.section>

      {/* WHY CHOOSE US */}
      <section id="about" style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 5rem', width: '100%' }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: TOYOTA_RED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>Why Choose Us</span>
          <h2 style={{ fontWeight: 800, fontSize: 'clamp(1.5rem, 3vw, 2rem)', color: '#0F172A', marginBottom: 10 }}>Built for Modern Workshops</h2>
          <p style={{ color: '#64748B', maxWidth: 480, margin: '0 auto', fontSize: '0.95rem', lineHeight: 1.7 }}>Everything your team and customers need, in one transparent platform.</p>
        </motion.div>

        <motion.div className="row g-3" variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.15 }}>
          {FEATURES.map((f, i) => (
            <motion.div key={i} className="col-sm-6 col-lg-3" variants={fadeUp}>
              <motion.div
                whileHover={{ y: -6, boxShadow: '0 12px 36px rgba(0,0,0,0.1)' }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                style={{ background: '#fff', borderRadius: 16, padding: '1.5rem', height: '100%', boxShadow: '0 1px 4px rgba(0,0,0,0.06)', border: '1px solid #F1F5F9', cursor: 'default' }}
              >
                <div style={{ width: 46, height: 46, borderRadius: 12, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1rem' }}>
                  <f.icon size={21} color={f.color} />
                </div>
                <div style={{ fontWeight: 700, color: '#1E293B', marginBottom: 6, fontSize: '0.95rem' }}>{f.title}</div>
                <div style={{ fontSize: '0.83rem', color: '#64748B', lineHeight: 1.65 }}>{f.desc}</div>
              </motion.div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* CTA BANNER */}
      <motion.section variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} style={{ maxWidth: 1200, margin: '0 auto', padding: '0 1.5rem 5rem', width: '100%' }}>
        <div style={{ background: 'linear-gradient(135deg, #0F172A 0%, #1E3A5F 100%)', borderRadius: 20, padding: 'clamp(2rem,4vw,3rem) clamp(1.5rem,4vw,3rem)', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem', boxShadow: '0 16px 48px rgba(15,23,42,0.25)', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: -40, top: -40, width: 200, height: 200, borderRadius: '50%', background: 'rgba(235,10,30,0.12)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 540, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              {[...Array(5)].map((_, i) => <Star key={i} size={14} color="#FBBF24" fill="#FBBF24" />)}
              <span style={{ color: '#94A3B8', fontSize: '0.8rem', marginLeft: 4 }}>Trusted by workshops across the region</span>
            </div>
            <h2 style={{ color: '#fff', fontWeight: 800, fontSize: 'clamp(1.3rem, 2.5vw, 1.75rem)', marginBottom: 8 }}>Ready to modernise your workshop?</h2>
            <p style={{ color: '#94A3B8', fontSize: '0.9rem', lineHeight: 1.7, margin: 0 }}>Give your customers live visibility and your team clear task management — starting today.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', position: 'relative' }}>
            <motion.button onClick={() => navigate('/login')} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ background: TOYOTA_RED, border: 'none', borderRadius: 10, padding: '0.75rem 1.75rem', fontSize: '0.9rem', fontWeight: 700, color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, boxShadow: '0 4px 14px rgba(235,10,30,0.4)' }}>
              Get Started Free <ArrowRight size={15} />
            </motion.button>
            <motion.button onClick={() => navigate('/login')} whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '0.75rem 1.75rem', fontSize: '0.9rem', fontWeight: 600, color: '#fff', cursor: 'pointer' }}>
              Sign In
            </motion.button>
          </div>
        </div>
      </motion.section>

      <Footer />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.5; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}
