import { Elysia } from 'elysia';
import { db } from '../db';
import { users, userTags, matchScores, industryAdjacency } from '../db/schema';
import { eq, ne, and, desc, gte, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/jwt';
import { intentScoreCalc, jaccardCalc, industryCalc, scaleCalc, geoCalc, buildReasonText } from '../services/matching';

const MIN_MATCH_SCORE = 60;

// --- Routes ---

export const matchRoutes = new Elysia({ prefix: '/matches' })
  .use(requireAuth)

  // Recompute match scores for a user against all active users
  .post('/recompute', async ({ user, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' }; }

    const userId = user.userId;

    // Load current user's profile + tags
    const [me] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (!me || !me.hasCompletedProfile) {
      set.status = 400;
      return { error: 'Complete your profile before computing matches' };
    }

    const myTags = await db.select({ tagId: userTags.tagId }).from(userTags).where(eq(userTags.userId, userId));
    const myTagIds = myTags.map(t => t.tagId);

    // Load all active non-admin users with completed profiles (excluding self)
    const candidates = await db
      .select()
      .from(users)
      .where(and(
        ne(users.id, userId),
        eq(users.accountStatus, 'active'),
        eq(users.hasCompletedProfile, true),
        eq(users.role, 'user')
      ));

    if (candidates.length === 0) return { success: true, computed: 0 };

    // Load all tags for candidates
    const allCandidateIds = candidates.map(c => c.id);
    const allTags = await db.select().from(userTags);
    const tagsByUser = new Map<number, number[]>();
    for (const t of allTags) {
      if (!tagsByUser.has(t.userId)) tagsByUser.set(t.userId, []);
      tagsByUser.get(t.userId)!.push(t.tagId);
    }

    // Load industry adjacency map
    const adjacencies = await db.select().from(industryAdjacency);
    const adjacencyMap = new Map<string, number>();
    for (const a of adjacencies) {
      adjacencyMap.set(`${a.industryAId}-${a.industryBId}`, a.weight);
    }

    // Compute scores pairwise
    let computed = 0;
    for (const candidate of candidates) {
      const candidateTags = tagsByUser.get(candidate.id) || [];

      const s = {
        intent: intentScoreCalc(me.intentOffer, me.intentSeek, candidate.intentOffer, candidate.intentSeek),
        expertise: jaccardCalc(myTagIds, candidateTags),
        industry: industryCalc(me.industryId, candidate.industryId, adjacencyMap),
        scale: scaleCalc(me.companySize, candidate.companySize),
        geo: geoCalc(me.city, candidate.city, me.isOpenToRemote, candidate.isOpenToRemote),
      };

      const total = s.intent + s.expertise + s.industry + s.scale + s.geo;
      const reason = buildReasonText(s);

      // Upsert both directions
      await db.insert(matchScores).values({
        userAId: userId, userBId: candidate.id,
        totalScore: total, intentScore: s.intent, expertiseScore: s.expertise,
        industryScore: s.industry, scaleScore: s.scale, geoScore: s.geo,
        matchReasonSummary: reason
      }).onDuplicateKeyUpdate({
        set: { totalScore: total, intentScore: s.intent, expertiseScore: s.expertise,
          industryScore: s.industry, scaleScore: s.scale, geoScore: s.geo,
          matchReasonSummary: reason, computedAt: sql`NOW()` }
      });

      await db.insert(matchScores).values({
        userAId: candidate.id, userBId: userId,
        totalScore: total, intentScore: s.intent, expertiseScore: s.expertise,
        industryScore: s.industry, scaleScore: s.scale, geoScore: s.geo,
        matchReasonSummary: reason
      }).onDuplicateKeyUpdate({
        set: { totalScore: total, intentScore: s.intent, expertiseScore: s.expertise,
          industryScore: s.industry, scaleScore: s.scale, geoScore: s.geo,
          matchReasonSummary: reason, computedAt: sql`NOW()` }
      });

      computed++;
    }

    return { success: true, computed };
  })

  // Get top matches for current user (min score 60, top 10)
  .get('/', async ({ user, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' }; }

    const userId = user.userId;

    const rows = await db
      .select({
        matchId: matchScores.userBId,
        totalScore: matchScores.totalScore,
        intentScore: matchScores.intentScore,
        expertiseScore: matchScores.expertiseScore,
        industryScore: matchScores.industryScore,
        scaleScore: matchScores.scaleScore,
        geoScore: matchScores.geoScore,
        reason: matchScores.matchReasonSummary,
        computedAt: matchScores.computedAt,
        fullName: users.fullName,
        username: users.username,
        title: users.title,
        company: users.company,
        companySize: users.companySize,
        city: users.city,
        isOpenToRemote: users.isOpenToRemote,
        intentOffer: users.intentOffer,
        intentSeek: users.intentSeek,
        whatsappNumber: users.whatsappNumber,
        linkedinUrl: users.linkedinUrl,
        industryId: users.industryId,
      })
      .from(matchScores)
      .innerJoin(users, eq(matchScores.userBId, users.id))
      .where(and(
        eq(matchScores.userAId, userId),
        gte(matchScores.totalScore, MIN_MATCH_SCORE),
        eq(users.accountStatus, 'active'),
        eq(users.hasCompletedProfile, true)
      ))
      .orderBy(desc(matchScores.totalScore))
      .limit(10);

    // Fetch tags for each match
    const matchIds = rows.map(r => r.matchId);
    const allTags = matchIds.length > 0
      ? await db.select({ userId: userTags.userId, tagId: userTags.tagId }).from(userTags)
      : [];

    const tagsByUser = new Map<number, number[]>();
    for (const t of allTags) {
      if (!tagsByUser.has(t.userId)) tagsByUser.set(t.userId, []);
      tagsByUser.get(t.userId)!.push(t.tagId);
    }

    return {
      matches: rows,
      total: rows.length,
      minScore: MIN_MATCH_SCORE
    };
  });
