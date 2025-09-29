import { Resend } from 'resend'

const resend = new Resend(process.env.AUTH_RESEND_KEY)

interface EmailTemplate {
  to: string
  subject: string
  html: string
  text: string
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(
  email: string,
  token: string,
  name?: string
): Promise<boolean> {
  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}`

  const template = createVerificationEmailTemplate({
    to: email,
    verificationUrl,
    name: name || 'User',
  })

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@grabtogo.com',
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
    return true
  } catch (error) {
    console.error('Failed to send verification email:', error)
    return false
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  token: string,
  name?: string
): Promise<boolean> {
  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

  const template = createPasswordResetEmailTemplate({
    to: email,
    resetUrl,
    name: name || 'User',
  })

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@grabtogo.com',
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
    return true
  } catch (error) {
    console.error('Failed to send password reset email:', error)
    return false
  }
}

/**
 * Send welcome email after email verification
 */
export async function sendWelcomeEmail(
  email: string,
  name: string,
  role: string
): Promise<boolean> {
  const template = createWelcomeEmailTemplate({
    to: email,
    name,
    role,
  })

  try {
    await resend.emails.send({
      from: process.env.EMAIL_FROM || 'noreply@grabtogo.com',
      to: email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    })
    return true
  } catch (error) {
    console.error('Failed to send welcome email:', error)
    return false
  }
}

/**
 * Create email verification template
 */
function createVerificationEmailTemplate({
  to,
  verificationUrl,
  name,
}: {
  to: string
  verificationUrl: string
  name: string
}): EmailTemplate {
  const subject = 'Verify your GrabtoGo account'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 20px; }
    .content h2 { color: #1a202c; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; }
    .content p { color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-align: center; }
    .button:hover { opacity: 0.9; }
    .footer { background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #718096; font-size: 14px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GrabtoGo</h1>
    </div>

    <div class="content">
      <h2>Welcome to GrabtoGo, ${name}!</h2>

      <p>Thank you for signing up for GrabtoGo. To complete your registration and start using our marketplace platform, please verify your email address by clicking the button below.</p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" class="button">Verify Email Address</a>
      </p>

      <p>This verification link will expire in 24 hours for security reasons.</p>

      <p>If you didn't create an account with GrabtoGo, you can safely ignore this email.</p>

      <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${verificationUrl}</p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} GrabtoGo. All rights reserved.</p>
      <p>This email was sent to ${to}</p>
    </div>
  </div>
</body>
</html>`

  const text = `
Welcome to GrabtoGo, ${name}!

Thank you for signing up for GrabtoGo. To complete your registration and start using our marketplace platform, please verify your email address by visiting this link:

${verificationUrl}

This verification link will expire in 24 hours for security reasons.

If you didn't create an account with GrabtoGo, you can safely ignore this email.

© ${new Date().getFullYear()} GrabtoGo. All rights reserved.
This email was sent to ${to}
`

  return { to, subject, html, text }
}

/**
 * Create password reset email template
 */
function createPasswordResetEmailTemplate({
  to,
  resetUrl,
  name,
}: {
  to: string
  resetUrl: string
  name: string
}): EmailTemplate {
  const subject = 'Reset your GrabtoGo password'

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 20px; }
    .content h2 { color: #1a202c; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; }
    .content p { color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-align: center; }
    .button:hover { opacity: 0.9; }
    .footer { background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #718096; font-size: 14px; margin: 0; }
    .alert { background-color: #fed7d7; border: 1px solid #fc8181; color: #c53030; padding: 16px; border-radius: 8px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GrabtoGo</h1>
    </div>

    <div class="content">
      <h2>Password Reset Request</h2>

      <p>Hello ${name},</p>

      <p>We received a request to reset your password for your GrabtoGo account. If you made this request, please click the button below to reset your password.</p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" class="button">Reset Password</a>
      </p>

      <div class="alert">
        <strong>Security Notice:</strong> This password reset link will expire in 1 hour for your security.
      </div>

      <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>

      <p>If the button above doesn't work, you can copy and paste this link into your browser:</p>
      <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} GrabtoGo. All rights reserved.</p>
      <p>This email was sent to ${to}</p>
    </div>
  </div>
</body>
</html>`

  const text = `
Password Reset Request

Hello ${name},

We received a request to reset your password for your GrabtoGo account. If you made this request, please visit this link to reset your password:

${resetUrl}

SECURITY NOTICE: This password reset link will expire in 1 hour for your security.

If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.

© ${new Date().getFullYear()} GrabtoGo. All rights reserved.
This email was sent to ${to}
`

  return { to, subject, html, text }
}

/**
 * Create welcome email template
 */
function createWelcomeEmailTemplate({
  to,
  name,
  role,
}: {
  to: string
  name: string
  role: string
}): EmailTemplate {
  const subject = `Welcome to GrabtoGo, ${name}!`
  const dashboardUrl = role === 'VENDOR' ? `${process.env.NEXTAUTH_URL}/vendor/dashboard` : `${process.env.NEXTAUTH_URL}`

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 28px; font-weight: 600; }
    .content { padding: 40px 20px; }
    .content h2 { color: #1a202c; margin: 0 0 20px 0; font-size: 24px; font-weight: 600; }
    .content p { color: #4a5568; line-height: 1.6; margin: 0 0 20px 0; }
    .button { display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 8px; font-weight: 600; text-align: center; }
    .button:hover { opacity: 0.9; }
    .footer { background-color: #f7fafc; padding: 20px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #718096; font-size: 14px; margin: 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>GrabtoGo</h1>
    </div>

    <div class="content">
      <h2>Welcome to GrabtoGo!</h2>

      <p>Hi ${name},</p>

      <p>Congratulations! Your email has been verified and your GrabtoGo account is now active.</p>

      ${role === 'VENDOR' ? `
      <p>As a vendor, you can now:</p>
      <ul>
        <li>Set up your store profile</li>
        <li>Add your products to the marketplace</li>
        <li>Manage orders and inventory</li>
        <li>Access analytics and insights</li>
      </ul>
      ` : `
      <p>As a customer, you can now:</p>
      <ul>
        <li>Browse thousands of products</li>
        <li>Place orders from multiple vendors</li>
        <li>Track your deliveries</li>
        <li>Leave reviews and ratings</li>
      </ul>
      `}

      <p style="text-align: center; margin: 30px 0;">
        <a href="${dashboardUrl}" class="button">Get Started</a>
      </p>

      <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>

      <p>Thank you for joining GrabtoGo!</p>
    </div>

    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} GrabtoGo. All rights reserved.</p>
      <p>This email was sent to ${to}</p>
    </div>
  </div>
</body>
</html>`

  const text = `
Welcome to GrabtoGo!

Hi ${name},

Congratulations! Your email has been verified and your GrabtoGo account is now active.

${role === 'VENDOR' ? `
As a vendor, you can now:
- Set up your store profile
- Add your products to the marketplace
- Manage orders and inventory
- Access analytics and insights
` : `
As a customer, you can now:
- Browse thousands of products
- Place orders from multiple vendors
- Track your deliveries
- Leave reviews and ratings
`}

Get started: ${dashboardUrl}

If you have any questions or need assistance, please don't hesitate to contact our support team.

Thank you for joining GrabtoGo!

© ${new Date().getFullYear()} GrabtoGo. All rights reserved.
This email was sent to ${to}
`

  return { to, subject, html, text }
}