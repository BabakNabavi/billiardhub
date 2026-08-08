'use client';

/* ─────────────────────────────────────────────────────────────
   پنل برگزارکننده‌ی مسابقه.

   تا پیش از این روی داده‌ی ساختگی داخل کد کار می‌کرد. حالا از
   /api/tournaments/:id/matches می‌خواند و می‌نویسد:
     • فهرست ثبت‌نام‌های تأییدشده
     • قرعه‌کشی (یک‌بار، اتمیک)
     • ثبت نتیجه‌ی هر بازی و صعود خودکار برنده

   دسترسی سمت سرور با `ownsClub` سنجیده می‌شود؛ این صفحه فقط UI است.
   ───────────────────────────────────────────────────────────── */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  Trophy, ChevronRight, GitBranch, Shuffle, AlertCircle,
  Loader2, CheckCircle2, RotateCcw, Radio, Save, Table2, Users, Monitor,
  Plus, Minus, Flag, Sparkles, SlidersHorizontal,
} from 'lucide-react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import DragScroll from '@/components/ui/DragScroll';
import BracketSeeding from '@/components/tournaments/BracketSeeding';
import BracketTree from '@/components/tournaments/BracketTree';
import {
  fetchBracket, drawBracket, resetBracket, reportResult, patchMatch,
  liveScore, setHighBreak, formatTarget, frameCap,
  faDigits, slotLabel, isBye,
  type Bracket, type Match,
} from '../../../../lib/tournaments/bracket-client';
import { apiFetch } from '../../../../lib/http';

const GOLD = '#C7A66A', GOLD_D = '#9A6E38', INK = '#1C1B17';
const MUT = '#8A8474', LINE = '#EAE5DA', FELT = '#0E7A38', RED = '#B23B2E';
const GROUND = '#FAF8F3';

/* «چیدن» و «براکت» تازه‌اند: چیدنِ دستی تا امروز اصلاً نبود، و
   براکت در پنلِ باشگاه دکمه‌ی جدا داشت — جایش این‌جاست، کنارِ
   قرعه‌کشی و ثبتِ نتیجه. */
/* «چیدن دستی» تبِ جدا نیست: وقتی جدول ساخته شد، خودش پایینِ همین
   تبِ قرعه‌کشی می‌آید. دو ورودی برای یک کار فقط سردرگمی می‌سازد. */
type AdminTab = 'overview' | 'draw' | 'bracket' | 'matches';

interface Registration {
  id: string; player_name: string | null; status: string;
  payment_status: string; amount: number; created_at: string;
}

