import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const apiUrl = process.env.API_URL || 'http://localhost:3001';

  const res = await fetch(`${apiUrl}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const data = await res.json();

  if (!res.ok) {
    return NextResponse.json(data, { status: res.status });
  }

  // Extract the JWT from Railway's Set-Cookie header
  const setCookie = res.headers.get('set-cookie');
  const tokenMatch = setCookie?.match(/token=([^;]+)/);
  const token = tokenMatch?.[1];

  const response = NextResponse.json(data, { status: 200 });

  if (token) {
    // Set cookie on the Netlify domain so middleware can read it
    response.cookies.set('token', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });
  }

  return response;
}
