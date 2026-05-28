import { Elysia, t } from 'elysia';
import { db } from '../db';
import { registrations, users, expertiseTags } from '../db/schema';
import { eq, desc, asc } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
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
  })

  // --- User Management ---

  .get('/users', async () => {
    return await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        title: users.title,
        company: users.company,
        role: users.role,
        accountStatus: users.accountStatus,
        profileCompleteness: users.profileCompleteness,
        hasCompletedProfile: users.hasCompletedProfile,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(desc(users.createdAt));
  })

  .patch('/users/:id/status', async ({ params: { id }, body, set }) => {
    const { status } = body as { status: 'active' | 'inactive' };
    if (!['active', 'inactive'].includes(status)) {
      set.status = 400;
      return { error: 'Status must be active or inactive' };
    }
    await db.update(users)
      .set({ accountStatus: status })
      .where(eq(users.id, parseInt(id)));
    return { success: true, status };
  })

  // --- Tag Management ---

  .get('/tags', async () => {
    return await db.select().from(expertiseTags).orderBy(asc(expertiseTags.category), asc(expertiseTags.name));
  })

  .post('/tags', async ({ body, set }) => {
    const { name, category } = body as any;
    if (!name || !category) { set.status = 400; return { error: 'name and category required' }; }
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const [result] = await db.insert(expertiseTags).values({ name, slug, category });
    return { success: true, id: result.insertId, name, slug, category };
  })

  .patch('/tags/:id', async ({ params: { id }, body }) => {
    const { name, category } = body as any;
    const updates: any = {};
    if (name) { updates.name = name; updates.slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
    if (category) updates.category = category;
    await db.update(expertiseTags).set(updates).where(eq(expertiseTags.id, parseInt(id)));
    return { success: true };
  })

  .delete('/tags/:id', async ({ params: { id } }) => {
    await db.delete(expertiseTags).where(eq(expertiseTags.id, parseInt(id)));
    return { success: true };
  });