export default function TournamentAdminPage() {
  const params = useParams();
  const id = String(params?.id ?? '');

  const [b, setB] = useState<Bracket | null>(null);
  const [regs, setRegs] = useState<Registration[]>([]);
  const [tab, setTab] = useState<AdminTab>('overview');
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const [bracket, regRes] = await Promise.all([
      fetchBracket(id),
      apiFetch(`/api/tournaments/${id}/registrations`, { cache: 'no-store' })
        .then(r => r.ok ? r.json() : null).catch(() => null),
    ]);
    setB(bracket);
    setRegs((regRes?.registrations ?? []) as Registration[]);
    if (!bracket) setErr('اطلاعات این مسابقه در دسترس نیست');
    setLoading(false);
  }, [id]);

  useEffect(() => { void load(); }, [load]);

  const confirmed = regs.filter(r => r.status === 'CONFIRMED');
  const pending = regs.filter(r => r.status === 'PENDING_PAYMENT');
  const hasBracket = (b?.matches.length ?? 0) > 0;

  const flash = (t: string) => { setNote(t); setTimeout(() => setNote(''), 3500); };

  const doDraw = async () => {
    setBusy(true); setErr('');
    const { ok, body } = await drawBracket(id, true);
    setBusy(false);
    if (!ok) { setErr(body.message ?? 'قرعه‌کشی انجام نشد'); return; }
    flash(`براکت ساخته شد — ${faDigits(body.matches ?? 0)} بازی`);
    setTab('matches');
    await load();
  };

  /* جدولِ خالی: ساختار ساخته می‌شود ولی جایگاه‌ها خالی می‌مانند تا
     برگزارکننده در تبِ «چیدن دستی» بچیند. */
  const doDrawEmpty = async () => {
    setBusy(true); setErr('');
    const { ok, body } = await drawBracket(id, false, true);
    setBusy(false);
    if (!ok) { setErr(body.message ?? 'ساخت جدول انجام نشد'); return; }
    flash('جدولِ خالی ساخته شد — حالا بازیکنان را بچینید');
    setTab('draw');
    await load();
  };

  /* پایانِ مسابقه — تا امروز هیچ راهی نبود و مسابقه هیچ‌وقت به تبِ
     «پایان یافته» نمی‌رفت. */
  const [askFinish, setAskFinish] = useState(false);
  const doFinish = async () => {
    setBusy(true); setErr('');
    const r = await apiFetch(`/api/tournaments/${id}/status`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'completed' }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setErr(j?.message ?? 'پایان مسابقه ثبت نشد'); return; }
    setAskFinish(false);
    flash('مسابقه پایان یافت');
    await load();
  };

  /* پنجره‌ی بومیِ مرورگر برداشته شد: انگلیسیِ چپ‌به‌راست بود، نشانیِ
     سایت را بالای خودش می‌نوشت، و برای یک کارِ برگشت‌ناپذیر کمترین
     خوانایی را داشت. */
  const [askReset, setAskReset] = useState(false);

  const doReset = async () => {
    setBusy(true); setErr('');
    const { ok, body } = await resetBracket(id);
    setBusy(false);
    if (!ok) { setErr(body.message ?? 'حذف براکت انجام نشد'); return; }
    setAskReset(false);
    flash('براکت حذف شد');
    await load();
  };

  if (loading) return (
    <div style={{ padding: 80, textAlign: 'center', color: MUT }}>
      <Loader2 size={28} style={{ animation: 'taspin 1s linear infinite' }} />
      <style>{`@keyframes taspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  return (
    <div dir="rtl" style={{ maxWidth: 1000, margin: '0 auto', padding: '0 16px 70px', fontFamily: 'inherit' }}>

      {/* ── سربرگ ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '18px 0 14px', flexWrap: 'wrap' }}>
        <Link href="/dashboard/club" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 12.5, color: MUT, textDecoration: 'none' }}>
          <ChevronRight size={14} /> داشبورد باشگاه
        </Link>
        <span style={{ color: LINE }}>/</span>
        <h1 style={{ fontSize: 17, fontWeight: 900, color: INK, margin: 0 }}>
          {b?.tournament.title ?? 'مسابقه'}
        </h1>
      </div>

      {note && (
        <div style={{ ...banner, background: 'rgba(14,122,56,0.07)', borderColor: 'rgba(14,122,56,0.25)', color: FELT }}>
          <CheckCircle2 size={15} /> {note}
        </div>
      )}
      {err && (
        <div style={{ ...banner, background: 'rgba(178,59,46,0.06)', borderColor: 'rgba(178,59,46,0.25)', color: RED }}>
          <AlertCircle size={15} /> {err}
        </div>
      )}

      {/* ── تب‌ها ──
          `flexWrap` باعث می‌شد چهارمی روی موبایل به خطِ دوم بیفتد و
          نوار نصفه‌نیمه دیده شود. همان نوارِ کشیدنیِ پنلِ باشگاه:
          یک ردیف می‌ماند، و اگر جا نشد کشیده می‌شود — نه اینکه
          بشکند. */}
      <DragScroll style={{
        display: 'flex', gap: 5, marginBottom: 18,
        background: '#fff', borderRadius: 14, padding: 5,
        border: `1px solid ${LINE}`,
      }}>
        {([
          { k: 'overview', label: 'خلاصه', Icon: Trophy },
          { k: 'draw', label: 'قرعه‌کشی', Icon: Shuffle },
          { k: 'bracket', label: 'براکت', Icon: GitBranch },
          { k: 'matches', label: `بازی‌ها${hasBracket ? ` (${faDigits(b!.matches.length)})` : ''}`, Icon: GitBranch },
        ] as const).map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={chip(tab === t.k)}>
            <t.Icon size={13} /> {t.label}
          </button>
        ))}
      </DragScroll>

      {/* ══ خلاصه ══ */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 12 }}>
          <Stat label="ثبت‌نام تأییدشده" value={confirmed.length} unit="نفر" tone="felt" />
          <Stat label="در انتظار پرداخت" value={pending.length} unit="نفر" />
          <Stat label="ظرفیت" value={b?.tournament.max_players ?? 0} unit="نفر" />
          <Stat label="بازی‌های براکت" value={b?.matches.length ?? 0} unit="بازی" tone={hasBracket ? 'gold' : undefined} />
          {hasBracket && (
            <>
              <Stat label="انجام‌شده" value={b!.matches.filter(m => m.winner).length} unit="بازی" />
              <Stat label="در حال اجرا" value={b!.matches.filter(m => m.status === 'in_progress').length} unit="بازی" tone="red" />
            </>
          )}
          {b?.champion && (
            <div style={{ ...card, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 11, flexWrap: 'wrap', borderColor: 'rgba(199,166,106,0.45)', background: 'rgba(199,166,106,0.07)' }}>
              <Trophy size={20} style={{ color: GOLD_D }} />
              <span style={{ fontSize: 14.5, fontWeight: 900, color: INK }}>قهرمان: {b.champion.name}</span>
              {b.runnerUp && <span style={{ fontSize: 12.5, color: MUT }}>نایب‌قهرمان: {b.runnerUp.name}</span>}
            </div>
          )}

          {/* ── پایانِ مسابقه ──
              تا امروز هیچ راهی نبود: مسابقه بعد از فینال هم در وضعیتِ
              قبلی می‌ماند و هیچ‌وقت به تبِ «پایان یافته» نمی‌رفت.
              عمداً خودکار نیست — بازیِ رده‌بندی یا مراسمِ اهدای جوایز
              ممکن است بعد از فینال باشد. */}
          {hasBracket && b?.tournament.status !== 'completed' && (
            <div style={{ ...card, gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 800, color: INK }}>پایان مسابقه</div>
                <div style={{ fontSize: 11.5, color: MUT, lineHeight: 1.9, marginTop: 2 }}>
                  مسابقه به تبِ «پایان یافته» می‌رود و نتایج نهایی می‌شوند.
                  {!b?.champion && ' هنوز قهرمان مشخص نشده — مطمئنید؟'}
                </div>
              </div>
              <button onClick={() => setAskFinish(true)} disabled={busy} style={btnGhostLink}>
                <CheckCircle2 size={14} /> اعلام پایان مسابقه
              </button>
            </div>
          )}
        </div>
      )}

      {/* ══ قرعه‌کشی ══ */}
      {tab === 'draw' && (
        <div style={card}>
          {!hasBracket ? (
            <>
              <h3 style={h3}>قرعه‌کشی براکت</h3>
              <p style={pStyle}>
                {faDigits(confirmed.length)} بازیکن تأییدشده وارد براکت می‌شوند.
                {confirmed.length >= 2 && (() => {
                  let size = 2; while (size < confirmed.length) size *= 2;
                  const byes = size - confirmed.length;
                  return ` براکت ${faDigits(size)} تایی ساخته می‌شود${byes ? ` و ${faDigits(byes)} بازیکن در دور اول Bye می‌گیرند` : ''}.`;
                })()}
              </p>
              <p style={{ ...pStyle, color: RED }}>
                قرعه‌کشی یک‌بار انجام می‌شود. برای تکرارش باید کل براکت و نتایج پاک شود.
              </p>
              {pending.length > 0 && (
                <p style={{ ...pStyle, color: GOLD_D }}>
                  {faDigits(pending.length)} ثبت‌نام هنوز پرداخت نشده و وارد براکت نمی‌شود.
                </p>
              )}
              {/* ── دو راهِ ساختِ جدول ──
                  تا امروز فقط قرعه‌کشیِ تصادفی بود، پس برگزارکننده‌ای
                  که می‌خواست خودش بچیند مجبور بود اول تصادفی بریزد و
                  بعد همه را جابه‌جا کند — و تبِ «چیدن دستی» هم تا آن
                  لحظه می‌گفت «اول براکت را بسازید». */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <button onClick={doDraw} disabled={busy || confirmed.length < 2} style={btnGold(busy || confirmed.length < 2)}>
                  {busy ? <Loader2 size={15} style={{ animation: 'taspin 1s linear infinite' }} /> : <Shuffle size={15} />}
                  قرعه‌کشی تصادفی
                </button>
                <button onClick={doDrawEmpty} disabled={busy || confirmed.length < 2} style={btnGhost(busy || confirmed.length < 2)}>
                  <Users size={15} /> جدول خالی برای چیدن دستی
                </button>
              </div>
              {confirmed.length < 2 && (
                <p style={{ ...pStyle, marginTop: 10 }}>حداقل دو ثبت‌نام تأییدشده لازم است.</p>
              )}
            </>
          ) : (
            <>
              <h3 style={h3}>براکت ساخته شده است</h3>
              <p style={pStyle}>
                {faDigits(b!.totalRounds)} دور، {faDigits(b!.matches.length)} بازی.
                نتایج را از تب «بازی‌ها» ثبت کنید.
              </p>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                <Link href={`/tournaments/${id}/bracket`} style={btnGhostLink}>
                  <GitBranch size={14} /> دیدن براکت
                </Link>
                <button onClick={() => setAskReset(true)} disabled={busy} style={btnDanger(busy)}>
                  <RotateCcw size={14} /> حذف براکت و قرعه‌کشی دوباره
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {/* ── چیدنِ دستی ──
          تبِ جدا نداشت که کاربر بین «ساختِ جدول» و «چیدنِ آن» گم
          شود؛ همان‌جا که جدول را می‌سازد، پایین‌ترش می‌چیندش. */}
      {tab === 'draw' && hasBracket && (
        <div style={{ marginTop: 16 }}>
          <BracketSeeding tournamentId={id} onChanged={load} />
        </div>
      )}

      {/* ══ براکت ══ */}
      {tab === 'bracket' && (
        hasBracket ? (
          <>
            {/* ── نمایشِ بزرگ ──
                برای مانیتورِ سالن: زمینه‌ی تیره، متنِ درشت، بدونِ
                نوار و فوتر، و خودش هر چند ثانیه تازه می‌شود. در تبِ
                تازه باز می‌شود تا پنلِ برگزارکننده بسته نشود. */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
              <a href={`/tournaments/${id}/stage`} target="_blank" rel="noopener noreferrer"
                style={btnGhostLink}>
                <Monitor size={14} /> نمایش روی مانیتور
              </a>
              {/* ── مدیریتِ زنده، پنجره‌ی جدا ──
                  پیش‌تر کشویی روی خودِ صفحه‌ی مانیتور بود؛ یعنی درست
                  همان لحظه‌ای که اپراتور نتیجه را ثبت می‌کرد، جدول را
                  از دیدِ تماشاگر می‌پوشاند. حالا نشانیِ خودش را دارد و
                  روی گوشیِ اپراتور باز می‌شود. */}
              <a href={`/tournaments/${id}/control`} target="_blank" rel="noopener noreferrer"
                style={btnGhostLink}>
                <SlidersHorizontal size={14} /> مدیریت زنده
              </a>
            </div>
            <div style={{ ...card, padding: '16px 10px' }}>
              <BracketTree bracket={b!} />
            </div>
          </>
        ) : (
          <div style={{ ...card, textAlign: 'center', padding: '40px 20px', color: MUT, fontSize: 13 }}>
            هنوز قرعه‌کشی نشده — از تب «قرعه‌کشی» شروع کنید.
          </div>
        )
      )}

      {/* ══ بازی‌ها ══ */}
      {tab === 'matches' && (
        !hasBracket ? (
          <div style={{ ...card, textAlign: 'center', padding: '50px 20px' }}>
            <GitBranch size={30} style={{ color: MUT, opacity: 0.4, marginBottom: 10 }} />
            <p style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 6px', color: INK }}>هنوز براکتی ساخته نشده</p>
            <p style={{ ...pStyle, margin: 0 }}>از تب «قرعه‌کشی» شروع کنید.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {b!.rounds.map(r => (
              <section key={r.round}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ width: 3, height: 16, borderRadius: 2, background: GOLD }} />
                  <h3 style={{ fontSize: 14.5, fontWeight: 900, color: INK, margin: 0 }}>{r.label}</h3>
                  <span style={{ fontSize: 11.5, color: MUT }}>
                    {faDigits(r.matches.filter(m => m.winner).length)} از {faDigits(r.matches.length)} انجام‌شده
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                  {r.matches.map(m => (
                    <MatchEditor key={m.id} tournamentId={id} match={m}
                      target={formatTarget(b!.tournament.match_format)}
                      onDone={async (msg) => { flash(msg); await load(); }}
                      onError={setErr} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )
      )}

      <ConfirmDialog
        open={askReset}
        title="حذف براکت"
        body={<>کل براکت و <b style={{ color: '#1A1A18' }}>همه‌ی نتایج ثبت‌شده</b> پاک
          می‌شوند و مسابقه به پیش از قرعه‌کشی برمی‌گردد. این کار برگشت‌پذیر نیست.</>}
        confirmLabel="حذف و قرعه‌کشی دوباره"
        busy={busy}
        onConfirm={() => void doReset()}
        onCancel={() => setAskReset(false)}
      />

      <ConfirmDialog
        open={askFinish}
        tone="gold"
        icon={<Trophy size={24} color="#A07840" />}
        title="اعلام پایان مسابقه"
        body={<>مسابقه به وضعیتِ <b style={{ color: '#1A1A18' }}>پایان یافته</b> می‌رود و
          در همان تب دیده می‌شود. پس از این، نتیجه‌ای ثبت یا اصلاح نمی‌شود.</>}
        confirmLabel="بله، تمام شد"
        busy={busy}
        onConfirm={() => void doFinish()}
        onCancel={() => setAskFinish(false)}
      />

      <style>{`@keyframes taspin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── ویرایشگر یک بازی ──────────────────────────────────────────
   بای و بازیِ نامشخص ورودی نمی‌گیرند: اولی حریف ندارد و دومی هنوز
   بازیکنش معلوم نیست.

   ── چرا از نو نوشته شد ──
   نسخه‌ی قبلی دو کادرِ عدد بود و یک دکمه‌ی «ثبت». سه ایراد داشت:

     • امتیاز کنارِ نامِ بازیکن نبود، یک «۳ – ۲»ی جدا بود. روی
       مانیتور و در شلوغیِ سالن، فهمیدنِ اینکه کدام عدد مالِ کیست
       یک لحظه مکث می‌خواست — و همان لحظه جای اشتباه‌کردن است.
     • سقفِ فرمت اعمال نمی‌شد؛ در Best of 5 عددِ ۷ هم پذیرفته
       می‌شد.
     • «ثبت» یعنی «بازی تمام شد و برنده به دورِ بعد رفت». راهی
       برای نشان‌دادنِ امتیازِ جاری روی مانیتور وجود نداشت.

   حالا: هر بازیکن عددِ خودش را کنارِ نامش دارد با −/+، دکمه‌ی
   «تأیید» امتیاز را زنده روی مانیتور می‌برد بدونِ اعلامِ برنده، و
   «پایان بازی» جداست. */
function MatchEditor({
  tournamentId, match, target, onDone, onError,
}: {
  tournamentId: string; match: Match; target: number | null;
  onDone: (msg: string) => Promise<void>; onError: (m: string) => void;
}) {
  const [s1, setS1] = useState(match.score1);
  const [s2, setS2] = useState(match.score2);
  const [busy, setBusy] = useState<'' | 'live' | 'finish' | 'stream' | 'break'>('');
  /* برک برای هر بازیکن جدا — کلید ۱ و ۲ */
  const [brk, setBrk] = useState<Record<1 | 2, string>>({
    1: match.high_break_p1 != null ? String(match.high_break_p1) : '',
    2: match.high_break_p2 != null ? String(match.high_break_p2) : '',
  });

  useEffect(() => { setS1(match.score1); setS2(match.score2); },
    [match.score1, match.score2]);

  const ready = !!match.p1_name && !!match.p2_name;
  const bye = isBye(match);
  const done = match.winner !== null;

  /* ── سقف ──
     هدف از فرمت می‌آید، ولی سقفِ هر بازیکن به امتیازِ حریفش هم
     بستگی دارد: در Best of 5 هدف ۳ است و ۳–۳ وجود ندارد — تا یکی
     به ۳ برسد بازی تمام است و بازنده حداکثر ۲ می‌گیرد. */
  const dirty = s1 !== match.score1 || s2 !== match.score2;
  /* بازی وقتی «تمام‌شدنی» است که یکی به هدف رسیده، مساوی نباشد، و
     هر دو به هدف نرسیده باشند */
  const finishable = s1 !== s2
    && (target === null || (Math.max(s1, s2) >= target && Math.min(s1, s2) < target));

  const pushLive = async () => {
    setBusy('live'); onError('');
    const { ok, body } = await liveScore(tournamentId, match.id, s1, s2);
    setBusy('');
    if (!ok) { onError(body.message ?? 'ثبت امتیاز انجام نشد'); return; }
    await onDone('امتیاز روی مانیتور به‌روز شد');
  };

  const finish = async () => {
    setBusy('finish'); onError('');
    const { ok, body } = await reportResult(tournamentId, match.id, s1, s2);
    setBusy('');
    if (!ok) { onError(body.message ?? 'ثبت نتیجه انجام نشد'); return; }
    await onDone(done ? 'نتیجه اصلاح شد' : 'بازی تمام شد — برنده به دور بعد رفت');
  };

  const saveBreak = async (player: 1 | 2) => {
    setBusy('break'); onError('');
    const raw = brk[player].trim();
    const v = raw === '' ? null : Number(raw);
    if (v !== null && (!Number.isFinite(v) || v < 0 || v > 200)) {
      setBusy(''); onError('مقدار برک معتبر نیست'); return;
    }
    const { ok, body } = await setHighBreak(tournamentId, match.id, player, v);
    setBusy('');
    if (!ok) { onError(body.message ?? 'ثبت برک انجام نشد'); return; }
    await onDone(v === null ? 'برک پاک شد' : 'بالاترین برک ثبت شد');
  };

  const toggleLive = async () => {
    setBusy('stream'); onError('');
    const wasLive = match.status === 'in_progress';
    const { ok, body } = await patchMatch(tournamentId, match.id, {
      status: wasLive ? 'waiting' : 'in_progress',
    });
    setBusy('');
    if (!ok) { onError(body.message ?? 'تغییر وضعیت انجام نشد'); return; }
    await onDone(wasLive ? 'بازی متوقف شد' : 'بازی شروع شد');
  };

  return (
    <div style={{
      ...card, padding: '12px 14px',
      borderColor: match.status === 'in_progress' ? 'rgba(178,59,46,0.4)'
        : done ? 'rgba(14,122,56,0.28)' : LINE,
      background: match.status === 'in_progress' ? 'rgba(178,59,46,0.03)' : '#fff',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: ready && !bye ? 10 : 0, flexWrap: 'wrap' }}>
        {target !== null && ready && !bye && (
          <span style={{
            fontSize: 10.5, fontWeight: 800, color: GOLD_D,
            background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.3)',
            borderRadius: 8, padding: '3px 9px',
          }}>تا {faDigits(target)} فریم</span>
        )}
        {match.table_number != null && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 11, color: MUT }}>
            <Table2 size={11} /> میز {faDigits(match.table_number)}
          </span>
        )}
        {(match.high_break_p1 != null || match.high_break_p2 != null) && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 4, fontSize: 10.5,
            fontWeight: 800, color: '#6D28D9', background: 'rgba(139,92,246,0.10)',
            border: '1px solid rgba(139,92,246,0.28)', borderRadius: 8, padding: '3px 9px',
          }}>
            <Sparkles size={10} /> برک {faDigits(Math.max(match.high_break_p1 ?? 0, match.high_break_p2 ?? 0))}
          </span>
        )}
      </div>

      {/* ── دو خطِ بازیکن، هر کدام با عددِ خودش ── */}
      {bye || !ready ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <PlayerLine name={slotLabel(match, 1)} win={match.winner === 1} dim={!match.p1_name} />
          <PlayerLine name={slotLabel(match, 2)} win={match.winner === 2} dim={!match.p2_name} />
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
            <ScoreLine name={match.p1_name!} win={match.winner === 1} value={s1}
              onSet={v => setS1(Math.max(0, Math.min(frameCap(target, s2), v)))}
              cap={frameCap(target, s2)} locked={done}
              brk={brk[1]} onBrk={v => setBrk(x => ({ ...x, 1: v }))}
              onSaveBrk={() => void saveBreak(1)} brkBusy={busy === 'break'} />
            <ScoreLine name={match.p2_name!} win={match.winner === 2} value={s2}
              onSet={v => setS2(Math.max(0, Math.min(frameCap(target, s1), v)))}
              cap={frameCap(target, s1)} locked={done}
              brk={brk[2]} onBrk={v => setBrk(x => ({ ...x, 2: v }))}
              onSaveBrk={() => void saveBreak(2)} brkBusy={busy === 'break'} />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginTop: 11 }}>
            {/* تأیید ⇒ امتیاز روی مانیتور، بدونِ اعلامِ برنده */}
            <button onClick={pushLive} disabled={!!busy || !dirty || done}
              style={btnSmall(!!busy || !dirty || done, GOLD_D)}>
              {busy === 'live' ? <Loader2 size={12} style={{ animation: 'taspin 1s linear infinite' }} /> : <Save size={12} />}
              تأیید
            </button>

            <button onClick={finish} disabled={!!busy || !finishable}
              style={btnSmall(!!busy || !finishable, FELT)}
              title={finishable ? '' : target !== null
                ? `یکی باید به ${target} فریم برسد`
                : 'امتیازها نباید مساوی باشند'}>
              {busy === 'finish' ? <Loader2 size={12} style={{ animation: 'taspin 1s linear infinite' }} /> : <Flag size={12} />}
              {done ? 'اصلاح نتیجه' : 'پایان بازی'}
            </button>

            {!done && (
              <button onClick={toggleLive} disabled={!!busy}
                style={btnSmall(!!busy, match.status === 'in_progress' ? RED : MUT)}>
                <Radio size={12} /> {match.status === 'in_progress' ? 'در حال انجام بازی' : 'شروع بازی'}
              </button>
            )}
          </div>

        </>
      )}
    </div>
  );
}

