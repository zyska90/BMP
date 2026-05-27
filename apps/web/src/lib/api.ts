import { treaty } from '@elysiajs/eden';
import type { App } from 'bizlink-types';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Type-safe Eden Treaty Client — credentials:include required for httpOnly cookie to be sent/received across ports
export const api = treaty<App>(apiUrl, {
  fetch: { credentials: 'include' }
});
export default api;
