import { Elysia, t } from 'elysia';
import { db } from '../db';
import { registrations, users, expertiseTags, userTags, matchScores, meetingRequests, industryAdjacency } from '../db/schema';
import { eq, desc, asc, count, and, gte, sql } from 'drizzle-orm';
import { intentScoreCalc, jaccardCalc, industryCalc, scaleCalc, geoCalc, buildReasonText } from '../services/matching';
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

  // Platform stats for admin dashboard
  .get('/stats', async () => {
    const [
      [{ activeUsers }],
      [{ inactiveUsers }],
      [{ completedProfiles }],
      [{ totalMatches }],
      [{ pendingMeetings }],
      [{ confirmedMeetings }],
      [{ pendingRegs }],
      [{ approvedRegs }],
    ] = await Promise.all([
      db.select({ activeUsers: count() }).from(users).where(and(eq(users.accountStatus, 'active'), eq(users.role, 'user'))),
      db.select({ inactiveUsers: count() }).from(users).where(eq(users.accountStatus, 'inactive')),
      db.select({ completedProfiles: count() }).from(users).where(and(eq(users.hasCompletedProfile, true), eq(users.role, 'user'))),
      db.select({ totalMatches: count() }).from(matchScores),
      db.select({ pendingMeetings: count() }).from(meetingRequests).where(eq(meetingRequests.status, 'pending')),
      db.select({ confirmedMeetings: count() }).from(meetingRequests).where(eq(meetingRequests.status, 'accepted')),
      db.select({ pendingRegs: count() }).from(registrations).where(eq(registrations.status, 'pending')),
      db.select({ approvedRegs: count() }).from(registrations).where(eq(registrations.status, 'approved')),
    ]);

    return {
      activeUsers,
      inactiveUsers,
      completedProfiles,
      totalMatchPairs: Math.floor(totalMatches / 2), // bidirectional so divide by 2
      pendingMeetings,
      confirmedMeetings,
      pendingRegistrations: pendingRegs,
      approvedRegistrations: approvedRegs,
    };
  })

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

  // Global recompute — compute all pairs for all active users
  .post('/matches/recompute-all', async ({ set }) => {
    const allUsers = await db
      .select()
      .from(users)
      .where(and(eq(users.accountStatus, 'active'), eq(users.hasCompletedProfile, true), eq(users.role, 'user')));

    if (allUsers.length < 2) return { success: true, computed: 0 };

    const allTags = await db.select().from(userTags);
    const tagsByUser = new Map<number, number[]>();
    for (const t of allTags) {
      if (!tagsByUser.has(t.userId)) tagsByUser.set(t.userId, []);
      tagsByUser.get(t.userId)!.push(t.tagId);
    }

    const adjacencies = await db.select().from(industryAdjacency);
    const adjacencyMap = new Map<string, number>();
    for (const a of adjacencies) {
      adjacencyMap.set(`${a.industryAId}-${a.industryBId}`, a.weight);
    }

    let computed = 0;
    for (let i = 0; i < allUsers.length; i++) {
      for (let j = i + 1; j < allUsers.length; j++) {
        const a = allUsers[i];
        const b = allUsers[j];
        const tagsA = tagsByUser.get(a.id) || [];
        const tagsB = tagsByUser.get(b.id) || [];

        const s = {
          intent: intentScoreCalc(a.intentOffer, a.intentSeek, b.intentOffer, b.intentSeek),
          expertise: jaccardCalc(tagsA, tagsB),
          industry: industryCalc(a.industryId ?? null, b.industryId ?? null, adjacencyMap),
          scale: scaleCalc(a.companySize ?? null, b.companySize ?? null),
          geo: geoCalc(a.city ?? null, b.city ?? null, a.isOpenToRemote, b.isOpenToRemote),
        };
        const total = s.intent + s.expertise + s.industry + s.scale + s.geo;
        const reason = buildReasonText(s);

        await db.insert(matchScores).values({ userAId: a.id, userBId: b.id, totalScore: total, intentScore: s.intent, expertiseScore: s.expertise, industryScore: s.industry, scaleScore: s.scale, geoScore: s.geo, matchReasonSummary: reason })
          .onDuplicateKeyUpdate({ set: { totalScore: total, intentScore: s.intent, expertiseScore: s.expertise, industryScore: s.industry, scaleScore: s.scale, geoScore: s.geo, matchReasonSummary: reason, computedAt: sql`NOW()` } });

        await db.insert(matchScores).values({ userAId: b.id, userBId: a.id, totalScore: total, intentScore: s.intent, expertiseScore: s.expertise, industryScore: s.industry, scaleScore: s.scale, geoScore: s.geo, matchReasonSummary: reason })
          .onDuplicateKeyUpdate({ set: { totalScore: total, intentScore: s.intent, expertiseScore: s.expertise, industryScore: s.industry, scaleScore: s.scale, geoScore: s.geo, matchReasonSummary: reason, computedAt: sql`NOW()` } });

        computed++;
      }
    }
    return { success: true, computed, totalPairs: computed };
  })

  // All computed match pairs (deduplicated A < B)
  .get('/matches', async () => {
    const rows = await db
      .select({
        userAId: matchScores.userAId,
        userBId: matchScores.userBId,
        totalScore: matchScores.totalScore,
        intentScore: matchScores.intentScore,
        expertiseScore: matchScores.expertiseScore,
        industryScore: matchScores.industryScore,
        scaleScore: matchScores.scaleScore,
        geoScore: matchScores.geoScore,
        reason: matchScores.matchReasonSummary,
        computedAt: matchScores.computedAt,
      })
      .from(matchScores)
      .where(sql`user_a_id < user_b_id`) // deduplicate
      .orderBy(desc(matchScores.totalScore));

    // Fetch user names
    const allUsers = await db.select({ id: users.id, fullName: users.fullName, company: users.company, photoUrl: users.photoUrl }).from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    return rows.map(r => ({
      ...r,
      userA: userMap.get(r.userAId),
      userB: userMap.get(r.userBId),
    }));
  })

  // All meetings (admin view)
  .get('/meetings', async () => {
    const rows = await db
      .select({
        id: meetingRequests.id,
        status: meetingRequests.status,
        channel: meetingRequests.channel,
        proposedTime: meetingRequests.proposedTime,
        introNote: meetingRequests.introNote,
        createdAt: meetingRequests.createdAt,
        updatedAt: meetingRequests.updatedAt,
        requesterId: meetingRequests.requesterId,
        recipientId: meetingRequests.recipientId,
      })
      .from(meetingRequests)
      .orderBy(desc(meetingRequests.createdAt));

    const allUsers = await db.select({ id: users.id, fullName: users.fullName, company: users.company, photoUrl: users.photoUrl }).from(users);
    const userMap = new Map(allUsers.map(u => [u.id, u]));

    return rows.map(r => ({
      ...r,
      requester: userMap.get(r.requesterId),
      recipient: userMap.get(r.recipientId),
    }));
  })

  // --- User Management ---

  .get('/users', async () => {
    const allUsers = await db
      .select({
        id: users.id,
        username: users.username,
        email: users.email,
        fullName: users.fullName,
        title: users.title,
        company: users.company,
        city: users.city,
        photoUrl: users.photoUrl,
        role: users.role,
        accountStatus: users.accountStatus,
        profileCompleteness: users.profileCompleteness,
        hasCompletedProfile: users.hasCompletedProfile,
        intentOffer: users.intentOffer,
        intentSeek: users.intentSeek,
        industryId: users.industryId,
        companySize: users.companySize,
        whatsappNumber: users.whatsappNumber,
        linkedinUrl: users.linkedinUrl,
        isOpenToRemote: users.isOpenToRemote,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(desc(users.createdAt));

    // Get meeting counts per user
    const meetingCounts = await db
      .select({ userId: meetingRequests.requesterId, cnt: count() })
      .from(meetingRequests)
      .groupBy(meetingRequests.requesterId);

    const meetingReceivedCounts = await db
      .select({ userId: meetingRequests.recipientId, cnt: count() })
      .from(meetingRequests)
      .groupBy(meetingRequests.recipientId);

    // Get match counts per user (above min score 50)
    const matchCounts = await db
      .select({ userId: matchScores.userAId, cnt: count() })
      .from(matchScores)
      .where(gte(matchScores.totalScore, 50))
      .groupBy(matchScores.userAId);

    const meetingSentMap = new Map(meetingCounts.map(r => [r.userId, Number(r.cnt)]));
    const meetingReceivedMap = new Map(meetingReceivedCounts.map(r => [r.userId, Number(r.cnt)]));
    const matchMap = new Map(matchCounts.map(r => [r.userId, Number(r.cnt)]));

    return allUsers.map(u => ({
      ...u,
      meetingsSentCount: meetingSentMap.get(u.id) || 0,
      meetingsReceivedCount: meetingReceivedMap.get(u.id) || 0,
      matchCount: matchMap.get(u.id) || 0,
    }));
  })

  .get('/users/:id', async ({ params: { id }, set }) => {
    const userId = parseInt(id);

    const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!user) { set.status = 404; return { error: 'User not found' }; }

    // Expertise tags
    const tags = await db
      .select({ id: expertiseTags.id, name: expertiseTags.name, category: expertiseTags.category })
      .from(userTags)
      .innerJoin(expertiseTags, eq(userTags.tagId, expertiseTags.id))
      .where(eq(userTags.userId, userId));

    // Meetings (sent + received)
    const meetingsSent = await db
      .select({ id: meetingRequests.id, status: meetingRequests.status, channel: meetingRequests.channel, proposedTime: meetingRequests.proposedTime, createdAt: meetingRequests.createdAt, otherName: users.fullName })
      .from(meetingRequests)
      .innerJoin(users, eq(meetingRequests.recipientId, users.id))
      .where(eq(meetingRequests.requesterId, userId))
      .orderBy(desc(meetingRequests.createdAt));

    const meetingsReceived = await db
      .select({ id: meetingRequests.id, status: meetingRequests.status, channel: meetingRequests.channel, proposedTime: meetingRequests.proposedTime, createdAt: meetingRequests.createdAt, otherName: users.fullName })
      .from(meetingRequests)
      .innerJoin(users, eq(meetingRequests.requesterId, users.id))
      .where(eq(meetingRequests.recipientId, userId))
      .orderBy(desc(meetingRequests.createdAt));

    // Top matches
    const matches = await db
      .select({ score: matchScores.totalScore, fullName: users.fullName, company: users.company })
      .from(matchScores)
      .innerJoin(users, eq(matchScores.userBId, users.id))
      .where(eq(matchScores.userAId, userId))
      .orderBy(desc(matchScores.totalScore))
      .limit(5);

    return {
      ...user,
      expertiseTags: tags,
      meetingsSent,
      meetingsReceived,
      topMatches: matches,
      activity: {
        totalMeetingsSent: meetingsSent.length,
        totalMeetingsReceived: meetingsReceived.length,
        meetingsConfirmed: [...meetingsSent, ...meetingsReceived].filter(m => m.status === 'accepted').length,
        memberSince: user.createdAt,
      }
    };
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
