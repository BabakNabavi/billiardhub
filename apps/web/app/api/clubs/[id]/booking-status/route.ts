export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';
import { closureState, closureLabel, todayInTehran } from '@/lib/booking/closure';

/* وضعیتِ بازبودنِ رزروِ یک باشگاه — عمومی.

   صفحه‌ی رزرو تا امروز این را از `localStorage` می‌خواند، یعنی از
   مرورگرِ *خودِ بازدیدکننده*. کلیدش را فقط مرورگرِ باشگاه‌دار داشت،
   پس:
     • بازدیدکننده هیچ‌وقت قفل را نمی‌دید و رزرو می‌کرد
     • و در مرورگرِ باشگاه‌دار، کلِ صفحه بسته می‌شد حتی برای روزهای
       آینده که باید باز می‌ماندند

   حالا از سرور می‌آید و «کل صفحه» را نمی‌بندد: فقط می‌گوید کدام
   تاریخ‌ها و کدام ساعت‌ها بسته‌اند. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const headers = { 'Cache-Control': 'no-store' };

  /* شناسه‌ی نامعتبر خطا نیست: نبودِ این پاسخ نباید صفحه‌ی رزرو را
     بشکند — بدترین حالتش این است که قفلی اعمال نشود، و سرورِ ثبتِ
     رزرو همچنان جلوی رزروِ نادرست را می‌گیرد. */
  if (!UUID.test(id)) {
    return NextResponse.json({ always: false, closeToday: false, closedUntil: null, today: todayInTehran() }, { headers });
  }

  const { data } = await sb().from('clubs')
    .select('*').eq('id', id).maybeSingle();
  const row = (data ?? {}) as { closeTodayReservations?: boolean; reserveClosedUntil?: string | null };

  const s = closureState({ closeToday: row.closeTodayReservations, closedUntil: row.reserveClosedUntil });

  return NextResponse.json({
    always: s.always,
    closeToday: s.closeToday,
    closedUntil: s.untilMs === null ? null : new Date(s.untilMs).toISOString(),
    today: todayInTehran(),
    label: closureLabel(s),
  }, { headers });
}
