import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import axios from 'axios'
import { Spinner } from 'react-bootstrap'
import { Search, RefreshCw, Car, CheckCircle2, Clock, Circle, AlertCircle } from 'lucide-react'
import { io } from 'socket.io-client'

const POLL_INTERVAL = 30_000

// Format seconds → "1h 4m" / "12m 3s" / "45s"
function formatDuration(sec) {
  if (!sec && sec !== 0) return null
  const s = Math.round(sec)
  if (s < 60)   return `${s}s`
  if (s < 3600) return `${Math.floor(s / 60)}m ${s % 60}s`
  return `${Math.floor(s / 3600)}h ${Math.floor((s % 3600) / 60)}m`
}

// Stopwatch format: MM:SS or HH:MM:SS
function formatStopwatch(sec) {
  const s = Math.max(0, Math.floor(sec ?? 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(ss)}`
  return `${pad(m)}:${pad(ss)}`
}

const STATUS_META = {
  pending:      { label: 'Waiting for Bay', cls: 'tw-badge-gray',   icon: Circle        },
  'in-service': { label: 'In Service',      cls: 'tw-badge-orange', icon: Clock         },
  ready:        { label: 'Delivery Bay',    cls: 'tw-badge-green',  icon: CheckCircle2  },
  delivered:    { label: 'Delivered',       cls: 'tw-badge-green',  icon: CheckCircle2  },
  closed:       { label: 'Job Closed',      cls: 'tw-badge-gray',   icon: CheckCircle2  },
}

// Live clock for in-progress stage elapsed time
function useTicker(active) {
  const [now, setNow] = useState(Date.now())
  useEffect(() => {
    if (!active) return
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [active])
  return now
}

// ── Feedback panel (shown when car status is 'ready') ────────────────────────
function FeedbackPanel({ regNumber, existing, onSubmitted }) {
  const [rating, setRating]         = useState(existing?.rating || 0)
  const [hover, setHover]           = useState(0)
  const [comment, setComment]       = useState(existing?.comment || '')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted]   = useState(Boolean(existing?.rating))
  const [err, setErr]               = useState(null)

  const handleSubmit = async () => {
    if (!rating) { setErr('Please select a star rating.'); return }
    setSubmitting(true); setErr(null)
    try {
      await axios.post(`/api/cars/${regNumber}/feedback`, { rating, comment })
      setSubmitted(true)
      onSubmitted()
    } catch (e) {
      setErr(e.response?.data?.message || 'Could not submit feedback.')
    } finally { setSubmitting(false) }
  }

  return (
    <div style={{
      marginTop: '1.25rem',
      padding: '1.1rem 1.2rem',
      background: 'linear-gradient(135deg, #F0FDF4 0%, #ECFDF5 100%)',
      border: '1px solid #BBF7D0',
      borderRadius: 12,
    }}>
      <div className="d-flex align-items-center gap-2 mb-3">
        <CheckCircle2 size={16} color="#16A34A" />
        <span style={{ fontWeight: 700, color: '#15803D', fontSize: '0.92rem' }}>
          Your car is ready for pickup!
        </span>
      </div>
      {submitted ? (
        <div>
          <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: 6, fontSize: '0.85rem' }}>Your Feedback</p>
          <div className="d-flex align-items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <span key={s} style={{ fontSize: '1.25rem', lineHeight: 1, color: s <= rating ? '#F59E0B' : '#E2E8F0' }}>★</span>
            ))}
            <span style={{ fontSize: '0.8rem', color: '#64748B', marginLeft: 6 }}>{rating} / 5</span>
          </div>
          {comment && (
            <p style={{ color: '#475569', fontSize: '0.83rem', margin: '0 0 6px', fontStyle: 'italic' }}>“{comment}”</p>
          )}
          <p style={{ color: '#94A3B8', fontSize: '0.75rem', margin: 0 }}>Thank you for your feedback!</p>
        </div>
      ) : (
        <div>
          <p style={{ fontWeight: 600, color: '#0F172A', marginBottom: 8, fontSize: '0.85rem' }}>
            Rate your service experience
          </p>
          <div className="d-flex gap-1 mb-3">
            {[1, 2, 3, 4, 5].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => { setRating(s); setErr(null) }}
                onMouseEnter={() => setHover(s)}
                onMouseLeave={() => setHover(0)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  padding: '0 3px', fontSize: '1.6rem', lineHeight: 1,
                  color: s <= (hover || rating) ? '#F59E0B' : '#CBD5E1',
                  transition: 'color 0.1s',
                }}
              >
                ★
              </button>
            ))}
          </div>
          <textarea
            className="tw-input w-100 mb-3"
            placeholder="Leave a comment (optional)…"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            style={{ resize: 'none' }}
          />
          {err && <p style={{ color: '#DC2626', fontSize: '0.8rem', margin: '0 0 8px' }}>{err}</p>}
          <button
            className="tw-btn-primary"
            onClick={handleSubmit}
            disabled={submitting}
            style={{ borderRadius: 8, padding: '7px 20px', fontSize: '0.85rem' }}
          >
            {submitting ? <Spinner size="sm" animation="border" /> : 'Submit Feedback'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function CustomerTracker() {
  const [searchParams]                  = useSearchParams()
  const [regInput, setRegInput]         = useState('')
  const [regNumber, setRegNumber]       = useState(null)
  const [data, setData]                 = useState(null)
  const [loading, setLoading]           = useState(false)
  const [error, setError]               = useState(null)
  const [lastUpdated, setLastUpdated]   = useState(null)
  const intervalRef                     = useRef(null)

  // Live clock — only ticks when there's an in-progress stage
  const hasInProgress = !!(data?.stages?.some(s => s.startedAt && !s.isCompleted))
  const now = useTicker(hasInProgress)

  // Auto-search if ?reg= query param is present (from Home landing page)
  useEffect(() => {
    const reg = searchParams.get('reg')
    if (reg) {
      const trimmed = reg.trim().toUpperCase()
      setRegInput(trimmed)
      setRegNumber(trimmed)
    }
  }, [searchParams])

  const fetchData = async (reg) => {
    if (!reg) return
    setLoading(true); setError(null)
    try {
      const { data: result } = await axios.get(`/api/cars/${reg}`)
      setData(result)
      setLastUpdated(new Date().toLocaleTimeString())
    } catch (err) {
      setError(err.response?.data?.message || 'Car not found. Please check your registration number.')
      setData(null)
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (!regNumber) return
    fetchData(regNumber)
    
    const socket = io(import.meta.env.VITE_API_URL || '/')
    socket.on('workshop_update', () => {
      fetchData(regNumber)
    })

    return () => socket.disconnect()
  }, [regNumber])

  const handleSearch = (e) => {
    e.preventDefault()
    const trimmed = regInput.trim().toUpperCase()
    if (!trimmed) return
    setRegNumber(trimmed)
  }

  const smeta = data ? (STATUS_META[data.car.status] || STATUS_META.pending) : null

  return (
    <div className="tw-page" style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* Page heading */}
      <div className="mb-4">
        <h2 style={{ fontWeight: 800, fontSize: '1.6rem', color: '#0F172A', marginBottom: 4 }}>
          Track Your Car
        </h2>
        <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>
          Enter your vehicle registration number to see live service progress.
        </p>
      </div>

      {/* ── Search ─────────────────────────────────────────────────── */}
      <form onSubmit={handleSearch} className="tw-search-wrap mb-5">
        <Search size={17} className="tw-search-icon" />
        <input
          type="text"
          className="tw-input"
          placeholder="e.g. ABC-1234"
          value={regInput}
          onChange={(e) => { setRegInput(e.target.value); setError(null) }}
          style={{ paddingLeft: '2.6rem', borderRadius: '10px 0 0 10px' }}
          autoFocus
        />
        <button
          type="submit"
          className="tw-btn-primary"
          disabled={loading}
          style={{ borderRadius: '0 10px 10px 0', padding: '0 1.4rem', height: 46, fontSize: '0.9rem' }}
        >
          {loading ? <Spinner size="sm" animation="border" /> : 'Search'}
        </button>
      </form>

      {/* ── Error state ────────────────────────────────────────────── */}
      {error && (
        <div
          className="d-flex align-items-start gap-3 p-3 rounded-3 mb-4"
          style={{ background: '#FEF2F2', border: '1px solid #FECACA' }}
        >
          <AlertCircle size={18} color="#DC2626" style={{ flexShrink: 0, marginTop: 1 }} />
          <p style={{ margin: 0, color: '#991B1B', fontSize: '0.88rem', fontWeight: 500 }}>{error}</p>
        </div>
      )}

      {/* ── Loading skeleton ────────────────────────────────────────── */}
      {loading && !data && (
        <div className="tw-card p-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              style={{ height: 16, background: '#F1F5F9', borderRadius: 6, marginBottom: 12,
                width: `${70 + i * 10}%`, animation: 'pulse 1.5s infinite' }}
            />
          ))}
        </div>
      )}

      {/* ── Result card ────────────────────────────────────────────── */}
      {data && (
        <div className="tw-card" style={{ overflow: 'hidden' }}>

          {/* Card header */}
          <div
            style={{
              padding: '1rem 1.4rem',
              background: 'linear-gradient(90deg, #0F172A 0%, #1E3A5F 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 8,
            }}
          >
            <div className="d-flex align-items-center gap-3">
              <div
                style={{
                  width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}
              >
                <Car size={20} color="#fff" />
              </div>
              <div>
                <div style={{ color: '#fff', fontWeight: 700, lineHeight: 1.2 }}>
                  {data.car.carModel}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.78rem', fontFamily: 'monospace' }}>
                  {data.car.regNumber}
                </div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-2">
              {smeta && (
                <span className={`tw-badge ${smeta.cls}`} style={{ fontSize: '0.8rem', padding: '4px 12px' }}>
                  {smeta.label}
                </span>
              )}
              <button
                type="button"
                onClick={() => fetchData(regNumber)}
                title="Refresh"
                style={{
                  background: 'rgba(255,255,255,0.12)', border: '1px solid rgba(255,255,255,0.2)',
                  borderRadius: 8, padding: '5px 8px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center',
                }}
              >
                <RefreshCw size={14} color="#fff" />
              </button>
            </div>
          </div>

          <div style={{ padding: '1.25rem 1.4rem' }}>
            {/* Meta line */}
            <div className="d-flex align-items-center justify-content-between mb-4" style={{ flexWrap: 'wrap', gap: 6 }}>
              <span style={{ color: '#475569', fontSize: '0.85rem' }}>
                Customer: <strong style={{ color: '#0F172A' }}>{data.car.customerName}</strong>
              </span>
              {lastUpdated && (
                <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>
                  Updated {lastUpdated} · auto-refreshes every 30s
                </span>
              )}
            </div>

            {/* Progress */}
            <div className="mb-1" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
              <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#0F172A' }}>Overall Progress</span>
              <span style={{ fontWeight: 800, color: data.progress === 100 ? '#16A34A' : '#EB0A1E', fontSize: '1rem' }}>
                {data.progress}%
              </span>
            </div>
            <div className="tw-progress-bar mb-4">
              <div
                className="tw-progress-fill"
                style={{
                  width: `${data.progress}%`,
                  background: data.progress === 100
                    ? '#16A34A'
                    : 'linear-gradient(90deg, #EB0A1E, #FF6B6B)',
                }}
              />
            </div>

            {/* Total & Remaining time */}
            {data.stages.some(s => s.estimatedMinutes) && (() => {
              const t = data.stages.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0)
              const totalLabel = t >= 60 ? `${Math.floor(t / 60)}h${t % 60 ? ` ${t % 60}m` : ''}` : `${t}m`
              
              const remainingSecs = data.stages.reduce((sum, s) => {
                if (s.isCompleted) return sum;
                const limitSec = s.estimatedMinutes ? s.estimatedMinutes * 60 : 0;
                if (!s.startedAt) return sum + limitSec;
                
                const elapsedSec = Math.round((now - new Date(s.startedAt)) / 1000);
                const remain = limitSec - elapsedSec;
                return sum + (remain > 0 ? remain : 0);
              }, 0);
              const remainMins = Math.ceil(remainingSecs / 60);
              const remainLabel = remainMins >= 60 ? `${Math.floor(remainMins / 60)}h${remainMins % 60 ? ` ${remainMins % 60}m` : ''}` : `${remainMins}m`

              return (
                <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
                  <div style={{ flex: 1, background: '#FFF7ED', padding: '10px 14px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #FFEDD5' }}>
                    <span style={{ fontSize: '0.78rem', color: '#EA580C', fontWeight: 700 }}>Remaining Time</span>
                    <span style={{ fontSize: '0.9rem', color: '#C2410C', fontWeight: 800 }}>⏱ {remainLabel}</span>
                  </div>
                  <div style={{ flex: 1, background: '#EEF2FF', padding: '10px 14px', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: '1px solid #E0E7FF' }}>
                    <span style={{ fontSize: '0.78rem', color: '#4F46E5', fontWeight: 700 }}>Total Time</span>
                    <span style={{ fontSize: '0.9rem', color: '#4338CA', fontWeight: 800 }}>⏱ {totalLabel}</span>
                  </div>
                </div>
              )
            })()}

            {/* Stage list */}
            <div className="d-flex flex-column" style={{ gap: 8 }}>
              {data.stages.map((stage, idx) => {
                const isInProgress = !!stage.startedAt && !stage.isCompleted
                const elapsedSec   = isInProgress
                  ? Math.round((now - new Date(stage.startedAt)) / 1000)
                  : null
                const limitSec  = stage.estimatedMinutes ? stage.estimatedMinutes * 60 : null
                const isOverdue = isInProgress && limitSec != null && elapsedSec > limitSec

                const rowBg     = stage.isCompleted ? '#F0FDF4' : isInProgress ? (isOverdue ? '#FFF1F2' : '#FFF7ED') : '#F8FAFC'
                const rowBorder = stage.isCompleted ? '#BBF7D0' : isInProgress ? (isOverdue ? '#FECDD3' : '#FED7AA') : '#E2E8F0'

                return (
                  <div
                    key={stage._id}
                    style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${rowBorder}`, transition: 'all 0.2s' }}
                  >
                    {/* Main row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.7rem 1rem', background: rowBg }}>
                      {/* Step number / check / clock */}
                      <div
                        style={{
                          width: 28, height: 28, borderRadius: '50%',
                          background: stage.isCompleted ? '#16A34A' : isInProgress ? (isOverdue ? '#DC2626' : '#D97706') : '#E2E8F0',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                        }}
                      >
                        {stage.isCompleted
                          ? <CheckCircle2 size={14} color="#fff" />
                          : isInProgress
                            ? <Clock size={13} color="#fff" />
                            : <span style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700 }}>{idx + 1}</span>
                        }
                      </div>

                      {/* Stage name + estimate */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{
                          fontWeight: 500, fontSize: '0.88rem', display: 'block',
                          color: stage.isCompleted ? '#15803D' : isInProgress ? (isOverdue ? '#991B1B' : '#92400E') : '#475569',
                        }}>
                          {stage.stageName}
                        </span>
                        {stage.estimatedMinutes && (
                          <span style={{ fontSize: '0.7rem', color: '#6366F1' }}>Est. {stage.estimatedMinutes} min</span>
                        )}
                      </div>

                      {/* Right badge */}
                      {stage.isCompleted && stage.durationSeconds != null ? (
                        <div className="d-flex flex-column align-items-end" style={{ gap: 2 }}>
                          <span className="tw-badge tw-badge-green" style={{ fontSize: '0.7rem' }}>Done</span>
                          <span style={{ fontSize: '0.68rem', color: '#16A34A', fontWeight: 600 }}>⏱ {formatDuration(stage.durationSeconds)}</span>
                        </div>
                      ) : stage.isCompleted ? (
                        <span className="tw-badge tw-badge-green" style={{ fontSize: '0.72rem' }}>Done</span>
                      ) : !isInProgress ? (
                        <span className="tw-badge tw-badge-gray" style={{ fontSize: '0.72rem' }}>Pending</span>
                      ) : null}
                    </div>

                    {/* Stopwatch bar — in-progress only */}
                    {isInProgress && (
                      <div style={{
                        background: isOverdue ? '#FEF2F2' : '#FFFBEB',
                        borderTop: `1px solid ${isOverdue ? '#FECDD3' : '#FED7AA'}`,
                        padding: '5px 14px',
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      }}>
                        <span style={{
                          fontFamily: 'monospace', fontSize: '1rem', fontWeight: 800,
                          letterSpacing: '0.06em',
                          color: isOverdue ? '#DC2626' : '#D97706',
                        }}>
                          ⏱ {formatStopwatch(elapsedSec)}
                        </span>
                        {limitSec != null && (
                          isOverdue ? (
                            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#DC2626' }}>
                              ⚠ {formatDuration(elapsedSec - limitSec)} over limit
                            </span>
                          ) : (
                            <span style={{ fontSize: '0.72rem', color: '#92400E' }}>
                              {formatDuration(limitSec - elapsedSec)} remaining
                            </span>
                          )
                        )}
                      </div>
                    )}

                    {/* Live Remarks */}
                    {stage.remarks && stage.remarks.length > 0 && (
                      <div style={{ background: '#F8FAFC', borderTop: '1px solid #E2E8F0', padding: '10px 14px' }}>
                        <p style={{ margin: '0 0 6px', fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>SERVICE UPDATES</p>
                        <div className="d-flex flex-column gap-2">
                          {stage.remarks.map((r, i) => (
                            <div key={r._id || i} style={{ display: 'flex', gap: 8, fontSize: '0.8rem', color: '#475569' }}>
                              <span style={{ color: r.isStoppage ? '#DC2626' : '#2563EB', flexShrink: 0, marginTop: 1 }}>
                                {r.isStoppage ? '⚠' : '▶'}
                              </span>
                              <span>{r.text}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Feedback — only shown when car is ready / closed */}
            {['ready', 'delivered', 'closed'].includes(data.car.status) && (
              <FeedbackPanel
                regNumber={data.car.regNumber}
                existing={data.car.feedback}
                onSubmitted={() => fetchData(regNumber)}
              />
            )}
          </div>
        </div>
      )}

      {/* Empty CTA when no search yet */}
      {!data && !loading && !error && !regNumber && (
        <div className="tw-card text-center" style={{ padding: '3rem 2rem' }}>
          <div
            style={{
              width: 64, height: 64, borderRadius: 16, background: '#F1F5F9',
              display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem',
            }}
          >
            <Car size={28} color="#94A3B8" />
          </div>
          <p style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>No vehicle loaded</p>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>
            Enter your registration number above to track service progress.
          </p>
        </div>
      )}
    </div>
  )
}