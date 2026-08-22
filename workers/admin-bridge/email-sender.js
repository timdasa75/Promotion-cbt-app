// Email sending module using Resend API
// Sign up at https://resend.com for free tier (100 emails/day)

import {
  buildVerificationEmail,
  buildPasswordResetEmail,
  buildWelcomeEmail,
  buildPaymentConfirmationEmail,
} from "./email-templates.js";

const RESEND_API_URL = "https://api.resend.com/emails";

/**
 * Send an email using Resend API
 * @param {object} env - Worker environment
 * @param {object} options - Email options
 * @returns {Promise<object>} - Send result
 */
export async function sendEmail(env, { to, subject, html, from }) {
  const apiKey = env.RESEND_API_KEY;
  console.log("[email-sender] RESEND_API_KEY present:", Boolean(apiKey));
  if (!apiKey) {
    console.warn("[email-sender] RESEND_API_KEY not configured, email not sent");
    return { ok: false, error: "Email service not configured" };
  }

  const fromAddress = from || env.EMAIL_FROM || "Promotion CBT <onboarding@resend.dev>";
  console.log("[email-sender] Sending email from:", fromAddress, "to:", to);

  try {
    const response = await fetch(RESEND_API_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: fromAddress,
        to: Array.isArray(to) ? to : [to],
        subject,
        html,
      }),
    });

    const result = await response.json();
    console.log("[email-sender] Response status:", response.status, "result:", JSON.stringify(result));

    if (!response.ok) {
      console.error("[email-sender] Email send failed:", result);
      return { ok: false, error: result.message || "Failed to send email" };
    }

    return { ok: true, id: result.id };
  } catch (error) {
    console.error("[email-sender] Email send error:", error);
    return { ok: false, error: error.message };
  }
}

/**
 * Send email verification email
 */
export async function sendVerificationEmail(env, { email, name, token, baseUrl }) {
  const verificationUrl = `${baseUrl}/verify?token=${encodeURIComponent(token)}`;
  
  const html = buildVerificationEmail({
    name,
    verificationUrl,
  });

  return sendEmail(env, {
    to: email,
    subject: "Verify your email - Promotion CBT",
    html,
  });
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(env, { email, name, token, baseUrl }) {
  const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;
  
  const html = buildPasswordResetEmail({
    name,
    resetUrl,
  });

  return sendEmail(env, {
    to: email,
    subject: "Reset your password - Promotion CBT",
    html,
  });
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(env, { email, name }) {
  const baseUrl = env.APP_URL || "https://promotioncbt.com";
  const loginUrl = `${baseUrl}`;
  
  const html = buildWelcomeEmail({
    name,
    loginUrl,
  });

  return sendEmail(env, {
    to: email,
    subject: "Welcome to Promotion CBT!",
    html,
  });
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(env, { email, name, plan, amount, currency, cycle }) {
  const html = buildPaymentConfirmationEmail({
    name,
    plan,
    amount,
    currency,
    cycle,
  });

  return sendEmail(env, {
    to: email,
    subject: "Payment Confirmed - Promotion CBT",
    html,
  });
}
