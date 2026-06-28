'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  ChevronRight, Star, ClipboardList,
} from 'lucide-react';
import {
  SAMPLE_TOURNAMENTS, formatFee, toFa,
} from '../../../lib/mock-tournaments';

export default function TournamentPublicPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const t = SAMPLE_TOURNAMENTS.find(x => x.id === id) ?? SAMPLE_TOURNAMENTS[0]!;

  const [matchFormat, setMatchFormat] = useState(t.matchFormat ?? 'bo3');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(`matchFormat_${id}`);
      if (stored) setMatchFormat(stored);
    } catch {}
  }, [id]);

  const FORMAT_LABELS: Record<string, string> = {
    bo3: 'Best of 3', bo5: 'Best of 5', bo7: 'Best of 7', bo9: 'Best of 9', bo11: 'Best of 11',
  };

  const pct  = Math.round((t.registeredCount / t.maxPlayers) * 100);
  const full = t.registeredCount >= t.maxPlayers;

  const canRegister = t.status === 'registration_open' && !full;

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

            {/* Rules */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px',
              border: '1px solid rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '0 0 14px' }}>
                قوانین مسابقه
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {t.rules.split('\n').map((rule, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                    fontSize: 15, color: '#555', lineHeight: 1.6 }}>
                    <span style={{ color: '#C7A66A', fontWeight: 800, flexShrink: 0 }}>•</span>
                    <span>{rule.replace(/^•\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>

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
                  { label: 'مهلت ثبت‌نام', value: t.registrationDeadline },
                  { label: 'تاریخ برگزاری', value: t.date },
                  { label: 'ساعت شروع', value: toFa(t.startTime) },
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
                  <span style={{ fontWeight: 500, color: '#111',
                    fontFamily: 'system-ui,-apple-system,sans-serif', direction: 'ltr', unicodeBidi: 'embed' }}>
                    {FORMAT_LABELS[matchFormat] ?? matchFormat}
                  </span>
                </div>
                <div style={{
                  display: 'flex', justifyContent: 'space-between',
                  fontSize: 14, paddingBottom: 10, borderBottom: '1px solid rgba(0,0,0,0.05)',
                }}>
                  <span style={{ color: '#aaa' }}>نوع مسابقه</span>
                  <span style={{ fontWeight: 700, color: '#111' }}>تک حذفی</span>
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

            {/* Admin link */}
            <div style={{ marginTop: 12 }}>
              <Link href={`/tournaments/${t.id}/admin`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 14, color: '#999', textDecoration: 'none',
                padding: '10px', borderRadius: 12,
                border: '1px solid rgba(0,0,0,0.07)',
                background: '#fff', transition: 'all 0.18s',
              }}>
                <Star size={13} />
                پنل مدیریت مسابقه
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
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
