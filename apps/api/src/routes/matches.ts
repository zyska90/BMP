import { Elysia } from 'elysia';
import { db } from '../db';
import { users, userTags, matchScores, industryAdjacency } from '../db/schema';
import { eq, ne, and, desc, gte, sql } from 'drizzle-orm';
import { requireAuth } from '../middleware/jwt';

const MIN_MATCH_SCORE = 60;

// --- Scoring helpers ---

function intentScore(offerA: string | null, seekA: string | null, offerB: string | null, seekB: string | null): number {
  if (!offerA || !seekA || !offerB || !seekB) return 0;
  const a = (offerA + ' ' + seekA).toLowerCase();
  const b = (offerB + ' ' + seekB).toLowerCase();

  // Check complementarity: does A's offer match B's seek, and B's offer match A's seek?
  const aOfferWords = (offerA || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const bSeekWords = (seekB || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const bOfferWords = (offerB || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const aSeekWords = (seekA || '').toLowerCase().split(/\s+/).filter(w => w.length > 3);

  const matchAtoB = aOfferWords.filter(w => bSeekWords.some(bw => bw.includes(w) || w.includes(bw))).length;
  const matchBtoA = bOfferWords.filter(w => aSeekWords.some(aw => aw.includes(w) || w.includes(aw))).length;

  const totalWords = Math.max(aOfferWords.length + bOfferWords.length, 1);
  const ratio = (matchAtoB + matchBtoA) / totalWords;

  // Scale to 0-30 points
  return Math.min(30, Math.round(ratio * 60));
}

function jaccardTagScore(tagsA: number[], tagsB: number[]): number {
  if (tagsA.length === 0 || tagsB.length === 0) return 0;
  const setA = new Set(tagsA);
  const setB = new Set(tagsB);
  const intersection = [...setA].filter(t => setB.has(t)).length;
  const union = new Set([...setA, ...setB]).size;
  // Scale to 0-25 points
  return Math.min(25, Math.round((intersection / union) * 25));
}

function industryScore(indA: number | null, indB: number | null, adjacencyMap: Map<string, number>): number {
  if (!indA || !indB) return 0;
  if (indA === indB) return 20; // same industry = full score
  const weight = adjacencyMap.get(`${indA}-${indB}`) || adjacencyMap.get(`${indB}-${indA}`) || 0;
  // weight 0-5 → scale to 0-15 points
  return Math.round((weight / 5) * 15);
}

function scaleScore(sizeA: string | null, sizeB: string | null): number {
  if (!sizeA || !sizeB) return 5; // neutral if unknown
  const ORDER = ['Solo', '2-10', '11-50', '51-200', '200+'];
  const iA = ORDER.indexOf(sizeA);
  const iB = ORDER.indexOf(sizeB);
  if (iA === -1 || iB === -1) return 5;
  const diff = Math.abs(iA - iB);
  // Same size = 15, adjacent = 10, 2 apart = 5, 3+ = 0
  return diff === 0 ? 15 : diff === 1 ? 10 : diff === 2 ? 5 : 0;
}

function geoScore(cityA: string | null, cityB: string | null, remoteA: boolean, remoteB: boolean): number {
  if (remoteA || remoteB) return 10; // either open to remote = full geo score
  if (!cityA || !cityB) return 5;
  return cityA.toLowerCase().trim() === cityB.toLowerCase().trim() ? 10 : 0;
}

function buildReason(scores: { intent: number; expertise: number; industry: number; scale: number; geo: number }, industryName?: string): string {
  const parts: string[] = [];
  if (scores.intent >= 15) parts.push('strong intent match');
  else if (scores.intent >= 8) parts.push('partial intent overlap');
  if (scores.expertise >= 15) parts.push('high expertise alignment');
  else if (scores.expertise >= 8) parts.push('some shared expertise');
  if (scores.industry >= 15) parts.push(`same industry${industryName ? ` (${industryName})` : ''}`);
  else if (scores.industry >= 8) parts.push('adjacent industries');
  if (scores.scale >= 10) parts.push('similar company scale');
  if (scores.geo >= 10) parts.push('same location or remote-friendly');
  return parts.length > 0 ? parts.join(', ') : 'general business compatibility';
}

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

    // Load all active users with completed profiles (excluding self)
    const candidates = await db
      .select()
      .from(users)
      .where(and(
        ne(users.id, userId),
        eq(users.accountStatus, 'active'),
        eq(users.hasCompletedProfile, true)
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
        intent: intentScore(me.intentOffer, me.intentSeek, candidate.intentOffer, candidate.intentSeek),
        expertise: jaccardTagScore(myTagIds, candidateTags),
        industry: industryScore(me.industryId, candidate.industryId, adjacencyMap),
        scale: scaleScore(me.companySize, candidate.companySize),
        geo: geoScore(me.city, candidate.city, me.isOpenToRemote, candidate.isOpenToRemote),
      };

      const total = s.intent + s.expertise + s.industry + s.scale + s.geo;
      const reason = buildReason(s);

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
