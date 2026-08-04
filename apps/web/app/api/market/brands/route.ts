export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, audit } from '@/lib/finance/db';

/* ═══════════════════════════════════════════════════════════════
   برندهای بیلیارد بازار.
   ───────────────────────────────────────────────────────────────
   تا امروز برند متنِ آزاد بود: «Predator»، «predator» و «پریداتور»
   سه برندِ جدا می‌شدند، پس فیلترِ برند هرگز کامل نبود و آمارِ برند
   بی‌معنی.

   ── چرا برندِ آزاد را ممنوع نکردیم ──
   بازارِ دستِ‌دومِ بیلیارد پر از برندِ محلی و بی‌نام است. اجبار به
   انتخاب از فهرست یعنی همه «متفرقه» را می‌زنند و اطلاعات کمتر می‌شود،
   نه بیشتر. به‌جایش، برندِ ناشناخته با `is_active = false` پیشنهاد
   می‌شود تا ادمین تأیید یا با برندِ موجود ادغامش کند.
   ═══════════════════════════════════════════════════════════════ */

/** نامِ برند → کلیدِ یکتای نرمال‌شده */
export function brandSlug(raw: string): string {
  return String(raw ?? '')
    .trim().toLowerCase()
    /* حروفِ فارسی/عربی در slug نمی‌آیند؛ برای برندِ فارسی از
       ترجمه‌نویسی صرف‌نظر می‌کنیم و کلید از روی همان حروفِ لاتینِ
       موجود یا هشِ کوتاه ساخته می‌شود. */
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
}

export async function GET(req: NextRequest) {
  const all = new URL(req.url).searchParams.get('all') === '1';

  /* فهرستِ کامل — شاملِ برندهای تأییدنشده — فقط برای ادمین */
  if (all) {
    const actor = actorFromRequest(req);
    if (!actor || !(await isAdmin(actor.id))) {
      return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
    }
  }

  let q = sb().from('market_brands')
    .select('id,slug,name,is_active,sort_order')
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (!all) q = q.eq('is_active', true);

  const { data, error } = await q;
  if (error) {
    /* جدول هنوز ساخته نشده ⇒ فهرستِ خالی، نه خطا: فرمِ ثبت آگهی
       نباید به‌خاطرِ مهاجرتِ اجرانشده از کار بیفتد. */
    return NextResponse.json({ brands: [] });
  }
  return NextResponse.json({ brands: data ?? [] }, { headers: { 'Cache-Control': 'no-store' } });
}

/* ── پیشنهادِ برندِ تازه ──
   از فرمِ ثبت آگهی صدا زده می‌شود وقتی کاربر برندی نوشته که در فهرست
   نیست. ردیف با `is_active = false` می‌نشیند، پس تا تأییدِ ادمین در
   کشوی هیچ‌کس دیده نمی‌شود — ولی آگهی ثبت می‌شود و برندش گم نمی‌شود. */
export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const name = String(b?.name ?? '').trim().slice(0, 80);
  if (name.length < 2) return NextResponse.json({ message: 'نام برند کوتاه است' }, { status: 400 });

  const admin = await isAdmin(actor.id);
  const slug = brandSlug(name);
  /* برندِ کاملاً غیرلاتین slug نمی‌سازد؛ کلیدِ پایدار از روی نام */
  const key = slug || `b-${Buffer.from(name).toString('hex').slice(0, 24)}`;

  const { data, error } = await sb().from('market_brands')
    .insert({ slug: key, name, is_active: admin, sort_order: 500 })
    .select('id,slug,name,is_active').single();

  if (error) {
    /* از قبل هست ⇒ همان را برگردان؛ برای کاربر «موفق» است */
    if (/duplicate|23505/i.test(error.message)) {
      const { data: existing } = await sb().from('market_brands')
        .select('id,slug,name,is_active').eq('slug', key).maybeSingle();
      return NextResponse.json({ brand: existing, existed: true });
    }
    return NextResponse.json({ message: 'ثبت برند انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: admin ? 'admin' : 'user',
    action: 'BRAND_SUGGESTED', entityType: 'market_brand',
    entityId: String((data as { id: string }).id), newValue: { name, active: admin },
  });
  return NextResponse.json({ brand: data }, { status: 201 });
}

/* ── ویرایش/فعال‌سازی — فقط ادمین ── */
export async function PATCH(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor || !(await isAdmin(actor.id))) {
    return NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 });
  }

  const b = await req.json().catch(() => ({}));
  const id = String(b?.id ?? '').trim();
  if (!id) return NextResponse.json({ message: 'شناسه لازم است' }, { status: 400 });

  const patch: Record<string, unknown> = {};
  if (b?.name !== undefined) patch.name = String(b.name).trim().slice(0, 80);
  if (b?.isActive !== undefined) patch.is_active = !!b.isActive;
  if (b?.sortOrder !== undefined) patch.sort_order = Math.round(Number(b.sortOrder) || 0);
  if (Object.keys(patch).length === 0) {
    return NextResponse.json({ message: 'تغییری فرستاده نشد' }, { status: 400 });
  }

  const { data, error } = await sb().from('market_brands')
    .update(patch).eq('id', id).select('id,slug,name,is_active,sort_order').single();
  if (error) return NextResponse.json({ message: 'ویرایش انجام نشد' }, { status: 500 });

  void audit({
    actorId: actor.id, actorRole: 'admin', action: 'BRAND_UPDATED',
    entityType: 'market_brand', entityId: id, newValue: patch,
  });
  return NextResponse.json({ brand: data });
}
