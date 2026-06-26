'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Trophy, Calendar, Clock, Users, ChevronRight, MapPin,
  CreditCard, CheckCircle, Share2, ChevronLeft, Star,
} from 'lucide-react';
import {
  SAMPLE_TOURNAMENTS, GAME_TYPE_LABELS, GAME_TYPE_COLORS,
  STATUS_LABELS, STATUS_COLORS, formatFee, toFa,
} from '../../../lib/mock-tournaments';

export default function TournamentPublicPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const t = SAMPLE_TOURNAMENTS.find(x => x.id === id) ?? SAMPLE_TOURNAMENTS[0]!;

  const [copied, setCopied] = useState(false);
  const pct  = Math.round((t.registeredCount / t.maxPlayers) * 100);
  const full = t.registeredCount >= t.maxPlayers;
  const gameColor   = GAME_TYPE_COLORS[t.gameType];
  const statusColor = STATUS_COLORS[t.status];

  const handleShare = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const canRegister = t.status === 'registration_open' && !full;

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 60 }}>

      {/* Hero */}
      <div style={{ position: 'relative', height: 'clamp(260px,40vw,420px)', overflow: 'hidden' }}>
        <img src={t.banner} alt={t.name}
          style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.55)' }} />
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 40%, rgba(0,0,0,0.80) 100%)',
        }} />

        {/* Back button */}
        <button onClick={() => router.push('/tournaments')} style={{
          position: 'absolute', top: 80, right: 'clamp(14px,3vw,28px)', zIndex: 10,
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20,
          padding: '8px 16px', fontSize: 13, fontWeight: 700, color: 'rgba(255,255,255,0.85)',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          <ChevronRight size={14} />
          مسابقات
        </button>

        {/* Status & share */}
        <div style={{ position: 'absolute', top: 80, left: 'clamp(14px,3vw,28px)',
          display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(0,0,0,0.40)', backdropFilter: 'blur(10px)',
            borderRadius: 20, padding: '7px 14px',
          }}>
            {t.status === 'live' && (
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444',
                animation: 'lp 1.8s infinite', display: 'inline-block' }} />
            )}
            <span style={{ fontSize: 13, fontWeight: 700, color: statusColor }}>
              {STATUS_LABELS[t.status]}
            </span>
          </div>
          <button onClick={handleShare} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(255,255,255,0.10)', backdropFilter: 'blur(12px)',
            border: '1px solid rgba(255,255,255,0.18)', borderRadius: 20,
            padding: '7px 14px', fontSize: 13, fontWeight: 700,
            color: copied ? '#30C55A' : 'rgba(255,255,255,0.85)',
            cursor: 'pointer', fontFamily: 'inherit', transition: 'color 0.2s',
          }}>
            {copied ? <CheckCircle size={13} /> : <Share2 size={13} />}
            {copied ? 'کپی شد' : 'اشتراک'}
          </button>
        </div>

        {/* Hero content */}
        <div style={{
          position: 'absolute', bottom: 0, left: 0, right: 0,
          padding: 'clamp(16px,4vw,32px)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <div style={{
              background: `${gameColor}22`, border: `1px solid ${gameColor}44`,
              borderRadius: 20, padding: '4px 12px', fontSize: 12, fontWeight: 700,
              color: gameColor,
            }}>
              {GAME_TYPE_LABELS[t.gameType]}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5,
              fontSize: 13, color: 'rgba(255,255,255,0.70)' }}>
              <MapPin size={12} />
              {t.clubName}
            </div>
          </div>
          <h1 style={{ fontSize: 'clamp(18px,3.5vw,32px)', fontWeight: 900,
            color: '#fff', margin: 0, letterSpacing: '-0.02em', lineHeight: 1.3 }}>
            {t.name}
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px clamp(16px,4vw,40px)' }}>
        <div className="tdgrid" style={{ display: 'grid', gridTemplateColumns: '1fr clamp(280px,35%,360px)', gap: 24,
          alignItems: 'start' }}>

          {/* ── Left: details ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Quick stats */}
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(140px,1fr))', gap: 12,
            }}>
              {[
                { icon: <Calendar size={16} color="#C7A66A" />, label: 'تاریخ', value: t.date },
                { icon: <Clock size={16} color="#C7A66A" />, label: 'ساعت شروع', value: `${toFa(t.startTime)}` },
                { icon: <Users size={16} color="#C7A66A" />, label: 'ظرفیت', value: `${toFa(t.registeredCount)} / ${toFa(t.maxPlayers)}` },
                { icon: <Trophy size={16} color="#C7A66A" />, label: 'نوع بازی', value: GAME_TYPE_LABELS[t.gameType] },
              ].map((item, i) => (
                <div key={i} style={{
                  background: '#fff', borderRadius: 16, padding: '16px 18px',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}>
                  <div style={{ marginBottom: 8 }}>{item.icon}</div>
                  <div style={{ fontSize: 11, color: '#aaa', marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Description */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px',
              border: '1px solid rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '0 0 12px' }}>
                درباره مسابقه
              </h2>
              <p style={{ fontSize: 14, color: '#555', margin: 0, lineHeight: 1.85 }}>
                {t.description}
              </p>
            </div>

            {/* Prize */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px',
              border: '1px solid rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '0 0 14px' }}>
                🏆 جوایز
              </h2>
              <p style={{ fontSize: 14, color: '#555', margin: 0, lineHeight: 2.2,
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
                    fontSize: 14, color: '#555', lineHeight: 1.6 }}>
                    <span style={{ color: '#C7A66A', fontWeight: 800, flexShrink: 0 }}>•</span>
                    <span>{rule.replace(/^•\s*/, '')}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Payment info */}
            {t.paymentMethod === 'card_transfer' && (
              <div style={{
                background: 'rgba(199,166,106,0.05)', borderRadius: 20, padding: '22px 24px',
                border: '1px solid rgba(199,166,106,0.18)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <CreditCard size={18} color="#C7A66A" />
                  <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: 0 }}>
                    روش پرداخت حق ثبت‌نام
                  </h2>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'شماره کارت', value: t.cardNumber ?? '' },
                    { label: 'صاحب حساب', value: t.cardHolder ?? '' },
                    { label: 'بانک', value: t.bankName ?? '' },
                  ].map(item => (
                    <div key={item.label} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '10px 14px', background: 'rgba(255,255,255,0.60)',
                      borderRadius: 10, border: '1px solid rgba(199,166,106,0.12)',
                    }}>
                      <span style={{ fontSize: 12, color: '#888' }}>{item.label}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#111',
                        fontVariantNumeric: 'tabular-nums', direction: 'ltr' }}>
                        {item.value}
                      </span>
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
                <div style={{ fontSize: 13, color: '#aaa', marginTop: 4 }}>حق ثبت‌نام</div>
              </div>

              {/* Capacity progress */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13,
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
                  <p style={{ fontSize: 12, color: '#ef4444', margin: '6px 0 0',
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
                  { label: 'فرمت', value: `حذفی — ${toFa(t.maxPlayers)} نفره` },
                ].map(row => (
                  <div key={row.label} style={{
                    display: 'flex', justifyContent: 'space-between',
                    fontSize: 13, color: '#555',
                    paddingBottom: 10, borderBottom: '1px solid rgba(0,0,0,0.05)',
                  }}>
                    <span style={{ color: '#aaa' }}>{row.label}</span>
                    <span style={{ fontWeight: 700, color: '#111' }}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* CTA */}
              {t.status === 'finished' ? (
                <Link href={`/tournaments/${t.id}/results`} style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                    background: 'rgba(199,166,106,0.10)', color: '#C7A66A',
                    fontSize: 15, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                    مشاهده نتایج 🏆
                  </button>
                </Link>
              ) : t.status === 'live' ? (
                <Link href={`/tournaments/${t.id}/live`} style={{ textDecoration: 'none' }}>
                  <button style={{
                    width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                    background: 'linear-gradient(135deg,#ef4444,#dc2626)',
                    color: '#fff', fontSize: 15, fontWeight: 800,
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
                    width: '100%', padding: '14px', borderRadius: 14, border: 'none',
                    background: canRegister
                      ? 'linear-gradient(135deg,#C7A66A,#A07840)'
                      : 'rgba(0,0,0,0.08)',
                    color: canRegister ? '#fff' : '#bbb',
                    fontSize: 15, fontWeight: 800,
                    cursor: canRegister ? 'pointer' : 'not-allowed',
                    fontFamily: 'inherit',
                    boxShadow: canRegister ? '0 4px 16px rgba(199,166,106,0.28)' : 'none',
                  }}>
                    {full ? 'ظرفیت تکمیل' : t.status === 'upcoming' ? 'ثبت‌نام هنوز باز نشده' : 'ثبت‌نام آنلاین'}
                  </button>
                </Link>
              )}

              {canRegister && (
                <p style={{ fontSize: 12, color: '#aaa', margin: '10px 0 0',
                  textAlign: 'center', lineHeight: 1.6 }}>
                  پس از ثبت‌نام و ارسال رسید، مدیر باشگاه تایید خواهد کرد
                </p>
              )}
            </div>

            {/* Admin link */}
            <div style={{ marginTop: 12 }}>
              <Link href={`/tournaments/${t.id}/admin`} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                fontSize: 13, color: '#999', textDecoration: 'none',
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
        @media (max-width: 767px) {
          .tdgrid { grid-template-columns: 1fr !important; }
          .treg { position: static !important; top: auto !important; order: -1; }
        }
      `}</style>
    </div>
  );
}
