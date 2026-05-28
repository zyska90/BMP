import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const token = cookies().get('token')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Determine approve or reject from URL
  const url = req.nextUrl.pathname;
  const action = url.includes('/approve') ? 'approve' : 'reject';

  const res = await fetch(`${process.env.API_URL}/admin/registrations/${params.id}/${action}`, {
    method: 'POST',
    headers: { Cookie: `token=${token}` }
  });
  return NextResponse.json(await res.json(), { status: res.status });
}
