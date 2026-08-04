export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { sb, actorFromRequest, audit, clientIp } from '@/lib/finance/db';

/* ═══════════════════════════════════════════════════════════════
   «ثبتِ نهایی» — پروفایل تکمیل شد، حالا برود روی میزِ ادمین.
   ───────────────────────────────────────────────────────────────
   تا امروز درخواستِ نقش همان لحظه‌ی *انتخاب* روی میزِ ادمین می‌نشست:
   خالی، بی‌مدرک، بی‌پروفایل. ادمین چیزی برای تأیید یا رد کردن نداشت.

   حالا انتخاب فقط ردیفِ `draft` می‌سازد و نقش را می‌دهد؛ این مسیر
   وقتی صدا زده می‌شود که کاربر پروفایلش را کامل کرده و «ثبت نهایی»
   را زده. آن‌وقت ردیف `pending` می‌شود و ادمین می‌بیندش.

   ── مدرک ──
   اجباری نیست. نبودنش یعنی «تأیید بدونِ تیک آبی»، نه «رد». معیارِ
   تیک برای هر نقش فرق دارد و در پنل ادمین دیده می‌شود.
   ═══════════════════════════════════════════════════════════════ */

export async function POST(req: NextRequest) {
  const actor = actorFromRequest(req);
  if (!actor) return NextResponse.json({ message: 'ابتدا وارد شوید' }, { status: 401 });

  const b = await req.json().catch(() => ({})) as Record<string, unknown>;
  const role = String(b.role ?? '').trim();
  if (!role) return NextResponse.json({ message: 'نقش مشخص نیست' }, { status: 400 });

  /* مدرک باید از مسیرِ آپلودِ خودمان آمده باشد. پذیرفتنِ هر URLای یعنی
     می‌شد نشانیِ دلخواه — حتی یک سایتِ بیرونی — را به‌عنوان مدرک ثبت
     کرد و ادمین رویش کلیک می‌کرد. */
  const rawDoc = String(b.docUrl ?? '').trim();
  const docUrl = rawDoc && /^(\/|https?:\/\/[^/]*supabase)/i.test(rawDoc) ? rawDoc.slice(0, 500) : null;
  if (rawDoc && !docUrl) {
    return NextResponse.json({ message: 'نشانی مدرک معتبر نیست' }, { status: 400 });
  }

  const { data: row } = await sb().from('role_requests')
    .select('id,status,doc_url').eq('user_id', actor.id).eq('role', role)
    .in('status', ['draft', 'pending']).maybeSingle();

  if (!row) {
    return NextResponse.json(
      { message: 'ابتدا این نقش را انتخاب کنید' }, { status: 404 },
    );
  }
  const r = row as { id: string; status: string; doc_url: string | null };

  if (r.status === 'pending') {
    /* از قبل روی میزِ ادمین است. اگر مدرکِ تازه‌ای آمده جایگزین می‌شود
       — کاربری که یادش رفته بود مدرک بگذارد نباید مجبور شود از نو
       شروع کند. */
    if (docUrl && docUrl !== r.doc_url) {
      await sb().from('role_requests').update({ doc_url: docUrl }).eq('id', r.id);
    }
    return NextResponse.json({ ok: true, already: true });
  }

  const { data, error } = await sb().from('role_requests').update({
    status: 'pending',
    submitted_at: new Date().toISOString(),
    ...(docUrl ? { doc_url: docUrl } : {}),
  }).eq('id', r.id).select().single();

  if (error) {
    console.error('[roles/submit]', error.message);
    return NextResponse.json({ message: 'ثبت نهایی انجام نشد' }, { status: 500 });
  }

  void audit({
    actorId: actor.id, actorRole: actor.role, action: 'ROLE_SUBMITTED',
    entityType: 'role_request', entityId: r.id,
    newValue: { role, hasDoc: !!(docUrl ?? r.doc_url) }, ip: clientIp(req) ?? undefined,
  });

  return NextResponse.json({ ok: true, request: data });
}
