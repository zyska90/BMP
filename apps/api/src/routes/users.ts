import { Elysia } from 'elysia';
import { db } from '../db';
import { users, registrations, expertiseTags, userTags, industries } from '../db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth } from '../middleware/jwt';

export const userRoutes = new Elysia({ prefix: '/users' })
  .use(requireAuth)

  // Full profile for the authenticated user
  .get('/me', async ({ user, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' }; }
    const rows = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        title: users.title,
        company: users.company,
        companySize: users.companySize,
        city: users.city,
        isOpenToRemote: users.isOpenToRemote,
        intentOffer: users.intentOffer,
        intentSeek: users.intentSeek,
        profileCompleteness: users.profileCompleteness,
        hasCompletedProfile: users.hasCompletedProfile,
        linkedinUrl: users.linkedinUrl,
        instagramHandle: users.instagramHandle,
        whatsappNumber: users.whatsappNumber,
        websiteUrl: users.websiteUrl,
        industryId: users.industryId,
        industryName: industries.name,
        role: users.role,
        accountStatus: users.accountStatus,
        createdAt: users.createdAt
      })
      .from(users)
      .leftJoin(industries, eq(users.industryId, industries.id))
      .where(eq(users.id, user.userId))
      .limit(1);

    if (rows.length === 0) {
      set.status = 404;
      return { error: 'User not found' };
    }

    // Fetch expertise tags separately
    const tagRows = await db
      .select({ id: expertiseTags.id, name: expertiseTags.name, slug: expertiseTags.slug, category: expertiseTags.category })
      .from(userTags)
      .innerJoin(expertiseTags, eq(userTags.tagId, expertiseTags.id))
      .where(eq(userTags.userId, user.userId));

    return { ...rows[0], expertiseTags: tagRows };
  })

  // Pre-fill data from registration record — used by profile setup wizard
  .get('/me/prefill', async ({ user, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' }; }
    // Look up the registration by the user's email
    const me = await db.select({ email: users.email }).from(users).where(eq(users.id, user.userId)).limit(1);
    if (me.length === 0) {
      set.status = 404;
      return { error: 'User not found' };
    }

    const regRows = await db
      .select()
      .from(registrations)
      .where(eq(registrations.email, me[0].email))
      .limit(1);

    if (regRows.length === 0) {
      // No registration found — return empty prefill (admin-created users won't have one)
      return { found: false, data: null };
    }

    const reg = regRows[0];
    let parsed: Record<string, string> = {};

    try {
      if (reg.rawPayload) {
        const raw = JSON.parse(reg.rawPayload);
        const fields: any[] = raw.data?.fields || [];
        for (const field of fields) {
          const label = (field.label || '').toLowerCase();
          const value = String(field.value || '').trim();
          if (!value) continue;
          if (label.includes('company') || label.includes('perusahaan')) parsed.company = value;
          else if (label.includes('role') || label.includes('jabatan') || label.includes('title')) parsed.title = value;
          else if (label.includes('industry') || label.includes('industri')) parsed.industry = value;
          else if (label.includes('offer') || label.includes('tawarkan') || label.includes('provide')) parsed.intentOffer = value;
          else if (label.includes('seek') || label.includes('cari') || label.includes('looking')) parsed.intentSeek = value;
          else if (label.includes('city') || label.includes('kota') || label.includes('location')) parsed.city = value;
          else if (label.includes('whatsapp') || label.includes('phone') || label.includes('wa')) parsed.whatsappNumber = value;
        }
      }
    } catch (_) {}

    return {
      found: true,
      data: {
        fullName: reg.fullName,
        roleType: reg.roleType,
        company: parsed.company || '',
        title: parsed.title || '',
        industry: parsed.industry || '',
        intentOffer: parsed.intentOffer || '',
        intentSeek: parsed.intentSeek || '',
        city: parsed.city || '',
        whatsappNumber: parsed.whatsappNumber || ''
      }
    };
  });
