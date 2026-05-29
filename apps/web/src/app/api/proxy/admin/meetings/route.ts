import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json([], { status: 401 });
  const res = await fetch(`${process.env.API_URL}/admin/meetings`, {
    headers: { Cookie: `token=${token}` }, cache: 'no-store'
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
