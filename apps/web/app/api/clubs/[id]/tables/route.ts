export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServer } from '@/lib/supabase-server';

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
