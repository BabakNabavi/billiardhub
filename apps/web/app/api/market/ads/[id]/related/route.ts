export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';

/* ═══════════════════════════════════════════════════════════════
   محصولات مشابه.
   ───────────────────────────────────────────────────────────────
   تا امروز این بخش از کاتالوگِ ثابتِ ساختگی می‌آمد و با حذفِ آن خالی
   شد. «چند آگهیِ تصادفی» هم جایگزینِ درستی نیست: کاربری که دنبالِ
   چوبِ Predator است، با دیدنِ گچ زیرِ صفحه چیزی به‌دست نمی‌آورد.

   ── دسته، مرزِ سخت است نه امتیاز ──
   پیش‌تر دسته ۵۰ امتیاز داشت و اگر هم‌دسته کمتر از شش تا بود، فهرست
   با «تازه‌ترین آگهی‌ها» از هر دسته‌ای پر می‌شد. نتیجه این بود که
   زیرِ صفحه‌ی یک چوبِ اسنوکر، توپ و گچ نشان داده می‌شد — و امتیاز هم
   کاری نمی‌کرد، چون رقیبی نبود.

   بخشِ کوتاه یا خالی از بخشِ بی‌ربط بهتر است: کسی که چوب می‌بیند و
   زیرش توپ می‌بیند، یاد می‌گیرد به این بخش نگاه نکند.

   ── رتبه‌بندی، بینِ هم‌دسته‌ها ──
     نوعِ یکسان          ۴۰   «چوب اسنوکر» با «چوب اسنوکر»، نه با «چوب پول»
     برندِ یکسان         ۲۵   چوبِ Predator شبیهِ چوبِ Predator است
     شهرِ یکسان          ۱۲   قابلِ دیدن و تحویلِ حضوری
     وضعیتِ یکسان         ۸   نو با نو، کارکرده با کارکرده
     قیمتِ نزدیک       ۰–۲۰   هرچه اختلافِ نسبی کمتر، امتیاز بیشتر

   نوع بالاتر از برند نشسته: خریدارِ چوبِ اسنوکر، چوبِ اسنوکرِ برندِ
   دیگر را می‌خرد، ولی چوبِ پولِ همان برند را نه.

   ── چرا این‌جا و نه در کلاینت؟ ──
   رتبه‌بندی در مرورگر یعنی همه‌ی آگهی‌ها باید دانلود شوند. با هزار
   آگهی، صفحه‌ی جزئیاتِ یک محصول چند مگابایت داده می‌گرفت تا شش کارت
   نشان دهد.

   ── مرزها ──
   · خودِ آگهی هرگز در نتیجه نیست.
   · فقط آگهیِ فعال و منقضی‌نشده — فروخته‌شده و متوقف هم نه.
   · شماره‌ی تماس برنمی‌گردد؛ کارت به آن نیازی ندارد.
   ═══════════════════════════════════════════════════════════════ */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const COLS = 'id,title,price,negotiable,"discountPercent",category,condition,city,brand,model,type,images,"createdAt"';

type Row = {
  id: string; title: string; price: number; negotiable: boolean;
  category: string; condition: string; city: string | null;
  brand: string | null; model: string | null; type: string | null; images: unknown;
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ related: [] });

  const { data: selfRow } = await sb().from('products')
    .select(COLS).eq('id', id).maybeSingle();
  const me = selfRow as unknown as Row | null;
  if (!me) return NextResponse.json({ related: [] });

  /* نامزدها: **فقط** هم‌دسته‌ها. هیچ پرکردنی از دسته‌های دیگر نیست. */
  const now = new Date().toISOString();
  const { data: sameCat } = await sb().from('products')
    .select(COLS)
    .eq('status', 'active')
    .eq('category', me.category)
    .neq('id', id)
    .or(`expiresAt.is.null,expiresAt.gt.${now}`)
    .limit(60);
  const pool = (sameCat as unknown as Row[]) ?? [];

  const norm = (v: string | null) => String(v ?? '').trim().toLowerCase();

  const score = (r: Row): number => {
    let s = 0;
    /* دسته امتیاز ندارد چون همه‌ی نامزدها هم‌دسته‌اند — امتیازِ ثابت
       فقط عددها را بزرگ می‌کند و ترتیب را عوض نمی‌کند. */
    if (norm(r.type) && norm(r.type) === norm(me.type)) s += 40;
    if (norm(r.brand) && norm(r.brand) === norm(me.brand)) s += 25;
    if (r.city && me.city && r.city === me.city) s += 12;
    if (r.condition === me.condition) s += 8;
    /* قیمت فقط وقتی معنا دارد که هر دو عدد داشته باشند — آگهیِ
       توافقی قیمتِ قابلِ مقایسه ندارد و نباید جریمه شود. */
    if (!r.negotiable && !me.negotiable && r.price > 0 && me.price > 0) {
      const diff = Math.abs(r.price - me.price) / Math.max(r.price, me.price);
      s += Math.round(20 * Math.max(0, 1 - diff));
    }
    return s;
  };

  const related = pool
    .map(r => ({ r, s: score(r) }))
    .sort((a, b) => b.s - a.s || String(a.r.id).localeCompare(String(b.r.id)))
    .slice(0, 8)
    .map(({ r }) => ({
      id: r.id, title: r.title, price: r.price, negotiable: r.negotiable,
      category: r.category, condition: r.condition, city: r.city, brand: r.brand, model: r.model,
      image: Array.isArray(r.images) ? String((r.images as unknown[])[0] ?? '') : '',
    }));

  return NextResponse.json({ related }, { headers: { 'Cache-Control': 'no-store' } });
}
