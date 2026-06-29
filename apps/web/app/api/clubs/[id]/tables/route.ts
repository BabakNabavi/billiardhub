export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';
import jwt from 'jsonwebtoken';

const TABLE_FIELDS = [
  { key: 'snookerTables',    type: 'snooker',     label: 'اسنوکر',     pricePerHour: 180000 },
  { key: 'pocketTables',     type: 'pocket',      label: 'پاکت',       pricePerHour: 150000 },
  { key: 'highballTables',   type: 'highball',    label: 'هی‌بال',     pricePerHour: 120000 },
  { key: 'vipSnookerTables', type: 'vipSnooker',  label: 'VIP اسنوکر', pricePerHour: 350000 },
  { key: 'vipPocketTables',  type: 'vipPocket',   label: 'VIP پاکت',  pricePerHour: 300000 },
  { key: 'airHockeyTables',  type: 'airHockey',   label: 'ایرهاکی',   pricePerHour: 100000 },
];

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const sb = getSupabaseServer();

  // ابتدا از جدول tables بخوان
  const { data: rows, error } = await sb
    .from('tables')
    .select('*')
    .eq('clubId', id)
    .eq('isActive', true);

  if (!error && rows && rows.length > 0) {
    return NextResponse.json(rows);
  }

  // جدول tables خالی بود — از فیلدهای clubs بساز
  const { data: club, error: clubErr } = await sb
    .from('clubs')
    .select('snookerTables, pocketTables, highballTables, vipSnookerTables, vipPocketTables, airHockeyTables')
    .eq('id', id)
    .single();

  if (clubErr || !club) {
    return NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 });
  }

  const tables: object[] = [];
  for (const field of TABLE_FIELDS) {
    const count = (club as any)[field.key] ?? 0;
    for (let i = 1; i <= count; i++) {
      tables.push({
        id: `${id}-${field.type}-${i}`,
        clubId: id,
        type: field.type,
        label: field.label,
        tableNumber: i,
        pricePerHour: field.pricePerHour,
        isActive: true,
      });
    }
  }

  return NextResponse.json(tables);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const token = req.headers.get('authorization')?.replace('Bearer ', '');
  if (!token) return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });

  let payload: any;
  try {
    payload = jwt.verify(token, process.env.JWT_SECRET || 'secret');
  } catch {
    return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
  }

  const sb = getSupabaseServer();

  // verify ownership or admin
  const { data: club } = await sb.from('clubs').select('ownerId').eq('id', id).single();
  const role = payload.primaryRole ?? payload.roles?.[0] ?? 'user';
  if (!club || (club.ownerId !== payload.sub && role !== 'admin')) {
    return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json();
  const { data, error } = await sb.from('tables').insert({
    clubId: id,
    number: body.number || null,
    type: body.type || 'snooker',
    brand: body.brand || null,
    model: body.model || null,
    pricePerHour: body.pricePerHour || 0,
    isActive: true,
  }).select().single();

  if (error) return NextResponse.json({ message: error.message }, { status: 500 });
  return NextResponse.json(data, { status: 201 });
}
