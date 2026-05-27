import { Elysia, t } from 'elysia';
import { db } from '../db';
import { registrations, users } from '../db/schema';
import { eq, desc } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { requireAdmin } from '../middleware/jwt';
import { sendEmail, getCredentialEmailTemplate } from '../services/email';

// Helper to generate a random 6-character uppercase passcode
function generatePasscode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Helper to generate a unique username from full name
async function generateUniqueUsername(fullName: string): Promise<string> {
  const base = fullName
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '.') // replace special chars with dot
    .replace(/\.+/g, '.')       // collapse consecutive dots
    .replace(/^\.|\.$/g, '');   // trim leading/trailing dots

  let username = base;
  let counter = 1;
  
  // Check collisions in database
  while (true) {
    const existing = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (existing.length === 0) {
      break;
    }
    username = `${base}${counter}`;
    counter++;
  }

  return username;
}

export const adminRoutes = new Elysia({ prefix: '/admin' })
  .use(requireAdmin)
  
  // Get all Tally registrations
  .get('/registrations', async () => {
    return await db
      .select()
      .from(registrations)
      .orderBy(desc(registrations.id));
  })

  // Approve a registration
  .post('/registrations/:id/approve', async ({ params: { id }, user, set }) => {
    const regId = parseInt(id);
    
    // 1. Fetch registration details
    const regList = await db.select().from(registrations).where(eq(registrations.id, regId)).limit(1);
    if (regList.length === 0) {
      set.status = 404;
      return { error: 'Registration not found' };
    }

    const reg = regList[0];
    if (reg.status !== 'pending') {
      set.status = 400;
      return { error: 'Invalid state', message: `Registration is already ${reg.status}` };
    }

    // 2. Generate unique username and secure random passcode
    const username = await generateUniqueUsername(reg.fullName);
    const passcode = generatePasscode();
    const passcodeHash = await bcrypt.hash(passcode, 10);

    // 3. Extract metadata from raw JSON if present (to prefill user info)
    let company = '';
    let title = '';
    let roleType = reg.roleType || 'user';

    try {
      if (reg.rawPayload) {
        const payload = JSON.parse(reg.rawPayload);
        // Tally forms usually return an array of fields or key-value dictionary depending on webhook config.
        // We will fallback to safe empty values if parsing fails or fields are missing.
        company = payload.company || '';
        title = payload.title || payload.role || '';
      }
    } catch (_) {}

    // 4. Create user record
    const [newUser] = await db.insert(users).values({
      username,
      email: reg.email,
      passcodeHash,
      role: 'user',
      fullName: reg.fullName,
      company,
      title,
      hasCompletedProfile: false,
      profileCompleteness: 0
    });

    // 5. Update registration status
    await db
      .update(registrations)
      .set({
        status: 'approved',
        reviewedBy: user.userId,
        reviewedAt: new Date()
      })
      .where(eq(registrations.id, regId));

    // 6. Send credential email via Resend helper
    const emailHtml = getCredentialEmailTemplate(reg.fullName, username, passcode);
    const emailSent = await sendEmail({
      to: reg.email,
      subject: 'Your BizLink Account is Approved!',
      html: emailHtml
    });

    return {
      success: true,
      message: 'Registration approved and user created successfully',
      emailSent,
      data: {
        userId: newUser.insertId,
        username,
        passcode
      }
    };
  })

  // Reject a registration
  .post('/registrations/:id/reject', async ({ params: { id }, user, set }) => {
    const regId = parseInt(id);

    const regList = await db.select().from(registrations).where(eq(registrations.id, regId)).limit(1);
    if (regList.length === 0) {
      set.status = 404;
      return { error: 'Registration not found' };
    }

    const reg = regList[0];
    if (reg.status !== 'pending') {
      set.status = 400;
      return { error: 'Invalid state', message: `Registration is already ${reg.status}` };
    }

    // Update status to rejected
    await db
      .update(registrations)
      .set({
        status: 'rejected',
        reviewedBy: user.userId,
        reviewedAt: new Date()
      })
      .where(eq(registrations.id, regId));

    return {
      success: true,
      message: 'Registration rejected successfully'
    };
  });
