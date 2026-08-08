export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { listPublicStores } from '@/lib/sellers-source';

const CORS = {
  'Vary': 'Origin',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

/* فهرستِ فروشگاه‌های عمومی. منبع و دلیلِ عوض‌شدنش در
   `lib/sellers-source.ts` توضیح داده شده — خلاصه‌اش: این مسیر
   `users.sellerProfile` را می‌خواند که هیچ‌جای پروژه نمی‌نویسدش، و
   در Production `[]` برمی‌گرداند در حالی که فروشگاهِ واقعی وجود دارد. */
export async function GET() {
  try {
    return NextResponse.json(await listPublicStores(), { headers: CORS });
  } catch {
    return NextResponse.json([], { headers: CORS });
  }
}
