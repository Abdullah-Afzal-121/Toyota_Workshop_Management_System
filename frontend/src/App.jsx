import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { GoogleOAuthProvider } from '@react-oauth/google'

import { ToastProvider }   from './context/ToastContext'
import ToastContainer      from './components/ToastContainer'
import ProtectedRoute      from './components/ProtectedRoute'
import Header              from './components/Header'
import Login               from './pages/Login'
import AdminLogin          from './pages/AdminLogin'
import ForgotPassword      from './pages/ForgotPassword'
import ResetPassword       from './pages/ResetPassword'
import Home                from './pages/Home'
import CustomerTracker     from './pages/CustomerTracker'
import MechanicPanel       from './pages/MechanicPanel'
import AdminEntry          from './pages/AdminEntry'
import AdvisorPanel        from './pages/AdvisorPanel'
import JCPanel             from './pages/JCPanel'
import FAQ                 from './pages/FAQ'
import ContactUs           from './pages/ContactUs'
import PrivacyPolicy       from './pages/PrivacyPolicy'
import TermsOfService      from './pages/TermsOfService'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ''

function App() {
  return (
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
    <ToastProvider>
      <BrowserRouter>
      {/* Header renders itself only when user is logged in */}
      <Header />

      <Routes>
        {/* Public */}
        <Route path="/"           element={<Home />} />
        <Route path="/login"      element={<Login />} />
        <Route path="/admin-login" element={<AdminLogin />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password"  element={<ResetPassword />} />

        {/* Customer — any authenticated user can track */}
        <Route
          path="/track"
          element={
            <ProtectedRoute allowedRoles={['customer', 'admin', 'mechanic']}>
              <CustomerTracker />
            </ProtectedRoute>
          }
        />

        {/* Mechanic + Admin */}
        <Route
          path="/mechanic"
          element={
            <ProtectedRoute allowedRoles={['mechanic', 'admin']}>
              <MechanicPanel />
            </ProtectedRoute>
          }
        />

        {/* Admin only */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminEntry />
            </ProtectedRoute>
          }
        />

        {/* Advisor */}
        <Route
          path="/advisor"
          element={
            <ProtectedRoute allowedRoles={['advisor', 'admin']}>
              <AdvisorPanel />
            </ProtectedRoute>
          }
        />

        {/* Job Controller */}
        <Route
          path="/jc"
          element={
            <ProtectedRoute allowedRoles={['job_controller', 'admin']}>
              <JCPanel />
            </ProtectedRoute>
          }
        />

        {/* Support pages */}
        <Route path="/faq"             element={<FAQ />} />
        <Route path="/contact"         element={<ContactUs />} />
        <Route path="/privacy-policy"  element={<PrivacyPolicy />} />
        <Route path="/terms"           element={<TermsOfService />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer />
    </BrowserRouter>
    </ToastProvider>
    </GoogleOAuthProvider>
  )
}

export default App
