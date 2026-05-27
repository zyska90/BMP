// Resend email service helper

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

export async function sendEmail({ to, subject, html }: EmailOptions): Promise<boolean> {
  const RESEND_API_KEY = process.env.RESEND_API_KEY;
  const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'noreply@bizlink.id';

  if (!RESEND_API_KEY) {
    console.warn('⚠️ RESEND_API_KEY is not configured. Email NOT sent. Logged content:');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body:\n${html}`);
    return true; // Return true in dev mode if not configured to prevent crashes
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error(`❌ Resend email failed: ${errText}`);
      return false;
    }

    console.log(`✉️ Email successfully sent to ${to}`);
    return true;
  } catch (error) {
    console.error('❌ Error calling Resend API:', error);
    return false;
  }
}

// Credential template helper
export function getCredentialEmailTemplate(fullName: string, username: string, passcode: string): string {
  const loginUrl = process.env.ALLOWED_ORIGIN || 'http://localhost:3000';

  return `
    <div style="font-family: 'Outfit', 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: #faf9f7; color: #0e0e0e; border: 1px solid #e4e1db; border-radius: 12px;">
      <h2 style="font-family: 'Lora', serif; color: #0d5c46; margin-bottom: 20px; font-weight: 600;">Welcome to BizLink (LinkID)!</h2>
      
      <p>Dear <strong>${fullName}</strong>,</p>
      
      <p>Congratulations! Your registration for the upcoming cohort of our <strong>Business Matching Platform</strong> has been approved by the administrators.</p>
      
      <div style="background: #ffffff; border: 1px solid #e4e1db; border-radius: 8px; padding: 24px; margin: 30px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.02);">
        <p style="margin-top: 0; font-size: 14px; text-transform: uppercase; letter-spacing: 0.08em; color: #9a9a9a; font-weight: 600;">Your Login Credentials</p>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 6px 0; color: #5a5a5a; font-size: 14px; width: 100px;">Username:</td>
            <td style="padding: 6px 0; font-weight: 600; font-family: monospace; font-size: 16px; color: #0e0e0e;">${username}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #5a5a5a; font-size: 14px; width: 100px;">One-Time Passcode:</td>
            <td style="padding: 6px 0; font-weight: 600; font-family: monospace; font-size: 16px; color: #c0432a;">${passcode}</td>
          </tr>
        </table>
        
        <p style="font-size: 12px; color: #b06c10; margin-bottom: 0; margin-top: 15px; font-weight: 500;">💡 For security reasons, you will be prompted to complete your profile and optionally change this passcode on your first login.</p>
      </div>
      
      <p style="margin-bottom: 30px;">To access the platform and start finding high-value matching recommendations, please click the button below:</p>
      
      <div style="text-align: center; margin-bottom: 40px;">
        <a href="${loginUrl}/login" style="background: #0d5c46; color: #ffffff; text-decoration: none; padding: 12px 30px; border-radius: 6px; font-weight: 600; font-size: 15px; display: inline-block; transition: background 0.15s;">
          Log In to Platform
        </a>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e4e1db; margin-bottom: 20px;" />
      
      <p style="font-size: 12px; color: #9a9a9a; text-align: center; margin-bottom: 0;">
        This email was sent automatically. Please do not reply directly to this address.<br/>
        &copy; 2026 BizLink Business Matching Platform.
      </p>
    </div>
  `;
}
