import { Elysia, t } from 'elysia';
import { db } from '../db';
import { users, registrations, expertiseTags, userTags, industries } from '../db/schema';
import { eq, asc } from 'drizzle-orm';
import { requireAuth } from '../middleware/jwt';

// Completeness scoring — weights must sum to 100
function computeCompleteness(u: {
  fullName?: string | null;
  title?: string | null;
  company?: string | null;
  companySize?: string | null;
  industryId?: number | null;
  city?: string | null;
  intentOffer?: string | null;
  intentSeek?: string | null;
  tagCount: number;
}): number {
  let score = 0;
  if (u.fullName) score += 15;
  if (u.company) score += 10;
  if (u.title) score += 10;
  if (u.companySize) score += 5;
  if (u.industryId) score += 10;
  if (u.city) score += 5;
  if (u.intentOffer && u.intentOffer.length >= 10) score += 20;
  if (u.intentSeek && u.intentSeek.length >= 10) score += 20;
  if (u.tagCount >= 1) score += 5;
  if (u.tagCount >= 3) score += 5;  // bonus for 3+ tags
  // max possible = 105, cap at 100
  return Math.min(100, score);
}

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
        photoUrl: users.photoUrl,
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

    if (rows.length === 0) { set.status = 404; return { error: 'User not found' }; }

    const tagRows = await db
      .select({ id: expertiseTags.id, name: expertiseTags.name, slug: expertiseTags.slug, category: expertiseTags.category })
      .from(userTags)
      .innerJoin(expertiseTags, eq(userTags.tagId, expertiseTags.id))
      .where(eq(userTags.userId, user.userId));

    return { ...rows[0], expertiseTags: tagRows };
  })

  // Save / update profile — called on wizard completion and profile edit
  .put('/me/profile', async ({ user, body, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' }; }

    const {
      fullName, title, company, companySize, industryId, city, isOpenToRemote,
      intentOffer, intentSeek, photoUrl, linkedinUrl, instagramHandle, whatsappNumber, websiteUrl,
      tagIds
    } = body as any;

    // Enforce max 8 tags
    const safeTagIds: number[] = Array.isArray(tagIds) ? tagIds.slice(0, 8) : [];

    // Compute completeness
    const completeness = computeCompleteness({
      fullName, title, company, companySize, industryId, city,
      intentOffer, intentSeek, tagCount: safeTagIds.length
    });

    const hasCompleted = completeness >= 80;

    // Update user record
    await db.update(users).set({
      fullName: fullName || null,
      title: title || null,
      company: company || null,
      companySize: companySize || null,
      industryId: industryId || null,
      city: city || null,
      isOpenToRemote: isOpenToRemote ?? false,
      intentOffer: intentOffer || null,
      intentSeek: intentSeek || null,
      photoUrl: photoUrl || null,
      linkedinUrl: linkedinUrl || null,
      instagramHandle: instagramHandle || null,
      whatsappNumber: whatsappNumber || null,
      websiteUrl: websiteUrl || null,
      profileCompleteness: completeness,
      hasCompletedProfile: hasCompleted
    }).where(eq(users.id, user.userId));

    // Sync expertise tags — delete all then re-insert
    await db.delete(userTags).where(eq(userTags.userId, user.userId));
    if (safeTagIds.length > 0) {
      await db.insert(userTags).values(
        safeTagIds.map((tagId: number) => ({ userId: user.userId, tagId }))
      );
    }

    return { success: true, profileCompleteness: completeness, hasCompletedProfile: hasCompleted };
  })

  // Pre-fill data from registration record
  .get('/me/prefill', async ({ user, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' }; }
    const me = await db.select({ email: users.email }).from(users).where(eq(users.id, user.userId)).limit(1);
    if (me.length === 0) { set.status = 404; return { error: 'User not found' }; }

    const regRows = await db.select().from(registrations).where(eq(registrations.email, me[0].email)).limit(1);
    if (regRows.length === 0) return { found: false, data: null };

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
          else if (label.includes('offer') || label.includes('tawarkan')) parsed.intentOffer = value;
          else if (label.includes('seek') || label.includes('cari') || label.includes('looking')) parsed.intentSeek = value;
          else if (label.includes('city') || label.includes('kota') || label.includes('location')) parsed.city = value;
          else if (label.includes('whatsapp') || label.includes('phone')) parsed.whatsappNumber = value;
        }
      }
    } catch (_) {}

    return {
      found: true,
      data: {
        fullName: reg.fullName, roleType: reg.roleType,
        company: parsed.company || '', title: parsed.title || '',
        intentOffer: parsed.intentOffer || '', intentSeek: parsed.intentSeek || '',
        city: parsed.city || '', whatsappNumber: parsed.whatsappNumber || ''
      }
    };
  });

// Public reference data routes (no auth required)
export const referenceRoutes = new Elysia({ prefix: '/reference' })
  .get('/industries', async () => {
    return await db.select().from(industries).orderBy(asc(industries.name));
  })
  .get('/expertise-tags', async () => {
    const tags = await db.select().from(expertiseTags).orderBy(asc(expertiseTags.category), asc(expertiseTags.name));
    // Group by category
    const grouped: Record<string, typeof tags> = {};
    for (const tag of tags) {
      if (!grouped[tag.category]) grouped[tag.category] = [];
      grouped[tag.category].push(tag);
    }
    return { tags, grouped };
  });
