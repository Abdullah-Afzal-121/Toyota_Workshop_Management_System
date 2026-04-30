import React, { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { Spinner } from 'react-bootstrap'
import {
  LayoutDashboard, Car, Clock, CheckCircle2, CircleDot,
  PlusCircle, RefreshCw, Eye, X, AlertCircle, Trash2, Archive,
  Settings, Users, UserPlus, Shield, Wrench, UserCircle2,
  LogOut, ChevronRight, Download, Menu, Activity, Edit, MapPin,
  Crosshair, Droplets, Home
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'

// ── Constants ──────────────────────────────────────────────────────────────
const RED     = '#EB0A1E'
const SIDEBAR = '#1A0508'
const ACTIVE  = '#EB0A1E'

const STATUS_META = {
  pending:      { label: 'Waiting for Bay', bg: '#FEF3C7', color: '#D97706', dot: '#F59E0B' },
  'in-service': { label: 'In Service', bg: '#FFF7ED', color: '#EA580C', dot: '#F97316' },
  ready:        { label: 'Delivery Bay',    bg: '#F0FDF4', color: '#16A34A', dot: '#22C55E' },
}

const ROLE_CONFIG = {
  mechanic: { label: 'Mechanic', color: '#B00010', bg: '#FFE4E6', icon: Wrench },
  advisor: { label: 'Advisor', color: '#2563EB', bg: '#DBEAFE', icon: Activity },
  job_controller: { label: 'Job Controller', color: '#D97706', bg: '#FEF3C7', icon: LayoutDashboard },
  customer: { label: 'Customer', color: '#7F1D1D', bg: '#FEE2E2', icon: UserCircle2 },
  admin:    { label: 'Admin',    color: '#1A0508', bg: '#F3D0D4', icon: Shield },
}

const INITIAL_CAR_FORM = { customerName: '', carModel: '', regNumber: '', assignedMechanic: '', needsAlignment: false, needsWashing: false }

const inp = {
  width: '100%', background: '#F8FAFC', border: '1px solid #E2E8F0',
  borderRadius: 8, padding: '0.65rem 0.9rem', fontSize: '0.875rem',
  color: '#0F172A', outline: 'none', boxSizing: 'border-box',
}

// ── Overlay modal shell ────────────────────────────────────────────────────
function Sheet({ open, onClose, title, children, footer }) {
  if (!open) return null
  return (
    <div onClick={onClose} style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 2000, padding: '1rem',
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        background: '#fff', borderRadius: 16, width: '100%', maxWidth: 480,
        maxHeight: '90vh', overflowY: 'auto',
        boxShadow: '0 24px 80px rgba(0,0,0,0.2)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.4rem', borderBottom: '1px solid #F1F5F9' }}>
          <span style={{ fontWeight: 700, color: '#0F172A', fontSize: '1rem' }}>{title}</span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 6, borderRadius: 8, color: '#94A3B8' }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: '1.2rem 1.4rem' }}>{children}</div>
        {footer && (
          <div style={{ padding: '0.85rem 1.4rem', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

// ── Tiny helpers ───────────────────────────────────────────────────────────
function Btn({ children, primary, ghost, danger, onClick, disabled, full, style: extra = {} }) {
  const base = {
    border: 'none', borderRadius: 9, padding: '7px 18px', fontSize: '0.83rem',
    fontWeight: 700, cursor: disabled ? 'not-allowed' : 'pointer',
    display: 'inline-flex', alignItems: 'center', gap: 6,
    opacity: disabled ? 0.65 : 1, transition: 'all 0.15s',
    width: full ? '100%' : undefined, justifyContent: full ? 'center' : undefined, ...extra,
  }
  if (primary) return <button onClick={onClick} disabled={disabled} style={{ ...base, background: 'linear-gradient(135deg,#EB0A1E,#A00010)', color: '#fff', boxShadow: '0 4px 14px rgba(235,10,30,0.3)' }}>{children}</button>
  if (danger)  return <button onClick={onClick} disabled={disabled} style={{ ...base, background: '#EF4444', color: '#fff' }}>{children}</button>
  return <button onClick={onClick} disabled={disabled} style={{ ...base, background: '#F1F5F9', color: '#374151' }}>{children}</button>
}
function ErrorBox({ msg }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 0.9rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 9, color: '#B91C1C', fontSize: '0.82rem', marginBottom: 12 }}><AlertCircle size={14} />{msg}</div>
}
function FieldGroup({ label, children }) {
  return <div style={{ marginBottom: 14 }}><label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: 5 }}>{label}</label>{children}</div>
}
function StatusBadge({ status }) {
  const m = STATUS_META[status] || STATUS_META.pending
  return <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: m.bg, color: m.color, borderRadius: 20, padding: '3px 10px', fontSize: '0.75rem', fontWeight: 700 }}><span style={{ width: 6, height: 6, borderRadius: '50%', background: m.dot, display: 'inline-block' }} />{m.label}</span>
}
function ProgressBar({ value }) {
  return <div style={{ height: 6, background: '#F1F5F9', borderRadius: 99, overflow: 'hidden', flex: 1 }}><div style={{ height: '100%', width: `${value}%`, background: value === 100 ? '#22C55E' : `linear-gradient(90deg,${RED},#FF6B6B)`, borderRadius: 99, transition: 'width 0.4s' }} /></div>
}

