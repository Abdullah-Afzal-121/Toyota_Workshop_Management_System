import { useState, useEffect } from 'react'
import axios from 'axios'
import { Spinner } from 'react-bootstrap'
import { Wrench, CheckCircle2, RefreshCw, AlertCircle, Play, MessageSquare, X } from 'lucide-react'
import { io } from 'socket.io-client'

function formatStopwatch(sec) {
  const s = Math.max(0, Math.floor(sec ?? 0))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const pad = (n) => String(n).padStart(2, '0')
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(ss)}`
  return `${pad(m)}:${pad(ss)}`
}

export default function MechanicPanel() {
  const [cars, setCars] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const [toggling, setToggling] = useState(null)
  const [starting, setStarting] = useState(null)
  const [now, setNow] = useState(Date.now())

  const [activeStageForRemark, setActiveStageForRemark] = useState(null)
  const [remarkText, setRemarkText] = useState('')
  const [isStoppage, setIsStoppage] = useState(false)
  const [submittingRemark, setSubmittingRemark] = useState(false)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const fetchCars = async (showLoading = true) => {
    if (showLoading) setLoading(true)
    setError(null)
    try {
      const { data } = await axios.get('/api/mechanic/cars')
      setCars(data)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load assigned jobs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCars()
    const socket = io(import.meta.env.VITE_API_URL || '/')
    socket.on('workshop_update', () => { fetchCars(false) })
    return () => socket.disconnect()
  }, [])

  const toggleStage = async (stageId) => {
    setToggling(stageId)
    try {
      await axios.patch(`/api/mechanic/complete-stage/${stageId}`)
      await fetchCars()
    } catch (err) {
      alert(err.response?.data?.message || 'Could not update stage.')
    } finally { setToggling(null) }
  }

  const startStage = async (stageId) => {
    setStarting(stageId)
    try {
      await axios.patch(`/api/mechanic/start-stage/${stageId}`)
      fetchCars()
    } catch (err) {
      setError('Error starting job: ' + (err.response?.data?.message || err.message))
    } finally { setStarting(null) }
  }

  const resumeStage = async (stageId) => {
    setStarting(stageId)
    try {
      await axios.patch(`/api/mechanic/resume-stage/${stageId}`)
      fetchCars()
    } catch (err) {
      setError('Error resuming job: ' + (err.response?.data?.message || err.message))
    } finally { setStarting(null) }
  }

  const submitRemark = async (e) => {
    e.preventDefault()
    if (!remarkText.trim()) return
    setSubmittingRemark(true)
    try {
      await axios.post(`/api/mechanic/stages/${activeStageForRemark}/remarks`, {
        text: remarkText, isStoppage
      })
      setRemarkText(''); setIsStoppage(false); setActiveStageForRemark(null)
      fetchCars()
    } catch (err) {
      alert(err.response?.data?.message || 'Error adding remark.')
    } finally { setSubmittingRemark(false) }
  }

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 280 }}>
      <Spinner animation="border" style={{ color: '#EB0A1E' }} />
    </div>
  )

  return (
    <div className="tw-page">
      <div className="d-flex align-items-start justify-content-between mb-4" style={{ flexWrap: 'wrap', gap: 8 }}>
        <div>
          <h2 style={{ fontWeight: 800, fontSize: '1.6rem', color: '#0F172A', marginBottom: 4 }}>Technician Panel</h2>
          <p style={{ color: '#64748B', margin: 0, fontSize: '0.9rem' }}>Full job card view — your stages are interactive, others are read-only.</p>
        </div>
        <button onClick={fetchCars} className="tw-btn-ghost d-flex align-items-center gap-2" style={{ borderRadius: 9, padding: '7px 14px', fontSize: '0.83rem' }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {error && (
        <div className="d-flex align-items-center gap-2 p-3 rounded-3 mb-4" style={{ background: '#FEF2F2', border: '1px solid #FECACA', color: '#B91C1C', fontSize: '0.88rem' }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {!error && cars.length === 0 && (
        <div className="tw-card text-center" style={{ padding: '3rem 2rem' }}>
          <div style={{ width: 60, height: 60, borderRadius: 16, background: '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <Wrench size={26} color="#94A3B8" />
          </div>
          <p style={{ fontWeight: 600, color: '#475569', marginBottom: 4 }}>No tasks assigned</p>
          <p style={{ color: '#94A3B8', fontSize: '0.82rem', margin: 0 }}>Waiting for Job Controller allocation.</p>
        </div>
      )}

      <div className="row g-4">
        {cars.map((car) => (
          <div key={car._id} className="col-12 col-xl-6">
            <div className="tw-card" style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>

              {/* Car Header */}
              <div style={{ padding: '1.25rem 1.4rem', borderBottom: '1px solid #E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <div>
                  <h5 style={{ margin: 0, fontWeight: 800, color: '#0F172A', fontSize: '1.1rem' }}>{car.regNumber}</h5>
                  <p style={{ margin: '2px 0 0', color: '#64748B', fontSize: '0.85rem' }}>{car.carModel || 'N/A'}</p>
                </div>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, padding: '4px 10px', borderRadius: 20, background: '#F1F5F9', color: '#475569' }}>
                  {car.stages.filter(s => s.isCompleted).length}/{car.stages.length} done
                </div>
              </div>

              {/* Stages */}
              <div style={{ padding: '1.25rem 1.4rem', flex: 1 }}>
                <div className="d-flex flex-column" style={{ gap: 10 }}>
                  {car.stages.map((stage) => {
                    const isMyStage = !!stage.isMyStage
                    const isInProgress = !!stage.startedAt && !stage.isCompleted
                    let elapsedSec = null
                    if (isInProgress) {
                      if (stage.isPaused && stage.lastPausedAt) {
                        elapsedSec = Math.round((new Date(stage.lastPausedAt) - new Date(stage.startedAt)) / 1000) - (stage.totalPausedSeconds || 0)
                      } else {
                        elapsedSec = Math.round((now - new Date(stage.startedAt)) / 1000) - (stage.totalPausedSeconds || 0)
                      }
                    }
                    const limitSec = stage.estimatedMinutes ? stage.estimatedMinutes * 60 : null
                    const isOverdue = isInProgress && limitSec != null && elapsedSec > limitSec

                    let rowBg, rowBorder
                    if (stage.jcVerified) {
                      rowBg = '#F0FDF4'; rowBorder = '#BBF7D0'
                    } else if (stage.isCompleted) {
                      rowBg = '#F8FAFC'; rowBorder = '#CBD5E1'
                    } else if (isInProgress) {
                      rowBg = stage.isPaused ? '#F1F5F9' : (isOverdue ? '#FFF1F2' : '#FFF7ED')
                      rowBorder = stage.isPaused ? '#CBD5E1' : (isOverdue ? '#FECDD3' : '#FED7AA')
                    } else if (!isMyStage) {
                      rowBg = '#FAFAFA'; rowBorder = '#E2E8F0'
                    } else {
                      rowBg = '#fff'; rowBorder = '#E2E8F0'
                    }

                    return (
                      <div key={stage._id} style={{ borderRadius: 10, overflow: 'hidden', border: `1px solid ${rowBorder}`, opacity: (!isMyStage && !stage.isCompleted && !isInProgress) ? 0.8 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '0.75rem 1rem', background: rowBg }}>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                              <span style={{ fontWeight: 600, fontSize: '0.9rem', color: stage.isCompleted ? '#15803D' : '#0F172A' }}>
                                {stage.stageName}
                              </span>
                              {!isMyStage && !stage.isCompleted && (
                                <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#F1F5F9', color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  🔒 Other
                                </span>
                              )}
                              {isMyStage && !stage.isCompleted && (
                                <span style={{ fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#EFF6FF', color: '#2563EB', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                                  ✦ Mine
                                </span>
                              )}
                            </div>
                            {stage.estimatedMinutes && (
                              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>Est: {stage.estimatedMinutes}m</span>
                            )}
                            {/* Show other technician info */}
                            {!isMyStage && stage.assignedTechnician && (
                              <div style={{ fontSize: '0.72rem', color: '#475569', marginTop: 2 }}>
                                👤 {stage.assignedTechnician.name}{stage.assignedTechnician.bayName ? ` · ${stage.assignedTechnician.bayName}` : ''}
                              </div>
                            )}
                            {!isMyStage && !stage.assignedTechnician && !stage.isCompleted && (
                              <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontStyle: 'italic', marginTop: 2 }}>Unassigned</div>
                            )}
                          </div>

                          <div className="d-flex align-items-center gap-2">
                            {/* Remark — only my stages */}
                            {isMyStage && (
                              <button
                                onClick={() => setActiveStageForRemark(stage._id)}
                                style={{ background: 'none', border: 'none', color: '#475569', padding: '4px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
                                title="Add Remark"
                              >
                                <MessageSquare size={16} />
                              </button>
                            )}

                            {/* Start — only my unstarted stages */}
                            {isMyStage && !stage.isCompleted && !isInProgress && (
                              <button
                                onClick={() => startStage(stage._id)}
                                disabled={starting === stage._id || cars.some(c => c.stages.some(s => s.isMyStage && s.startedAt && !s.isCompleted)) || stage.isStartable === false}
                                className="tw-btn-primary d-flex align-items-center gap-1"
                                style={{
                                  borderRadius: 8, padding: '5px 12px', fontSize: '0.8rem', background: '#EB0A1E',
                                  opacity: (cars.some(c => c.stages.some(s => s.isMyStage && s.startedAt && !s.isCompleted)) || stage.isStartable === false) ? 0.5 : 1
                                }}
                                title={
                                  stage.isStartable === false ? 'Waiting for previous job to complete' :
                                  cars.some(c => c.stages.some(s => s.isMyStage && s.startedAt && !s.isCompleted)) ? 'Finish your active job first' :
                                  'Start Job'
                                }
                              >
                                {starting === stage._id ? <Spinner size="sm" animation="border" /> : <Play size={13} fill="currentColor" />} Start
                              </button>
                            )}

                            {/* Resume / End — only my in-progress stages */}
                            {isMyStage && isInProgress && (() => {
                              // Use last STOPPAGE remark consistently for both checks
                              const stoppageRemarks = stage.remarks ? stage.remarks.filter(r => r.isStoppage) : []
                              const lastStoppage = stoppageRemarks.length > 0
                                ? stoppageRemarks[stoppageRemarks.length - 1]
                                : null
                              const customerResponded = !!(lastStoppage && lastStoppage.customerResponse)

                              // 10-min block: measured from last STOPPAGE remark, bypassed if customer responded
                              let minutesSinceStoppage = 999
                              if (lastStoppage) {
                                minutesSinceStoppage = (now - new Date(lastStoppage.createdAt)) / 1000 / 60
                              }
                              const blocked = minutesSinceStoppage < 10 && !customerResponded
                              const remainMins = blocked ? Math.ceil(10 - minutesSinceStoppage) : 0

                              if (stage.isPaused) {
                                return (
                                  <button
                                    onClick={() => resumeStage(stage._id)}
                                    disabled={starting === stage._id}
                                    className="tw-btn-primary d-flex align-items-center gap-1"
                                    style={{ borderRadius: 8, padding: '5px 12px', fontSize: '0.8rem', background: '#3B82F6' }}
                                    title="Resume Job"
                                  >
                                    {starting === stage._id ? <Spinner size="sm" animation="border" /> : <Play size={14} fill="currentColor" />} Resume
                                  </button>
                                )
                              }
                              return (
                                <button
                                  onClick={() => toggleStage(stage._id)}
                                  disabled={toggling === stage._id || blocked}
                                  className="tw-btn-primary d-flex align-items-center gap-1"
                                  style={{ borderRadius: 8, padding: '5px 12px', fontSize: '0.8rem', background: '#16A34A', opacity: blocked ? 0.5 : 1 }}
                                  title={blocked ? `Wait ${remainMins}m OR advisor records customer response` : 'End Job'}
                                >
                                  {toggling === stage._id ? <Spinner size="sm" animation="border" /> : <CheckCircle2 size={14} />} {blocked ? `Wait ${remainMins}m` : 'End Job'}
                                </button>
                              )
                            })()}

                            {/* Other mechanic's in-progress indicator */}
                            {!isMyStage && isInProgress && (
                              <span style={{ fontSize: '0.72rem', fontWeight: 600, padding: '4px 8px', background: '#FFF7ED', color: '#D97706', borderRadius: 6 }}>
                                ▶ In Progress
                              </span>
                            )}

                            {stage.isCompleted && (
                              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: stage.jcVerified ? '#16A34A' : '#D97706', padding: '4px 8px', background: stage.jcVerified ? '#DCFCE7' : '#FEF3C7', borderRadius: 6 }}>
                                {stage.jcVerified ? '✔ Verified' : 'Awaiting JC'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Timer bar — only for in-progress stages */}
                        {isInProgress && (() => {
                          const stoppageRemarks = stage.remarks ? stage.remarks.filter(r => r.isStoppage) : []
                          const lastStoppage = stoppageRemarks.length > 0 ? stoppageRemarks[stoppageRemarks.length - 1] : null
                          const customerResponded = lastStoppage && lastStoppage.customerResponse
                          const pendingResponse = stage.isPaused && lastStoppage && !customerResponded

                          return (
                            <div style={{ borderTop: `1px solid ${stage.isPaused ? '#CBD5E1' : (isOverdue ? '#FECDD3' : '#FED7AA')}` }}>
                              {/* Timer row */}
                              <div style={{ background: stage.isPaused ? '#F1F5F9' : (isOverdue ? '#FEF2F2' : '#FFFBEB'), padding: '8px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span style={{ fontFamily: 'monospace', fontSize: '0.95rem', fontWeight: 700, color: stage.isPaused ? '#475569' : (isOverdue ? '#DC2626' : '#D97706') }}>
                                  {stage.isPaused && '⏸ '}⏱ {formatStopwatch(elapsedSec)}
                                </span>
                                {customerResponded && (
                                  <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: lastStoppage.customerResponse === 'approved' ? '#DCFCE7' : '#FEE2E2', color: lastStoppage.customerResponse === 'approved' ? '#16A34A' : '#DC2626' }}>
                                    {lastStoppage.customerResponse === 'approved' ? '✔ Customer Approved' : '✘ Customer Declined'}
                                  </span>
                                )}
                              </div>
                              {/* Pending customer response banner */}
                              {pendingResponse && (
                                <div style={{ background: '#FEF3C7', borderTop: '1px solid #FDE68A', padding: '7px 14px', display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.78rem', color: '#92400E', fontWeight: 600 }}>
                                  <span>⏳</span>
                                  <span>Waiting for customer response via Advisor — auto-unlocks in {Math.ceil(10 - (now - new Date(lastStoppage.createdAt)) / 1000 / 60)} min</span>
                                </div>
                              )}
                            </div>
                          )
                        })()}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Remark Modal */}
      {activeStageForRemark && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', borderRadius: 12, width: 400, padding: '1.5rem', boxShadow: '0 10px 25px rgba(0,0,0,0.2)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h4 style={{ margin: 0, fontWeight: 700 }}>Add Live Remark</h4>
              <button onClick={() => setActiveStageForRemark(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><X size={18} /></button>
            </div>
            <form onSubmit={submitRemark}>
              <textarea
                value={remarkText}
                onChange={e => setRemarkText(e.target.value)}
                placeholder="e.g. Need to replace brake pads..."
                style={{ width: '100%', borderRadius: 8, border: '1px solid #CBD5E1', padding: '10px', minHeight: 80, marginBottom: 12, resize: 'none' }}
                autoFocus
              />
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20, cursor: 'pointer', fontSize: '0.9rem' }}>
                <input type="checkbox" checked={isStoppage} onChange={e => setIsStoppage(e.target.checked)} />
                <span style={{ color: isStoppage ? '#DC2626' : '#0F172A', fontWeight: isStoppage ? 700 : 500 }}>Flag as Stoppage / Delay</span>
              </label>
              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setActiveStageForRemark(null)} style={{ flex: 1, padding: 10, background: '#F1F5F9', border: 'none', borderRadius: 8, fontWeight: 600 }}>Cancel</button>
                <button type="submit" disabled={submittingRemark} style={{ flex: 1, padding: 10, background: '#EB0A1E', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600 }}>
                  {submittingRemark ? 'Sending...' : 'Submit Remark'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}