/* یک بازیکن با امتیاز و بالاترین برکِ خودش، کنارِ نامش. */
function ScoreLine({ name, win, value, onSet, cap, locked, brk, onBrk, onSaveBrk, brkBusy }: {
  name: string; win: boolean; value: number;
  onSet: (v: number) => void; cap: number; locked: boolean;
  /* برک مالِ بازیکن است نه بازی: در یک بازی هر دو نفر ممکن است
     برکِ قابل‌ثبت بزنند. */
  brk: string; onBrk: (v: string) => void; onSaveBrk: () => void; brkBusy: boolean;
}) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '7px 10px', borderRadius: 10,
      background: win ? 'rgba(14,122,56,0.06)' : GROUND,
      border: `1px solid ${win ? 'rgba(14,122,56,0.22)' : 'transparent'}`,
    }}>
      <span style={{
        flex: 1, minWidth: 0, fontSize: 13.5, fontWeight: win ? 900 : 700,
        color: win ? FELT : INK,
        display: 'flex', alignItems: 'center', gap: 5,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {win && <Trophy size={12} style={{ flexShrink: 0 }} />}{name}
      </span>

      {/* بالاترین برکِ همین بازیکن */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
        <Sparkles size={12} color="#6D28D9" />
        <input aria-label={`بالاترین برک ${name}`} inputMode="numeric" value={brk}
          onChange={e => onBrk(e.target.value.replace(/[^0-9]/g, '').slice(0, 3))}
          placeholder="برک"
          style={{
            width: 46, padding: '4px 4px', borderRadius: 8, textAlign: 'center',
            border: `1px solid ${LINE}`, background: '#fff', fontFamily: 'inherit',
            fontSize: 12, fontWeight: 800, color: INK, outline: 'none',
          }} />
        <button type="button" onClick={onSaveBrk} disabled={brkBusy} aria-label="ثبت برک"
          style={{
            width: 26, height: 26, borderRadius: 8, display: 'inline-flex',
            alignItems: 'center', justifyContent: 'center', padding: 0,
            border: '1px solid rgba(139,92,246,0.35)', background: 'rgba(139,92,246,0.08)',
            color: '#6D28D9', cursor: brkBusy ? 'not-allowed' : 'pointer',
          }}><Save size={12} /></button>
      </span>

      {/* عدد بدونِ کادر، با −/+ دو طرفش */}
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
        <StepBtn onClick={() => onSet(value - 1)} disabled={locked || value <= 0} label="کم کردن">
          <Minus size={13} />
        </StepBtn>
        <span style={{
          minWidth: 26, textAlign: 'center', fontSize: 19, fontWeight: 900,
          color: win ? FELT : INK, fontVariantNumeric: 'tabular-nums',
        }}>{faDigits(value)}</span>
        <StepBtn onClick={() => onSet(value + 1)} disabled={locked || value >= cap} label="زیاد کردن">
          <Plus size={13} />
        </StepBtn>
      </span>
    </div>
  );
}

function StepBtn({ onClick, disabled, label, children }: {
  onClick: () => void; disabled: boolean; label: string; children: React.ReactNode;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label}
      style={{
        width: 27, height: 27, borderRadius: 8, display: 'inline-flex',
        alignItems: 'center', justifyContent: 'center',
        border: `1px solid ${disabled ? LINE : 'rgba(199,166,106,0.4)'}`,
        background: disabled ? '#fff' : 'rgba(199,166,106,0.10)',
        color: disabled ? '#CFC9BB' : GOLD_D,
        cursor: disabled ? 'not-allowed' : 'pointer', padding: 0,
      }}>{children}</button>
  );
}