// ── Car detail sheet ───────────────────────────────────────────────────────
function CarDetailSheet({ car, onClose }) {
  if (!car) return null
  return (
    <Sheet open={!!car} onClose={onClose} title={`${car.regNumber} — ${car.carModel}`}
      footer={<Btn ghost onClick={onClose}>Close</Btn>}>
      <p style={{ fontSize: '0.85rem', color: '#475569', marginBottom: 8 }}><strong>Customer:</strong> {car.customerName}</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        <span style={{ fontSize: '0.82rem', color: '#475569', fontWeight: 600 }}>Status:</span>
        <StatusBadge status={car.status} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#0F172A' }}>Progress</span>
        <span style={{ fontWeight: 800, color: car.progress === 100 ? '#16A34A' : RED }}>{car.progress}%</span>
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 12 }}><ProgressBar value={car.progress} /></div>
      <p style={{ fontSize: '0.83rem', color: '#64748B', margin: '0 0 1rem' }}><strong>Current Stage:</strong> {car.currentStage}</p>
      {car.feedback?.rating ? (
        <div style={{ padding: '0.9rem 1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10 }}>
          <p style={{ fontWeight: 700, fontSize: '0.78rem', color: '#15803D', margin: '0 0 0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Customer Feedback</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
            {[1,2,3,4,5].map(s => <span key={s} style={{ fontSize: '1.1rem', color: s <= car.feedback.rating ? '#F59E0B' : '#E2E8F0' }}>★</span>)}
            <span style={{ fontSize: '0.8rem', color: '#64748B', marginLeft: 4 }}>{car.feedback.rating}/5</span>
          </div>
          {car.feedback.comment && <p style={{ color: '#475569', fontSize: '0.83rem', margin: 0, fontStyle: 'italic' }}>"{car.feedback.comment}"</p>}
        </div>
      ) : car.status === 'ready' ? (
        <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>No feedback submitted yet.</p>
      ) : null}
    </Sheet>
  )
}

// ── Add car sheet ──────────────────────────────────────────────────────────
function AddCarSheet({ open, onClose, onCarAdded }) {
  const [form, setForm]      = useState(INITIAL_CAR_FORM)
  const [submitting, setSub] = useState(false)
  const [error, setError]    = useState(null)
  const [mechanics, setMechanics] = useState([])

  useEffect(() => {
    if (!open) return
    axios.get('/api/admin/staff').then(({ data }) => {
      setMechanics(data.filter(u => u.role === 'mechanic'))
    }).catch(() => {})
  }, [open])

  const handleSubmit = async (e) => {
    e.preventDefault()
    const { customerName, carModel, regNumber, assignedMechanic, needsAlignment, needsWashing } = form
    if (!customerName.trim() || !carModel.trim() || !regNumber.trim()) { setError('All fields are required.'); return }
    if (!assignedMechanic) { setError('Please assign a mechanic.'); return }
    setSub(true)
    try {
      const { data } = await axios.post('/api/admin/add-car', { customerName: customerName.trim(), carModel: carModel.trim(), regNumber: regNumber.trim().toUpperCase(), assignedMechanic, needsAlignment, needsWashing })
      onCarAdded(data); setForm(INITIAL_CAR_FORM); onClose()
    } catch (err) { setError(err.response?.data?.message || 'Failed to add car.') }
    finally { setSub(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Register New Vehicle"
      footer={<><Btn ghost onClick={onClose} disabled={submitting}>Cancel</Btn><Btn primary onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving…' : 'Register'}</Btn></>}>
      <form onSubmit={handleSubmit}>
        {error && <ErrorBox msg={error} />}
        {[{ name: 'customerName', label: 'Customer Name', placeholder: 'e.g. Ahmed Al-Rashidi' },
          { name: 'carModel',     label: 'Car Model',     placeholder: 'e.g. Toyota Camry 2022' },
          { name: 'regNumber',    label: 'Reg. Number',   placeholder: 'e.g. ABC-1234' }].map(f => (
          <FieldGroup key={f.name} label={f.label}>
            <input type="text" style={{ ...inp, textTransform: f.name === 'regNumber' ? 'uppercase' : 'none' }}
              placeholder={f.placeholder} value={form[f.name]}
              onChange={e => { setForm(p => ({ ...p, [f.name]: e.target.value })); setError(null) }} required />
          </FieldGroup>
        ))}
        <FieldGroup label="Assign Mechanic">
          <select
            style={{ ...inp, cursor: 'pointer', appearance: 'auto' }}
            value={form.assignedMechanic}
            onChange={e => { setForm(p => ({ ...p, assignedMechanic: e.target.value })); setError(null) }}
            required
          >
            <option value="">— Select mechanic —</option>
            {mechanics.map(m => (
              <option key={m._id} value={m._id}>{m.name} ({m.email})</option>
            ))}
          </select>
          {mechanics.length === 0 && <p style={{ fontSize: '0.73rem', color: '#94A3B8', margin: '4px 0 0' }}>No mechanics found. Add one in Staff Management first.</p>}
        </FieldGroup>
        <div style={{ background: '#F8FAFC', border: '1px dashed #CBD5E1', borderRadius: 10, padding: '0.75rem 1rem' }}>
          <p style={{ fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 0.5rem' }}>Optional Workflow Stages</p>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#374151', cursor: 'pointer', marginBottom: 6 }}>
            <input type="checkbox" checked={form.needsAlignment} onChange={e => setForm(p => ({ ...p, needsAlignment: e.target.checked }))} />
            Include Alignment Process
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#374151', cursor: 'pointer', marginBottom: 6 }}>
            <input type="checkbox" checked={form.needsWashing} onChange={e => setForm(p => ({ ...p, needsWashing: e.target.checked }))} />
            Include Washing Process
          </label>
          <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '8px 0 0' }}>Use the ⚙ button later to add custom production jobs.</p>
        </div>
      </form>
    </Sheet>
  )
}

// ── Stage manage sheet ─────────────────────────────────────────────────────
function StageManageSheet({ car, onClose, onChanged }) {
  const [stages, setStages]     = useState([])
  const [loading, setLoading]   = useState(false)
  const [newStage, setNewStage] = useState('')
  const [newEst, setNewEst]     = useState('')
  const [adding, setAdding]     = useState(false)
  const [delId, setDelId]       = useState(null)
  const [err, setErr]           = useState(null)

  useEffect(() => {
    if (!car) return
    setLoading(true); setErr(null)
    axios.get(`/api/admin/cars/${car._id}/stages`).then(({ data }) => setStages(data)).catch(() => setErr('Could not load stages.')).finally(() => setLoading(false))
  }, [car])

  const handleAdd = async () => {
    const name = newStage.trim(); if (!name) return
    setAdding(true)
    try {
      const { data } = await axios.post(`/api/admin/cars/${car._id}/stages`, { stageName: name, estimatedMinutes: parseInt(newEst) || null })
      setStages(s => [...s, data]); setNewStage(''); setNewEst(''); onChanged()
    } catch (e) { setErr(e.response?.data?.message || 'Could not add stage.') }
    finally { setAdding(false) }
  }

  const handleDelete = async (id) => {
    setDelId(id)
    try { await axios.delete(`/api/admin/stages/${id}`); setStages(s => s.filter(x => x._id !== id)); onChanged() }
    catch (e) { setErr(e.response?.data?.message || 'Could not delete.') }
    finally { setDelId(null) }
  }

  if (!car) return null
  return (
    <Sheet open={!!car} onClose={onClose} title={`Manage Stages — ${car.regNumber}`}
      footer={<Btn ghost onClick={onClose}>Close</Btn>}>
      {err && <ErrorBox msg={err} />}
      {loading && <div style={{ textAlign: 'center', padding: '2rem' }}><Spinner size="sm" animation="border" /></div>}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
        {stages.map((s, i) => (
          <div key={s._id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.55rem 0.8rem', borderRadius: 9, background: s.isCompleted ? '#F0FDF4' : '#F8FAFC', border: `1px solid ${s.isCompleted ? '#BBF7D0' : '#E2E8F0'}` }}>
            <span style={{ width: 22, height: 22, borderRadius: '50%', background: s.isCompleted ? '#16A34A' : '#E2E8F0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.68rem', color: s.isCompleted ? '#fff' : '#94A3B8', fontWeight: 700 }}>{i + 1}</span>
            <span style={{ flex: 1, fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>{s.stageName}</span>
            {s.estimatedMinutes && <span style={{ fontSize: '0.68rem', color: '#B00010', background: '#FFE4E6', borderRadius: 5, padding: '1px 6px' }}>Est {s.estimatedMinutes}m</span>}
            {s.isCompleted && <span style={{ fontSize: '0.68rem', background: '#DCFCE7', color: '#16A34A', borderRadius: 20, padding: '1px 8px', fontWeight: 700 }}>Done</span>}
            <button onClick={() => handleDelete(s._id)} disabled={delId === s._id || s.isCompleted} style={{ background: 'none', border: 'none', cursor: s.isCompleted ? 'not-allowed' : 'pointer', padding: 4, display: 'flex', opacity: s.isCompleted ? 0.3 : 1 }}>
              {delId === s._id ? <Spinner size="sm" animation="border" style={{ width: 14, height: 14 }} /> : <Trash2 size={14} color="#EF4444" />}
            </button>
          </div>
        ))}
        {!loading && stages.length === 0 && <p style={{ color: '#94A3B8', fontSize: '0.83rem', textAlign: 'center', padding: '0.75rem', margin: 0 }}>No stages yet.</p>}
      </div>
      {stages.length > 0 && stages.some(s => s.estimatedMinutes) && (() => {
        const t = stages.reduce((sum, s) => sum + (s.estimatedMinutes || 0), 0)
        const label = t >= 60 ? `${Math.floor(t / 60)}h${t % 60 ? ` ${t % 60}m` : ''}` : `${t}m`
        return (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 10 }}>
            <span style={{ fontSize: '0.75rem', color: '#6366F1', background: '#EEF2FF', borderRadius: 6, padding: '3px 10px', fontWeight: 700 }}>
              ⏱ Total Estimated: {label}
            </span>
          </div>
        )
      })()}
      <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.9rem' }}>
        <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8rem', color: '#374151', marginBottom: 6 }}>Add New Stage</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <input type="text" style={{ ...inp, flex: 1 }} placeholder="e.g. Brake Inspection" value={newStage} onChange={e => setNewStage(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleAdd()} />
          <input type="number" style={{ ...inp, width: 90 }} placeholder="Min" min="1" value={newEst} onChange={e => setNewEst(e.target.value)} />
        </div>
        <Btn primary onClick={handleAdd} disabled={adding || !newStage.trim()} full>
          {adding ? <Spinner size="sm" animation="border" /> : <><PlusCircle size={14} /> Add Stage</>}
        </Btn>
      </div>
    </Sheet>
  )
}

// ── Create staff sheet ─────────────────────────────────────────────────────
function CreateStaffSheet({ open, onClose, onCreated, bays = [] }) {
  const [form, setForm]      = useState({ name: '', email: '', password: '', role: 'mechanic', bayName: '', specialization: '' })
  const [submitting, setSub] = useState(false)
  const [error, setError]    = useState(null)
  const [showPw, setShowPw]  = useState(false)

  const reset = () => { setForm({ name: '', email: '', password: '', role: 'mechanic', bayName: '', specialization: '' }); setError(null) }

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(null)
    if (!form.name || !form.email || !form.password) { setError('All fields are required.'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return }
    
    const payload = { ...form };
    if (payload.role !== 'mechanic') { delete payload.bayName; delete payload.specialization; }
    else if (!payload.bayName || !payload.specialization) { setError('Bay Name and Specialization are required for mechanics.'); return }

    setSub(true)
    try {
      const { data } = await axios.post('/api/admin/staff', payload)
      onCreated(data.user); reset(); onClose()
    } catch (err) { setError(err.response?.data?.message || 'Failed to create account.') }
    finally { setSub(false) }
  }

  return (
    <Sheet open={open} onClose={() => { reset(); onClose() }} title="Create Staff Account"
      footer={<><Btn ghost onClick={() => { reset(); onClose() }} disabled={submitting}>Cancel</Btn><Btn primary onClick={handleSubmit} disabled={submitting}>{submitting ? 'Creating…' : 'Create Account'}</Btn></>}>
      <form onSubmit={handleSubmit}>
        {error && <ErrorBox msg={error} />}
        <FieldGroup label="Role">
          <div style={{ display: 'flex', gap: 8 }}>
            {Object.entries(ROLE_CONFIG).filter(([r]) => !['admin', 'customer'].includes(r)).map(([r, cfg]) => {
              const Icon = cfg.icon; const active = form.role === r
              return (
                <button key={r} type="button" onClick={() => setForm(f => ({ ...f, role: r }))}
                  style={{ flex: 1, border: `2px solid ${active ? cfg.color : '#E2E8F0'}`, borderRadius: 10, padding: '0.55rem 0.4rem', background: active ? cfg.bg : '#fff', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, transition: 'all 0.15s' }}>
                  <Icon size={16} color={active ? cfg.color : '#94A3B8'} />
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: active ? cfg.color : '#64748B', letterSpacing: '0.04em' }}>{cfg.label.toUpperCase()}</span>
                </button>
              )
            })}
          </div>
        </FieldGroup>
        {[{ k: 'name', l: 'Full Name', p: 'e.g. Ahmed Ali', t: 'text' }, { k: 'email', l: 'Email', p: 'e.g. ahmed@toyota.com', t: 'email' }].map(({ k, l, p, t }) => (
          <FieldGroup key={k} label={l}><input type={t} style={inp} placeholder={p} value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} required /></FieldGroup>
        ))}
        {form.role === 'mechanic' && (
          <>
            <FieldGroup label="Bay Name">
              <select style={{ ...inp, cursor: 'pointer', appearance: 'auto' }} value={form.bayName || ''} onChange={e => setForm(f => ({ ...f, bayName: e.target.value }))} required>
                <option value="">— Select a Bay —</option>
                {bays.map(b => (
                  <option key={b._id} value={b.name}>{b.name}</option>
                ))}
              </select>
              {bays.length === 0 && <p style={{ fontSize: '0.73rem', color: '#94A3B8', margin: '4px 0 0' }}>No bays available. Create one first.</p>}
            </FieldGroup>
            <FieldGroup label="Specialization">
              <input type="text" style={inp} placeholder="e.g. Engine & Transmission" value={form.specialization || ''} onChange={e => setForm(f => ({ ...f, specialization: e.target.value }))} required />
            </FieldGroup>
          </>
        )}
        <FieldGroup label="Password">
          <div style={{ position: 'relative' }}>
            <input type={showPw ? 'text' : 'password'} style={{ ...inp, paddingRight: '2.6rem' }} placeholder="Min. 6 characters" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required />
            <button type="button" onClick={() => setShowPw(v => !v)} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: 0, display: 'flex' }}>{showPw ? '🙈' : '👁️'}</button>
          </div>
        </FieldGroup>
      </form>
    </Sheet>
  )
}

