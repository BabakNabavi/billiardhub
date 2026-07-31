export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, audit } from '@/lib/finance/db';
import { invalidateFeatureCache } from '@/lib/features';

/* تنظیمات پلتفرم — کلیدهایی که خود شما روشن/خاموش می‌کنید.

   عمداً فهرست سفید دارد: هر کلیدی که این‌جا نباشد نوشته نمی‌شود، تا
   یک درخواست دستکاری‌شده نتواند تنظیم ناشناخته‌ای بسازد. */

const WRITABLE: Record<string, 'bool' | 'json'> = {
  ads_quota_enabled: 'bool',   // محدودیت تعداد آگهی
  ads_free_quota: 'json',      // { quota, period }
  /* ad_slots_enabled حذف شد (فاز ۲): هیچ کلید سراسری‌ای برای جایگاه‌ها
     وجود ندارد — نمایش هر جایگاه فقط با is_active خودش. */
  platform_bank: 'json',       // حسابی که پول بسته‌ها به آن می‌رود

  stories_quota_enabled: 'bool',  // فروش بسته‌ی استوری
  stories_free_quota: 'json',     // سهمیه‌ی رایگان استوری، به تفکیک نقش
  story_platform_bank: 'json',

  /* بیلیارد مدیا — این دو تا امروز در localStorage بودند، یعنی هر
     ادمین روی مرورگر خودش چیز دیگری می‌دید و انتخابش برای کاربران
     هیچ اثری نداشت. */
  media_hidden_ids: 'json',       // شناسه‌ی ویدیوهای مخفی‌شده — string[]
  media_featured_id: 'json',      // ویدیوی «NOW SHOWING» — string | null

  /* جدول رنکینگ. ساختارش تودرتوست (رشته × جنسیت × دسته × بازیکنان) و
     همان‌طور هم مصرف می‌شود، پس یک‌جا به‌صورت JSON نگه داشته می‌شود.
     جدول نرمال `rankings` (مهاجرت ۰۲۵) برای مدل ردیف‌به‌ردیف آینده
     آماده است ولی این صفحه هنوز از آن استفاده نمی‌کند. */
  rankings_board: 'json',

  /* تعاملات اجتماعی — لایک، ری‌اکشن، پاسخ به استوری و پیام خصوصی.
     نبود ردیف یعنی «خاموش» (fail-closed در lib/features.ts)، پس این
     کلید تا اولین‌بار که ادمین روشنش کند اصلاً در دیتابیس نیست.

     ⚠️ دیدن استوری عمداً زیر این پرچم نیست و با خاموش‌بودن آن هم
     برای همه — از جمله مهمان — کار می‌کند. */
  social_interactions_enabled: 'bool',
};

const READABLE = Object.keys(WRITABLE);

async function guard(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return { err: NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 }) };
  if (!(await isAdmin(actor.id))) return { err: NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 }) };
  return { actor };
}

export async function GET(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const { data, error } = await sb().from('app_settings').select('key,value').in('key', READABLE);
  if (error) return NextResponse.json({ settings: {} });

  const settings: Record<string, unknown> = {};
  for (const r of (data as { key: string; value: unknown }[] ?? [])) settings[r.key] = r.value;
  return NextResponse.json({ settings }, { headers: { 'Cache-Control': 'no-store' } });
}

export async function PATCH(req: NextRequest) {
  const g = await guard(req);
  if (g.err) return g.err;

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const applied: Record<string, unknown> = {};

  for (const [key, kind] of Object.entries(WRITABLE)) {
    if (b[key] === undefined) continue;
    const value = kind === 'bool' ? !!b[key] : b[key];
    if (kind === 'json' && (value === null || typeof value !== 'object')) continue;

    const { error } = await sb().from('app_settings').upsert({
      key, value, updated_at: new Date().toISOString(), updated_by: g.actor!.id,
    }, { onConflict: 'key' });
    if (error) return NextResponse.json({ message: `ذخیره‌ی «${key}» انجام نشد` }, { status: 500 });
    applied[key] = value;
  }

  if (Object.keys(applied).length === 0) {
    return NextResponse.json({ message: 'تنظیم قابل ذخیره‌ای فرستاده نشد' }, { status: 400 });
  }

  /* کش پرچم‌ها را همین‌جا بینداز دور تا ادمین نتیجه‌ی تغییر خودش را
     بلافاصله ببیند، نه بعد از انقضای TTL. */
  invalidateFeatureCache();

  void audit({
    actorId: g.actor!.id, actorRole: g.actor!.role, action: 'SETTINGS_UPDATED',
    entityType: 'app_settings', newValue: applied,
  });

  return NextResponse.json({ settings: applied });
}
