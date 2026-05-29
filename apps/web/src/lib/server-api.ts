import { cookies } from 'next/headers';

const API_URL = process.env.API_URL || 'http://localhost:3001';
const TIMEOUT_MS = 8000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...options, signal: controller.signal });
    return res;
  } catch {
    return null; // timeout or network error
  } finally {
    clearTimeout(timeout);
  }
}

export async function getAuthUser(): Promise<any | null> {
  const token = cookies().get('token')?.value;
  if (!token) return null;

  const res = await fetchWithTimeout(`${API_URL}/auth/me`, {
    headers: { Cookie: `token=${token}` },
    cache: 'no-store'
  });

  // Only treat as unauthenticated on explicit 401/403
  // API timeout or 500 = Railway cold start, don't logout
  if (!res || res.status === 401 || res.status === 403) return null;
  if (!res.ok) return { _apiError: true }; // signal error without forcing logout
  return res.json();
}

export async function fetchAdmin(path: string): Promise<any> {
  const token = cookies().get('token')?.value;
  if (!token) return null;

  const res = await fetchWithTimeout(`${API_URL}${path}`, {
    headers: { Cookie: `token=${token}` },
    cache: 'no-store'
  });

  if (!res || !res.ok) return null;
  return res.json();
}