function PlayerLine({ name, win, dim }: { name: string; win: boolean; dim: boolean }) {
  return (
    <span style={{
      fontSize: 13.5, fontWeight: win ? 900 : 700,
      /* «Bye» قرمز است، همان‌جور که در جدول. نشانِ جداگانه‌ی بالای
         کارت برداشته شد چون همین خط قبلاً آن را می‌گفت. */
      color: name === 'Bye' ? RED : dim ? MUT : win ? FELT : INK,
      display: 'flex', alignItems: 'center', gap: 5,
      overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
    }}>
      {win && <Trophy size={12} style={{ flexShrink: 0 }} />}{name}
    </span>
  );
}

/* ورودی عدد: نمایش فارسی، مقدار لاتین */
function ScoreBox({ value, onChange, label }: { value: string; onChange: (v: string) => void; label: string }) {
  const FA = '۰۱۲۳۴۵۶۷۸۹';
  const fa = (v: string) => v.replace(/[0-9]/g, d => FA[+d]!);
  const latin = (v: string) => v.replace(/[۰-۹]/g, ch => String(FA.indexOf(ch))).replace(/[^0-9]/g, '');
  return (
    <input aria-label={label} type="text" inputMode="numeric" value={fa(value)}
      onChange={e => onChange(latin(e.target.value).slice(0, 3))}
      style={{
        width: 52, textAlign: 'center', padding: '7px 4px', borderRadius: 9,
        border: `1px solid ${LINE}`, background: GROUND, fontFamily: 'inherit',
        fontSize: 14, fontWeight: 800, color: INK, outline: 'none',
      }} />
  );
}


