import { Elysia, t } from 'elysia';
import { db } from '../db';
import { users } from '../db/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { signJWT, requireAuth, jwtAuth } from '../middleware/jwt';

export const authRoutes = new Elysia({ prefix: '/auth' })
  .use(jwtAuth)
  .post('/login', async ({ body, cookie: { token }, set }) => {
    const { username, passcode } = body;

    // 1. Find user in database
    const userList = await db.select().from(users).where(eq(users.username, username)).limit(1);
    if (userList.length === 0) {
      set.status = 400;
      return { error: 'Invalid credentials', message: 'Username or passcode is incorrect' };
    }

    const user = userList[0];

    // 2. Verify passcode hash
    const isValid = await bcrypt.compare(passcode, user.passcodeHash);
    if (!isValid) {
      set.status = 400;
      return { error: 'Invalid credentials', message: 'Username or passcode is incorrect' };
    }

    // 3. Generate JWT Token
    const jwtToken = await signJWT({
      userId: user.id,
      username: user.username,
      role: user.role,
      fullName: user.fullName
    });

    // 4. Set Http-only Cookie
    token.set({
      value: jwtToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return {
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        hasCompletedProfile: user.hasCompletedProfile
      }
    };
  }, {
    body: t.Object({
      username: t.String(),
      passcode: t.String()
    })
  })

  .post('/logout', ({ cookie: { token } }) => {
    token.remove();
    return {
      success: true,
      message: 'Logout successful'
    };
  })

  .use(requireAuth)
  .get('/me', async ({ user, set }) => {
    if (!user) {
      set.status = 401;
      return { error: 'Unauthorized' };
    }

    const userList = await db.select().from(users).where(eq(users.id, user.userId)).limit(1);
    if (userList.length === 0) {
      set.status = 404;
      return { error: 'User not found' };
    }

    const dbUser = userList[0];

    return {
      id: dbUser.id,
      username: dbUser.username,
      role: dbUser.role,
      fullName: dbUser.fullName,
      title: dbUser.title,
      company: dbUser.company,
      city: dbUser.city,
      profileCompleteness: dbUser.profileCompleteness,
      hasCompletedProfile: dbUser.hasCompletedProfile,
      createdAt: dbUser.createdAt
    };
  });
