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

  // 1. If trying to access protected routes without a token, redirect to login
  if ((isAppRoute || isAdminRoute || isProfileSetupRoute) && !token) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('from', pathname);
    return NextResponse.redirect(url);
  }

  // 2. If token exists, validate session and role via backend API
  if (token) {
    try {
      const apiUrl = process.env.API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/auth/me`, {
        headers: {
          'Cookie': `token=${token}`
        }
      });

      if (!res.ok) {
        // Bad/expired token, clear and redirect to login
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        const response = NextResponse.redirect(url);
        response.cookies.delete('token');
        return response;
      }

      const user = await res.json();

      // Check Admin Role
      if (isAdminRoute && user.role !== 'admin') {
        const url = request.nextUrl.clone();
        url.pathname = '/app/dashboard'; // redirect standard user back to user dashboard
        return NextResponse.redirect(url);
      }

      // Check Onboarding profile setup gate
      if (isAppRoute && !user.hasCompletedProfile) {
        // Force redirect standard user to profile setup if incomplete
        const url = request.nextUrl.clone();
        url.pathname = '/profile/setup';
        return NextResponse.redirect(url);
      }

      // If already completed profile and trying to access onboarding, redirect to dashboard
      if (isProfileSetupRoute && user.hasCompletedProfile) {
        const url = request.nextUrl.clone();
        url.pathname = '/app/dashboard';
        return NextResponse.redirect(url);
      }

      // If already logged in and going to login, redirect to dashboard (or admin panel)
      if (isAuthRoute) {
        const url = request.nextUrl.clone();
        url.pathname = user.role === 'admin' ? '/admin/dashboard' : '/app/dashboard';
        return NextResponse.redirect(url);
      }

    } catch (err) {
      console.error('Middleware API call failed:', err);
      // Fallback in case API is down, allow request but log warning
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