function Stat({ label, value, unit, tone }: { label: string; value: number; unit: string; tone?: 'gold' | 'felt' | 'red' }) {
  const color = tone === 'gold' ? GOLD_D : tone === 'felt' ? FELT : tone === 'red' ? RED : INK;
  return (
    <div style={{ ...card, padding: '13px 15px' }}>
      <div style={{ fontSize: 11.5, color: MUT, marginBottom: 5 }}>{label}</div>
      <div style={{ fontSize: 19, fontWeight: 900, color, fontVariantNumeric: 'tabular-nums' }}>
        {faDigits(value)}<span style={{ fontSize: 10.5, fontWeight: 700, color: MUT, marginInlineStart: 4 }}>{unit}</span>
      </div>
    </div>
  );
}

/* ── استایل‌ها ── */
const card: React.CSSProperties = { background: '#fff', border: `1px solid ${LINE}`, borderRadius: 16, padding: 16 };
const h3: React.CSSProperties = { fontSize: 15, fontWeight: 900, color: INK, margin: '0 0 8px' };
const pStyle: React.CSSProperties = { fontSize: 12.5, color: MUT, margin: '0 0 6px', lineHeight: 2 };
const banner: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px',
  border: '1px solid', borderRadius: 12, fontSize: 12.5, fontWeight: 700, marginBottom: 14,
};
/* `flex: 0 0 auto` و `whiteSpace: nowrap`: داخلِ نوارِ کشیدنی هیچ
   تبی نباید کوچک شود یا برچسبش دو خط شود. قابِ خودِ تب هم برداشته
   شد چون نوار قاب دارد و دو قابِ تودرتو شلوغ می‌شود. */
