import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const TOYOTA_RED = '#EB0A1E'

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect only the minimum information necessary to operate the service:
• Vehicle registration numbers entered for tracking purposes
• Account credentials (email and hashed password) for workshop staff
• Service stage data, timestamps, and technician notes associated with a vehicle
• Optional feedback ratings and comments submitted by customers

We do not collect personally identifiable information from customers who use the public tracking feature.`,
  },
  {
    title: '2. How We Use Your Information',
    body: `Information collected is used exclusively to:
• Display real-time service status to the vehicle owner or customer
• Allow workshop staff to manage, update, and complete service stages
• Generate internal analytics for workshop performance (aggregate, non-personal)
• Send optional email updates if you subscribe to our newsletter

We do not sell, rent, or distribute your data to third parties for marketing purposes.`,
  },
  {
    title: '3. Data Storage & Security',
    body: `All data is stored in a secure, encrypted cloud database (MongoDB Atlas). 
We apply industry-standard security practices including:
• Bcrypt password hashing for all user accounts
• JWT-based authentication with expiring tokens
• HTTPS encryption for all data in transit
• Role-based access control (customer, mechanic, admin)

While we take every reasonable precaution, no system is 100% immune to security risks.`,
  },
  {
    title: '4. Cookies',
    body: `We use minimal, functional cookies only to maintain your authenticated session (if you are a logged-in workshop user). We do not use tracking, advertising, or analytics cookies. Customers using the public tracker are not tracked via cookies.`,
  },
  {
    title: '5. Third-Party Services',
    body: `We use the following third-party services which have their own privacy policies:
• MongoDB Atlas (database hosting) — mongodb.com/legal/privacy-policy
• Vite / React (client-side rendering, no data collection)
• Any future email providers used for subscriptions

We encourage you to review their policies if relevant to your use.`,
  },
  {
    title: '6. Your Rights',
    body: `You have the right to:
• Request access to any personal data we hold associated with your account
• Request correction or deletion of your data
• Withdraw consent for newsletter communications at any time
• Lodge a complaint with a relevant data protection authority

To exercise any of these rights, contact us at privacy@toyotaworkshop.com.`,
  },
  {
    title: '7. Changes to This Policy',
    body: `We may update this Privacy Policy from time to time. Changes will be posted on this page with an updated "Last revised" date. Continued use of the service after changes constitutes acceptance of the revised policy.`,
  },
]

export default function PrivacyPolicy() {
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
            Privacy Policy
          </h1>
          <p style={{ color: '#94A3B8', fontSize: '0.83rem' }}>Last revised: March 2026</p>
          <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: 1.75, marginTop: '0.75rem', maxWidth: 640 }}>
            Toyota Workshop Service Tracker ("we", "our", "us") is committed to protecting your privacy.
            This policy explains what information we collect, how we use it, and your rights.
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
          <span style={{ fontSize: '0.875rem', color: '#374151', fontWeight: 500 }}>Questions about this policy?</span>
          <a href="mailto:privacy@toyotaworkshop.com" style={{ fontSize: '0.875rem', fontWeight: 700, color: TOYOTA_RED, textDecoration: 'none' }}>
            privacy@toyotaworkshop.com
          </a>
        </div>
      </main>

      <Footer />
    </div>
  )
}
