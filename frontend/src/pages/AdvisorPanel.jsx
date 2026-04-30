import { useState, useEffect } from 'react'
import axios from 'axios'
import { PlusCircle, Search, Menu, UserCircle2, LogOut, CheckCircle2, ChevronRight, X, User, AlertCircle, Car, LayoutGrid, List } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Spinner } from 'react-bootstrap'
import { io } from 'socket.io-client'

const TOYOTA_RED = '#EB0A1E'

function Btn({ children, primary, onClick, style, disabled }) {
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        background: disabled ? '#E2E8F0' : primary ? TOYOTA_RED : '#fff',
        color: disabled ? '#94A3B8' : primary ? '#fff' : '#0F172A',
        border: primary ? 'none' : '1px solid #E2E8F0',
        borderRadius: 8, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: primary && !disabled ? '0 2px 4px rgba(235,10,30,0.15)' : 'none',
        display: 'flex', alignItems: 'center', gap: 6, ...style
      }}
    >
      {children}
    </button>
  )
}

export default function AdvisorPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [cars, setCars] = useState([])
  const [historyCars, setHistoryCars] = useState([])
  const [activeTab, setActiveTab] = useState('active') // 'active' or 'history'
  const [viewMode, setViewMode] = useState('grid') // 'grid' or 'list'
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  const [dismissedStoppages, setDismissedStoppages] = useState(new Set())
  const [now, setNow] = useState(Date.now())

  // Live ticker — updates every second so countdown refreshes in real time
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  // Registration Form
  const [showAdd, setShowAdd] = useState(false)
  const [form, setForm] = useState({ customerName: '', carModel: '', regNumber: '', phone: '', needsAlignment: false, needsWashing: false, selectedJobs: [] })
  const [submitting, setSubmitting] = useState(false)

  const [jobMasters, setJobMasters] = useState([])

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchCars = async () => {
    setLoading(true)
    try {
      const [carsRes, jobsRes] = await Promise.all([
        axios.get('/api/admin/cars'),
        axios.get('/api/admin/job-master')
      ])
      setCars(carsRes.data.filter(c => c.status !== 'closed'))
      setHistoryCars(carsRes.data.filter(c => c.status === 'closed'))
      setJobMasters(jobsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCars()
    const socket = io(import.meta.env.VITE_API_URL || '/')
    socket.on('workshop_update', () => {
      fetchCars()
    })
    return () => socket.disconnect()
  }, [])

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.customerName || !form.phone || !form.regNumber) {
      return showToast('Customer Name, Phone, and Registration Number are required.', false)
    }

    setSubmitting(true)
    let createdCarId = null
    try {
      // 1. Add Car
      const { data } = await axios.post('/api/admin/add-car', {
        customerName: form.customerName,
        carModel: form.carModel || 'N/A',
        regNumber: form.regNumber,
        phoneNumber: form.phone,
        needsAlignment: form.needsAlignment,
        needsWashing: form.needsWashing
      })
      createdCarId = data.car._id

      // 2. Add Stages based on DB estimates
      for (const jobId of form.selectedJobs) {
        const jobTemplate = jobMasters.find(j => j._id === jobId)
        if (jobTemplate) {
          await axios.post(`/api/admin/cars/${createdCarId}/stages`, {
            stageName: jobTemplate.title,
            estimatedMinutes: jobTemplate.estimatedMinutes
          })
        }
      }

      showToast('Vehicle registered and jobs added!')
      setShowAdd(false)
      setForm({ customerName: '', carModel: '', regNumber: '', phone: '', needsAlignment: false, needsWashing: false, selectedJobs: [] })
      fetchCars()
    } catch (err) {
      // If stage creation failed AFTER car was created, rollback the car
      if (createdCarId && err.config?.url?.includes('/stages')) {
        try {
          await axios.delete(`/api/admin/cars/${createdCarId}`)
        } catch (_) {}
        showToast('Failed to add job stages. Car registration was rolled back. Please try again.', false)
      } else {
        const msg = err.response?.data?.message || 'Error adding car'
        // Give a more helpful message for duplicates
        if (err.response?.status === 409) {
          showToast(`${msg} — If you believe this is an error, the previous registration may have failed partway through. Please contact admin to clear the duplicate entry.`, false)
        } else {
          showToast(msg, false)
        }
      }
    } finally {
      setSubmitting(false)
    }
  }

  const toggleJob = (jobId) => {
    setForm(p => {
      const isSelected = p.selectedJobs.includes(jobId)
      return { ...p, selectedJobs: isSelected ? p.selectedJobs.filter(j => j !== jobId) : [...p.selectedJobs, jobId] }
    })
  }

  const closeJobCard = async (carId) => {
    try {
      await axios.put(`/api/admin/cars/${carId}/status`, { status: 'closed' })
      showToast('Job card successfully closed and archived.')
      fetchCars()
    } catch (err) {
      showToast('Error closing job card', false)
    }
  }

  const recordCustomerResponse = async (stageId, remarkId, response) => {
    try {
      await axios.put(`/api/admin/stages/${stageId}/remarks/${remarkId}/customer-response`, { response })
      showToast(response === 'approved' ? 'Customer approved — mechanic notified.' : 'Customer declined — mechanic notified.')
      fetchCars()
    } catch (err) {
      showToast(err.response?.data?.message || 'Error recording response', false)
    }
  }

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#F8FAFC', fontFamily: 'Inter, sans-serif' }}>

      {/* Sidebar */}
      <aside style={{ width: 260, background: '#0F172A', color: '#fff', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/toyota-logo.png" style={{ width: 40, background: '#fff', borderRadius: 8 }} />
          <div>
            <div style={{ fontWeight: 800 }}>Service Advisor</div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{user.name}</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: '1rem' }}>
          <div style={{ padding: '10px', background: 'rgba(255,255,255,0.1)', borderRadius: 8, cursor: 'pointer' }}>
            Active Reception
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login') }} style={{ margin: '1rem', background: 'rgba(239,68,68,0.2)', border: 'none', color: '#FCA5A5', padding: '10px', borderRadius: 8, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center' }}>
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>

        {toast && (
          <div style={{ padding: '1rem', background: toast.ok ? '#DCFCE7' : '#FEE2E2', color: toast.ok ? '#16A34A' : '#DC2626', borderRadius: 8, marginBottom: 20 }}>
            {toast.msg}
          </div>
        )}

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>Service Advisor</h2>
            <p style={{ color: '#64748B', margin: '4px 0 0', fontSize: '0.9rem' }}>Register new vehicles and monitor workshop progress.</p>
          </div>
          <Btn primary onClick={() => setShowAdd(true)} style={{ background: '#10B981' }}>
            <PlusCircle size={18} /> Register Vehicle
          </Btn>
        </div>

        {/* Tabs and Controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #E2E8F0', marginBottom: '2rem' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button 
              onClick={() => setActiveTab('active')}
              style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'active' ? `3px solid ${TOYOTA_RED}` : '3px solid transparent', color: activeTab === 'active' ? TOYOTA_RED : '#64748B', fontWeight: 700, cursor: 'pointer', marginBottom: '-2px' }}
            >
              Active Vehicles ({cars.length})
            </button>
            <button 
              onClick={() => setActiveTab('history')}
              style={{ padding: '0.75rem 1rem', background: 'none', border: 'none', borderBottom: activeTab === 'history' ? `3px solid ${TOYOTA_RED}` : '3px solid transparent', color: activeTab === 'history' ? TOYOTA_RED : '#64748B', fontWeight: 700, cursor: 'pointer', marginBottom: '-2px' }}
            >
              Service History ({historyCars.length})
            </button>
          </div>
          
          <div style={{ display: 'flex', gap: '4px', background: '#F1F5F9', padding: '4px', borderRadius: '8px', marginBottom: '4px' }}>
            <button 
              onClick={() => setViewMode('grid')}
              style={{ display: 'flex', alignItems: 'center', padding: '6px', background: viewMode === 'grid' ? '#fff' : 'transparent', border: 'none', borderRadius: '4px', boxShadow: viewMode === 'grid' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', color: viewMode === 'grid' ? '#0F172A' : '#94A3B8', cursor: 'pointer' }}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              style={{ display: 'flex', alignItems: 'center', padding: '6px', background: viewMode === 'list' ? '#fff' : 'transparent', border: 'none', borderRadius: '4px', boxShadow: viewMode === 'list' ? '0 1px 2px rgba(0,0,0,0.1)' : 'none', color: viewMode === 'list' ? '#0F172A' : '#94A3B8', cursor: 'pointer' }}
              title="List View"
            >
              <List size={16} />
            </button>
          </div>
        </div>

        {loading ? <Spinner animation="border" /> : activeTab === 'active' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Active Stoppages Alert Section */}
                {(() => {
                  const pendingStoppages = []
                  cars.forEach(car => {
                    if (!car.stages) return
                    car.stages.forEach(stage => {
                      if (!stage.remarks) return
                      stage.remarks.forEach(remark => {
                        if (remark.isStoppage && !remark.customerResponse && !dismissedStoppages.has(remark._id)) {
                          pendingStoppages.push({ car, stage, remark })
                        }
                      })
                    })
                  })
                  if (pendingStoppages.length === 0) return null
                  return (
                    <div style={{ gridColumn: '1 / -1', background: '#FEF3C7', border: '1px solid #FDE68A', borderRadius: 10, padding: '1rem 1.25rem', marginBottom: 8 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.85rem', color: '#92400E', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
                        ⚠ Active Stoppages — Contact Customer &amp; Record Response
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {pendingStoppages.map(({ car, stage, remark }) => {
                          const minElapsed = Math.floor((now - new Date(remark.createdAt)) / 1000 / 60)
                          const secRemain = Math.max(0, 600 - Math.floor((now - new Date(remark.createdAt)) / 1000))
                          const expired = secRemain === 0
                          return (
                            <div key={remark._id} style={{ background: '#fff', borderRadius: 8, padding: '10px 14px', border: '1px solid #FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontWeight: 800, fontSize: '0.88rem', color: '#0F172A' }}>
                                  {car.regNumber} <span style={{ fontWeight: 500, color: '#64748B' }}>– {stage.stageName}</span>
                                </div>
                                <div style={{ fontSize: '0.78rem', color: '#DC2626', marginTop: 2 }}>⚠ {remark.text}</div>
                                <div style={{ fontSize: '0.72rem', color: '#92400E', marginTop: 3, fontWeight: 600 }}>
                                  {expired
                                    ? '⏰ 10 min expired — mechanic can end job'
                                    : `⏳ ${minElapsed}m elapsed — ${Math.floor(secRemain / 60)}m ${secRemain % 60}s remaining`}
                                  {car.phoneNumber && <span style={{ marginLeft: 10, color: '#475569', fontWeight: 500 }}>📞 {car.phoneNumber}</span>}
                                </div>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                {!expired && (
                                  <>
                                    <button
                                      onClick={() => recordCustomerResponse(stage._id, remark._id, 'approved')}
                                      style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#16A34A', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                                    >
                                      ✔ Customer Approved
                                    </button>
                                    <button
                                      onClick={() => recordCustomerResponse(stage._id, remark._id, 'declined')}
                                      style={{ padding: '6px 14px', borderRadius: 6, border: 'none', background: '#DC2626', color: '#fff', fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer' }}
                                    >
                                      ✘ Customer Declined
                                    </button>
                                  </>
                                )}
                                {/* Dismiss button */}
                                <button
                                  onClick={() => setDismissedStoppages(prev => new Set([...prev, remark._id]))}
                                  title="Dismiss this alert"
                                  style={{ background: 'none', border: '1px solid #D97706', borderRadius: 6, color: '#92400E', cursor: 'pointer', padding: '5px 8px', display: 'flex', alignItems: 'center', lineHeight: 1 }}
                                >
                                  <X size={14} />
                                </button>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })()}

                {/* Car cards */}
                {cars.map(car => (
              <div key={car._id} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '1.25rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, marginBottom: 16, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexShrink: 0 }}>
                      <Car size={24} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', marginBottom: 4 }}>{car.regNumber}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '4px 8px', alignItems: 'center' }}>
                        <span style={{display: 'flex', alignItems: 'center'}}><User size={12} style={{marginRight: 4}}/>{car.customerName}</span>
                        <span style={{ color: '#CBD5E1' }}>|</span>
                        <span>{car.phoneNumber || 'N/A'}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', marginTop: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ color: '#94A3B8' }}>Added By:</span>
                        <span style={{ color: '#0F172A', fontWeight: 700 }}>
                          {car.serviceAdvisor?.name || 'N/A'}
                        </span>
                        {car.serviceAdvisor?.role && (
                          <span style={{ fontSize: '0.65rem', padding: '1px 6px', borderRadius: 4, background: '#EDE9FE', color: '#7C3AED', fontWeight: 700, textTransform: 'uppercase' }}>
                            {car.serviceAdvisor.role === 'advisor' ? 'Advisor' : car.serviceAdvisor.role === 'admin' ? 'Admin' : car.serviceAdvisor.role}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0, textAlign: 'right' }}>
                    {car.status === 'ready' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ color: '#16A34A', background: '#DCFCE7', padding: '6px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>READY</span>
                        <Btn onClick={() => closeJobCard(car._id)} style={{ padding: '6px 14px', fontSize: '0.75rem', background: '#3B82F6', color: '#fff', border: 'none' }}>Bill Manually &amp; Close</Btn>
                      </div>
                    ) : car.status === 'in-service' ? (
                      <span style={{ color: '#D97706', background: '#FEF3C7', padding: '6px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>IN PRODUCTION</span>
                    ) : (
                      <span style={{ color: '#1D4ED8', background: '#DBEAFE', padding: '6px 14px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.05em' }}>RECEPTION</span>
                    )}
                  </div>
                </div>

                {/* Job Allocations */}
                {car.stages && car.stages.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>Job Allocations</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {car.stages.map((stage, i) => (
                        <div key={i} style={{
                          padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
                          background: stage.isCompleted ? '#F1F5F9' : '#fff',
                          border: `1px solid ${stage.isCompleted ? '#E2E8F0' : '#CBD5E1'}`,
                          color: stage.isCompleted ? '#94A3B8' : '#334155',
                          display: 'flex', alignItems: 'center', gap: 6
                        }}>
                          <span style={{ textDecoration: stage.isCompleted ? 'line-through' : 'none' }}>{stage.stageName}</span>
                          <span style={{ paddingLeft: 6, borderLeft: `1px solid ${stage.isCompleted ? '#E2E8F0' : '#CBD5E1'}`, color: stage.assignedTechnician ? '#0F172A' : '#EF4444' }}>
                            {stage.assignedTechnician ? stage.assignedTechnician.name : 'Unassigned'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Remarks with customer response status */}
                {car.stages && car.stages.some(s => s.remarks && s.remarks.length > 0) && (
                  <div style={{ padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.8rem' }}>
                    <div style={{ fontWeight: 700, color: '#64748B', marginBottom: 4 }}>REMARKS / STOPPAGES:</div>
                    {car.stages.map(stage =>
                      stage.remarks && stage.remarks.length > 0 ? (
                        <div key={stage._id} style={{ marginBottom: 4 }}>
                          <span style={{ fontWeight: 600, color: '#475569' }}>[{stage.stageName}]</span>
                          {stage.remarks.map((r, idx) => (
                            <div key={r._id || idx} style={{ marginLeft: 8, color: r.isStoppage ? '#DC2626' : '#334155', display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginTop: 2 }}>
                              <span>{r.isStoppage ? '⚠ ' : '▶ '}{r.text}</span>
                              {r.isStoppage && r.customerResponse && (
                                <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: r.customerResponse === 'approved' ? '#DCFCE7' : '#FEE2E2', color: r.customerResponse === 'approved' ? '#16A34A' : '#DC2626' }}>
                                  {r.customerResponse === 'approved' ? '✔ Approved' : '✘ Declined'}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : null
                    )}
                  </div>
                )}
              </div>
            ))}
            {cars.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8', border: '2px dashed #E2E8F0', borderRadius: 10 }}>
                No active vehicles. Register one to get started.
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: viewMode === 'grid' ? 'grid' : 'flex', flexDirection: viewMode === 'list' ? 'column' : undefined, gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(380px, 1fr))' : undefined, gap: '1.5rem' }}>
            {historyCars.map(car => (
              <div key={car._id} style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '1.25rem', background: '#fff', border: '1px solid #E2E8F0', borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, minWidth: 0 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 10, background: '#F8FAFC', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', flexShrink: 0 }}>
                      <Car size={24} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '1rem', color: '#0F172A', marginBottom: 4 }}>{car.regNumber}</div>
                      <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', flexWrap: 'wrap', gap: '4px 8px', alignItems: 'center' }}>
                        <span style={{display: 'flex', alignItems: 'center'}}><User size={12} style={{marginRight: 4}}/>{car.customerName}</span>
                        <span style={{ color: '#CBD5E1' }}>|</span>
                        <span>{car.carModel}</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: '#64748B', marginTop: 6, fontWeight: 500 }}>
                        {new Date(car.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  <div style={{ flexShrink: 0 }}>
                    <span style={{ color: '#475569', background: '#F1F5F9', border: '1px solid #E2E8F0', padding: '6px 14px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.05em' }}>BILLED / CLOSED</span>
                  </div>
                </div>

                {car.stages && car.stages.length > 0 && (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', marginBottom: 8 }}>Service Log</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {car.stages.map(stage => (
                        <div key={stage._id} style={{ 
                          padding: '4px 10px', borderRadius: 20, fontSize: '0.7rem', fontWeight: 600,
                          background: '#F8FAFC', border: '1px solid #E2E8F0', color: '#334155',
                          display: 'flex', alignItems: 'center', gap: 6
                        }}>
                          <span>{stage.stageName}</span>
                          <span style={{ paddingLeft: 6, borderLeft: '1px solid #E2E8F0', color: '#64748B' }}>
                            {stage.assignedTechnician ? stage.assignedTechnician.name : 'N/A'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
            {historyCars.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8', border: '2px dashed #E2E8F0', borderRadius: 10, gridColumn: '1 / -1' }}>
                No service history available.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add Modal */}
      {showAdd && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ background: '#fff', width: 450, borderRadius: 12, overflow: 'hidden' }}>
            <div style={{ padding: '1.25rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Register Vehicle</h3>
              <button onClick={() => setShowAdd(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X /></button>
            </div>
            <form onSubmit={handleRegister} style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input placeholder="Registration Number *" value={form.regNumber} onChange={e => setForm(p => ({ ...p, regNumber: e.target.value }))} style={{ padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', width: '100%', background: '#F8FAFC' }} />
              <input placeholder="Customer Name *" value={form.customerName} onChange={e => setForm(p => ({ ...p, customerName: e.target.value }))} style={{ padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', width: '100%', background: '#F8FAFC' }} />
              <input placeholder="Phone" value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} style={{ padding: '10px', borderRadius: 8, border: '1px solid #CBD5E1', width: '100%', background: '#F8FAFC' }} />

              <div style={{ display: 'flex', gap: 20, alignItems: 'center', marginTop: 5 }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.needsAlignment} onChange={e => setForm(p => ({ ...p, needsAlignment: e.target.checked }))} />
                  Needs Alignment
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.85rem', color: '#475569', cursor: 'pointer' }}>
                  <input type="checkbox" checked={form.needsWashing} onChange={e => setForm(p => ({ ...p, needsWashing: e.target.checked }))} />
                  Needs Washing
                </label>
              </div>

              <div style={{ marginTop: 10 }}>
                <p style={{ margin: '0 0 10px', fontWeight: 500, fontSize: '0.85rem', color: '#0F172A' }}>Select Jobs </p>
                <div style={{ display: 'grid', gap: 0, maxHeight: 180, overflowY: 'auto', paddingRight: 8 }}>
                  {jobMasters.length === 0 ? (
                    <span style={{ fontSize: '0.8rem', color: '#EF4444' }}>No templates found.</span>
                  ) : (
                    (() => {
                      const grouped = jobMasters.reduce((acc, job) => {
                        const cat = (job.category || 'General').toUpperCase();
                        if (!acc[cat]) acc[cat] = [];
                        acc[cat].push(job);
                        return acc;
                      }, {});
                      return Object.entries(grouped).map(([category, jobs]) => (
                        <div key={category} style={{ marginBottom: 12 }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#94A3B8', letterSpacing: '0.05em', marginBottom: 6 }}>{category}</div>
                          {jobs.map(job => (
                            <label key={job._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0', cursor: 'pointer' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.85rem', color: '#1E293B', fontWeight: 500 }}>
                                <input type="checkbox" checked={form.selectedJobs.includes(job._id)} onChange={() => toggleJob(job._id)} />
                                {job.title}
                              </div>
                              <span style={{ color: '#94A3B8', fontSize: '0.75rem' }}>{job.estimatedMinutes} min</span>
                            </label>
                          ))}
                        </div>
                      ));
                    })()
                  )}
                </div>
              </div>

              <div style={{ marginTop: 20 }}>
                <Btn primary style={{ width: '100%', justifyContent: 'center' }} disabled={submitting}>
                  {submitting ? 'Adding...' : 'Add Vehicle'}
                </Btn>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
