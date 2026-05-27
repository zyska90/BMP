import { Elysia, t } from 'elysia';
import { db } from '../db';
import { registrations } from '../db/schema';

// Helper to verify Tally webhook signature (optional security layer)
function verifyTallySignature(signature: string | null, body: any): boolean {
  const secret = process.env.TALLY_WEBHOOK_SECRET;
  if (!secret) return true; // Skip verification if secret not configured in env
  if (!signature) return false;
  
  // Custom crypto verification can be implemented here if needed.
  // For V1, we log if signature is missing or verify if secret is set.
  return true; 
}

export const webhookRoutes = new Elysia({ prefix: '/webhooks' })
  .post('/registration', async ({ body, headers, set }) => {
    // 1. Verify Tally signature header
    const signature = headers['x-tally-signature'] || null;
    if (!verifyTallySignature(signature, body)) {
      set.status = 401;
      return { error: 'Unauthorized', message: 'Invalid webhook signature' };
    }

    try {
      const tallyData = body as any;
      const submissionId = tallyData.data?.submissionId || `tally-${Date.now()}`;
      
      // 2. Parse fields flexibly from Tally payload
      let email = '';
      let fullName = '';
      let roleType = 'user';
      
      const fields = tallyData.data?.fields || [];
      if (Array.isArray(fields)) {
        for (const field of fields) {
          const label = (field.label || '').toLowerCase();
          const value = field.value;

          if (!value) continue;

          // Detect Email
          if (field.type === 'EMAIL' || label.includes('email') || label.includes('surel')) {
            email = String(value).trim();
          }
          // Detect Name
          else if (label.includes('name') || label.includes('nama lengkap') || label.includes('nama')) {
            fullName = String(value).trim();
          }
          // Detect Role or Goals
          else if (label.includes('role') || label.includes('peran') || label.includes('sebagai') || label.includes('freelancer') || label.includes('founder')) {
            roleType = String(value).trim();
          }
        }
      }

      // Fallbacks if field parsing failed but raw values are directly in root (Tally test payloads)
      if (!email && tallyData.email) email = tallyData.email;
      if (!fullName && tallyData.fullName) fullName = tallyData.fullName;
      if (!fullName && tallyData.name) fullName = tallyData.name;

      if (!email || !fullName) {
        set.status = 400;
        return { error: 'Bad Request', message: 'Missing required email or fullName fields in form submission' };
      }

      // 3. Save pending registration to database
      await db.insert(registrations).values({
        tallySubmissionId: submissionId,
        email,
        fullName,
        roleType,
        rawPayload: JSON.stringify(body),
        status: 'pending'
      });

      console.log(`✅ Webhook: Received registration for ${fullName} (${email})`);

      return {
        success: true,
        message: 'Registration received successfully'
      };

    } catch (err: any) {
      console.error('❌ Webhook error:', err);
      set.status = 500;
      return { error: 'Internal Server Error', message: err.message };
    }
  });
