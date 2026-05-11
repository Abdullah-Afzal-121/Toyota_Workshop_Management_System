import { NavLink, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import { Car, Wrench, ShieldCheck, LogOut, User2, Search, Bell, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'

const TOYOTA_RED = '#EB0A1E'

const ROLE_META = {
  admin:    { label: 'Admin',    color: '#EB0A1E', bg: '#FFF0F1' },
  mechanic: { label: 'Mechanic', color: '#D97706', bg: '#FEF3C7' },
  customer: { label: 'Customer', color: '#2563EB', bg: '#DBEAFE' },
}

export default function Header() {
  const { user, logout } = useAuth()
  const navigate          = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  if (!user || ['admin', 'advisor', 'job_controller'].includes(user.role)) return null

  const role = ROLE_META[user.role] || ROLE_META.customer

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <>
      <header className="tw-header" style={{ justifyContent: 'space-between' }}>

        {/* ── LEFT: Logo ─────────────────────────────────────────────── */}
        <div className="d-flex align-items-center gap-4">
          <NavLink
            to={user.role === 'admin' ? '/admin' : user.role === 'mechanic' ? '/mechanic' : '/track'}
            className="d-flex align-items-center gap-2 text-decoration-none"
          >
            <img src="/toyota-logo.png" alt="Toyota" style={{ width: 38, height: 38, borderRadius: 8 }} />
            <div className="d-none d-md-block">
              <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1E293B', lineHeight: 1.2 }}>
                Toyota Chenab Motors
              </div>
              <div style={{ fontSize: '0.65rem', color: '#94A3B8', lineHeight: 1 }}>
                Service Tracker
              </div>
            </div>
          </NavLink>

          {/* ── Centre nav links (desktop) ── */}
          <nav className="d-none d-md-flex align-items-center gap-1 ms-2">
            {(user.role === 'customer' || user.role === 'admin') && (
              <NavLink to="/track" className={({ isActive }) => `tw-nav-link ${isActive ? 'active' : ''}`}>
                <Car size={15} /> Track My Car
              </NavLink>
            )}
            {(user.role === 'mechanic' || user.role === 'admin') && (
              <NavLink to="/mechanic" className={({ isActive }) => `tw-nav-link ${isActive ? 'active' : ''}`}>
                <Wrench size={15} /> Mechanic Panel
              </NavLink>
            )}
            {user.role === 'admin' && (
              <NavLink to="/admin" className={({ isActive }) => `tw-nav-link ${isActive ? 'active' : ''}`}>
                <ShieldCheck size={15} /> Dashboard
              </NavLink>
            )}
          </nav>
        </div>

        {/* ── RIGHT: User ─────────────────────────────────────── */}
        <div className="d-flex align-items-center gap-2">

          {/* User pill */}
          <div
            className="d-flex align-items-center gap-2 px-3 py-1 rounded-3 cursor-pointer"
            style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', height: 36 }}
          >
            <div
              className="rounded-circle d-flex align-items-center justify-content-center"
              style={{ width: 24, height: 24, background: role.bg, flexShrink: 0 }}
            >
              <User2 size={13} color={role.color} />
            </div>
            <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#1E293B', whiteSpace: 'nowrap' }}>
              {user.name.split(' ')[0]}
            </span>
            <span
              style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px',
                borderRadius: 999, background: role.bg, color: role.color,
              }}
            >
              {role.label}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="d-flex align-items-center gap-1 tw-btn-ghost"
            style={{ height: 36, borderRadius: 8, padding: '0 10px', fontSize: '0.78rem' }}
            title="Sign out"
          >
            <LogOut size={14} />
            <span className="d-none d-sm-inline">Out</span>
          </button>
        </div>
      </header>
    </>
  )
}
