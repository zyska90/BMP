import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { authRoutes } from './routes/auth';
import { adminRoutes } from './routes/admin';
import { userRoutes, referenceRoutes } from './routes/users';
import { webhookRoutes } from './routes/webhooks';

const port = process.env.PORT || 3001;

const app = new Elysia()
  .use(cors({
    origin: process.env.ALLOWED_ORIGIN || 'http://localhost:3000',
    credentials: true
  }))
  .use(swagger())
  
  // Public Health checks
  .get('/', () => ({
    message: 'Welcome to the BizLink (LinkID) API',
    status: 'healthy',
    timestamp: new Date().toISOString()
  }))
  .get('/health', () => ({ status: 'UP' }))
  
  // Group and Register all app routes
  .use(authRoutes)
  .use(userRoutes)
  .use(referenceRoutes)
  .use(adminRoutes)
  .use(webhookRoutes)
  
  .listen(port);

console.log(`🚀 BizLink (LinkID) API is running at http://localhost:${port}`);
console.log(`📖 Swagger documentation is available at http://localhost:${port}/swagger`);

export type App = typeof app;
export { app };
