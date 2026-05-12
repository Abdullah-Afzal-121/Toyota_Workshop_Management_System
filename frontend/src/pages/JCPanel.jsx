import { useState, useEffect } from 'react'
import axios from 'axios'
import { CheckCircle2, ChevronRight, X, User, Clock, Settings, LogOut, CheckCircle, RefreshCcw, Wrench, Menu } from 'lucide-react'
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
        borderRadius: 6, padding: '8px 16px', fontSize: '0.85rem', fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
        boxShadow: primary && !disabled ? '0 2px 4px rgba(235,10,30,0.15)' : 'none',
        display: 'flex', alignItems: 'center', gap: 6, ...style
      }}
    >
      {children}
    </button>
  )
}

function StatBox({ value, label, valueColor = '#0F172A' }) {
  return (
    <div style={{
      background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10,
      padding: '1.25rem', textAlign: 'center', flex: 1,
      boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
    }}>
      <div style={{ fontSize: '2rem', fontWeight: 800, color: valueColor, lineHeight: 1.1, marginBottom: 5 }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600, textTransform: 'uppercase' }}>{label}</div>
    </div>
  )
}

// Minimal Badge
const Badge = ({ text, color, bg }) => (
  <span style={{ fontSize: '0.65rem', fontWeight: 800, padding: '3px 8px', borderRadius: 4, background: bg, color: color, textTransform: 'uppercase' }}>
    {text}
  </span>
)

