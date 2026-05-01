import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

// Point all axios calls to the Railway backend in production
// In dev, VITE_API_URL is not set so Vite proxy handles /api/* automatically
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''
axios.defaults.withCredentials = true

// ── Context ───────────────────────────────────────────────────────────────────
const AuthContext = createContext(null)

// ── Role → home route mapping ─────────────────────────────────────────────────
export const ROLE_HOME = {
  admin:          '/admin',
  mechanic:       '/mechanic',
  customer:       '/track',
  advisor:        '/advisor',
  job_controller: '/jc',
}

// ── Provider ──────────────────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null)
  const [loading, setLoading] = useState(true)
  const initialized = useRef(false)

  // Rehydrate session from the API on mount (relies on HttpOnly cookies)
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    axios.get('/api/auth/me')
      .then(({ data }) => {
        setUser(data.user)
        localStorage.setItem('tw_user', JSON.stringify(data.user))
      })
      .catch(() => {
        localStorage.removeItem('tw_user')
        setUser(null)
      })
      .finally(() => setLoading(false))
  }, [])

  // -- Axios Interceptor for 401 Auto-Logout -------------------------------------
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          // If token expired or invalid, auto logout
          clear()
          // Optionally, redirect to login page if we aren't handling it via ProtectedRoute
        }
        return Promise.reject(error)
      }
    )
    return () => axios.interceptors.response.eject(interceptor)
  }, [])

  // -- Persist helpers -----------------------------------------------------------
  const persist = (userData) => {
    localStorage.setItem('tw_user',  JSON.stringify(userData))
    setUser(userData)
  }

  const clear = () => {
    localStorage.removeItem('tw_user')
    setUser(null)
  }

  // -- Login (Customer + Mechanic only) -----------------------------------------
  const login = useCallback(async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password })
    persist(data.user)
    return data.user
  }, [])

  // -- Admin Login (Admin only) --------------------------------------------------
  const adminLogin = useCallback(async (email, password) => {
    const { data } = await axios.post('/api/auth/admin-login', { email, password })
    persist(data.user)
    return data.user
  }, [])

  // -- Register (Customer only) --------------------------------------------------
  const register = useCallback(async (name, email, password) => {
    const { data } = await axios.post('/api/auth/register', { name, email, password })
    persist(data.user)
    return data.user
  }, [])

  // -- Google Login (Customer only) ---------------------------------------------
  const googleLogin = useCallback(async (credential) => {
    const { data } = await axios.post('/api/auth/google', { credential })
    persist(data.user)
    return data.user
  }, [])

  // -- Logout --------------------------------------------------------------------
  const logout = useCallback(async () => {
    try {
      await axios.post('/api/auth/logout')
    } catch (e) { /* ignore */ }
    clear()
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, adminLogin, register, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// -- Hook ----------------------------------------------------------------------
export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
