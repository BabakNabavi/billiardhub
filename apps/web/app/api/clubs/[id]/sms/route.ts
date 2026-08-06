export const dynamic = 'force-dynamic';
import { callbackOrigin } from '@/lib/site-url';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, ownsClub, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider } from '@/lib/payments';
import { CLUB_TEMPLATES, clubTemplate, faJalali } from '@/lib/sms/club-templates';
import { pricing, quote } from '@/lib/sms/club-campaign';
import { registeredPatterns } from '@/lib/sms-server';

/* پیامک باشگاه به اعضا — برآورد هزینه و ساخت سفارش.

   مالکیت در هر دو مسیر بررسی می‌شود: شناسه‌ی باشگاه از نشانی می‌آید،
   پس بدون آن هر باشگاه‌داری می‌توانست به اعضای باشگاه دیگری پیامک
   بفرستد و پولش را هم خودش بدهد — که بدتر است، چون آن باشگاه هرگز
   خبردار نمی‌شود. */

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function guard(req: NextRequest, clubId: string) {
  const actor = actorFromRequest(req);
  if (!actor) return { err: NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 }) };
  if (!UUID.test(clubId)) return { err: NextResponse.json({ message: 'باشگاه نامعتبر است' }, { status: 400 }) };
  if (!(await ownsClub(actor.id, clubId)) && !(await isAdmin(actor.id))) {
    return { err: NextResponse.json({ message: 'دسترسی مجاز نیست' }, { status: 403 }) };
  }
  const { data: club } = await sb().from('clubs').select('id,name').eq('id', clubId).maybeSingle();
  if (!club) return { err: NextResponse.json({ message: 'باشگاه یافت نشد' }, { status: 404 }) };
  return { actor, clubName: (club as { name?: string }).name ?? 'باشگاه' };
}

/* مقدارهای فرم.

   هیچ‌کدام متنِ آزاد نیستند و این عمدی است: سرویسِ پیامک مقدارهای
   ممکنِ هر متغیر را از قبل می‌خواهد، و متنی که باشگاه‌دار تایپ کند
   قابلِ اعلام نیست. جدا از آن، یک فیلدِ بی‌قید در پیامکی که از طرفِ
   سایت می‌رود دقیقاً ابزارِ کلاهبرداری است.

   تاریخ به قالبِ ثابتِ «۲۵ مرداد ۱۴۰۵» درمی‌آید — هم خواناتر، هم
   قابلِ اعلام. */
function cleanArgs(tplKey: string, raw: unknown): string[] | { error: string } {
  const tpl = clubTemplate(tplKey);
  if (!tpl) return { error: 'متن انتخابی معتبر نیست' };
  const arr = Array.isArray(raw) ? raw : [];

  const out: string[] = [];
  for (const f of tpl.fields) {
    const v = String(arr[out.length] ?? '').trim().replace(/\s+/g, ' ');
    if (!v) return { error: `«${f.label}» را پر کنید` };

    if (f.type === 'select') {
      if (!(f.options ?? []).includes(v)) return { error: `«${f.label}» از فهرست انتخاب شود` };
      out.push(v);
      continue;
    }

    if (f.type === 'number') {
      const n = Number(v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, ''));
      if (!Number.isInteger(n) || n < (f.min ?? 1) || n > (f.max ?? 99)) {
        return { error: `«${f.label}» باید عددی بین ${f.min ?? 1} و ${f.max ?? 99} باشد` };
      }
      out.push(String(n).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]!));
      continue;
    }

    /* jalali — فقط قالبِ خودِ تقویم پذیرفته است */
    const fa = faJalali(v);
    if (fa === v) return { error: `«${f.label}» را از تقویم انتخاب کنید` };
    out.push(fa);
  }
  return out;
}