export default function JCPanel() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [cars, setCars] = useState([])
  const [mechanics, setMechanics] = useState([])
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState(null)
  
  // Allocate Modal state
  const [allocatingCar, setAllocatingCar] = useState(null)
  const [stageAllocations, setStageAllocations] = useState({}) // { stageId: mechanicId }
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok })
    setTimeout(() => setToast(null), 4000)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [carsRes, staffRes] = await Promise.all([
        axios.get('/api/admin/cars'), // IMPORTANT: Updated from /api/cars/all
        axios.get('/api/admin/staff')
      ])
      setCars(carsRes.data.filter(c => c.status !== 'archived'))
      setMechanics(staffRes.data.filter(s => s.role === 'mechanic' || s.role === 'technician'))
    } catch (err) {
      console.error(err)
      showToast('Error loading data', false)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { 
    fetchData()
    const socket = io(import.meta.env.VITE_API_URL || '/')
    socket.on('workshop_update', () => {
      fetchData()
    })
    return () => socket.disconnect()
  }, [])

  const handleAllocate = async (e) => {
    e.preventDefault()

    try {
      const promises = Object.entries(stageAllocations).map(([stageId, mechanicId]) => {
        if (!mechanicId) return Promise.resolve(); // Skip if no mechanic selected
        return axios.put(`/api/admin/stages/${stageId}/allocate`, {
          assignedTechnician: mechanicId
        });
      });
      
      await Promise.all(promises);
      
      showToast('Jobs allocated successfully!')
      setAllocatingCar(null)
      fetchData()
    } catch (err) {
      showToast('Error allocating jobs: ' + (err.response?.data?.message || err.message), false)
    }
  }

  const verifyNextStage = async (stageId) => {
    try {
      await axios.put(`/api/admin/stages/${stageId}/verify`)
      showToast('Stage verified and progressed to next step!')
      fetchData()
    } catch (err) {
      showToast('Error verifying stage', false)
    }
  }

  const rejectStage = async (stageId) => {
    try {
      await axios.put(`/api/admin/stages/${stageId}/reject`)
      showToast('Stage rejected and sent back to mechanic!')
      fetchData()
    } catch (err) {
      showToast('Error rejecting stage', false)
    }
  }

  const markCarReady = async (carId) => {
    try {
      await axios.put(`/api/admin/cars/${carId}/status`, { status: 'ready' })
      showToast('Vehicle marked Ready for Delivery')
      fetchData()
    } catch (err) {
      showToast('Error updating car status', false)
    }
  }

  // Derived KPIs
  const receptionCount = cars.filter(c => c.status === 'pending').length
  const inProgressCount = cars.filter(c => c.status === 'in-service').length
  const readyCount = cars.filter(c => c.status === 'ready').length

  return (
    <div className="admin-layout-container" style={{ background: '#F4F4F5' }}>
      
      {/* Sidebar */}
      <div className={`admin-sidebar-overlay ${sidebarOpen ? 'open' : ''}`} onClick={() => setSidebarOpen(false)} />
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`} style={{ width: 250, background: '#0F172A', color: '#fff' }}>
        <div style={{ padding: '1.5rem', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #1E293B' }}>
          <img src="/toyota-logo.png" style={{ width: 32, background: '#fff', padding: 2, borderRadius: 4 }} />
          <div>
            <div style={{ fontWeight: 800, color: '#fff' }}>Job Controller</div>
            <div style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{user?.name}</div>
          </div>
        </div>
        <div style={{ flex: 1, padding: '1rem' }}>
          <div style={{ padding: '10px 14px', background: 'rgba(235,10,30,0.15)', color: '#fff', borderLeft: `3px solid ${TOYOTA_RED}`, fontWeight: 600, borderRadius: '0 8px 8px 0', cursor: 'pointer', fontSize: '0.85rem' }}>
            Job Operations
          </div>
        </div>
        <button onClick={() => { logout(); navigate('/login') }} style={{ margin: '1rem', background: 'undefined', border: '1px solid #1E293B', color: '#94A3B8', padding: '10px', borderRadius: 8, cursor: 'pointer', display: 'flex', gap: 8, alignItems: 'center', fontWeight: 600, fontSize: '0.85rem', justifyContent: 'center', transition: 'all 0.2s' }}>
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main Content */}
      <main className="admin-main" style={{ padding: '2rem', overflowY: 'auto' }}>
        
        {toast && (
          <div style={{ position: 'fixed', top: 20, right: 20, zIndex: 100, padding: '1rem', background: toast.ok ? '#DCFCE7' : '#FEE2E2', color: toast.ok ? '#16A34A' : '#DC2626', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            {toast.msg}
          </div>
        )}

        <div style={{ marginBottom: '2rem', display: 'flex', alignItems: 'center', gap: 12 }}>
          <button className="d-md-none" onClick={() => setSidebarOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex' }}>
            <Menu size={24} color="#0F172A" />
          </button>
          <div>
            <h2 className="admin-welcome-text" style={{ fontSize: '1.5rem', fontWeight: 800, margin: 0, color: '#0F172A' }}>Job Controller</h2>
            <p className="d-none d-sm-block" style={{ color: '#64748B', margin: '4px 0 0', fontSize: '0.9rem' }}>Allocate jobs, monitor progress, and verify work.</p>
          </div>
        </div>

        {/* Top Stats */}
        <div className="tw-stats-grid" style={{ marginBottom: '2rem' }}>
          <StatBox value={receptionCount} label="Reception" valueColor="#2563EB" />
          <StatBox value={inProgressCount} label="In Progress" valueColor="#D97706" />
          <StatBox value={readyCount} label="Ready" valueColor="#16A34A" />
        </div>

        {loading ? <Spinner animation="border" /> : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {cars.map(car => {
              const statusColors = {
                'pending': { bg: '#DBEAFE', text: '#2563EB', label: 'RECEPTION' },
                'in-service': { bg: '#FEF3C7', text: '#D97706', label: 'IN PRODUCTION' },
                'ready': { bg: '#DCFCE7', text: '#16A34A', label: 'READY' }
              }
              const activeStatus = statusColors[car.status] || statusColors['pending']

              // Aggregate stages visually
              const hasStages = car.stages && car.stages.length > 0;
              const completedStages = hasStages ? car.stages.filter(s => s.isCompleted).length : 0;
              const allVerified = hasStages && car.stages.every(s => s.jcVerified);

              const advisorEmail = car.serviceAdvisor ? car.serviceAdvisor.email : 'Unassigned';
              const techName = car.assignedMechanic ? car.assignedMechanic.name : 'Unassigned';

              // Derive bay from stage technicians (covers per-stage allocation)
              const stageBays = (car.stages || [])
                .map(s => s.assignedTechnician?.bayName)
                .filter(Boolean)
              const uniqueBays = [...new Set(stageBays)]
              const bayName = uniqueBays.length > 0
                ? uniqueBays.join(', ')
                : (car.assignedMechanic?.bayName || 'Unassigned')

              return (
                <div key={car._id} style={{ 
                  background: '#fff', border: '1px solid #E2E8F0', borderRadius: 10, padding: '1.25rem',
                  display: 'flex', flexDirection: 'column', gap: '1rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                }}>
                  {/* Row Top: Info + Allocate Button */}
                  <div className="d-flex flex-column flex-sm-row justify-content-between align-items-sm-start gap-3">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
                      
                      {/* Title & Badge */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>{car.regNumber}</h3>
                        <Badge bg={activeStatus.bg} color={activeStatus.text} text={activeStatus.label} />
                      </div>

                      {/* Info Grid */}
                      <div className="tw-stats-grid" style={{ gap: '1.5rem', alignItems: 'center', fontSize: '0.8rem', color: '#475569' }}>
                        <div><span style={{ color: '#94A3B8' }}>Customer:</span> <strong style={{ color: '#0F172A' }}>{car.customerName}</strong></div>
                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}><span style={{ color: '#94A3B8' }}>Advisor:</span> {advisorEmail}</div>
                        <div>
                          <span style={{ color: '#94A3B8' }}>Bay:</span>{' '}
                          <span style={{ color: uniqueBays.length > 0 ? '#0F172A' : '#94A3B8', fontWeight: uniqueBays.length > 0 ? 700 : 400 }}>
                            {bayName}
                          </span>
                        </div>
                        <div><span style={{ color: '#94A3B8' }}>Est:</span> {car.totalEstimatedMinutes > 0 ? `${car.totalEstimatedMinutes} mins` : '-'}</div>
                      </div>

                      {/* Stages with assigned mechanics */}
                      <div style={{ marginTop: 4 }}>
                        {hasStages ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                              <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stages & Technicians</span>
                              <span style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 500 }}>{completedStages}/{car.stages.length} done</span>
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {car.stages.map((stage, i) => {
                                const tech = stage.assignedTechnician;
                                const isStarted = !!stage.startedAt && !stage.isCompleted;
                                const stageColor = stage.isCompleted
                                  ? { bg: '#F0FDF4', border: '#BBF7D0', text: '#15803D' }
                                  : isStarted
                                  ? { bg: '#FFF7ED', border: '#FED7AA', text: '#C2410C' }
                                  : tech
                                  ? { bg: '#EFF6FF', border: '#BFDBFE', text: '#1D4ED8' }
                                  : { bg: '#F8FAFC', border: '#E2E8F0', text: '#64748B' };
                                return (
                                  <div key={i} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    padding: '6px 10px', borderRadius: 8,
                                    background: stageColor.bg,
                                    border: `1px solid ${stageColor.border}`
                                  }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                      <span style={{
                                        fontSize: '0.78rem', fontWeight: 600,
                                        color: stageColor.text,
                                        textDecoration: stage.isCompleted ? 'line-through' : 'none'
                                      }}>
                                        {stage.isCompleted ? '✓ ' : isStarted ? '▶ ' : `${i + 1}. `}
                                        {stage.stageName}
                                      </span>
                                      {stage.estimatedMinutes && (
                                        <span style={{ fontSize: '0.7rem', color: '#94A3B8' }}>{stage.estimatedMinutes}m</span>
                                      )}
                                      {stage.jcVerified && (
                                        <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 4, background: '#DCFCE7', color: '#16A34A' }}>VERIFIED</span>
                                      )}
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                      {tech ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                          <div style={{
                                            width: 22, height: 22, borderRadius: '50%',
                                            background: '#2563EB', color: '#fff',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontSize: '0.6rem', fontWeight: 800, flexShrink: 0
                                          }}>
                                            {tech.name ? tech.name.charAt(0).toUpperCase() : '?'}
                                          </div>
                                          <div>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>{tech.name}</div>
                                            {tech.bayName && <div style={{ fontSize: '0.65rem', color: '#64748B' }}>{tech.bayName}</div>}
                                          </div>
                                        </div>
                                      ) : (
                                        <span style={{ fontSize: '0.7rem', color: '#94A3B8', fontStyle: 'italic' }}>Unassigned</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>No stages mapped yet</span>
                        )}
                      </div>

                      {/* Stages Remarks */}
                      {hasStages && car.stages.some(s => s.remarks && s.remarks.length > 0) && (
                        <div style={{ marginTop: 8, padding: '8px 12px', background: '#F8FAFC', borderRadius: 8, border: '1px solid #E2E8F0', fontSize: '0.8rem' }}>
                          <div style={{ fontWeight: 700, color: '#64748B', marginBottom: 4 }}>REMARKS / STOPPAGES:</div>
                          {car.stages.map(stage => 
                            stage.remarks && stage.remarks.length > 0 ? (
                              <div key={stage._id} style={{ marginBottom: 4 }}>
                                <span style={{ fontWeight: 600, color: '#475569' }}>[{stage.stageName}]</span>
                                {stage.remarks.map((r, idx) => (
                                  <div key={r._id || idx} style={{ marginLeft: 8, color: r.isStoppage ? '#DC2626' : '#334155' }}>
                                    {r.isStoppage ? '⚠ ' : '▶ '}{r.text}
                                  </div>
                                ))}
                              </div>
                            ) : null
                          )}
                        </div>
                      )}

                    </div>

                    {/* Action Button Right */}
                    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 160, width: '100%', maxWidth: '200px' }} className="mt-3 mt-sm-0">
                      <Btn primary={car.stages.some(s => !s.assignedTechnician)} style={{ background: car.stages.some(s => !s.assignedTechnician) ? '#10B981' : '#F1F5F9', color: car.stages.some(s => !s.assignedTechnician) ? '#fff' : '#0F172A', width: '100%', justifyContent: 'center' }} onClick={() => {
                        setAllocatingCar(car);
                        const initialAllocations = {};
                        car.stages.forEach(s => {
                          initialAllocations[s._id] = s.assignedTechnician || '';
                        });
                        setStageAllocations(initialAllocations);
                      }}>
                        <Wrench size={16} /> Assign Jobs
                      </Btn>

                      {car.stages.some(s => s.assignedTechnician) && (
                        <>
                           {(() => {
                             const pendingVerify = car.stages && car.stages.find(s => s.isCompleted && !s.jcVerified);
                             if (pendingVerify) {
                               return (
                                 <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                   <div style={{ fontSize: '0.7rem', color: '#D97706', fontWeight: 800, textAlign: 'center', background: '#FEF3C7', padding: '4px', borderRadius: 4 }}>
                                     ⚠ Completed: {pendingVerify.stageName}
                                   </div>
                                   <div style={{ display: 'flex', gap: 4 }}>
                                     <Btn primary style={{ background: '#3B82F6', flex: 1, justifyContent: 'center', padding: '8px 4px' }} onClick={() => verifyNextStage(pendingVerify._id)}>
                                       <RefreshCcw size={14} /> Verify
                                     </Btn>
                                     <Btn primary style={{ background: '#EF4444', flex: 1, justifyContent: 'center', padding: '8px 4px' }} onClick={() => rejectStage(pendingVerify._id)}>
                                       <X size={14} /> Reject
                                     </Btn>
                                   </div>
                                 </div>
                               )
                             }
                             return null;
                           })()}

                           {car.status !== 'ready' && completedStages === car.stages.length && car.stages.length > 0 && allVerified && (
                             <Btn primary style={{ background: '#16A34A', width: '100%', justifyContent: 'center' }} onClick={() => markCarReady(car._id)}>
                               <CheckCircle size={16} /> Ready to Deliver
                             </Btn>
                           )}
                           {car.status === 'ready' && (
                             <div style={{ fontSize: '0.8rem', color: '#16A34A', fontWeight: 800, textAlign: 'center', padding: '8px 0' }}>✓ READY</div>
                           )}
                           {car.status === 'in-service' && !car.stages.find(s => s.isCompleted && !s.jcVerified) && completedStages !== car.stages.length && (
                             <div style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600, textAlign: 'center', padding: '8px 0', border: '1px dashed #CBD5E1', borderRadius: 6 }}>⚙ Work In Progress</div>
                           )}
                        </>
                      )}
                    </div>
                  </div>

                </div>
              )
            })}
            
            {cars.length === 0 && (
              <div style={{ padding: '3rem', textAlign: 'center', color: '#94A3B8', border: '2px dashed #E2E8F0', borderRadius: 10 }}>
                No active vehicles right now.
              </div>
            )}
          </div>
        )}
      </main>

      {/* Allocate Modal (Matching the mock design, but light logic) */}
      {allocatingCar && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: '#fff', width: 500, borderRadius: 10, boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ padding: '1.25rem 1.5rem', borderBottom: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800, color: '#0F172A' }}>Allocate Job - {allocatingCar.regNumber}</h3>
              <button onClick={() => setAllocatingCar(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}><X size={20}/></button>
            </div>

            <form onSubmit={handleAllocate} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              
              <div style={{ maxHeight: '60vh', overflowY: 'auto', paddingRight: '8px' }}>
                <p style={{ margin: '0 0 12px 0', fontSize: '0.9rem', color: '#64748B' }}>Assign a technician to each job stage. If a job is already assigned, you can change it here.</p>
                {allocatingCar.stages.map(stage => (
                  <div key={stage._id} style={{ marginBottom: '1rem', padding: '12px', background: '#F8FAFC', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <strong style={{ color: '#0F172A', fontSize: '0.95rem' }}>{stage.stageName}</strong>
                      {stage.estimatedMinutes && <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{stage.estimatedMinutes} mins</span>}
                    </div>
                    <select 
                      value={stageAllocations[stage._id] || ''}
                      onChange={e => setStageAllocations(p => ({ ...p, [stage._id]: e.target.value }))}
                      style={{ width: '100%', padding: '10px 12px', borderRadius: 6, border: '1px solid #CBD5E1', fontSize: '0.9rem', outline: 'none' }}
                      disabled={stage.isCompleted}
                    >
                      <option value="">-- Select Technician --</option>
                      {mechanics.map(m => (
                        <option key={m._id} value={m._id}>{m.name} - {m.bayName || 'No Bay'}</option>
                      ))}
                    </select>
                    {stage.isCompleted && <div style={{ fontSize: '0.75rem', color: '#16A34A', marginTop: 4 }}>✓ Job Completed</div>}
                  </div>
                ))}
              </div>

              <button type="submit" style={{ 
                background: '#10B981', color: '#fff', border: 'none', borderRadius: 6, padding: '12px', 
                fontSize: '0.95rem', fontWeight: 700, cursor: 'pointer', marginTop: 10, transition: 'background 0.2s'
              }}>
                Save Allocations
              </button>
            </form>

          </div>
        </div>
      )}

    </div>
  )
}