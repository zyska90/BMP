import { Elysia } from 'elysia';
import { SignJWT, jwtVerify } from 'jose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-random-key-bizlink-platform-2026';
const key = new TextEncoder().encode(JWT_SECRET);

export interface JWTPayload {
  userId: number;
  username: string;
  role: 'user' | 'admin';
  fullName?: string | null;
}

// Generate JWT token
export async function signJWT(payload: JWTPayload): Promise<string> {
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(process.env.JWT_EXPIRES_IN || '7d')
    .sign(key);
}

// Verify JWT token
export async function verifyJWT(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256']
    });
    return payload as unknown as JWTPayload;
  } catch (err) {
    return null;
  }
}

// Elysia JWT Auth plugin
export const jwtAuth = new Elysia({ name: 'jwt-auth' })
  .derive(async ({ cookie: { token }, set }) => {
    const tokenVal = token.value;
    if (!tokenVal) {
      return { user: null };
    }

    const decoded = await verifyJWT(tokenVal);
    if (!decoded) {
      // Invalidate expired/bad token
      token.remove();
      return { user: null };
    }

    return { user: decoded };
  })
  .as('global');

// Elysia Role Guard plugins
export const requireAuth = new Elysia({ name: 'require-auth' })
  .use(jwtAuth)
  .guard({
    beforeHandle({ user, set }) {
      if (!user) {
        set.status = 401;
        return { error: 'Unauthorized', message: 'You must be logged in to access this resource' };
      }
    }
  });

export const requireAdmin = new Elysia({ name: 'require-admin' })
  .use(jwtAuth)
  .guard({
    beforeHandle({ user, set }) {
      if (!user) {
        set.status = 401;
        return { error: 'Unauthorized', message: 'You must be logged in to access this resource' };
      }
      if (user.role !== 'admin') {
        set.status = 403;
        return { error: 'Forbidden', message: 'Admin access required' };
      }
    }
  });
