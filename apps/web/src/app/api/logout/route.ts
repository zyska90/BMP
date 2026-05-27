import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  const cookieStore = cookies();
  const token = cookieStore.get('token')?.value;

  // Tell the API to clear its httpOnly cookie
  if (token) {
    try {
      await fetch(`${process.env.API_URL}/auth/logout`, {
        method: 'POST',
        headers: { Cookie: `token=${token}` }
      });
    } catch {
      // API unreachable — still clear the local cookie below
    }
  }

  const loginUrl = new URL('/login', request.url);
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('token');
  return response;
}
