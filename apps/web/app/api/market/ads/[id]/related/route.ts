export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb } from '@/lib/finance/db';

/* ═══════════════════════════════════════════════════════════════
   محصولات مشابه.
   ───────────────────────────────────────────────────────────────
   تا امروز این بخش از کاتالوگِ ثابتِ ساختگی می‌آمد و با حذفِ آن خالی
   شد. «چند آگهیِ تصادفی» هم جایگزینِ درستی نیست: کاربری که دنبالِ
   چوبِ Predator است، با دیدنِ گچ زیرِ صفحه چیزی به‌دست نمی‌آورد.

   ── رتبه‌بندی ──
   امتیازِ شباهت از روی چیزهایی که واقعاً معنا دارند ساخته می‌شود:

     دسته‌ی یکسان        ۵۰   بدونِ این اصلاً «مشابه» نیست
     برندِ یکسان         ۳۰   چوبِ Predator شبیهِ چوبِ Predator است
     نوعِ یکسان          ۱۵   زیرشاخه‌ی خودِ فروشنده
     شهرِ یکسان          ۱۲   قابلِ دیدن و تحویلِ حضوری
     وضعیتِ یکسان         ۸   نو با نو، کارکرده با کارکرده
     قیمتِ نزدیک       ۰–۲۰   هرچه اختلافِ نسبی کمتر، امتیاز بیشتر

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

const COLS = 'id,title,price,negotiable,"discountPercent",category,condition,city,brand,type,images,"createdAt"';

type Row = {
  id: string; title: string; price: number; negotiable: boolean;
  category: string; condition: string; city: string | null;
  brand: string | null; type: string | null; images: unknown;
};

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!UUID.test(id)) return NextResponse.json({ related: [] });

  const { data: selfRow } = await sb().from('products')
    .select(COLS).eq('id', id).maybeSingle();
  const me = selfRow as unknown as Row | null;
  if (!me) return NextResponse.json({ related: [] });

  /* نامزدها: هم‌دسته‌ها اول. اگر هم‌دسته کم بود، فهرست با تازه‌ترین‌ها
     پر می‌شود — بهتر از بخشِ خالی، و امتیازدهی ترتیبشان را درست
     می‌کند. */
  const now = new Date().toISOString();
  const base = () => sb().from('products')
    .select(COLS)
    .eq('status', 'active')
    .neq('id', id)
    .or(`expiresAt.is.null,expiresAt.gt.${now}`);

  const { data: sameCat } = await base().eq('category', me.category).limit(60);
  let pool = (sameCat as unknown as Row[]) ?? [];

  if (pool.length < 6) {
    const { data: fill } = await base().order('createdAt', { ascending: false }).limit(40);
    const seen = new Set(pool.map(r => r.id));
    for (const r of ((fill as unknown as Row[]) ?? [])) {
      if (!seen.has(r.id)) { pool.push(r); seen.add(r.id); }
    }
  }

  const score = (r: Row): number => {
    let s = 0;
    if (r.category === me.category) s += 50;
    if (r.brand && me.brand && r.brand.trim() === me.brand.trim()) s += 30;
    if (r.type && me.type && r.type.trim() === me.type.trim()) s += 15;
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
      category: r.category, condition: r.condition, city: r.city, brand: r.brand,
      image: Array.isArray(r.images) ? String((r.images as unknown[])[0] ?? '') : '',
    }));

  return NextResponse.json({ related }, { headers: { 'Cache-Control': 'no-store' } });
}
