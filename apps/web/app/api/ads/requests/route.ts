export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest } from '@/lib/finance/db';
import { isPlacementKey, LEGACY_KEY_MAP } from '@/lib/ads/core';

/* درخواستِ تبلیغ — فرمِ «تبلیغ در بیلیارد هاب».
   ورود لازم نیست؛ اگر کاربر وارد باشد، درخواست به حسابش گره می‌خورد. */

const str = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);
const faToEn = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)));

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));

  const name = str(b?.name, 120);
  const phone = faToEn(str(b?.phone, 20)).replace(/[^0-9+]/g, '');
  const message = str(b?.message, 2000);

  if (!name) return NextResponse.json({ message: 'نام و نام‌خانوادگی لازم است' }, { status: 400 });
  if (!/^(\+98|0)?9\d{9}$/.test(phone)) {
    return NextResponse.json({ message: 'شماره موبایل معتبر نیست' }, { status: 400 });
  }

  const actor = actorFromRequest(req);
  /* کلیدِ قدیمی (کلاینتِ کش‌شده) به معادلِ تازه ترجمه می‌شود */
  const raw = String(b?.slotKey ?? '');
  const mapped = LEGACY_KEY_MAP[raw] ?? raw;
  const slotKey = isPlacementKey(mapped) ? mapped : null;

  const { error } = await sb().from('ad_requests').insert({
    user_id: actor?.id ?? null,
    name, phone,
    email: str(b?.email, 160) || null,
    company: str(b?.company, 160) || null,
    slot_key: slotKey,
    budget: str(b?.budget, 60) || null,
    message,
  });

  if (error) {
    if (/does not exist|schema cache/i.test(error.message)) {
      return NextResponse.json({ message: 'ثبتِ درخواست هنوز راه‌اندازی نشده (مایگریشن ۰۰۹ اجرا نشده)' }, { status: 503 });
    }
    return NextResponse.json({ message: 'ثبتِ درخواست انجام نشد' }, { status: 500 });
  }

  return NextResponse.json({ ok: true }, { status: 201 });
}
