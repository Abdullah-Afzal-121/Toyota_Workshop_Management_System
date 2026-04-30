/**
 * emailService.js
 * Sends emails via nodemailer. Reads SMTP config from environment variables.
 * If SMTP_USER is not set, falls back to printing the reset link in the console
 * (useful during development without an email account configured).
 */
const nodemailer = require('nodemailer');

function createTransporter() {
  if (!process.env.SMTP_USER) return null;
  return nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for others
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

/**
 * Send a password-reset email.
 * @param {string} toEmail  - recipient email address
 * @param {string} name     - recipient name
 * @param {string} resetUrl - full reset link (frontend URL + token + email)
 */
async function sendPasswordResetEmail(toEmail, name, resetUrl) {
  const transporter = createTransporter();

  if (!transporter) {
    // No SMTP configured – log to console so the developer can test manually.
    console.log('\n[PASSWORD RESET – email not configured, use this link to test]');
    console.log(`  To    : ${toEmail}`);
    console.log(`  Name  : ${name}`);
    console.log(`  Link  : ${resetUrl}\n`);
    return;
  }

  const from = process.env.SMTP_FROM || `"Toyota Workshop" <${process.env.SMTP_USER}>`;

  await transporter.sendMail({
    from,
    to:      toEmail,
    subject: 'Reset your Toyota Workshop password',
    html: `
      <!DOCTYPE html>
      <html>
        <body style="font-family:Arial,sans-serif;background:#f0f2f5;margin:0;padding:2rem;">
          <div style="max-width:540px;margin:auto;background:#fff;border-radius:12px;padding:2.5rem;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
            <div style="text-align:center;margin-bottom:1.5rem;">
              <div style="display:inline-block;background:linear-gradient(135deg,#f5316f,#eb0a1e);border-radius:50%;width:52px;height:52px;line-height:52px;text-align:center;font-size:1.4rem;">🔑</div>
            </div>
            <h2 style="color:#0F172A;font-size:1.4rem;margin:0 0 0.5rem;">Hi ${name},</h2>
            <p style="color:#475569;line-height:1.7;margin:0 0 1.5rem;">
              We received a request to reset your password for your Toyota Workshop account.
              Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
            </p>
            <div style="text-align:center;margin:2rem 0;">
              <a href="${resetUrl}"
                style="display:inline-block;background:linear-gradient(135deg,#f5316f,#eb0a1e);color:#fff;text-decoration:none;font-weight:700;font-size:0.9rem;letter-spacing:0.08em;padding:0.8rem 2.5rem;border-radius:25px;box-shadow:0 4px 14px rgba(235,10,30,0.35);">
                RESET PASSWORD
              </a>
            </div>
            <p style="color:#94A3B8;font-size:0.78rem;line-height:1.6;margin:0;">
              If you didn't request a password reset, you can safely ignore this email — your password will not change.
              <br/><br/>
              Or copy this link into your browser:<br/>
              <span style="color:#eb0a1e;word-break:break-all;">${resetUrl}</span>
            </p>
          </div>
        </body>
      </html>
    `,
  });
}

module.exports = { sendPasswordResetEmail };
