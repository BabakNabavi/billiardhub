export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, isAdmin, ownsClub, audit, clientIp } from '@/lib/finance/db';
import { getPaymentProvider } from '@/lib/payments';
import { CLUB_TEMPLATES, clubTemplate } from '@/lib/sms/club-templates';
import { pricing, quote } from '@/lib/sms/club-campaign';

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

/* مقدارهای فرم — هر کدام کوتاه و بی‌لینک.
   لینک عمداً رد می‌شود: سرویس پیامک لینکِ داخلِ متغیر را رد می‌کند، و
   مهم‌تر این‌که یک لینکِ دلخواه در پیامکی که از طرفِ سایت می‌رود
   دقیقاً همان چیزی است که کلاهبرداری با آن انجام می‌شود. */
function cleanArgs(tplKey: string, raw: unknown): string[] | { error: string } {
  const tpl = clubTemplate(tplKey);
  if (!tpl) return { error: 'متن انتخابی معتبر نیست' };
  const arr = Array.isArray(raw) ? raw : [];

  const out: string[] = [];
  for (const f of tpl.fields) {
    const v = String(arr[out.length] ?? '').trim().replace(/\s+/g, ' ');
    if (!v) return { error: `«${f.label}» را پر کنید` };
    if (v.length > (f.maxLength ?? 40)) return { error: `«${f.label}» بیش از حد بلند است` };
    if (/https?:|www\.|\.(ir|com|net|org)\b/i.test(v)) {
      return { error: `در «${f.label}» نمی‌توان نشانی اینترنتی نوشت` };
    }
    out.push(v);
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

  return NextResponse.json({
    templates: CLUB_TEMPLATES,
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

  const origin = req.nextUrl.origin;
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
