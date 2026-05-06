import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'

// Point all axios calls to the Render backend in production
axios.defaults.baseURL = import.meta.env.VITE_API_URL || ''

// ── Token helpers (localStorage — works in ALL browsers, no cookie issues) ────
const TOKEN_KEY = 'tw_token'
const USER_KEY  = 'tw_user'

const saveToken = (token) => { if (token) localStorage.setItem(TOKEN_KEY, token) }
const getToken  = ()      => localStorage.getItem(TOKEN_KEY)
const clearToken = ()     => localStorage.removeItem(TOKEN_KEY)

// ── Axios request interceptor — attach Bearer token to every request ──────────
axios.interceptors.request.use((config) => {
  const token = getToken()
  if (token) config.headers['Authorization'] = `Bearer ${token}`
  return config
})

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

  // Rehydrate session on mount — use stored token to verify with backend
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    const storedUser  = localStorage.getItem(USER_KEY)
    const storedToken = getToken()

    if (storedToken && storedUser) {
      // Optimistically restore user from localStorage, then verify with backend
      setUser(JSON.parse(storedUser))
      axios.get('/api/auth/me')
        .then(({ data }) => {
          setUser(data.user)
          localStorage.setItem(USER_KEY, JSON.stringify(data.user))
        })
        .catch(() => {
          // Token invalid/expired — clear everything
          clearToken()
          localStorage.removeItem(USER_KEY)
          setUser(null)
        })
        .finally(() => setLoading(false))
    } else {
      setLoading(false)
    }
  }, [])

  // -- Axios Interceptor for 401 Auto-Logout -------------------------------------
  useEffect(() => {
    const interceptor = axios.interceptors.response.use(
      response => response,
      error => {
        if (error.response && error.response.status === 401) {
          clearToken()
          localStorage.removeItem(USER_KEY)
          setUser(null)
        }
        return Promise.reject(error)
      }
    )
    return () => axios.interceptors.response.eject(interceptor)
  }, [])

  // -- Persist helpers -----------------------------------------------------------
  const persist = (userData, token) => {
    localStorage.setItem(USER_KEY, JSON.stringify(userData))
    saveToken(token)
    setUser(userData)
  }

  const clear = () => {
    localStorage.removeItem(USER_KEY)
    clearToken()
    setUser(null)
  }

  // -- Login (Customer + Mechanic only) -----------------------------------------
  const login = useCallback(async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password })
    persist(data.user, data.token)
    return data.user
  }, [])

  // -- Admin Login (Admin only) --------------------------------------------------
  const adminLogin = useCallback(async (email, password) => {
    const { data } = await axios.post('/api/auth/admin-login', { email, password })
    persist(data.user, data.token)
    return data.user
  }, [])

  // -- Register (Customer only) --------------------------------------------------
  const register = useCallback(async (name, email, password) => {
    const { data } = await axios.post('/api/auth/register', { name, email, password })
    persist(data.user, data.token)
    return data.user
  }, [])

  // -- Google Login (Customer only) ---------------------------------------------
  const googleLogin = useCallback(async (credential) => {
    const { data } = await axios.post('/api/auth/google', { credential })
    persist(data.user, data.token)
    return data.user
  }, [])

  // -- Logout --------------------------------------------------------------------
  const logout = useCallback(async () => {
    try { await axios.post('/api/auth/logout') } catch (e) { /* ignore */ }
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
