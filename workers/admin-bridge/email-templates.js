// Email templates for Promotion CBT

const BASE_STYLES = `
  body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #1f2937; margin: 0; padding: 0; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { background: linear-gradient(135deg, #064222, #0a7840); color: white; padding: 24px; text-align: center; border-radius: 12px 12px 0 0; }
  .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
  .content { background: #ffffff; padding: 32px 24px; border: 1px solid #e5e7eb; }
  .footer { background: #f9fafb; padding: 20px 24px; text-align: center; font-size: 12px; color: #6b7280; border-radius: 0 0 12px 12px; }
  .button { 
    display: inline-block; 
    background: #0a7840; 
    color: #ffffff !important; 
    padding: 14px 28px; 
    text-decoration: none; 
    border-radius: 8px; 
    font-weight: 600;
    margin: 16px 0;
  }
  .button:hover { background: #086636; }
  .link { color: #0a7840; word-break: break-all; }
  .code { 
    background: #f3f4f6; 
    padding: 12px 16px; 
    border-radius: 8px; 
    font-family: monospace; 
    font-size: 16px;
    text-align: center;
    margin: 16px 0;
  }
  .warning { 
    background: #fef3c7; 
    border: 1px solid #fcd34d; 
    padding: 12px 16px; 
    border-radius: 8px; 
    margin: 16px 0;
  }
`;

function baseTemplate(title, content) {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${BASE_STYLES}</style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Promotion CBT</h1>
    </div>
    <div class="content">
      <h2 style="margin-top: 0; color: #064222;">${title}</h2>
      ${content}
    </div>
    <div class="footer">
      <p>Promotion CBT - Federal Civil Service Learning Suite</p>
      <p>This is an automated message. Please do not reply.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

export function buildVerificationEmail({ name, verificationUrl, expiresIn = "24 hours" }) {
  const content = `
    <p>Hello ${name || "there"},</p>
    <p>Welcome to Promotion CBT! Please verify your email address to get started.</p>
    <div style="text-align: center;">
      <a href="${verificationUrl}" class="button">Verify Email Address</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p class="link">${verificationUrl}</p>
    <div class="warning">
      <strong>This link expires in ${expiresIn}.</strong>
    </div>
    <p>If you didn't create an account, you can safely ignore this email.</p>
  `;
  
  return baseTemplate("Verify Your Email", content);
}

export function buildPasswordResetEmail({ name, resetUrl, expiresIn = "1 hour" }) {
  const content = `
    <p>Hello ${name || "there"},</p>
    <p>We received a request to reset your password for Promotion CBT.</p>
    <div style="text-align: center;">
      <a href="${resetUrl}" class="button">Reset Password</a>
    </div>
    <p>Or copy and paste this link into your browser:</p>
    <p class="link">${resetUrl}</p>
    <div class="warning">
      <strong>This link expires in ${expiresIn}.</strong>
    </div>
    <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
  `;
  
  return baseTemplate("Reset Your Password", content);
}

export function buildWelcomeEmail({ name, loginUrl }) {
  const content = `
    <p>Hello ${name || "there"},</p>
    <p>Welcome to Promotion CBT! Your account has been created successfully.</p>
    <p>You can now access all features including:</p>
    <ul>
      <li>Practice questions across 10 core topics</li>
      <li>Timed topic tests</li>
      <li>Weekly mock exams</li>
      <li>Detailed performance analytics</li>
    </ul>
    <div style="text-align: center;">
      <a href="${loginUrl}" class="button">Start Learning</a>
    </div>
    <p>Good luck with your preparation!</p>
  `;
  
  return baseTemplate("Welcome to Promotion CBT", content);
}

export function buildPaymentConfirmationEmail({ name, plan, amount, currency, cycle }) {
  const content = `
    <p>Hello ${name || "there"},</p>
    <p>Your payment has been confirmed! You now have access to <strong>Premium</strong> features.</p>
    <div style="background: #ecfdf3; border: 1px solid #34d399; padding: 16px; border-radius: 8px; margin: 16px 0;">
      <p style="margin: 0;"><strong>Plan:</strong> ${plan || "Premium"}</p>
      <p style="margin: 8px 0 0;"><strong>Amount:</strong> ${currency || "NGN"} ${amount || "2,500"} (${cycle || "monthly"})</p>
    </div>
    <p>Enjoy unlimited access to all topics, questions, and features!</p>
  `;
  
  return baseTemplate("Payment Confirmed", content);
}
