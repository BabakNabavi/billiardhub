export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, audit } from '@/lib/finance/db';
import { invalidateFeatureCache } from '@/lib/features';
import { can } from '@/lib/admin/permissions';

/* تنظیمات پلتفرم — کلیدهایی که خود شما روشن/خاموش می‌کنید.

   عمدا فهرست سفید دارد: هر کلیدی که این‌جا نباشد نوشته نمی‌شود، تا
   یک درخواست دستکاری‌شده نتواند تنظیم ناشناخته‌ای بسازد. */

const WRITABLE: Record<string, 'bool' | 'json' | 'phone'> = {
  ads_quota_enabled: 'bool',   // محدودیت تعداد آگهی

  /* شماره‌ای که هشدار گزارش تخلف به آن پیامک می‌شود. در کد نیست چون
     شماره‌ی ادمین عوض می‌شود و نباید دیپلوی بخواهد؛ خالی بودنش یعنی
     «پیامک نفرست» و فقط نشان داشبورد می‌ماند.

     ⚠️ تا آبان ۱۴۰۵ نوعش 'json' بود و هر مقدار غیرشیء رد می‌شد، در حالی که
     صفحه‌ی گزارش‌ها و `notifyReportCreated` هر دو رشته می‌خواهند: شماره هرگز
     ذخیره نشد و ادمین فقط «ذخیره‌ی شماره انجام نشد» می‌دید. */
  report_alert_phone: 'phone',

  /* کد متن هر الگوی پیامک، همان‌طور که پنل ملی‌پیامک می‌دهد:
       { "booking_confirmed": 524, "role_approved": 531, … }
     در کد نیست چون کد را پنل بعد از تأیید هر متن می‌دهد و با هر
     اصلاح متن عوض می‌شود؛ گذاشتنش در کد یعنی هر بار یک دیپلوی. */
  sms_body_ids: 'json',

  /* آیا آگهی تازه پیش از انتشار بازبینی می‌شود؟
     پیش‌فرض خاموش است — همان رفتار امروز، یعنی انتشار بی‌درنگ. */
  market_approval_required: 'bool',
  ads_free_quota: 'json',      // { quota, period }
  /* ad_slots_enabled حذف شد (فاز ۲): هیچ کلید سراسری‌ای برای جایگاه‌ها
     وجود ندارد — نمایش هر جایگاه فقط با is_active خودش. */
  /* ── `platform_bank` و `story_platform_bank` حذف شدند ──
     هر دو فقط نوشته می‌شدند و خوانده نمی‌شدند: فرم پنل ذخیره‌شان
     می‌کرد و همان فرم دوباره می‌خواندشان، و هیچ صفحه‌ی کاربری یا
     مسیر پرداختی سراغشان نمی‌رفت.

     خرید بسته‌ها از اول از درگاه می‌رود، پس حساب دومی معنا ندارد.
     نگه‌داشتن فرم فعال هم این توقع را می‌ساخت که جایی مؤثر است —
     و اگر روزی کسی آن شماره را واقعا به خریدار نشان می‌داد، پولی
     بیرون سایت جابه‌جا می‌شد که نه در دفتر مالی می‌نشیند نه
     قابل بازپرداخت است. */

  stories_quota_enabled: 'bool',  // فروش بسته‌ی استوری
  stories_free_quota: 'json',     // سهمیه‌ی رایگان استوری، به تفکیک نقش

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
     کلید تا اولین‌بار که ادمین روشنش کند اصلا در دیتابیس نیست.

     ⚠️ دیدن استوری عمدا زیر این پرچم نیست و با خاموش‌بودن آن هم
     برای همه — از جمله مهمان — کار می‌کند. */
  social_interactions_enabled: 'bool',

  /* تعرفه‌ی ارتقای آگهی (مهاجرت ۰۷۹) — تازه‌سازی و فوری. قیمت عوض
     می‌شود و نباید دیپلوی بخواهد، پس این‌جاست نه در کد. */
  ad_boost_pricing: 'json',
};

const READABLE = Object.keys(WRITABLE);

/* ── هر تنظیم مال کدام صفحه است ──
   ⚠️ تا آبان ۱۴۰۵ نوشتن فقط «ادمین بودن» می‌خواست: ادمینی که فقط کلید «اخبار»
   داشت می‌توانست تعاملات اجتماعی را روشن، بازبینی آگهی را خاموش یا تعرفه‌ی
   ارتقا را عوض کند. حالا هر کلید دسترسی صفحه‌ی خودش را می‌خواهد. کلیدی که
   این‌جا نباشد فقط به سوپرادمین اجازه می‌دهد ('access' کلید سوپر است). */
const OWNER_KEY: Record<string, string> = {
  ads_quota_enabled: 'ad-plans', ads_free_quota: 'ad-plans', ad_boost_pricing: 'ad-plans',
  report_alert_phone: 'reports',
  sms_body_ids: 'sms',
  market_approval_required: 'products',
  stories_quota_enabled: 'story-plans', stories_free_quota: 'story-plans',
  media_hidden_ids: 'media', media_featured_id: 'media',
  rankings_board: 'rankings',
  social_interactions_enabled: 'features',
};

/* ۰۹۱۲… با ارقام لاتین؛ خالی یعنی «پیامک نفرست» */
const toPhone = (v: unknown): string | null => {
  const s = String(v ?? '').trim()
    .replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d)))
    .replace(/[٠-٩]/g, d => String('٠١٢٣٤٥٦٧٨٩'.indexOf(d)))
    .replace(/[\s-]/g, '');
  if (!s) return '';
  const local = s.startsWith('+98') ? '0' + s.slice(3) : s.startsWith('0098') ? '0' + s.slice(4)
    : s.startsWith('98') ? '0' + s.slice(2) : /^9\d{9}$/.test(s) ? '0' + s : s;
  return /^09\d{9}$/.test(local) ? local : null;
};

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

  /* همه یا هیچ: پیش از نوشتن اولین کلید، اجازه‌ی همه سنجیده می‌شود تا نیمی ذخیره
     و نیمی رد نشود. */
  for (const key of Object.keys(WRITABLE)) {
    if (b[key] === undefined) continue;
    if (!(await can(g.actor!.id, OWNER_KEY[key] ?? 'access'))) {
      return NextResponse.json({ message: `اجازه‌ی تغییر «${key}» را ندارید` }, { status: 403 });
    }
    if (WRITABLE[key] === 'phone' && toPhone(b[key]) === null) {
      return NextResponse.json({ message: 'شماره‌ی موبایل معتبر نیست (مثلا ۰۹۱۲۱۲۳۴۵۶۷)' }, { status: 400 });
    }
  }

  for (const [key, kind] of Object.entries(WRITABLE)) {
    if (b[key] === undefined) continue;
    const value = kind === 'bool' ? !!b[key] : kind === 'phone' ? toPhone(b[key]) : b[key];
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
