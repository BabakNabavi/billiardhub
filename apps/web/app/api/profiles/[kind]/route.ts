export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin } from '@/lib/finance/db';
import {
  PROFILE_KINDS, getProfileByOwner, getProfileBySlug, listProfiles, saveProfile,
  type ProfileKind,
} from '@/lib/profiles/server';

/* پروفایل‌های نقش‌ها — فروشگاه، تولیدکننده و بقیه.
   GET  ?slug=  یک پروفایل | ?mine=1 پروفایل خودم | بدون هیچ‌کدام: فهرست
   POST ذخیره‌ی پروفایل خودم (ساخت یا به‌روزرسانی) */

const kindOf = (v: string): ProfileKind | null =>
  (PROFILE_KINDS as string[]).includes(v) ? (v as ProfileKind) : null;

const str = (v: unknown, max = 200) => String(v ?? '').trim().slice(0, max);

export async function GET(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const kind = kindOf((await ctx.params).kind);
  if (!kind) return NextResponse.json({ message: 'نوع پروفایل نامعتبر است' }, { status: 400 });

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get('slug');
  const mine = searchParams.get('mine') === '1';

  if (mine) {
    const actor = actorFromRequest(req);
    if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
    const p = await getProfileByOwner(kind, actor.id);
    return NextResponse.json({ profile: p }, { headers: { 'Cache-Control': 'no-store' } });
  }

  if (slug) {
    const p = await getProfileBySlug(kind, slug);
    if (!p) return NextResponse.json({ message: 'پیدا نشد' }, { status: 404 });
    /* پروفایل تأییدنشده را فقط صاحبش و ادمین می‌بینند */
    if (p.status !== 'approved') {
      const actor = actorFromRequest(req);
      const allowed = !!actor && (actor.id === p.ownerId || (await isAdmin(actor.id)));
      if (!allowed) return NextResponse.json({ message: 'پیدا نشد' }, { status: 404 });
    }
    return NextResponse.json({ profile: p }, { headers: { 'Cache-Control': 'no-store' } });
  }

  /* ── فهرستِ کامل برای پنل‌ها ──
     پنلِ باشگاه می‌خواهد هر مربی‌ای که ثبت‌نام کرده را ببیند، نه فقط
     تأییدشده‌ها: تا امروز فهرستِ «افزودن مربی» خالی بود و باشگاه‌دار
     فکر می‌کرد وصل نیست، در حالی که فقط هیچ پروفایلی هنوز تأیید نشده
     بود. تأییدنشده‌ها فقط برای کاربرِ واردشده برگردانده می‌شوند و با
     `status` می‌آیند تا رابط بتواند نشانشان کند. */
  if (searchParams.get('all') === '1') {
    const actor = actorFromRequest(req);
    if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });
    try {
      const all = await listProfiles(kind, {});
      return NextResponse.json(
        { profiles: all.filter(p => p.status !== 'rejected') },
        { headers: { 'Cache-Control': 'no-store' } },
      );
    } catch {
      return NextResponse.json({ message: 'خطا در دریافت پروفایل‌ها' }, { status: 500 });
    }
  }

  try {
    const all = await listProfiles(kind, { status: 'approved' });
    return NextResponse.json({ profiles: all }, { headers: { 'Cache-Control': 'no-store' } });
  } catch {
    return NextResponse.json({ message: 'خطا در دریافت پروفایل‌ها' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ kind: string }> }) {
  const kind = kindOf((await ctx.params).kind);
  if (!kind) return NextResponse.json({ message: 'نوع پروفایل نامعتبر است' }, { status: 400 });

  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const b = await req.json().catch(() => ({}));
  const data = b?.data && typeof b.data === 'object' ? b.data as Record<string, unknown> : null;
  if (!data) return NextResponse.json({ message: 'بدنه‌ی پروفایل خالی است' }, { status: 400 });

  const slug = str(b?.slug, 80);
  if (!slug) return NextResponse.json({ message: 'نامک پروفایل لازم است' }, { status: 400 });

  /* جواز کسب — عوض‌شدنش تأیید قبلی را باطل می‌کند (در PATCH ادمین دوباره بررسی می‌شود) */
  const licenseNumber = b?.licenseNumber !== undefined ? str(b.licenseNumber, 60) : undefined;
  const licenseUrl = b?.licenseUrl !== undefined ? str(b.licenseUrl, 600) : undefined;

  try {
    const saved = await saveProfile({
      kind, ownerId: actor.id, slug, data,
      ...(licenseNumber !== undefined ? { licenseNumber } : {}),
      ...(licenseUrl !== undefined ? { licenseUrl } : {}),
    });
    /* ── ساختنِ پروفایل یعنی داشتنِ آن نقش ──
       تا امروز این مسیر فقط پروفایل را ذخیره می‌کرد و به نقشِ کاربر
       دست نمی‌زد. نتیجه‌اش باگی بود که کاربر این‌طور دیدش: فروشگاه
       را ساخت، پنلش کار کرد، **بعد از خروج و ورودِ دوباره نقش و
       پنل ناپدید شدند** — در حالی که فروشگاه در صفحه‌ی فروشگاه‌ها و
       صفحه‌ی اصلی دیده می‌شد.

       دلیلش این بود که پنل به حالتِ کلاینت تکیه داشت، ولی ورودِ
       دوباره نقش‌ها را از دیتابیس می‌خواند و آن‌جا خبری از `seller`
       نبود. در دیتابیس هم دیده شد: `role_requests` ردیفِ `pending`
       داشت ولی `secondaryRoles` کاربر خالیِ آن نقش بود.

       این‌جا همان قاعده‌ی `/api/roles/request` تکرار می‌شود: نقش
       داده می‌شود تا کاربر بتواند کارش را شروع کند. امن است چون هر
       چیزی که می‌سازد صفِ تأییدِ خودش را دارد و تا تأیید، روی سایت
       نشانِ تأییدشده نمی‌گیرد.

       `primaryRole` فقط وقتی جابه‌جا می‌شود که کاربر هنوز نقشِ
       معناداری ندارد — وگرنه ساختنِ فروشگاه، باشگاه‌داری‌اش را از
       دستش درمی‌آورد. */
    try {
      const { data: u } = await sb().from('users')
        .select('"primaryRole","secondaryRoles"').eq('id', actor.id).maybeSingle();
      const cur = (u ?? {}) as { primaryRole?: string; secondaryRoles?: string[] };
      const owned = [cur.primaryRole, ...(cur.secondaryRoles ?? [])].filter(Boolean);
      if (!owned.includes(kind)) {
        const roles = [...new Set([...(cur.secondaryRoles ?? []), kind])].filter(Boolean);
        const promote = !cur.primaryRole || cur.primaryRole === 'user';
        await sb().from('users').update({
          secondaryRoles: roles,
          ...(promote ? { primaryRole: kind } : {}),
          updatedAt: new Date().toISOString(),
        }).eq('id', actor.id);
      }
    } catch (roleErr) {
      /* نقش ندادن نباید ذخیره‌ی پروفایل را بشکند؛ لاگ می‌شود و
         کاربر می‌تواند از مسیرِ «نقش‌ها» هم بگیردش. */
      console.error('[profiles] grant role failed:', roleErr);
    }

    return NextResponse.json({ profile: saved }, { status: 201 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : '';
    if (/does not exist|schema cache/i.test(msg)) {
      return NextResponse.json({ message: 'جدول پروفایل‌ها هنوز ساخته نشده (مایگریشن ۰۰۸ اجرا نشده)' }, { status: 503 });
    }
    if (/duplicate key/i.test(msg)) {
      return NextResponse.json({ message: 'این نامک قبلاً استفاده شده است' }, { status: 409 });
    }
    console.error('save profile failed:', msg);
    return NextResponse.json({ message: 'ذخیره‌ی پروفایل انجام نشد' }, { status: 500 });
  }
}
