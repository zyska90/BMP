import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const res = await fetch(`${process.env.API_URL}/users/me`, {
    headers: { Cookie: `token=${token}` }
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}
