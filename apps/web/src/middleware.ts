import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const tokenCookie = request.cookies.get('token');
  const token = tokenCookie?.value || '';

  const isAuthRoute = pathname.startsWith('/login');
  const isAppRoute = pathname.startsWith('/app');
  const isAdminRoute = pathname.startsWith('/admin');
  const isProfileSetupRoute = pathname === '/profile/setup';
  const isProtected = isAppRoute || isAdminRoute || isProfileSetupRoute;

  // 1. No token — redirect to login
  if (isProtected && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Token exists — validate with 5s timeout to handle Railway cold starts
  if (token) {
    try {
      const apiUrl = process.env.API_URL || 'http://localhost:3001';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: { Cookie: `token=${token}` },
        signal: controller.signal
      });
      clearTimeout(timeout);

      // Only clear cookie + redirect if API explicitly says token is bad (401/403)
      // Do NOT logout on 500 or network errors — could be Railway cold start
      if (res.status === 401 || res.status === 403) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        const response = NextResponse.redirect(url);
        response.cookies.delete('token');
        return response;
      }

      if (!res.ok) {
        // API error (500, timeout, etc) — let user through, don't logout
        return NextResponse.next();
      }

      const user = await res.json();

      if (isAdminRoute && user.role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/app/dashboard';
        return NextResponse.redirect(url);
      }

      if (isAppRoute && !user.hasCompletedProfile) {
        const url = request.nextUrl.clone();
        url.pathname = '/profile/setup';
        return NextResponse.redirect(url);
      }

      if (isProfileSetupRoute && user.hasCompletedProfile) {
        const url = request.nextUrl.clone();
        url.pathname = '/app/dashboard';
        return NextResponse.redirect(url);
      }

      if (isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = user.role === 'admin' ? '/admin/dashboard' : '/app/dashboard';
        return NextResponse.redirect(url);
      }

    } catch (err: any) {
      // Network error or timeout — Railway might be cold-starting
      // Do NOT logout, just let the request through
      if (err?.name === 'AbortError') {
        console.warn('Middleware: API timeout (Railway cold start?) — allowing request');
      } else {
        console.error('Middleware API error:', err?.message);
      }
      // If trying to access protected route during API downtime, let them through
      // Pages will handle their own auth check via proxy routes
      return NextResponse.next();
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/login',
    '/app/:path*',
    '/admin/:path*',
    '/profile/setup'
  ]
};