/** متن‌های آماده، نرخ‌نامه، برآورد، و تاریخچه */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(req, id);
  if (g.err) return g.err;

  const sp = req.nextUrl.searchParams;
  const p = await pricing();

  /* برآورد — فقط وقتی متن انتخاب شده باشد */
  const key = sp.get('template') ?? '';
  let est: unknown = null;
  if (key) {
    const args = (() => { try { return JSON.parse(sp.get('args') ?? '[]'); } catch { return []; } })();
    const c = cleanArgs(key, args);
    /* برای برآورد، مقدارهای ناقص خطا نیستند — کاربر هنوز در حالِ پر
       کردن است و باید هزینه را ببیند. جای خالی با «…» پر می‌شود تا
       طولِ متن تقریباً درست بماند. */
    const safe = Array.isArray(c) ? c : (clubTemplate(key)?.fields ?? []).map((_, i) =>
      String((Array.isArray(args) ? args[i] : '') ?? '').trim() || '…');
    est = await quote(id, g.actor!.id, g.clubName!, key, safe);
  }

  const { data: history } = await sb().from('club_sms_campaigns')
    .select('id,template_key,recipient_count,total_amount,status,sent_count,failed_count,created_at,sent_at')
    .eq('club_id', id).order('created_at', { ascending: false }).limit(20);

  /* ── متنی که کدش ثبت نشده قابلِ خرید نیست ──
     بدونِ این، باشگاه‌دار می‌توانست پول بدهد و هیچ پیامکی نرود:
     `sendPattern` بی‌صدا رد می‌کند و کمپین «ناموفق» می‌شود. کدِ متن
     را پنلِ ملی‌پیامک بعد از تأییدِ هر متن می‌دهد، پس تا آن لحظه این
     الگو واقعاً وجود ندارد. */
  const ready = await registeredPatterns(CLUB_TEMPLATES.map(t => t.key));

  return NextResponse.json({
    templates: CLUB_TEMPLATES.map(t => ({ ...t, ready: ready.has(t.key) })),
    pricing: p,
    estimate: est,
    history: history ?? [],
  }, { headers: { 'Cache-Control': 'no-store' } });
}

/** ساخت سفارش و رفتن به درگاه */
export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const g = await guard(req, id);
  if (g.err) return g.err;

  const body = await req.json().catch(() => ({})) as { template?: string; args?: unknown };
  const key = String(body.template ?? '');
  const args = cleanArgs(key, body.args);
  if (!Array.isArray(args)) return NextResponse.json({ message: args.error }, { status: 400 });

  /* سدِ دوم، سمتِ سرور: رابط دکمه را خاموش می‌کند ولی یک درخواستِ
     دستی همچنان می‌رسید — و نتیجه‌اش پولِ گرفته‌شده و پیامکِ نرفته
     بود. */
  if (!(await registeredPatterns([key])).has(key)) {
    return NextResponse.json({
      message: 'این متن هنوز آماده‌ی ارسال نیست؛ کمی بعد دوباره تلاش کنید',
    }, { status: 409 });
  }

  /* قیمت دوباره سمت سرور حساب می‌شود. عددی که کلاینت فرستاده هرگز
     استفاده نمی‌شود — وگرنه یک درخواستِ دستکاری‌شده می‌توانست
     پنجاه پیامک را به قیمت یکی بخرد. */
  const q = await quote(id, g.actor!.id, g.clubName!, key, args);
  if ('error' in q) return NextResponse.json({ message: q.error }, { status: 400 });

  /* سفارشِ بازِ قبلی را ببند تا ایندکسِ یکتا نخورد و کاربر گیر نکند */
  await sb().from('club_sms_campaigns')
    .update({ status: 'CANCELED', updated_at: new Date().toISOString() })
    .eq('club_id', id).eq('status', 'PENDING_PAYMENT');

  const provider = getPaymentProvider();
  const { data: created, error } = await sb().from('club_sms_campaigns').insert({
    club_id: id, created_by: g.actor!.id,
    template_key: key, args,
    recipient_count: q.recipients, unit_price: q.unitPrice,
    setup_fee: q.setupFee, total_amount: q.total,
    status: 'PENDING_PAYMENT', provider: provider.name,
  }).select('id').single();

  if (error || !created) {
    return NextResponse.json({ message: 'ثبت سفارش انجام نشد' }, { status: 500 });
  }
  const campaignId = (created as { id: string }).id;

  const origin = callbackOrigin();
  const res = await provider.createPayment({
    paymentId: campaignId, amount: q.total,
    description: `پیامک به اعضای ${g.clubName}`,
    callbackUrl: `${origin}/api/clubs/sms/callback/${provider.name}?campaign=${campaignId}`,
  });

  if (!res.ok || !res.redirectUrl) {
    await sb().from('club_sms_campaigns')
      .update({ status: 'FAILED', error_note: res.message ?? null }).eq('id', campaignId);
    return NextResponse.json({ message: res.message || 'اتصال به درگاه ناموفق بود' }, { status: 502 });
  }

  await sb().from('club_sms_campaigns').update({
    provider_ref: res.authority ?? null, updated_at: new Date().toISOString(),
  }).eq('id', campaignId);

  void audit({
    actorId: g.actor!.id, actorRole: g.actor!.role, action: 'CLUB_SMS_ORDERED',
    entityType: 'club_sms_campaign', entityId: campaignId,
    newValue: { recipients: q.recipients, total: q.total, template: key },
    ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, campaignId, redirectUrl: res.redirectUrl });
}
