export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { getSupabaseServer } from '@/lib/supabase-server';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { data, error } = await getSupabaseServer()
    .from('clubs')
    .select('*')
    .eq('id', id)
    .single();

  if (error || !data) {
    return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404, headers: CORS });
  }
  return NextResponse.json(data, { headers: CORS });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401, headers: CORS });
  }

  let payload: { sub: string; primaryRole?: string; roles?: string[] };
  try {
    payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as typeof payload;
  } catch {
    return NextResponse.json({ message: 'توکن نامعتبر است' }, { status: 401, headers: CORS });
  }

  const userId = payload.sub;
  const userRole = payload.primaryRole ?? payload.roles?.[0] ?? 'user';
  const isAdmin = userRole === 'admin';

  const { data: club } = await getSupabaseServer().from('clubs').select('ownerId').eq('id', id).single();
  if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404, headers: CORS });

  if (!isAdmin && club.ownerId !== userId) {
    return NextResponse.json({ message: 'شما مجاز به ویرایش این باشگاه نیستید' }, { status: 403, headers: CORS });
  }

  const body = await req.json();
  const { data: updated, error } = await getSupabaseServer()
    .from('clubs')
    .update(body)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500, headers: CORS });
  return NextResponse.json(updated, { headers: CORS });
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return NextResponse.json({ message: 'احراز هویت الزامی است' }, { status: 401, headers: CORS });
  }

  let payload: { sub: string; primaryRole?: string; roles?: string[] };
  try {
    payload = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET!) as typeof payload;
  } catch {
    return NextResponse.json({ message: 'توکن نامعتبر است' }, { status: 401, headers: CORS });
  }

  const userId = payload.sub;
  const userRole = payload.primaryRole ?? payload.roles?.[0] ?? 'user';
  const isAdmin = userRole === 'admin';

  const { data: club } = await getSupabaseServer().from('clubs').select('ownerId').eq('id', id).single();
  if (!club) return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404, headers: CORS });

  if (!isAdmin && club.ownerId !== userId) {
    return NextResponse.json({ message: 'شما مجاز به حذف این باشگاه نیستید' }, { status: 403, headers: CORS });
  }

  const { error } = await getSupabaseServer().from('clubs').delete().eq('id', id);
  if (error) return NextResponse.json({ message: error.message }, { status: 500, headers: CORS });

  return NextResponse.json({ success: true }, { headers: CORS });
}
