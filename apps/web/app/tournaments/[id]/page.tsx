'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronRight, Star, ClipboardList,
} from 'lucide-react';
import {
  formatFee, toFa, GAME_TYPE_LABELS, type Tournament,
} from '../../../lib/mock-tournaments';
import { fetchTournament } from '../../../lib/tournaments/client';
import { fetchBracket, type Bracket } from '../../../lib/tournaments/bracket-client';
import { formatLabel, formatIsLatin } from '../../../lib/tournaments/formats';

export default function TournamentPublicPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();

  /* مسابقه‌ی واقعی از سرور. پیش‌تر اگر شناسه پیدا نمی‌شد، **اولین
     مسابقه‌ی آرایه‌ی ساختگی** نشان داده می‌شد — یعنی کاربر روی یک
     نشانی نامعتبر هم صفحه‌ی پر می‌دید. حالا تا آمدن داده صبر
     می‌کنیم و اگر نبود «پیدا نشد» می‌گوییم. */
  const [t, setT] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  /* سکوی نفراتِ برتر — فقط وقتی مسابقه تمام شده. براکت جدا خوانده
     می‌شود چون ردیفِ مسابقه اسمِ قهرمان را ندارد؛ نتیجه در
     tournament_matches است. */
  const [podium, setPodium] = useState<Bracket | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchTournament(id)
      .then(row => { if (alive) { setT(row); setLoading(false); } })
      .catch(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [id]);

  useEffect(() => {
    if (t?.status !== 'finished') return;
    let alive = true;
    void fetchBracket(id).then(b => { if (alive) setPodium(b); });
    return () => { alive = false; };
  }, [id, t?.status]);

  /* ── فرمت از سرور، نه از localStorage ──
     پیش‌تر این مقدار از `localStorage.matchFormat_${id}` خوانده
     می‌شد — کلیدی که فقط صفحه‌ی مرده‌ی `/tournaments/new` روی
     مرورگرِ سازنده می‌نوشت (آن هم با شناسه‌ی ثابتِ `t1`). یعنی هر
     بازدیدکننده‌ای «Best of 3» می‌دید، صرفِ‌نظر از اینکه باشگاه چه
     انتخاب کرده بود. */
  const matchFormat = t?.matchFormat ?? '';

  if (loading) return (
    <div dir="rtl" style={{ minHeight: '60vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn, sans-serif', color: '#8A8474', fontSize: 14 }}>
      در حال بارگذاری…
    </div>
  );

  if (!t) return (
    <div dir="rtl" style={{ minHeight: '60vh', background: '#F7F7F5', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, fontFamily: 'Vazirmatn, sans-serif', padding: 20, textAlign: 'center' }}>
      <h1 style={{ fontSize: 19, fontWeight: 900, color: '#1C1B17', margin: 0 }}>این مسابقه پیدا نشد</h1>
      <p style={{ fontSize: 13.5, color: '#8A8474', margin: 0, lineHeight: 2 }}>
        ممکن است برگزار شده باشد یا برگزارکننده آن را برداشته باشد.
      </p>
      <Link href="/tournaments" style={{ padding: '11px 22px', borderRadius: 12, textDecoration: 'none', fontSize: 13.5, fontWeight: 800, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: '#9A6E38' }}>
        همه‌ی مسابقات
      </Link>
    </div>
  );

  const pct  = Math.round((t.registeredCount / t.maxPlayers) * 100);
  const full = t.registeredCount >= t.maxPlayers;

  const canRegister = t.status === 'registration_open' && !full;

  /* خطوطِ خالی و بولتِ دستیِ کاربر برداشته می‌شوند — خودمان بولت
     می‌گذاریم و دو بولت پشتِ هم زشت است. */
  const rules = t.rules
    .split('\n')
    .map(r => r.replace(/^\s*[•\-*]\s*/, '').trim())
    .filter(Boolean);

  /* مهلتِ ثبت‌نام با ساعتش. باشگاه‌دار ساعت را در فرم انتخاب می‌کند
     ولی تا امروز فقط روزش نمایش داده می‌شد — یعنی کسی که ثبت‌نام را
     ظهر می‌بست، بازیکنانش تا شب فکر می‌کردند فرصت دارند. */
  const deadlineText = t.registrationDeadline
    ? t.registrationDeadlineTime
      ? `${t.registrationDeadline} — ساعت ${toFa(t.registrationDeadlineTime)}`
      : t.registrationDeadline
    : '—';

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 60 }}>

      {/* Header */}
      <div style={{
        background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '18px clamp(16px,4vw,48px)',
      }}>
        <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={() => router.push('/tournaments')} style={{
            display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none',
            cursor: 'pointer', fontSize: 15, color: '#777', fontFamily: 'inherit', padding: 0,
          }}>
            <ChevronRight size={16} /> مسابقات
          </button>
          <span style={{ color: 'rgba(0,0,0,0.15)' }}>›</span>
          <span style={{ fontSize: 15, fontWeight: 700, color: '#111',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {t.name}
          </span>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px clamp(16px,4vw,40px)' }}>
        <div className="tdgrid" style={{ display: 'grid', gridTemplateColumns: '1fr clamp(280px,35%,360px)', gap: 24,
          alignItems: 'start' }}>

          {/* ── Left: details ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Description */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px',
              border: '1px solid rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '0 0 12px' }}>
                درباره مسابقه
              </h2>
              <p style={{ fontSize: 15, color: '#555', margin: 0, lineHeight: 1.85 }}>
                {t.description}
              </p>
            </div>

            {/* Prize */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px',
              border: '1px solid rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '0 0 14px' }}>
                🏆 جوایز
              </h2>
              <p style={{ fontSize: 15, color: '#555', margin: 0, lineHeight: 2.2,
                whiteSpace: 'pre-line' }}>
                {t.prizeInfo}
              </p>
            </div>

            {/* Rules — فقط وقتی چیزی هست.
                پیش‌تر این کارت همیشه رندر می‌شد و چون `t.rules` در
                نگاشت همیشه رشته‌ی خالی بود، هر مسابقه یک کادرِ
                «قوانین مسابقه»ی خالی با یک بولتِ تنها داشت. */}
            {rules.length > 0 && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px',
                border: '1px solid rgba(0,0,0,0.06)' }}>
                <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '0 0 14px' }}>
                  قوانین مسابقه
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {rules.map((rule, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                      fontSize: 15, color: '#555', lineHeight: 1.6 }}>
                      <span style={{ color: '#C7A66A', fontWeight: 800, flexShrink: 0 }}>•</span>
                      <span>{rule}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* ── Right: registration card ── */}
          <div className="treg" style={{ position: 'sticky', top: 96 }}>
            <div style={{
              background: '#fff', borderRadius: 24, padding: '26px 24px',
              border: '1px solid rgba(0,0,0,0.07)',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
            }}>
              {/* Fee */}
              <div style={{ textAlign: 'center', marginBottom: 20 }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#C7A66A' }}>
                  {formatFee(t.entryFee)}
                </div>
                <div style={{ fontSize: 14, color: '#aaa', marginTop: 4 }}>مبلغ ورودی</div>
              </div>

              {/* Capacity progress */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14,
                  marginBottom: 8 }}>
                  <span style={{ color: '#777' }}>تعداد ثبت‌نام‌شده</span>
                  <span style={{ fontWeight: 800, color: full ? '#ef4444' : '#111' }}>
                    {toFa(t.registeredCount)} / {toFa(t.maxPlayers)} نفر
                  </span>
                </div>
                <div style={{ height: 8, background: 'rgba(0,0,0,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 99, width: `${pct}%`,
                    background: full ? '#ef4444' : pct > 75 ? '#f59e0b' : '#30C55A',
                    transition: 'width 0.6s',
                  }} />
                </div>
                {full && (
                  <p style={{ fontSize: 13, color: '#ef4444', margin: '6px 0 0',
                    textAlign: 'center', fontWeight: 700 }}>
                    ظرفیت تکمیل شد
                  </p>
                )}
              </div>

              {/* Info rows */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {[
                  { label: 'مهلت ثبت‌نام', value: deadlineText },
                  { label: 'تاریخ برگزاری', value: t.date },
                  { label: 'ساعت شروع', value: toFa(t.startTime) },
                  { label: 'نوع بازی', value: GAME_TYPE_LABELS[t.gameType] },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 14, paddingBottom: 10, borderBottom: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <span style={{ color: '#aaa' }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: '#111' }}>{row.value}</span>
                  </div>
                ))}
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 14, paddingBottom: 10, borderBottom: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <span style={{ color: '#aaa' }}>فرمت مسابقه</span>
                  {/* برچسبِ «۹۰ دقیقه» فارسی است و نباید در فونتِ
                      لاتین و جهتِ چپ‌به‌راست بنشیند؛ «Race to 7»
                      برعکس. پس هر کدام سبکِ خودش را می‌گیرد. */}
                  <span
                    className={formatIsLatin(matchFormat) ? 'lat' : undefined}
                    style={{
                      fontWeight: formatIsLatin(matchFormat) ? 500 : 700, color: '#111',
                      direction: formatIsLatin(matchFormat) ? 'ltr' : 'rtl',
                      unicodeBidi: 'isolate',
                    }}>
                    {matchFormat ? formatLabel(matchFormat) : '—'}
                  </span>
                </div>
              </div>

              {/* CTA */}
              {t.status === 'finished' ? (
                <Link href={`/tournaments/${t.id}/results`} style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                    background: 'rgba(199,166,106,0.10)', color: '#C7A66A',
                    fontSize: 16, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    مشاهده نتایج 🏆
                  </button>
                </Link>
              ) : t.status === 'live' ? (
                <Link href={`/tournaments/${t.id}/live`} style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                    color: '#fff', fontSize: 16, fontWeight: 800,
                    cursor: 'pointer', fontFamily: 'inherit',
                    boxShadow: '0 4px 16px rgba(239,68,68,0.28)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff',
                      animation: 'lp 1.8s infinite', display: 'inline-block' }} />
                    مشاهده زنده
                  </button>
                </Link>
              ) : (
                <Link href={canRegister ? `/tournaments/${t.id}/register` : '#'}
                  style={{ textDecoration: 'none' }}>
                  <button disabled={!canRegister} style={{
                    width: '100%', padding: '14px', borderRadius: 20,
                    background: canRegister ? 'rgba(199,166,106,0.10)' : 'rgba(0,0,0,0.05)',
                    border: `1px solid ${canRegister ? 'rgba(199,166,106,0.40)' : 'rgba(0,0,0,0.10)'}`,
                    color: canRegister ? '#C7A66A' : '#bbb',
                    fontSize: 16, fontWeight: 800,
                    cursor: canRegister ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                  }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      {!full && t.status === 'registration_open' && <ClipboardList size={16} />}
                      {full ? 'ظرفیت تکمیل' : t.status === 'upcoming' ? 'ثبت نام هنوز باز نشده' : 'ثبت نام'}
                    </span>
                  </button>
                </Link>
              )}

            </div>

            {/* لینکِ «پنل مدیریت مسابقه» برداشته شد: این صفحه عمومی
                است و همه — از جمله بازیکن — آن را می‌دیدند. جای
                درستش پنلِ باشگاه است، کنارِ خودِ مسابقه. */}
          </div>
        </div>
      </div>

      {/* ── سکوی نفراتِ برتر ──
          تا امروز مسابقه‌ی تمام‌شده هیچ نشانی از نتیجه‌اش روی صفحه‌ی
          خودش نداشت؛ برای دیدنِ قهرمان باید به براکت می‌رفتی. حالا
          همین‌جا، آخرِ صفحه.

          نفرِ سوم دو نفر است: در حذفیِ یک‌طرفه بدونِ بازیِ رده‌بندی
          هیچ‌کدام از دو بازنده‌ی نیمه‌نهایی بالاتر از دیگری نیست، و
          حدس‌زدنش یعنی نوشتنِ چیزی که برگزار نشده. */}
      {t.status === 'finished' && podium?.champion && (
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 clamp(16px,4vw,40px) 8px' }}>
          <div style={{
            position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(150deg,#17150F 0%,#241F14 55%,#12100B 100%)',
            border: '1px solid rgba(199,166,106,0.34)', borderRadius: 22,
            padding: 'clamp(22px,4vw,34px) clamp(18px,4vw,32px)',
          }}>
            <div aria-hidden style={{
              position: 'absolute', inset: '-40% 55% auto -30%', height: '180%',
              background: 'radial-gradient(circle,rgba(199,166,106,0.16),transparent 62%)',
              pointerEvents: 'none',
            }} />

            <div style={{ position: 'relative', textAlign: 'center', marginBottom: 22 }}>
              <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.26em', color: '#C7A66A' }}>
                FINAL STANDINGS
              </div>
              <h2 style={{ margin: '8px 0 0', fontSize: 19, fontWeight: 900, color: '#fff' }}>
                نفرات برتر
              </h2>
            </div>

            <div style={{ position: 'relative', display: 'grid', gap: 12,
              gridTemplateColumns: 'repeat(auto-fit,minmax(190px,1fr))' }}>

              {/* قهرمان */}
              <div style={{
                gridColumn: '1 / -1',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                background: 'linear-gradient(135deg,rgba(232,206,150,0.20),rgba(199,166,106,0.09))',
                border: '1px solid rgba(199,166,106,0.5)', borderRadius: 16,
                padding: '18px 20px', flexWrap: 'wrap',
              }}>
                <span style={{ fontSize: 26, lineHeight: 1 }}>🏆</span>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.14em', color: '#C7A66A' }}>قهرمان</div>
                  <div style={{ fontSize: 'clamp(19px,3vw,25px)', fontWeight: 900, color: '#fff', marginTop: 4 }}>
                    {podium.champion.name}
                  </div>
                </div>
              </div>

              {podium.runnerUp && (
                <div style={{
                  background: 'rgba(255,255,255,0.045)', border: '1px solid rgba(255,255,255,0.10)',
                  borderRadius: 14, padding: '14px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', color: '#C9C3B4' }}>
                    🥈 نایب‌قهرمان
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: '#fff', marginTop: 6 }}>
                    {podium.runnerUp.name}
                  </div>
                </div>
              )}

              {(podium.thirds ?? []).map((name, i) => (
                <div key={i} style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 14, padding: '14px 16px', textAlign: 'center',
                }}>
                  <div style={{ fontSize: 10.5, fontWeight: 800, letterSpacing: '0.12em', color: '#B99A6E' }}>
                    🥉 سوم مشترک
                  </div>
                  <div style={{ fontSize: 15.5, fontWeight: 800, color: '#fff', marginTop: 6 }}>{name}</div>
                </div>
              ))}
            </div>

            <div style={{ position: 'relative', textAlign: 'center', marginTop: 18 }}>
              <Link href={`/tournaments/${t.id}/bracket`} style={{
                display: 'inline-flex', alignItems: 'center', gap: 7,
                fontSize: 12.5, fontWeight: 800, textDecoration: 'none',
                color: '#E8CE96', background: 'rgba(199,166,106,0.12)',
                border: '1px solid rgba(199,166,106,0.34)', borderRadius: 10,
                padding: '9px 18px',
              }}>
                <Star size={13} /> دیدن جدول کامل
              </Link>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .lat { font-family: system-ui,-apple-system,Arial,sans-serif !important; }
        @keyframes lp {
          0%,100% { opacity:1; transform:scale(1); }
          50% { opacity:0.4; transform:scale(1.5); }
        }
        @keyframes blinkReg {
          0%,100% { opacity:1; }
          50% { opacity:0.45; }
        }
        @media (max-width: 767px) {
          .tdgrid { grid-template-columns: 1fr !important; }
          .treg { position: static !important; top: auto !important; }
        }
      `}</style>
    </div>
  );
}
