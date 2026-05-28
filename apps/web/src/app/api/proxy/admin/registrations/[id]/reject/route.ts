import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(_: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const res = await fetch(`${process.env.API_URL}/admin/registrations/${params.id}/reject`, {
    method: 'POST', headers: { Cookie: `token=${token}` }
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
