import { Elysia, t } from 'elysia';
import { db } from '../db';
import { meetingRequests, notifications, users } from '../db/schema';
import { eq, or, and, desc, gt } from 'drizzle-orm';
import { requireAuth } from '../middleware/jwt';

async function createNotification(userId: number, type: string, payload: object) {
  await db.insert(notifications).values({
    userId,
    type,
    payload: JSON.stringify(payload)
  });
}

export const meetingRoutes = new Elysia({ prefix: '/meetings' })
  .use(requireAuth)

  // Create a meeting request
  .post('/', async ({ user, body, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' }; }

    const { recipientId, channel, proposedTime, introNote } = body as any;

    if (!recipientId || !channel || !proposedTime || !introNote) {
      set.status = 400;
      return { error: 'Missing required fields' };
    }
    if (introNote.length > 200) {
      set.status = 400;
      return { error: 'Intro note must be 200 characters or less' };
    }
    if (recipientId === user.userId) {
      set.status = 400;
      return { error: 'Cannot send meeting request to yourself' };
    }

    // Check recipient exists and is active
    const [recipient] = await db.select({ id: users.id, fullName: users.fullName })
      .from(users).where(eq(users.id, recipientId)).limit(1);
    if (!recipient) { set.status = 404; return { error: 'Recipient not found' }; }

    // Check no existing pending request between the two
    const existing = await db.select({ id: meetingRequests.id })
      .from(meetingRequests)
      .where(and(
        eq(meetingRequests.requesterId, user.userId),
        eq(meetingRequests.recipientId, recipientId),
        eq(meetingRequests.status, 'pending')
      ))
      .limit(1);
    if (existing.length > 0) {
      set.status = 400;
      return { error: 'You already have a pending request with this person' };
    }

    const [result] = await db.insert(meetingRequests).values({
      requesterId: user.userId,
      recipientId,
      channel,
      proposedTime: new Date(proposedTime),
      introNote,
      status: 'pending'
    });

    // Notify recipient
    await createNotification(recipientId, 'meeting_request', {
      title: 'New meeting request',
      message: `${user.fullName || user.username} wants to meet with you`,
      meetingId: result.insertId
    });

    return { success: true, meetingId: result.insertId };
  })

  // Get all meetings for current user
  .get('/', async ({ user, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' }; }

    const sent = await db
      .select({
        id: meetingRequests.id,
        status: meetingRequests.status,
        channel: meetingRequests.channel,
        proposedTime: meetingRequests.proposedTime,
        introNote: meetingRequests.introNote,
        meetLink: meetingRequests.meetLink,
        createdAt: meetingRequests.createdAt,
        updatedAt: meetingRequests.updatedAt,
        otherUserId: users.id,
        otherUserName: users.fullName,
        otherUserTitle: users.title,
        otherUserCompany: users.company,
        otherUserWhatsapp: users.whatsappNumber,
        direction: db.$count(meetingRequests.id)  // placeholder, overridden below
      })
      .from(meetingRequests)
      .innerJoin(users, eq(meetingRequests.recipientId, users.id))
      .where(eq(meetingRequests.requesterId, user.userId))
      .orderBy(desc(meetingRequests.createdAt));

    const received = await db
      .select({
        id: meetingRequests.id,
        status: meetingRequests.status,
        channel: meetingRequests.channel,
        proposedTime: meetingRequests.proposedTime,
        introNote: meetingRequests.introNote,
        meetLink: meetingRequests.meetLink,
        createdAt: meetingRequests.createdAt,
        updatedAt: meetingRequests.updatedAt,
        otherUserId: users.id,
        otherUserName: users.fullName,
        otherUserTitle: users.title,
        otherUserCompany: users.company,
        otherUserWhatsapp: users.whatsappNumber,
      })
      .from(meetingRequests)
      .innerJoin(users, eq(meetingRequests.requesterId, users.id))
      .where(eq(meetingRequests.recipientId, user.userId))
      .orderBy(desc(meetingRequests.createdAt));

    const sentWithDir = sent.map(m => ({ ...m, direction: 'sent' as const }));
    const receivedWithDir = received.map(m => ({ ...m, direction: 'received' as const }));
    const all = [...sentWithDir, ...receivedWithDir].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return {
      pending: all.filter(m => m.status === 'pending'),
      confirmed: all.filter(m => m.status === 'accepted'),
      past: all.filter(m => m.status === 'declined' || m.status === 'rescheduled'),
    };
  })

  // Accept / decline / reschedule a meeting
  .patch('/:id', async ({ user, params, body, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' }; }

    const meetingId = parseInt(params.id);
    const { action, newTime } = body as any;

    const [meeting] = await db.select().from(meetingRequests)
      .where(eq(meetingRequests.id, meetingId)).limit(1);

    if (!meeting) { set.status = 404; return { error: 'Meeting not found' }; }
    if (meeting.recipientId !== user.userId) {
      set.status = 403;
      return { error: 'Only the recipient can respond to a meeting request' };
    }
    if (meeting.status !== 'pending') {
      set.status = 400;
      return { error: `Meeting is already ${meeting.status}` };
    }

    const validActions = ['accepted', 'declined', 'rescheduled'];
    if (!validActions.includes(action)) {
      set.status = 400;
      return { error: 'Invalid action. Use: accepted, declined, rescheduled' };
    }

    const updateData: any = { status: action };
    if (action === 'rescheduled' && newTime) {
      updateData.proposedTime = new Date(newTime);
    }

    await db.update(meetingRequests).set(updateData).where(eq(meetingRequests.id, meetingId));

    // Notify requester
    const [responder] = await db.select({ fullName: users.fullName })
      .from(users).where(eq(users.id, user.userId)).limit(1);

    await createNotification(meeting.requesterId, `meeting_${action}`, {
      title: `Meeting ${action}`,
      message: `${responder?.fullName || 'Someone'} ${action} your meeting request`,
      meetingId
    });

    return { success: true, status: action };
  });

// Notifications polling
export const notificationRoutes = new Elysia({ prefix: '/notifications' })
  .use(requireAuth)
  .get('/', async ({ user, query, set }) => {
    if (!user) { set.status = 401; return { error: 'Unauthorized' }; }

    const since = query.since ? new Date(query.since as string) : new Date(Date.now() - 24 * 60 * 60 * 1000);

    const rows = await db.select().from(notifications)
      .where(and(
        eq(notifications.userId, user.userId),
        gt(notifications.createdAt, since)
      ))
      .orderBy(desc(notifications.createdAt))
      .limit(20);

    return { notifications: rows, unread: rows.filter(n => !n.readAt).length };
  });
