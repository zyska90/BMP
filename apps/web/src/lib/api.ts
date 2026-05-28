import { treaty } from '@elysiajs/eden';

const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = treaty<any>(apiUrl, {
  fetch: { credentials: 'include' }
});
export default api;
