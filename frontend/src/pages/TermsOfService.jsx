import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TOYOTA_RED = '#EB0A1E'

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using the Toyota Workshop Service Tracker ("the Service"), you agree to be bound by these Terms of Service. If you do not agree to these terms, please discontinue use of the Service immediately.

These terms apply to all users — including customers tracking their vehicle, mechanics managing service stages, and administrators operating the workshop portal.`,
  },
  {
    title: '2. Description of Service',
    body: `Toyota Workshop Service Tracker provides:
• A public vehicle tracking interface allowing customers to view the service progress of their vehicle using a registration number
• An authenticated workshop portal for mechanics to update service stages, set time estimates, and mark work complete
• An admin panel for workshop managers to register vehicles, manage stages, and view feedback

The Service is provided "as is" and may be updated, modified, or discontinued at any time.`,
  },
  {
    title: '3. User Accounts',
    body: `Workshop staff (mechanics and admins) must maintain the confidentiality of their login credentials. You are responsible for all activity that occurs under your account.

You agree not to:
• Share login credentials with unauthorised individuals
• Use another user's account without permission
• Attempt to access admin or mechanic functionality without proper authorisation

Accounts found to be in violation may be suspended or permanently removed.`,
  },
  {
    title: '4. Acceptable Use',
    body: `You agree not to use the Service to:
• Provide false vehicle registration numbers or misleading information
• Attempt to gain unauthorised access to protected routes or data
• Interfere with or disrupt the operation of the Service
• Use automated bots or scripts to scrape or stress-test the application
• Engage in any activity that violates applicable laws or regulations`,
  },
  {
    title: '5. Intellectual Property',
    body: `All content, design, code, and assets within the Toyota Workshop Service Tracker are the intellectual property of the workshop operator or its licensors. You may not copy, reproduce, distribute, or create derivative works without express written consent.

Customer-submitted feedback and data remain the property of the submitting party but grant us a non-exclusive licence to display it within the service dashboard.`,
  },
  {
    title: '6. Limitation of Liability',
    body: `To the fullest extent permitted by law, Toyota Workshop Service Tracker and its operators shall not be liable for:
• Inaccurate service time estimates displayed in the tracker
• Service delays or vehicle damage occurring at the workshop (these are the responsibility of the workshop operator)
• Data loss due to circumstances beyond our control, including cloud outages
• Any indirect, incidental, or consequential damages arising from use of the Service`,
  },
  {
    title: '7. Termination',
    body: `We reserve the right to suspend or terminate access to the Service at any time, with or without notice, for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.`,
  },
  {
    title: '8. Changes to Terms',
    body: `We may revise these Terms at any time. The updated version will be posted on this page with a revised date. Your continued use of the Service after changes are posted constitutes acceptance of the new terms.`,
  },
  {
    title: '9. Governing Law',
    body: `These Terms of Service shall be governed by and construed in accordance with the laws of Malaysia, without regard to its conflict of law provisions. Any disputes arising shall be subject to the exclusive jurisdiction of courts located in Kuala Lumpur, Malaysia.`,
  },
]

export default function TermsOfService() {
  return (
    <div style={{ background: '#F4F7FE', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />

      <main style={{ flex: 1, maxWidth: 780, margin: '0 auto', width: '100%', padding: '3.5rem 1.5rem' }}>

        {/* Header */}
        <div style={{ marginBottom: '2.5rem' }}>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: TOYOTA_RED, textTransform: 'uppercase', letterSpacing: '0.1em', display: 'block', marginBottom: 8 }}>
            Legal
          </span>
          <h1 style={{ fontWeight: 800, fontSize: 'clamp(1.6rem, 3vw, 2.1rem)', color: '#0F172A', marginBottom: 8 }}>
            Terms of Service
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.83rem' }}>Effective date: March 2026</p>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.75, marginTop: '0.75rem', maxWidth: 640 }}>
            Please read these Terms of Service carefully before using the Toyota Workshop Service Tracker.
            By using the platform, you agree to be bound by these terms.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {SECTIONS.map(({ title, body }) => (
            <div key={title} style={{ background: '#fff', borderRadius: 14, padding: '1.5rem 1.75rem', border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
              <h2 style={{ fontWeight: 700, fontSize: '1rem', color: '#0F172A', marginBottom: '0.75rem' }}>{title}</h2>
              <p style={{ fontSize: '0.875rem', color: '#475569', lineHeight: 1.8, margin: 0, whiteSpace: 'pre-line' }}>{body}</p>
            </div>
          ))}
        </div>

        {/* Contact line */}
        <div style={{ marginTop: '2rem', padding: '1.25rem 1.5rem', background: '#FFF0F1', borderRadius: 12, border: '1px solid rgba(235,10,30,0.15)', display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>Questions about these terms?</span>
          <a href="mailto:legal@toyotaworkshop.com" style={{ fontSize: '0.875rem', fontWeight: 700, color: TOYOTA_RED, textDecoration: 'none' }}>
            legal@toyotaworkshop.com
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}