// ── Admin Profile Modal ───────────────────────────────────────────────────
function AdminProfileModal({ open, onClose, user, onUpdated }) {
  const [preview, setPreview]     = useState(null)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState(null)
  const [success, setSuccess]     = useState(null)
  const fileRef = useRef()

  useEffect(() => { if (!open) { setPreview(null); setError(null); setSuccess(null) } }, [open])

  if (!open || !user) return null
  const initials = (user.name || 'A').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const joined = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'N/A'
  const currentAvatar = preview || user.avatar || null

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 5 * 1024 * 1024) { setError('Image must be under 5MB.'); return }
    setError(null); setSuccess(null)
    const reader = new FileReader()
    reader.onload = (ev) => {
      // Compress via canvas to max 400x400 JPEG
      const img = new Image()
      img.onload = () => {
        const MAX = 400
        let { width, height } = img
        if (width > MAX || height > MAX) {
          if (width > height) { height = Math.round(height * MAX / width); width = MAX }
          else { width = Math.round(width * MAX / height); height = MAX }
        }
        const canvas = document.createElement('canvas')
        canvas.width = width; canvas.height = height
        canvas.getContext('2d').drawImage(img, 0, 0, width, height)
        setPreview(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.src = ev.target.result
    }
    reader.readAsDataURL(file)
  }

  const saveAvatar = async () => {
    if (!preview) return
    setSaving(true); setError(null); setSuccess(null)
    try {
      const { data } = await axios.put('/api/admin/avatar', { avatar: preview })
      setSuccess('Profile picture updated!')
      onUpdated && onUpdated({ ...user, avatar: data.avatar })
      setPreview(null)
    } catch (e) {
      const msg = e.response?.data?.message
      if (e.response?.status === 413 || (!msg && e.message?.includes('Large'))) setError('Image too large. Please use a smaller image (max 2MB).')
      else setError(msg || `Upload failed (${e.response?.status ?? 'network error'}).`)
    }
    finally { setSaving(false) }
  }

  const removeAvatar = async () => {
    setSaving(true); setError(null); setSuccess(null)
    try {
      await axios.put('/api/admin/avatar', { avatar: '' })
      setSuccess('Profile picture removed.')
      onUpdated && onUpdated({ ...user, avatar: null })
      setPreview(null)
    } catch (e) { setError(e.response?.data?.message || 'Failed.') }
    finally { setSaving(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="My Profile" footer={<Btn ghost onClick={onClose}>Close</Btn>}>
      {/* Avatar upload area */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ position: 'relative' }}>
          <div onClick={() => fileRef.current?.click()} style={{ width: 88, height: 88, borderRadius: '50%', background: currentAvatar ? 'transparent' : 'linear-gradient(135deg,#EB0A1E,#A00010)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 800, color: '#fff', boxShadow: '0 4px 18px rgba(235,10,30,0.3)', cursor: 'pointer', overflow: 'hidden', border: '3px solid #EB0A1E' }}>
            {currentAvatar
              ? <img src={currentAvatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : initials
            }
          </div>
          <div onClick={() => fileRef.current?.click()} style={{ position: 'absolute', bottom: 2, right: 2, width: 26, height: 26, background: '#EB0A1E', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', border: '2px solid #fff', boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }}>
            <span style={{ color: '#fff', fontSize: '0.7rem' }}>✎</span>
          </div>
        </div>
        <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
        <p style={{ margin: 0, fontSize: '0.72rem', color: '#94A3B8' }}>Click avatar to change • Compressed automatically</p>

        {error   && <div style={{ fontSize: '0.78rem', color: '#B91C1C', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: 8, padding: '5px 10px' }}>{error}</div>}
        {success && <div style={{ fontSize: '0.78rem', color: '#15803D', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 8, padding: '5px 10px' }}>✓ {success}</div>}

        {preview && (
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn primary onClick={saveAvatar} disabled={saving} style={{ fontSize: '0.75rem', padding: '5px 14px' }}>{saving ? 'Saving…' : 'Save Photo'}</Btn>
            <Btn ghost onClick={() => setPreview(null)} style={{ fontSize: '0.75rem', padding: '5px 14px' }}>Cancel</Btn>
          </div>
        )}
        {!preview && user.avatar && (
          <button onClick={removeAvatar} disabled={saving} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.72rem', color: '#EF4444' }}>Remove photo</button>
        )}
      </div>

      {/* Info */}
      <div style={{ textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontWeight: 800, fontSize: '1.05rem', color: '#0F172A' }}>{user.name}</div>
        <div style={{ fontSize: '0.82rem', color: '#64748B' }}>{user.email}</div>
        <span style={{ display: 'inline-block', marginTop: 6, background: '#FFE4E6', color: '#B00010', borderRadius: 20, padding: '3px 14px', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em' }}>Administrator</span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[['Full Name', user.name], ['Email Address', user.email], ['Role', 'Admin'], ['Member Since', joined]].map(([label, val]) => (
          <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.9rem', background: '#F8FAFC', borderRadius: 9, border: '1px solid #E2E8F0' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#0F172A' }}>{val}</span>
          </div>
        ))}
      </div>
    </Sheet>
  )
}

// ── Admin Settings Modal ───────────────────────────────────────────────────
function AdminSettingsModal({ open, onClose, user, onUpdated }) {
  const [tab, setTab]           = useState('profile')
  const [name, setName]         = useState('')
  const [email, setEmail]       = useState('')
  const [profLoading, setProfL] = useState(false)
  const [profError, setProfErr] = useState(null)
  const [profSuccess, setProfOk]= useState(null)
  const [curPw, setCurPw]       = useState('')
  const [newPw, setNewPw]       = useState('')
  const [conPw, setConPw]       = useState('')
  const [pwLoading, setPwL]     = useState(false)
  const [pwError, setPwErr]     = useState(null)
  const [pwSuccess, setPwOk]    = useState(null)

  useEffect(() => {
    if (open && user) { setName(user.name || ''); setEmail(user.email || '') }
  }, [open, user])

  const handleClose = () => {
    setProfErr(null); setProfOk(null); setPwErr(null); setPwOk(null)
    setCurPw(''); setNewPw(''); setConPw('')
    onClose()
  }

  const saveProfile = async () => {
    if (!name.trim()) { setProfErr('Name cannot be empty.'); return }
    setProfL(true); setProfErr(null); setProfOk(null)
    try {
      const { data } = await axios.put('/api/admin/profile', { name: name.trim(), email: email.trim() })
      setProfOk('Profile updated successfully.')
      onUpdated && onUpdated(data.user)
    } catch (e) { setProfErr(e.response?.data?.message || `Update failed (${e.response?.status ?? 'network error'}).`) }
    finally { setProfL(false) }
  }

  const savePassword = async () => {
    if (!curPw || !newPw || !conPw) { setPwErr('All password fields are required.'); return }
    if (newPw !== conPw) { setPwErr('New passwords do not match.'); return }
    if (newPw.length < 6) { setPwErr('New password must be at least 6 characters.'); return }
    setPwL(true); setPwErr(null); setPwOk(null)
    try {
      const { data } = await axios.put('/api/admin/change-password', { currentPassword: curPw, newPassword: newPw })
      setPwOk(data.message)
      setCurPw(''); setNewPw(''); setConPw('')
    } catch (e) { setPwErr(e.response?.data?.message || `Failed (${e.response?.status ?? 'network error'}).`) }
    finally { setPwL(false) }
  }

  const tabStyle = (t) => ({
    flex: 1, border: 'none', borderRadius: 8, padding: '7px', fontSize: '0.8rem', fontWeight: 700,
    cursor: 'pointer', background: tab === t ? '#EB0A1E' : '#F1F5F9',
    color: tab === t ? '#fff' : '#64748B', transition: 'all 0.15s',
  })

  return (
    <Sheet open={open} onClose={handleClose} title="Settings">
      <div style={{ display: 'flex', gap: 6, marginBottom: 20 }}>
        <button style={tabStyle('profile')} onClick={() => setTab('profile')}>Update Profile</button>
        <button style={tabStyle('password')} onClick={() => setTab('password')}>Change Password</button>
      </div>

      {tab === 'profile' && (
        <div>
          {profError  && <ErrorBox msg={profError} />}
          {profSuccess && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 0.9rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9, color: '#15803D', fontSize: '0.82rem', marginBottom: 12 }}>✓ {profSuccess}</div>}
          <FieldGroup label="Full Name">
            <input type="text" style={inp} value={name} onChange={e => { setName(e.target.value); setProfErr(null); setProfOk(null) }} placeholder="Your name" />
          </FieldGroup>
          <FieldGroup label="Email Address">
            <input type="email" style={inp} value={email} onChange={e => { setEmail(e.target.value); setProfErr(null); setProfOk(null) }} placeholder="your@email.com" />
          </FieldGroup>
          <Btn primary full onClick={saveProfile} disabled={profLoading}>{profLoading ? 'Saving…' : 'Save Changes'}</Btn>
        </div>
      )}

      {tab === 'password' && (
        <div>
          {pwError   && <ErrorBox msg={pwError} />}
          {pwSuccess && <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 0.9rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 9, color: '#15803D', fontSize: '0.82rem', marginBottom: 12 }}>✓ {pwSuccess}</div>}
          <FieldGroup label="Current Password">
            <input type="password" style={inp} value={curPw} onChange={e => { setCurPw(e.target.value); setPwErr(null); setPwOk(null) }} placeholder="Enter current password" />
          </FieldGroup>
          <FieldGroup label="New Password">
            <input type="password" style={inp} value={newPw} onChange={e => { setNewPw(e.target.value); setPwErr(null); setPwOk(null) }} placeholder="Min. 6 characters" />
          </FieldGroup>
          <FieldGroup label="Confirm New Password">
            <input type="password" style={inp} value={conPw} onChange={e => { setConPw(e.target.value); setPwErr(null); setPwOk(null) }} placeholder="Repeat new password" />
          </FieldGroup>
          <Btn primary full onClick={savePassword} disabled={pwLoading}>{pwLoading ? 'Updating…' : 'Change Password'}</Btn>
        </div>
      )}
    </Sheet>
  )
}

function CreateJobSheet({ open, onClose, onCreated, jobMasters }) {
  const [title, setTitle] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  
  const uniqueCategories = [...new Set((jobMasters || []).map(j => j.category).filter(Boolean))]
  const categories = uniqueCategories.length > 0 ? uniqueCategories : ['Maintenance', 'Repair', 'Alignment', 'Washing', 'Diagnostics', 'AC', 'Electrical', 'General']
  const [category, setCategory] = useState(categories[0] || 'Maintenance')
  const [isNewCategory, setIsNewCategory] = useState(false)

  useEffect(() => { 
    if (open) { 
      setTitle(''); 
      setCategory(categories[0] || 'Maintenance'); 
      setIsNewCategory(false);
      setEstimatedMinutes(30); 
      setErr(null) 
    } 
  }, [open, jobMasters])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setErr(null)
    try {
      const { data } = await axios.post('/api/admin/job-master', { title, category, estimatedMinutes })
      onCreated(data.job)
      onClose()
    } catch (e) { setErr(e.response?.data?.message || 'Failed to create.') }
    finally { setLoading(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="New Service Template">
      {err && <ErrorBox msg={err} />}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <FieldGroup label="Service Title">
          <input autoFocus type="text" style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. Engine Diagnostics" required />
        </FieldGroup>
        <FieldGroup label="Category">
          {!isNewCategory ? (
            <select style={{ ...inp, cursor: 'pointer' }} value={category} onChange={e => {
              if (e.target.value === '__NEW__') { setIsNewCategory(true); setCategory(''); }
              else { setCategory(e.target.value); }
            }} required>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__NEW__" style={{ fontWeight: 'bold' }}>+ Add Custom Category...</option>
            </select>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input autoFocus type="text" style={{...inp, flex: 1}} value={category} onChange={e => setCategory(e.target.value)} placeholder="New category name" required />
              <button type="button" onClick={() => { setIsNewCategory(false); setCategory(categories[0] || 'General') }} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '0 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>Cancel</button>
            </div>
          )}
        </FieldGroup>
        <FieldGroup label="Default Estimate (Minutes)">
          <input type="number" style={inp} value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} required min={1} />
        </FieldGroup>
        <Btn primary full style={{ marginTop: 10, padding: 12 }}>{loading ? 'Creating…' : 'Save Service'}</Btn>
      </form>
    </Sheet>
  )
}

function EditJobSheet({ job, open, onClose, onUpdated, jobMasters }) {
  const [title, setTitle] = useState('')
  const [estimatedMinutes, setEstimatedMinutes] = useState(30)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)
  
  const uniqueCategories = [...new Set((jobMasters || []).map(j => j.category).filter(Boolean))]
  const categories = uniqueCategories.length > 0 ? uniqueCategories : ['Maintenance', 'Repair', 'Alignment', 'Washing', 'Diagnostics', 'AC', 'Electrical', 'General']
  const [category, setCategory] = useState(categories[0] || 'Maintenance')
  const [isNewCategory, setIsNewCategory] = useState(false)

  useEffect(() => { 
    if (open && job) { 
      setTitle(job.title || ''); 
      setEstimatedMinutes(job.estimatedMinutes || 30); 
      if (categories.includes(job.category)) {
        setCategory(job.category || categories[0]);
        setIsNewCategory(false);
      } else {
        setCategory(job.category || '');
        setIsNewCategory(true);
      }
      setErr(null) 
    } 
  }, [open, job, jobMasters])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setErr(null)
    try {
      const { data } = await axios.put(`/api/admin/job-master/${job._id}`, { title, category, estimatedMinutes })
      onUpdated(data.job)
      onClose()
    } catch (e) { setErr(e.response?.data?.message || 'Failed to update.') }
    finally { setLoading(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit Service Template">
      {err && <ErrorBox msg={err} />}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <FieldGroup label="Service Title">
          <input autoFocus type="text" style={inp} value={title} onChange={e => setTitle(e.target.value)} required />
        </FieldGroup>
        <FieldGroup label="Category">
          {!isNewCategory ? (
            <select style={{ ...inp, cursor: 'pointer' }} value={category} onChange={e => {
              if (e.target.value === '__NEW__') { setIsNewCategory(true); setCategory(''); }
              else { setCategory(e.target.value); }
            }} required>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
              <option value="__NEW__" style={{ fontWeight: 'bold' }}>+ Add Custom Category...</option>
            </select>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <input autoFocus type="text" style={{...inp, flex: 1}} value={category} onChange={e => setCategory(e.target.value)} placeholder="New category name" required />
              <button type="button" onClick={() => { setIsNewCategory(false); setCategory(categories.includes(job?.category) ? job.category : categories[0]) }} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '0 12px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: 600, color: '#475569' }}>Cancel</button>
            </div>
          )}
        </FieldGroup>
        <FieldGroup label="Default Estimate (Minutes)">
          <input type="number" style={inp} value={estimatedMinutes} onChange={e => setEstimatedMinutes(e.target.value)} required min={1} />
        </FieldGroup>
        <Btn primary full style={{ marginTop: 10, padding: 12 }}>{loading ? 'Updating…' : 'Update Service'}</Btn>
      </form>
    </Sheet>
  )
}

// ── Create/Edit Bay sheets ──────────────────────────────────────────────────
function CreateBaySheet({ open, onClose, onCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  useEffect(() => { if (open) { setName(''); setDescription(''); setErr(null) } }, [open])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setErr(null)
    try {
      const { data } = await axios.post('/api/admin/bays', { name, description })
      onCreated(data.bay)
      onClose()
    } catch (e) { setErr(e.response?.data?.message || 'Failed to create.') }
    finally { setLoading(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="New Workshop Bay">
      {err && <ErrorBox msg={err} />}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <FieldGroup label="Bay Name">
          <input autoFocus type="text" style={inp} value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Bay 1 - General" required />
        </FieldGroup>
        <FieldGroup label="Description (Optional)">
          <input type="text" style={inp} value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Main repair area" />
        </FieldGroup>
        <Btn primary full style={{ marginTop: 10, padding: 12 }}>{loading ? 'Creating…' : 'Save Bay'}</Btn>
      </form>
    </Sheet>
  )
}

function EditBaySheet({ bay, open, onClose, onUpdated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState(null)

  useEffect(() => { if (open && bay) { setName(bay.name || ''); setDescription(bay.description || ''); setErr(null) } }, [open, bay])

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true); setErr(null)
    try {
      const { data } = await axios.put(`/api/admin/bays/${bay._id}`, { name, description })
      onUpdated(data.bay)
      onClose()
    } catch (e) { setErr(e.response?.data?.message || 'Failed to update.') }
    finally { setLoading(false) }
  }

  return (
    <Sheet open={open} onClose={onClose} title="Edit Workshop Bay">
      {err && <ErrorBox msg={err} />}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        <FieldGroup label="Bay Name">
          <input autoFocus type="text" style={inp} value={name} onChange={e => setName(e.target.value)} required />
        </FieldGroup>
        <FieldGroup label="Description (Optional)">
          <input type="text" style={inp} value={description} onChange={e => setDescription(e.target.value)} />
        </FieldGroup>
        <Btn primary full style={{ marginTop: 10, padding: 12 }}>{loading ? 'Updating…' : 'Update Bay'}</Btn>
      </form>
    </Sheet>
  )
}

// ══════════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ────────────────────────────────────────────────────────
// ══════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user, logout } = useAuth()

  const [activePage, setActivePage]   = useState('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const [stats, setStats]   = useState({ total: 0, inService: 0, ready: 0, pending: 0 })
  const [cars, setCars]     = useState([])
  const [staff, setStaff]   = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingCars, setLoadingCars]   = useState(true)
  const [loadingStaff, setLoadingStaff] = useState(true)

  const [search, setSearch]           = useState('')
  const [staffSearch, setStaffSearch] = useState('')
  const [detailCar, setDetailCar]     = useState(null)
  const [deleteConfirmId, setDeleteConfirmId]     = useState(null)
  const [deletingCarId, setDeletingCarId]         = useState(null)
  const [archiveConfirmId, setArchiveConfirmId]   = useState(null)
  const [archivingCarId, setArchivingCarId]       = useState(null)
  const [showArchived, setShowArchived]           = useState(false)
  const [showCreateStaff, setShowCreateStaff]     = useState(false)
  const [deletingStaffId, setDeletingStaffId]     = useState(null)
  const [confirmStaffId, setConfirmStaffId]       = useState(null)
  const [toast, setToast]                         = useState(null)
  const [showProfile, setShowProfile]             = useState(false)
  const [showSettings, setShowSettings]           = useState(false)
  const [adminUser, setAdminUser]                 = useState(null)

  const [jobMasters, setJobMasters]               = useState([])
  const [loadingJobs, setLoadingJobs]             = useState(true)
  const [showAddJob, setShowAddJob]               = useState(false)
  const [deletingJobId, setDeletingJobId]         = useState(null)
  const [confirmJobId, setConfirmJobId]           = useState(null)

  const [editJob, setEditJob]                     = useState(null)

  const [bays, setBays]                           = useState([])
  const [loadingBays, setLoadingBays]             = useState(true)
  const [showCreateBay, setShowCreateBay]         = useState(false)
  const [editBay, setEditBay]                     = useState(null)
  const [deletingBayId, setDeletingBayId]         = useState(null)
  const [confirmBayId, setConfirmBayId]           = useState(null)

  useEffect(() => { if (user) setAdminUser(user) }, [user])

  // Refresh user data from server to pick up avatar + createdAt
  useEffect(() => {
    axios.get('/api/auth/me').then(({ data }) => setAdminUser(data.user)).catch(() => {})
  }, [])

  const fetchStats = useCallback(async () => {
    setLoadingStats(true)
    try { const { data } = await axios.get('/api/admin/stats'); setStats(data) } catch {}
    finally { setLoadingStats(false) }
  }, [])

  const fetchCars = useCallback(async () => {
    setLoadingCars(true)
    try { const { data } = await axios.get('/api/admin/cars'); setCars(data) } catch {}
    finally { setLoadingCars(false) }
  }, [])

  const fetchStaff = useCallback(async () => {
    setLoadingStaff(true)
    try { const { data } = await axios.get('/api/admin/staff'); setStaff(data) } catch {}
    finally { setLoadingStaff(false) }
  }, [])

  const fetchJobs = useCallback(async () => {
    setLoadingJobs(true)
    try { const { data } = await axios.get('/api/admin/job-master'); setJobMasters(data) } catch {}
    finally { setLoadingJobs(false) }
  }, [])

  const fetchBays = useCallback(async () => {
    setLoadingBays(true)
    try { const { data } = await axios.get('/api/admin/bays'); setBays(data) } catch {}
    finally { setLoadingBays(false) }
  }, [])

  useEffect(() => { fetchStats(); fetchCars(); fetchStaff(); fetchJobs(); fetchBays() }, [fetchStats, fetchCars, fetchStaff, fetchJobs, fetchBays])

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 4000) }

  const handleCarAdded = (data) => { showToast(`${data.car.regNumber} registered successfully.`); fetchStats(); fetchCars() }

  const handleArchiveCar = async (carId) => {
    setArchivingCarId(carId)
    try { await axios.patch(`/api/admin/cars/${carId}/archive`); showToast('Vehicle archived.'); fetchStats(); fetchCars() }
    catch (err) { showToast(err.response?.data?.message || 'Archive failed.', false) }
    finally { setArchivingCarId(null); setArchiveConfirmId(null) }
  }

  const handleDeleteCar = async (carId) => {
    setDeletingCarId(carId)
    try { await axios.delete(`/api/admin/cars/${carId}`); showToast('Vehicle deleted permanently.'); fetchStats(); fetchCars() }
    catch (err) { showToast(err.response?.data?.message || 'Delete failed.', false) }
    finally { setDeletingCarId(null); setDeleteConfirmId(null) }
  }

  const handleStaffStatus = async (id, isActive) => {
    try {
      await axios.patch(`/api/admin/staff/${id}/status`, { isActive });
      showToast(`Account ${isActive ? 'activated' : 'deactivated'}.`);
      fetchStaff();
    } catch (err) {
      showToast('Toggle failed.', false);
    }
  }

  const handleDeleteStaff = async (id) => {
    setDeletingStaffId(id)
    try { await axios.delete(`/api/admin/staff/${id}`); setStaff(p => p.filter(u => u._id !== id)); showToast('Account deleted.') }
    catch (err) { showToast(err.response?.data?.message || 'Delete failed.', false) }
    finally { setDeletingStaffId(null); setConfirmStaffId(null) }
  }

  const handleDeleteJob = async (id) => {
    setDeletingJobId(id)
    try { await axios.delete(`/api/admin/job-master/${id}`); setJobMasters(p => p.filter(j => j._id !== id)); showToast('Service Template deleted.') }
    catch (err) { showToast('Delete failed.', false) }
    finally { setDeletingJobId(null); setConfirmJobId(null) }
  }

  const handleDeleteBay = async (id) => {
    setDeletingBayId(id)
    try { await axios.delete(`/api/admin/bays/${id}`); setBays(p => p.filter(b => b._id !== id)); showToast('Bay deleted.') }
    catch (err) { showToast('Delete failed.', false) }
    finally { setDeletingBayId(null); setConfirmBayId(null) }
  }

  const filteredCars  = cars.filter(c => { 
    if (!showArchived && c.status === 'archived') return false;
    const q = search.toLowerCase(); 
    return !q || c.regNumber.toLowerCase().includes(q) || c.customerName.toLowerCase().includes(q) || c.carModel.toLowerCase().includes(q) 
  })
  const filteredStaff = staff.filter(u => { const q = staffSearch.toLowerCase(); return !q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.role.includes(q) })

  const mechanics = staff.filter(u => u.role === 'mechanic').length
  const advisors  = staff.filter(u => u.role === 'advisor').length
  const jcs       = staff.filter(u => u.role === 'job_controller').length
  const customers = staff.filter(u => u.role === 'customer').length
  const dateStr   = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  const exportReport = () => {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const now = new Date()
    const rows = []

    // ── Header
    rows.push([esc('TOYOTA WORKSHOP — SERVICE REPORT')])
    rows.push([esc(`Generated: ${now.toLocaleString()}`)])
    rows.push([])

    // ── Summary
    rows.push([esc('=== WORKSHOP SUMMARY ===')])
    rows.push([esc('Metric'), esc('Count')])
    rows.push([esc('Total Vehicles'),    esc(stats.total)])
    rows.push([esc('In Service'),        esc(stats.inService)])
    rows.push([esc('Ready for Pickup'),  esc(stats.ready)])
    rows.push([esc('Pending'),           esc(stats.pending)])
    rows.push([esc('Total Staff'),       esc(staff.length)])
    rows.push([esc('Mechanics'),         esc(mechanics)])
    rows.push([esc('Customers'),         esc(customers)])
    rows.push([])

    // ── Vehicles
    rows.push([esc('=== VEHICLES ===')])
    rows.push([esc('Reg Number'), esc('Customer Name'), esc('Car Model'), esc('Status'), esc('Progress %'), esc('Current Stage'), esc('Feedback Rating'), esc('Feedback Comment'), esc('Created')])
    cars.forEach(c => {
      rows.push([
        esc(c.regNumber),
        esc(c.customerName),
        esc(c.carModel),
        esc(c.status),
        esc(c.progress ?? 0),
        esc(c.currentStage ?? '—'),
        esc(c.feedback?.rating ?? ''),
        esc(c.feedback?.comment ?? ''),
        esc(c.createdAt ? new Date(c.createdAt).toLocaleDateString() : ''),
      ])
    })
    rows.push([])

    // ── Staff
    rows.push([esc('=== STAFF ACCOUNTS ===')])
    rows.push([esc('Name'), esc('Email'), esc('Role'), esc('Created')])
    staff.forEach(u => {
      rows.push([esc(u.name), esc(u.email), esc(u.role), esc(u.createdAt ? new Date(u.createdAt).toLocaleDateString() : '')])
    })

    const csv = rows.map(r => r.join(',')).join('\r\n')
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `toyota-workshop-report-${now.toISOString().slice(0,10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    showToast('Report exported successfully.')
  }

  const NAV = [
    { id: 'dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { id: 'vehicles',  icon: Car,             label: 'Vehicles',       badge: stats.pending || null },
    { id: 'services',  icon: Wrench,          label: 'Workshop Services' },
    { id: 'bays',      icon: MapPin,          label: 'Workshop Bays' },
    { id: 'staff',     icon: Users,           label: 'Staff Accounts' },
  ]

  const navBtn = (id) => ({
    display: 'flex', alignItems: 'center', gap: 12,
    padding: sidebarOpen ? '0.72rem 1.2rem' : '0.72rem',
    borderRadius: 10, cursor: 'pointer', margin: '2px 10px',
    background: activePage === id ? ACTIVE : 'transparent',
    color: activePage === id ? '#fff' : 'rgba(255,255,255,0.55)',
    transition: 'all 0.15s', fontSize: '0.875rem', fontWeight: activePage === id ? 700 : 500,
    justifyContent: sidebarOpen ? 'flex-start' : 'center',
    border: 'none', width: 'calc(100% - 20px)',
  })

  const TH = ({ children }) => <th style={{ padding: '0.65rem 1rem', textAlign: 'left', fontSize: '0.68rem', fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', whiteSpace: 'nowrap', background: '#F8FAFC' }}>{children}</th>

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F4F7FE', fontFamily: 'inherit' }}>

      {/* ═══ SIDEBAR ══════════════════════════════════════════════════════ */}
      <aside style={{ width: sidebarOpen ? 240 : 72, background: SIDEBAR, flexShrink: 0, display: 'flex', flexDirection: 'column', transition: 'width 0.25s', zIndex: 100, position: 'sticky', top: 0, height: '100vh', overflowY: 'hidden' }}>

        {/* Logo */}
        <div style={{ padding: sidebarOpen ? '1.5rem 1.4rem 1rem' : '1.5rem 0 1rem', display: 'flex', alignItems: 'center', gap: 10, justifyContent: sidebarOpen ? 'flex-start' : 'center' }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, overflow: 'hidden', background: '#EB0A1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img src="/toyota-logo.png" alt="Toyota" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
          </div>
          {sidebarOpen && (
            <div>
              <div style={{ color: '#fff', fontWeight: 800, fontSize: '1rem', lineHeight: 1.2 }}>Toyota</div>
              <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.68rem', letterSpacing: '0.06em' }}>Admin Portal</div>
            </div>
          )}
        </div>

        {sidebarOpen && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0.5rem 1.4rem 0.3rem', margin: 0 }}>MAIN MENU</p>}

        {/* Main nav — takes all remaining space */}
        <nav style={{ flex: 1, overflowY: 'auto' }}>
          {NAV.map(({ id, icon: Icon, label, badge }) => (
            <button key={id} onClick={() => setActivePage(id)} style={navBtn(id)}>
              <Icon size={18} style={{ flexShrink: 0 }} />
              {sidebarOpen && <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{label}</span>}
              {sidebarOpen && badge ? <span style={{ background: 'rgba(255,255,255,0.25)', color: '#fff', borderRadius: 20, fontSize: '0.62rem', fontWeight: 800, padding: '1px 7px' }}>{badge}</span> : null}
            </button>
          ))}
        </nav>

        {/* Account section — pinned to bottom */}
        <div style={{ paddingBottom: '0.75rem' }}>
          <div style={{ margin: '0 1.2rem 0.5rem', borderTop: '1px solid rgba(255,255,255,0.07)' }} />
          {sidebarOpen && <p style={{ color: 'rgba(255,255,255,0.25)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', padding: '0 1.4rem 0.3rem', margin: 0 }}>ACCOUNT</p>}

          <button onClick={() => setShowSettings(true)} style={navBtn('__settings')}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}>
            <Settings size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>Settings</span>}
          </button>

          <button onClick={() => setShowProfile(true)} style={navBtn('__profile')}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}>
            <UserCircle2 size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>Profile</span>}
          </button>

          <button onClick={logout} style={navBtn('logout')}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.18)'; e.currentTarget.style.color = '#FCA5A5' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)' }}>
            <LogOut size={18} style={{ flexShrink: 0 }} />
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>

      </aside>

      {/* ═══ MAIN ═════════════════════════════════════════════════════════ */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* NeuroNexus-style Top Bar */}
        <header style={{ background: '#fff', borderBottom: '1px solid #E2E8F0', padding: '0 1.5rem', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexShrink: 0, boxShadow: '0 1px 8px rgba(0,0,0,0.06)' }}>

          {/* Left: hamburger + logo + title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <button onClick={() => setSidebarOpen(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 6, borderRadius: 8, color: '#64748B' }}>
              <Menu size={20} />
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, overflow: 'hidden', background: '#EB0A1E', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <img src="/toyota-logo.png" alt="Toyota" style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }} />
              </div>
              <div>
                <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0F172A', lineHeight: 1.2 }}>Toyota Workshop</div>
                <div style={{ fontSize: '0.7rem', color: '#94A3B8', lineHeight: 1 }}>{activePage === 'dashboard' ? 'Dashboard' : activePage === 'vehicles' ? 'Vehicles' : 'Staff Accounts'}</div>
              </div>
            </div>
          </div>

          {/* Right: action buttons + bell + user */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {activePage === 'services' && <Btn primary onClick={() => setShowAddJob(true)} style={{ fontSize: '0.8rem', padding: '6px 14px' }}><PlusCircle size={13} /> New Service</Btn>}
            {activePage === 'staff'    && <Btn primary onClick={() => setShowCreateStaff(true)} style={{ fontSize: '0.8rem', padding: '6px 14px' }}><UserPlus size={13} /> New Account</Btn>}
            {activePage === 'bays'     && <Btn primary onClick={() => setShowCreateBay(true)} style={{ fontSize: '0.8rem', padding: '6px 14px' }}><PlusCircle size={13} /> New Bay</Btn>}
            <button onClick={() => { fetchStats(); fetchCars(); fetchStaff(); fetchJobs(); fetchBays() }} style={{ background: '#F1F5F9', border: 'none', borderRadius: 9, padding: '7px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#64748B' }} title="Refresh"><RefreshCw size={15} /></button>



            {/* User chip */}
            <div onClick={() => setShowProfile(true)} style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '5px 12px 5px 5px', cursor: 'pointer' }}>
              <div style={{ width: 32, height: 32, borderRadius: '50%', background: ACTIVE, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                {adminUser?.avatar
                  ? <img src={adminUser.avatar} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <span style={{ color: '#fff', fontWeight: 800, fontSize: '0.72rem' }}>{(adminUser?.name || user?.name || 'A').slice(0,2).toUpperCase()}</span>
                }
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#0F172A', lineHeight: 1.2, whiteSpace: 'nowrap' }}>{adminUser?.name || user?.name || 'Admin User'}</div>
                <div style={{ fontSize: '0.65rem', color: '#94A3B8', whiteSpace: 'nowrap' }}>Administrator</div>
              </div>
              <ChevronRight size={14} color="#94A3B8" style={{ marginLeft: 2 }} />
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{ flex: 1, padding: '1.75rem', overflowY: 'auto' }}>

          {/* Toast */}
          {toast && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0.65rem 1rem', background: toast.ok ? '#ECFDF5' : '#FEF2F2', border: `1px solid ${toast.ok ? '#BBF7D0' : '#FECACA'}`, borderRadius: 10, color: toast.ok ? '#15803D' : '#B91C1C', fontSize: '0.85rem', fontWeight: 500, marginBottom: 20 }}>
              {toast.ok ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              <span style={{ flex: 1 }}>{toast.msg}</span>
              <button onClick={() => setToast(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', padding: 0 }}><X size={14} /></button>
            </div>
          )}

          {/* ══ DASHBOARD ══ */}
          {activePage === 'dashboard' && (() => {
            const getBadgeStyle = (stage) => {
              const s = (stage || '').toLowerCase();
              if (s.includes('production')) return { bg: '#FEF08A', color: '#A16207' };
              if (s.includes('waiting')) return { bg: '#FFEDD5', color: '#C2410C' };
              if (s.includes('alignment')) return { bg: '#F3E8FF', color: '#7E22CE' };
              if (s.includes('washing')) return { bg: '#CFFAFE', color: '#0E7490' };
              if (s.includes('ready') || s.includes('complete')) return { bg: '#DCFCE7', color: '#15803D' };
              return { bg: '#DBEAFE', color: '#1D4ED8' }; // Default to reception style
            };

            const countByStageMatch = (keyword) => cars.filter(c => (c.currentStage || '').toLowerCase().includes(keyword)).length;
            const countAlign = countByStageMatch('alignment');
            const countWash = countByStageMatch('washing');
            const countDelivered = cars.filter(c => c.status === 'closed').length;
            const activeCars = cars.filter(c => c.status !== 'closed');

            return (
              <>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
                  <div>
                    <h2 style={{ margin: '0 0 2px', fontWeight: 800, fontSize: '1.55rem', color: '#0F172A' }}>Welcome back, Admin! 👋</h2>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '0.88rem' }}>Here's what's happening at your workshop today.</p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <button onClick={exportReport} style={{ background: 'linear-gradient(135deg,#EB0A1E,#A00010)', border: 'none', borderRadius: 9, padding: '9px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 7, fontSize: '0.83rem', color: '#fff', fontWeight: 700, boxShadow: '0 4px 14px rgba(235,10,30,0.3)' }}><Download size={14} /> Export Report</button>
                    <div style={{ background: '#fff', border: '1px solid #E2E8F0', borderRadius: 9, padding: '7px 13px', fontSize: '0.78rem', color: '#475569', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }}>📅 {dateStr}</div>
                  </div>
                </div>

                {/* Banner removed */}

                {/* Unified stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
                  {[
                    { label: 'Total Vehicles',   val: stats.total,     icon: Car,          bg: '#EB0A1E', sub: 'Registered in system' },
                    { label: 'In Service',        val: stats.inService, icon: Clock,        bg: '#EA580C', sub: 'Needs attention' },
                    { label: 'Ready for Pickup',  val: stats.ready,     icon: CheckCircle2, bg: '#16A34A', sub: '↑ +22% from last month' },
                    { label: 'Pending',           val: stats.pending,   icon: CircleDot,    bg: '#64748B', sub: 'Awaiting service start' },
                    { label: 'Alignment',         val: countAlign,      icon: Crosshair,    bg: '#9333EA', sub: 'Currently queuing' },
                    { label: 'Washing',           val: countWash,       icon: Droplets,     bg: '#0891B2', sub: 'Currently queued' },
                    { label: 'Delivered Today',   val: countDelivered,  icon: Home,         bg: '#475569', sub: 'Completed and gone' },
                    { label: 'Total Staff',    val: staff.length, icon: Users,       bg: '#1A0508', sub: 'All accounts' },
                    { label: 'Mechanics',      val: mechanics,    icon: Wrench,      bg: '#B00010', sub: 'Active mechanics' },
                    { label: 'Advisors',       val: advisors,     icon: Activity,    bg: '#2563EB', sub: 'Service Advisors' },
                    { label: 'Job Controllers',val: jcs,          icon: LayoutDashboard, bg: '#D97706', sub: 'Active JC staff' },
                    { label: 'Customers',      val: customers,    icon: UserCircle2, bg: '#7F1D1D', sub: 'Registered customers' },
                  ].map(({ label, val, icon: Icon, bg, sub }) => (
                    <div key={label} style={{ background: '#fff', borderRadius: 16, padding: '1.25rem', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <div>
                          <p style={{ margin: '0 0 4px', fontSize: '0.7rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</p>
                          {loadingStats || loadingStaff ? <Spinner size="sm" animation="border" style={{ color: bg }} /> : <p style={{ margin: 0, fontWeight: 800, fontSize: '2rem', color: '#0F172A', lineHeight: 1 }}>{val}</p>}
                        </div>
                        <div style={{ width: 46, height: 46, borderRadius: 12, background: bg + '22', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon size={22} color={bg} />
                        </div>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: sub.startsWith('↑') ? '#16A34A' : '#94A3B8' }}>{sub}</p>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
                  <div style={{ padding: '1.1rem 1.4rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ margin: '0 0 1px', fontWeight: 700, color: '#0F172A' }}>Recent Activity</p>
                      <p style={{ margin: 0, fontSize: '0.76rem', color: '#94A3B8' }}>Latest vehicle service updates</p>
                    </div>
                    <button onClick={() => setActivePage('vehicles')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: ACTIVE, fontSize: '0.82rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}>View all <ChevronRight size={14} /></button>
                  </div>
                  {loadingCars ? (
                    <div style={{ display: 'flex', justifyContent: 'center', padding: '2.5rem' }}><Spinner animation="border" style={{ color: ACTIVE }} /></div>
                  ) : activeCars.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '2.5rem', color: '#94A3B8', fontSize: '0.88rem' }}>No active vehicles registered.</div>
                  ) : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead><tr>{['Reg. Number', 'Customer', 'Advisor', 'Bay / Tech', 'Status', 'Jobs', 'Est. Time'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                        <tbody>
                          {activeCars.slice(0, 8).map((car, i) => {
                            const style = getBadgeStyle(car.currentStage);
                            const fallbackStatusText = car.status === 'pending' ? 'reception' : (car.status === 'in-service' ? 'in production' : car.status);
                            const dispStatus = car.currentStage && car.currentStage !== 'No Stages' ? car.currentStage.toLowerCase() : fallbackStatusText;
                            return (
                              <tr key={car._id} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 ? '#FAFBFC' : '#fff' }}>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: ACTIVE + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      <span style={{ fontWeight: 700, fontSize: '0.68rem', color: ACTIVE }}>{car.regNumber.slice(0, 2)}</span>
                                    </div>
                                    <div>
                                      <p style={{ margin: 0, fontWeight: 700, fontSize: '0.82rem', color: '#0F172A', fontFamily: 'monospace' }}>{car.regNumber}</p>
                                      <p style={{ margin: 0, fontSize: '0.7rem', color: '#94A3B8' }}>ID: #{car._id.slice(-6).toUpperCase()}</p>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', fontWeight: 500, color: '#0F172A', fontSize: '0.85rem' }}>{car.customerName}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontSize: '0.83rem' }}>{car.serviceAdvisor?.name || '—'}</td>
                                <td style={{ padding: '0.75rem 1rem', color: '#64748B', fontSize: '0.83rem' }}>{car.assignedMechanic?.bayName || '-'} / {car.assignedMechanic?.name || 'Unassigned'}</td>
                                <td style={{ padding: '0.75rem 1rem' }}>
                                  <span style={{ background: style.bg, color: style.color, padding: '4px 12px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.02em', whiteSpace: 'nowrap' }}>
                                    {dispStatus}
                                  </span>
                                </td>
                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.83rem', color: '#475569', fontWeight: 600 }}>{car.completedCount || 0}/{car.stageCount || 0}</td>
                                <td style={{ padding: '0.75rem 1rem', fontSize: '0.83rem', color: '#475569' }}>{car.totalEstimatedMinutes ? `${car.totalEstimatedMinutes} mins` : '-'}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* ══ VEHICLES ══ */}
          {activePage === 'vehicles' && (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>All Vehicles</span>
                  <span style={{ background: '#F1F5F9', color: '#64748B', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px' }}>{filteredCars.length}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', color: '#64748B', cursor: 'pointer' }}>
                    <input type="checkbox" checked={showArchived} onChange={e => setShowArchived(e.target.checked)} />
                    Show Archived
                  </label>
                  <input type="text" placeholder="Search reg, customer, model…" value={search} onChange={e => setSearch(e.target.value)}
                    style={{ ...inp, width: 260, height: 36, fontSize: '0.82rem' }} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', borderBottom: '1px solid #F1F5F9' }}>
                {[{ l: 'Total', v: stats.total, c: '#EB0A1E' }, { l: 'In Service', v: stats.inService, c: '#EA580C' }, { l: 'Ready', v: stats.ready, c: '#16A34A' }, { l: 'Pending', v: stats.pending, c: '#64748B' }].map(s => (
                  <div key={s.l} style={{ padding: '0.75rem', borderRight: '1px solid #F1F5F9', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 2px', fontSize: '1.35rem', fontWeight: 800, color: s.c }}>{loadingStats ? '…' : s.v}</p>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
                  </div>
                ))}
              </div>
              {loadingCars && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner animation="border" style={{ color: ACTIVE }} /></div>}
              {!loadingCars && filteredCars.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: '0.88rem' }}>{cars.length === 0 ? 'No vehicles yet. Click "+ New Service" to add the first.' : 'No vehicles match your search.'}</div>}
              {!loadingCars && filteredCars.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['REG #','CUSTOMER','MODEL','CURRENT STAGE','PROGRESS','STATUS','MECHANIC','ACTIONS'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                    <tbody>
                      {filteredCars.map((car, i) => (
                        <tr key={car._id} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 ? '#FAFBFC' : '#fff' }}>
                          <td style={{ padding: '0.8rem 1rem' }}><span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.85rem', color: '#0F172A' }}>{car.regNumber}</span></td>
                          <td style={{ padding: '0.8rem 1rem', fontWeight: 500, color: '#0F172A', fontSize: '0.85rem' }}>{car.customerName}</td>
                          <td style={{ padding: '0.8rem 1rem', color: '#64748B', fontSize: '0.83rem' }}>{car.carModel}</td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <span style={{ background: '#F1F5F9', color: '#475569', borderRadius: 20, fontSize: '0.72rem', fontWeight: 600, padding: '2px 9px', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }} title={car.currentStage}>{car.currentStage}</span>
                          </td>
                          <td style={{ padding: '0.8rem 1rem', minWidth: 130 }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <ProgressBar value={car.progress} />
                              <span style={{ fontSize: '0.74rem', color: '#64748B', flexShrink: 0 }}>{car.progress}%</span>
                            </div>
                          </td>
                          <td style={{ padding: '0.8rem 1rem' }}><StatusBadge status={car.status} /></td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            {car.assignedMechanic
                              ? <span style={{ fontSize: '0.77rem', fontWeight: 600, color: '#B00010', background: '#FFE4E6', borderRadius: 20, padding: '2px 9px' }}>{car.assignedMechanic.name}</span>
                              : <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>Unassigned</span>}
                          </td>
                          <td style={{ padding: '0.8rem 1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <button onClick={() => { setDetailCar(car); setDeleteConfirmId(null); setArchiveConfirmId(null); }} style={{ background: 'none', border: `1px solid ${ACTIVE}30`, borderRadius: 7, padding: '4px 9px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600, color: ACTIVE, display: 'flex', alignItems: 'center', gap: 4 }}><Eye size={12} /> View</button>
                              {car.status !== 'archived' && (
                                archiveConfirmId === car._id ? (
                                  <button onClick={() => handleArchiveCar(car._id)} disabled={archivingCarId === car._id} style={{ background: '#F59E0B', color: '#fff', border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                    {archivingCarId === car._id ? <Spinner size="sm" animation="border" /> : 'Confirm Archive?'}
                                  </button>
                                ) : (
                                  <button onClick={() => { setArchiveConfirmId(car._id); setDeleteConfirmId(null); }} style={{ background: '#FEF3C7', border: 'none', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Archive"><Archive size={13} color="#D97706" /></button>
                                )
                              )}
                              {deleteConfirmId === car._id ? (
                                <button onClick={() => handleDeleteCar(car._id)} disabled={deletingCarId === car._id} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 7, padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {deletingCarId === car._id ? <Spinner size="sm" animation="border" /> : 'Confirm Delete?'}
                                </button>
                              ) : (
                                <button onClick={() => { setDeleteConfirmId(car._id); setArchiveConfirmId(null); }} style={{ background: '#FEF2F2', border: 'none', borderRadius: 7, padding: '5px 7px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Delete"><Trash2 size={13} color="#EF4444" /></button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ SERVICES ══ */}
          {activePage === 'services' && (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>Workshop Services</span>
                  <span style={{ background: '#F1F5F9', color: '#64748B', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px' }}>{jobMasters.length}</span>
                </div>
              </div>
              {loadingJobs && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner animation="border" style={{ color: ACTIVE }} /></div>}
              {!loadingJobs && jobMasters.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: '0.88rem' }}>No service templates found. Start by adding one.</div>}
              {!loadingJobs && jobMasters.length > 0 && (
                <div style={{ padding: '1.4rem' }}>
                  {Object.entries(jobMasters.reduce((acc, job) => {
                    const cat = job.category || 'General'
                    if (!acc[cat]) acc[cat] = []
                    acc[cat].push(job)
                    return acc
                  }, {})).map(([cat, jobs]) => (
                    <div key={cat} style={{ marginBottom: '2rem' }}>
                      <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#0F172A', marginBottom: '1rem', borderBottom: '2px solid #F1F5F9', paddingBottom: '0.4rem' }}>{cat}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                        {jobs.map(job => (
                          <div key={job._id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1rem', position: 'relative' }}>
                            <h5 style={{ margin: '0 0 0.4rem', fontSize: '0.95rem', fontWeight: 700, color: '#0F172A' }}>{job.title}</h5>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#64748B', fontSize: '0.8rem', marginBottom: '1rem' }}>
                              <Clock size={13} /> {job.estimatedMinutes} mins avg.
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <button onClick={() => setEditJob(job)} style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}><Edit size={12} /> Edit</button>
                              {confirmJobId === job._id ? (
                                <button onClick={() => handleDeleteJob(job._id)} disabled={deletingJobId === job._id} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {deletingJobId === job._id ? <Spinner size="sm" animation="border" /> : 'Confirm?'}
                                </button>
                              ) : (
                                <button onClick={() => setConfirmJobId(job._id)} style={{ background: '#FEF2F2', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#EF4444' }} title="Delete"><Trash2 size={13} /></button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ══ STAFF ══ */}
          {activePage === 'staff' && (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>Staff &amp; Customers</span>
                  <span style={{ background: '#F1F5F9', color: '#64748B', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px' }}>{filteredStaff.length}</span>
                </div>
                <input type="text" placeholder="Search name, email, role…" value={staffSearch} onChange={e => setStaffSearch(e.target.value)}
                  style={{ ...inp, width: 260, height: 36, fontSize: '0.82rem' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', borderBottom: '1px solid #F1F5F9' }}>
                {[{ l: 'Total', v: staff.length, c: '#1A0508' }, { l: 'Mechanics', v: mechanics, c: '#B00010' }, { l: 'Advisors', v: advisors, c: '#2563EB' }, { l: 'JCs', v: jcs, c: '#D97706' }, { l: 'Customers', v: customers, c: '#7F1D1D' }].map(s => (
                  <div key={s.l} style={{ padding: '0.75rem', borderRight: '1px solid #F1F5F9', textAlign: 'center' }}>
                    <p style={{ margin: '0 0 2px', fontSize: '1.35rem', fontWeight: 800, color: s.c }}>{loadingStaff ? '…' : s.v}</p>
                    <p style={{ margin: 0, fontSize: '0.68rem', color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.l}</p>
                  </div>
                ))}
              </div>
              {loadingStaff && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner animation="border" style={{ color: ACTIVE }} /></div>}
              {!loadingStaff && filteredStaff.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: '0.88rem' }}>{staff.length === 0 ? 'No accounts yet.' : 'No accounts match your search.'}</div>}
              {!loadingStaff && filteredStaff.length > 0 && (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead><tr>{['USER','EMAIL','ROLE','CREATED','ACTIONS'].map(h => <TH key={h}>{h}</TH>)}</tr></thead>
                    <tbody>
                      {filteredStaff.map((u, i) => {
                        const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.customer
                        const Icon = cfg.icon
                        return (
                          <tr key={u._id} style={{ borderTop: '1px solid #F1F5F9', background: i % 2 ? '#FAFBFC' : '#fff' }}>
                            <td style={{ padding: '0.8rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                <div style={{ width: 34, height: 34, borderRadius: '50%', background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  <span style={{ fontWeight: 700, fontSize: '0.7rem', color: cfg.color }}>{u.name.slice(0, 2).toUpperCase()}</span>
                                </div>
                                <span style={{ fontWeight: 600, color: '#0F172A', fontSize: '0.88rem' }}>{u.name}</span>
                              </div>
                            </td>
                            <td style={{ padding: '0.8rem 1rem', color: '#475569', fontSize: '0.83rem' }}>{u.email}</td>
                            <td style={{ padding: '0.8rem 1rem' }}>
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, background: cfg.bg, color: cfg.color, borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700 }}>
                                <Icon size={11} /> {cfg.label}
                              </span>
                              {u.isActive === false && <span style={{ marginLeft: 6, display: 'inline-flex', alignItems: 'center', background: '#FEF2F2', color: '#DC2626', borderRadius: 20, padding: '2px 8px', fontSize: '0.65rem', fontWeight: 700, border: '1px solid #FECACA' }}>INACTIVE</span>}
                            </td>
                            <td style={{ padding: '0.8rem 1rem', color: '#94A3B8', fontSize: '0.78rem' }}>{new Date(u.createdAt).toLocaleDateString()}</td>
                            <td style={{ padding: '0.8rem 1rem' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <button onClick={() => handleStaffStatus(u._id, u.isActive === false ? true : false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: 8, padding: '4px 10px', fontSize: '0.7rem', fontWeight: 700, color: u.isActive === false ? '#16A34A' : '#64748B', cursor: 'pointer' }}>
                                  {u.isActive === false ? 'ACTIVATE' : 'DEACTIVATE'}
                                </button>
                                {confirmStaffId === u._id ? (
                                <button onClick={() => handleDeleteStaff(u._id)} disabled={deletingStaffId === u._id} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 8, padding: '4px 12px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                  {deletingStaffId === u._id ? <Spinner size="sm" animation="border" /> : 'Confirm Delete?'}
                                </button>
                              ) : (
                                <button onClick={() => setConfirmStaffId(u._id)} style={{ background: '#FEF2F2', border: 'none', borderRadius: 8, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center' }} title="Delete"><Trash2 size={13} color="#EF4444" /></button>
                              )}
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ══ BAYS ══ */}
          {activePage === 'bays' && (
            <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 12px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.4rem', borderBottom: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontWeight: 700, color: '#0F172A' }}>Workshop Bays</span>
                  <span style={{ background: '#F1F5F9', color: '#64748B', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700, padding: '2px 9px' }}>{bays.length}</span>
                </div>
              </div>
              {loadingBays && <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}><Spinner animation="border" style={{ color: ACTIVE }} /></div>}
              {!loadingBays && bays.length === 0 && <div style={{ textAlign: 'center', padding: '3rem', color: '#94A3B8', fontSize: '0.88rem' }}>No workshop bays found. Start by adding one.</div>}
              {!loadingBays && bays.length > 0 && (
                <div style={{ padding: '1.4rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.2rem' }}>
                    {bays.map(bay => (
                      <div key={bay._id} style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: 12, padding: '1.2rem', position: 'relative', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.8rem' }}>
                          <div>
                            <h5 style={{ margin: '0 0 0.3rem', fontSize: '1.05rem', fontWeight: 800, color: '#0F172A' }}>{bay.name}</h5>
                            {bay.description && <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748B' }}>{bay.description}</p>}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <button onClick={() => setEditBay(bay)} style={{ background: '#fff', border: '1px solid #CBD5E1', borderRadius: 6, padding: '4px 8px', fontSize: '0.75rem', fontWeight: 600, color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }} title="Edit"><Edit size={12} /></button>
                            {confirmBayId === bay._id ? (
                              <button onClick={() => handleDeleteBay(bay._id)} disabled={deletingBayId === bay._id} style={{ background: '#EF4444', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
                                {deletingBayId === bay._id ? <Spinner size="sm" animation="border" /> : 'Yes?'}
                              </button>
                            ) : (
                              <button onClick={() => setConfirmBayId(bay._id)} style={{ background: '#FEF2F2', border: 'none', borderRadius: 6, padding: '5px 8px', cursor: 'pointer', display: 'flex', alignItems: 'center', color: '#EF4444' }} title="Delete"><Trash2 size={13} /></button>
                            )}
                          </div>
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ marginBottom: '1rem', background: '#fff', border: '1px dashed #CBD5E1', borderRadius: 8, padding: '0.75rem' }}>
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Working Mechanics ({bay.mechanics?.length || 0})</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {bay.mechanics?.map(m => (
                                <span key={m._id} style={{ background: '#FFE4E6', color: '#B00010', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 12 }}>{m.name}</span>
                              ))}
                              {(!bay.mechanics || bay.mechanics.length === 0) && <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>None</span>}
                            </div>
                          </div>

                          <div style={{ background: '#fff', border: '1px dashed #CBD5E1', borderRadius: 8, padding: '0.75rem' }}>
                            <p style={{ margin: '0 0 0.5rem', fontSize: '0.72rem', fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vehicles in Bay ({bay.cars?.length || 0})</p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              {bay.cars?.map(c => (
                                <span key={c._id} style={{ background: '#F1F5F9', color: '#333', fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', borderRadius: 12, border: '1px solid #E2E8F0' }} title={`${c.carModel} - ${c.customerName}`}>{c.regNumber}</span>
                              ))}
                              {(!bay.cars || bay.cars.length === 0) && <span style={{ fontSize: '0.75rem', color: '#94A3B8' }}>No vehicles</span>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

        </main>
      </div>

      {/* ═══ MODALS ══════════════════════════════════════════════════════ */}
      <CarDetailSheet car={detailCar} onClose={() => setDetailCar(null)} />
      <CreateBaySheet open={showCreateBay} onClose={() => setShowCreateBay(false)} onCreated={b => { setBays(p => [...p, b]); showToast(`Bay "${b.name}" created.`); fetchBays(); }} />
      <EditBaySheet open={!!editBay} bay={editBay} onClose={() => setEditBay(null)} onUpdated={b => { fetchBays(); showToast('Bay updated.'); fetchStaff(); }} />
      <CreateStaffSheet open={showCreateStaff} onClose={() => setShowCreateStaff(false)} onCreated={u => { setStaff(p => [u, ...p]); showToast(`Account for ${u.email} created.`); fetchBays(); }} bays={bays} />
      <CreateJobSheet open={showAddJob} jobMasters={jobMasters} onClose={() => setShowAddJob(false)} onCreated={j => { fetchJobs(); showToast(`Service ${j.title} created.`) }} />
      <EditJobSheet open={!!editJob} job={editJob} jobMasters={jobMasters} onClose={() => setEditJob(null)} onUpdated={j => { fetchJobs(); showToast('Service updated.') }} />
      <AdminProfileModal open={showProfile} onClose={() => setShowProfile(false)} user={adminUser} onUpdated={u => { setAdminUser(u); showToast('Profile updated.') }} />
      <AdminSettingsModal open={showSettings} onClose={() => setShowSettings(false)} user={adminUser} onUpdated={u => { setAdminUser(u); showToast('Profile updated.') }} />
    </div>
  )
}