const chip = (on: boolean): React.CSSProperties => ({
  flex: '0 0 auto',
  display: 'inline-flex', alignItems: 'center', gap: 5, padding: '8px 15px', borderRadius: 20,
  border: `1px solid ${on ? 'rgba(199,166,106,0.5)' : 'transparent'}`,
  background: on ? 'rgba(199,166,106,0.12)' : 'transparent',
  color: on ? GOLD_D : MUT, fontSize: 12.5, fontWeight: 800,
  cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
});
const btnGold = (dis: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  marginTop: 12, padding: '11px 20px', borderRadius: 11, border: 'none',
  background: dis ? '#DDD8CC' : GOLD, color: dis ? MUT : '#241B08',
  fontSize: 13.5, fontWeight: 800, cursor: dis ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
});
/* دکمه‌ی دوم کنارِ طلایی — همان اندازه ولی کم‌رنگ‌تر، چون انتخابِ
   جایگزین است نه عملِ اصلی */
const btnGhost = (dis: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7,
  marginTop: 12, padding: '11px 20px', borderRadius: 11,
  border: `1px solid ${dis ? LINE : 'rgba(199,166,106,0.45)'}`,
  background: dis ? '#F5F2EA' : '#FFFBF0', color: dis ? MUT : GOLD_D,
  fontSize: 13.5, fontWeight: 800, cursor: dis ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
});
const btnDanger = (dis: boolean): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10,
  border: '1px solid rgba(178,59,46,0.3)', background: 'rgba(178,59,46,0.06)', color: RED,
  fontSize: 12.5, fontWeight: 800, cursor: dis ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
});
const btnGhostLink: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 15px', borderRadius: 10,
  border: `1px solid ${LINE}`, background: '#fff', color: GOLD_D,
  fontSize: 12.5, fontWeight: 800, textDecoration: 'none',
};
const btnSmall = (dis: boolean, color: string): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 4, padding: '7px 11px', borderRadius: 9,
  border: `1px solid ${color}44`, background: `${color}0F`, color,
  fontSize: 11.5, fontWeight: 800, cursor: dis ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
});
