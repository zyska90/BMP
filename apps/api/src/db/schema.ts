import { mysqlTable, int, varchar, text, datetime, mysqlEnum, boolean, unique, index } from 'drizzle-orm/mysql-core';
import { sql } from 'drizzle-orm';

// 1. Industries Table (defined first — referenced by users.industryId)
export const industries = mysqlTable('industries', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique()
});

// 2. Expertise Tags Table
export const expertiseTags = mysqlTable('expertise_tags', {
  id: int('id').primaryKey().autoincrement(),
  name: varchar('name', { length: 100 }).notNull(),
  slug: varchar('slug', { length: 100 }).notNull().unique(),
  category: varchar('category', { length: 100 }).notNull()
});

// 3. Users Table
export const users = mysqlTable('users', {
  id: int('id').primaryKey().autoincrement(),
  username: varchar('username', { length: 255 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passcodeHash: varchar('passcode_hash', { length: 255 }).notNull(),
  role: mysqlEnum('role', ['user', 'admin']).default('user').notNull(),
  accountStatus: mysqlEnum('account_status', ['active', 'inactive']).default('active').notNull(),
  fullName: varchar('full_name', { length: 255 }),
  title: varchar('title', { length: 255 }),
  company: varchar('company', { length: 255 }),
  companySize: mysqlEnum('company_size', ['Solo', '2-10', '11-50', '51-200', '200+']),
  industryId: int('industry_id').references(() => industries.id, { onDelete: 'set null' }),
  city: varchar('city', { length: 255 }),
  isOpenToRemote: boolean('is_open_to_remote').default(false).notNull(),
  intentOffer: text('intent_offer'),
  intentSeek: text('intent_seek'),
  profileCompleteness: int('profile_completeness').default(0).notNull(),
  hasCompletedProfile: boolean('has_completed_profile').default(false).notNull(),
  photoUrl: varchar('photo_url', { length: 500 }),
  linkedinUrl: varchar('linkedin_url', { length: 255 }),
  instagramHandle: varchar('instagram_handle', { length: 100 }),
  whatsappNumber: varchar('whatsapp_number', { length: 20 }),
  websiteUrl: varchar('website_url', { length: 255 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
});

// 4. User Tags Junction Table
export const userTags = mysqlTable('user_tags', {
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  tagId: int('tag_id').notNull().references(() => expertiseTags.id, { onDelete: 'cascade' })
}, (table) => ({
  pk: unique('user_tags_user_id_tag_id_pk').on(table.userId, table.tagId)
}));

// 5. Industry Adjacency Table
export const industryAdjacency = mysqlTable('industry_adjacency', {
  industryAId: int('industry_a_id').notNull().references(() => industries.id, { onDelete: 'cascade' }),
  industryBId: int('industry_b_id').notNull().references(() => industries.id, { onDelete: 'cascade' }),
  weight: int('weight').default(1).notNull()
}, (table) => ({
  pk: unique('industry_adj_a_b_pk').on(table.industryAId, table.industryBId)
}));

// 6. Match Scores Table
export const matchScores = mysqlTable('match_scores', {
  userAId: int('user_a_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  userBId: int('user_b_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  totalScore: int('total_score').notNull(),
  intentScore: int('intent_score').default(0).notNull(),
  expertiseScore: int('expertise_score').default(0).notNull(),
  industryScore: int('industry_score').default(0).notNull(),
  scaleScore: int('scale_score').default(0).notNull(),
  geoScore: int('geo_score').default(0).notNull(),
  matchReasonSummary: varchar('match_reason_summary', { length: 255 }),
  computedAt: datetime('computed_at').default(sql`CURRENT_TIMESTAMP`).notNull()
}, (table) => ({
  pk: unique('match_scores_user_a_b_pk').on(table.userAId, table.userBId),
  scoreIdx: index('total_score_idx').on(table.totalScore)
}));

// 7. Meeting Requests Table
export const meetingRequests = mysqlTable('meeting_requests', {
  id: int('id').primaryKey().autoincrement(),
  requesterId: int('requester_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  recipientId: int('recipient_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  channel: mysqlEnum('channel', ['WhatsApp', 'Meet', 'Zoom']).notNull(),
  proposedTime: datetime('proposed_time').notNull(),
  introNote: varchar('intro_note', { length: 255 }).notNull(),
  status: mysqlEnum('status', ['pending', 'accepted', 'declined', 'rescheduled']).default('pending').notNull(),
  meetLink: varchar('meet_link', { length: 255 }),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull()
});

// 8. Profile View Requests Table
export const profileViewRequests = mysqlTable('profile_view_requests', {
  id: int('id').primaryKey().autoincrement(),
  requesterId: int('requester_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  targetId: int('target_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  status: mysqlEnum('status', ['pending', 'approved', 'declined']).default('pending').notNull(),
  requestedAt: datetime('requested_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  respondedAt: datetime('responded_at')
}, (table) => ({
  uniquePair: unique('view_req_pair').on(table.requesterId, table.targetId)
}));

// 9. User Projects Table (V1.1 Open Projects)
export const userProjects = mysqlTable('user_projects', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  summary: varchar('summary', { length: 160 }).notNull(),
  status: mysqlEnum('status', ['ideation', 'mvp', 'live', 'fundraising']).default('ideation').notNull(),
  lookingFor: mysqlEnum('looking_for', ['co-founder', 'investor', 'client', 'mentor', 'partner']).notNull(),
  sortOrder: int('sort_order').default(0).notNull(),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull(),
  updatedAt: datetime('updated_at').default(sql`CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP`).notNull()
});

// 10. Registrations Table (from Tally Webhook)
export const registrations = mysqlTable('registrations', {
  id: int('id').primaryKey().autoincrement(),
  tallySubmissionId: varchar('tally_submission_id', { length: 255 }).unique(),
  email: varchar('email', { length: 255 }).notNull(),
  fullName: varchar('full_name', { length: 255 }).notNull(),
  roleType: varchar('role_type', { length: 100 }),
  rawPayload: text('raw_payload'),
  status: mysqlEnum('status', ['pending', 'approved', 'rejected']).default('pending').notNull(),
  reviewedBy: int('reviewed_by').references(() => users.id),
  reviewedAt: datetime('reviewed_at')
});

// 11. Notifications Table
export const notifications = mysqlTable('notifications', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 50 }).notNull(),
  payload: text('payload'),
  readAt: datetime('read_at'),
  createdAt: datetime('created_at').default(sql`CURRENT_TIMESTAMP`).notNull()
});
