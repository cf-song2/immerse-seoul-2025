// utils/email.js
// Utility for sending emails via Resend (Free: 3000 emails/month)

export async function sendVerificationEmail(to, token, env) {
  const RESEND_API_KEY = env.RESEND_API_KEY;
  const FROM_EMAIL = env.EMAIL_FROM || 'onboarding@resend.dev';
  
  if (!RESEND_API_KEY) {
    console.error('RESEND_API_KEY not configured');
    return false;
  }
  
  const verificationUrl = `${env.ENVIRONMENT === 'production' ? env.FRONTEND_URL : env.DEV_FRONTEND_URL}/verify?token=${token}`;
  
  const emailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #7c3aed;">Verify Your Email</h2>
      <p>Welcome to Immerse Seoul AI Image Generator!</p>
      <p>Please click the button below to verify your email address:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationUrl}" 
           style="background-color: #7c3aed; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 6px; display: inline-block;">
          Verify Email
        </a>
      </div>
      <p style="color: #666; font-size: 14px;">
        If the button doesn't work, copy and paste this link into your browser:<br>
        <a href="${verificationUrl}">${verificationUrl}</a>
      </p>
      <p style="color: #666; font-size: 12px; margin-top: 30px;">
        If you didn't create an account, you can safely ignore this email.
      </p>
    </div>
  `;
  
  const body = {
    from: FROM_EMAIL,
    to: [to],
    subject: 'Verify your email for Immerse Seoul',
    html: emailHtml,
    text: `Click the link to verify your email: ${verificationUrl}`
  };
  
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });
    
    if (!res.ok) {
      const error = await res.text();
      console.error('Resend API error:', error);
      return false;
    }
    
    const result = await res.json();
    console.log('Email sent successfully:', result.id);
    return true;
  } catch (error) {
    console.error('Error sending email:', error);
    return false;
  }
}
