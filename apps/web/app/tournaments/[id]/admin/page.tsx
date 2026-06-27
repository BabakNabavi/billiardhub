'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import {
  Trophy, Users, Check, X, Clock, Search, ChevronRight,
  Plus, GitBranch, Image, Radio, Star, Trash2, UserPlus,
  BarChart2, CheckCircle, XCircle, AlertCircle, ChevronDown,
  Share2, Camera, Zap,
} from 'lucide-react';
import {
  SAMPLE_TOURNAMENTS, SAMPLE_REGISTRATIONS, SAMPLE_PLAYERS,
  STATUS_LABELS, formatFee, toFa,
  type Registration, type RegistrationStatus,
} from '../../../../lib/mock-tournaments';

type AdminTab = 'overview' | 'registrations' | 'participants' | 'story';

function StatusBadge({ status }: { status: RegistrationStatus }) {
  const map = {
    pending:  { label: 'در انتظار', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)',  icon: <Clock size={11} /> },
    approved: { label: 'تایید شده', color: '#30C55A', bg: 'rgba(48,197,90,0.10)',   icon: <CheckCircle size={11} /> },
    rejected: { label: 'رد شده',    color: '#ef4444', bg: 'rgba(239,68,68,0.10)',   icon: <XCircle size={11} /> },
  };
  const s = map[status];
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      background: s.bg, borderRadius: 20, padding: '5px 10px',
      fontSize: 11, fontWeight: 700, color: s.color,
      animation: status === 'pending' ? 'pendingPulse 1.5s ease-in-out infinite' : undefined,
    }}>
      {s.icon} {s.label}
    </div>
  );
}

function StoryCard({ type, label, desc }: { type: string; label: string; desc: string }) {
  const [gen, setGen]       = useState(false);
  const [published, setPub] = useState(false);
  return (
    <div style={{
      background: '#fff', borderRadius: 20, overflow: 'hidden',
      border: '1px solid rgba(0,0,0,0.07)',
      boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
    }}>
      {/* Story preview — Instagram aspect ratio 9:16 scaled down */}
      <div style={{
        background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)',
        height: 200, position: 'relative', overflow: 'hidden',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        {/* Billiard Hub watermark */}
        <div style={{ position: 'absolute', top: 12, right: 12, left: 12,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Trophy size={14} color="#C7A66A" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#C7A66A', letterSpacing: '0.08em' }}>
              BILLIARD HUB
            </span>
          </div>
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)' }}>@billiard.hub</span>
        </div>

        {type === 'registration' && (
          <>
            <div style={{ fontSize: 11, color: 'rgba(199,166,106,0.80)',
              letterSpacing: '0.16em', marginBottom: 8 }}>TOURNAMENT</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff',
              textAlign: 'center', lineHeight: 1.2, padding: '0 16px' }}>
              ثبت‌نام<br />باز شد!
            </div>
            <div style={{ marginTop: 12, background: 'rgba(199,166,106,0.20)',
              border: '1px solid rgba(199,166,106,0.40)', borderRadius: 20,
              padding: '6px 16px', fontSize: 12, fontWeight: 700, color: '#C7A66A' }}>
              ثبت‌نام آنلاین
            </div>
          </>
        )}
        {type === 'bracket' && (
          <>
            <div style={{ fontSize: 11, color: 'rgba(199,166,106,0.80)',
              letterSpacing: '0.16em', marginBottom: 8 }}>BRACKET</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textAlign: 'center' }}>
              جدول مسابقات
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              {[0,1,2].map(i => (
                <div key={i} style={{ width: 48, height: 32, borderRadius: 8,
                  border: '1px solid rgba(199,166,106,0.30)',
                  background: 'rgba(199,166,106,0.10)' }} />
              ))}
            </div>
          </>
        )}
        {type === 'semifinal' && (
          <>
            <div style={{ fontSize: 11, color: '#ef4444', letterSpacing: '0.16em', marginBottom: 8 }}>SEMI-FINAL</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff', textAlign: 'center' }}>
              نیمه‌نهایی
            </div>
            <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>علی رضایی</span>
              <div style={{ width: 30, height: 30, borderRadius: '50%',
                background: 'rgba(239,68,68,0.20)', border: '1px solid rgba(239,68,68,0.40)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#ef4444' }}>vs</div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>رضا کاظمی</span>
            </div>
          </>
        )}
        {type === 'champion' && (
          <>
            <div style={{ fontSize: 40, marginBottom: 8 }}>🏆</div>
            <div style={{ fontSize: 11, color: '#C7A66A', letterSpacing: '0.16em', marginBottom: 6 }}>CHAMPION</div>
            <div style={{ fontSize: 22, fontWeight: 900, color: '#fff' }}>علی رضایی</div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.60)', marginTop: 4 }}>قهرمان مسابقه</div>
          </>
        )}

        <div style={{ position: 'absolute', bottom: 12, right: 12, left: 12, textAlign: 'center',
          fontSize: 10, color: 'rgba(255,255,255,0.30)' }}>billiardhub.net</div>
      </div>

      <div style={{ padding: '16px 18px' }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: '#111', marginBottom: 4 }}>{label}</div>
        <div style={{ fontSize: 12, color: '#888', marginBottom: 14 }}>{desc}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button onClick={() => setGen(true)} style={{
            width: '100%', padding: '10px', borderRadius: 20,
            border: `1px solid rgba(199,166,106,${gen ? '0' : '0.30'})`,
            background: gen ? 'rgba(48,197,90,0.10)' : 'rgba(199,166,106,0.12)',
            color: gen ? '#30C55A' : '#C7A66A', fontSize: 13, fontWeight: 800,
            cursor: 'pointer', fontFamily: 'inherit',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
            {gen ? <><Check size={13} /> دانلود آماده</> : <><Camera size={13} /> تولید استوری</>}
          </button>
          {gen && (
            <button onClick={() => setPub(true)} style={{
              width: '100%', padding: '10px', borderRadius: 20,
              border: `1px solid rgba(${published ? '48,197,90' : '139,92,246'},0.30)`,
              background: `rgba(${published ? '48,197,90' : '139,92,246'},0.10)`,
              color: published ? '#30C55A' : '#8b5cf6', fontSize: 13, fontWeight: 800,
              cursor: published ? 'default' : 'pointer', fontFamily: 'inherit',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
            }}>
              {published
                ? <><Check size={13} /> منتشر شد در استوری‌های سایت</>
                : <><Share2 size={13} /> انتشار در استوری‌های سایت</>}
            </button>
          )}
          {published && (
            <div style={{ padding: '8px 12px', borderRadius: 12,
              background: 'rgba(48,197,90,0.06)', border: '1px solid rgba(48,197,90,0.18)',
              fontSize: 11, color: '#065f46', fontWeight: 600, textAlign: 'center', lineHeight: 1.5 }}>
              این استوری در بخش استوری‌های سایت <strong>billiardhub.net</strong> منتشر شد
              و بازدیدکنندگان می‌توانند آن را ببینند.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TournamentAdminPage() {
  const { id }  = useParams() as { id: string };
  const router  = useRouter();
  const t       = SAMPLE_TOURNAMENTS.find(x => x.id === id) ?? SAMPLE_TOURNAMENTS[0]!;
  const regs    = SAMPLE_REGISTRATIONS.filter(r => r.tournamentId === id || r.tournamentId === 't1');

  const [tab, setTab]          = useState<AdminTab>('overview');
  const [search, setSearch]    = useState('');
  const [statusFilter, setSF]  = useState<RegistrationStatus | 'all'>('all');
  const [regsState, setRegs]   = useState<Registration[]>(regs);
  const [addingPlayer, setAP]  = useState(false);
  const [manualName, setMN]    = useState('');
  const [manualPhone, setMP]   = useState('');

  const approved  = regsState.filter(r => r.status === 'approved');
  const pending   = regsState.filter(r => r.status === 'pending');
  const rejected  = regsState.filter(r => r.status === 'rejected');

  const updateStatus = (id: string, status: RegistrationStatus) => {
    setRegs(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  };
  const remove = (id: string) => {
    setRegs(prev => prev.filter(r => r.id !== id));
  };

  const filtered = regsState.filter(r => {
    const ms = statusFilter === 'all' || r.status === statusFilter;
    const mq = !search || r.playerName.includes(search) || r.phone.includes(search);
    return ms && mq;
  });

  const inputStyle: React.CSSProperties = {
    padding: '10px 14px', borderRadius: 12, border: '1.5px solid rgba(0,0,0,0.09)',
    background: '#fff', fontSize: 14, fontFamily: 'Vazirmatn, sans-serif',
    color: '#111', outline: 'none',
  };

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', direction: 'rtl',
      fontFamily: 'Vazirmatn, sans-serif', paddingBottom: 60 }}>
      <style>{`@keyframes pendingPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>

      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid rgba(0,0,0,0.06)',
        padding: '0 clamp(16px,4vw,48px)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0 0' }}>
            <button onClick={() => router.push(`/tournaments/${t.id}`)} style={{
              display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 13, color: '#888', fontFamily: 'inherit',
            }}>
              <ChevronRight size={15} /> {t.name}
            </button>
            <span style={{ color: 'rgba(0,0,0,0.15)' }}>›</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#111' }}>پنل مدیریت</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 0 0', flexWrap: 'wrap', gap: 12 }}>
            <div>
              <h1 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: 0 }}>{t.name}</h1>
              <p style={{ fontSize: 13, color: '#888', margin: '4px 0 0' }}>
                {t.date} • {STATUS_LABELS[t.status]}
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              <Link href={`/tournaments/${t.id}/bracket`} style={{ textDecoration: 'none' }}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '10px 18px', borderRadius: 12,
                  border: '1.5px solid rgba(199,166,106,0.30)',
                  background: 'rgba(199,166,106,0.07)', color: '#A07840',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <GitBranch size={14} /> براکت
                </button>
              </Link>
              <Link href={`/tournaments/${t.id}/live`} style={{ textDecoration: 'none' }}>
                <button style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: '10px 18px', borderRadius: 12, border: 'none',
                  background: 'linear-gradient(135deg,#C7A66A,#A07840)',
                  color: '#fff', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}>
                  <Radio size={14} /> نمای زنده
                </button>
              </Link>
            </div>
          </div>

          {/* Admin tabs */}
          <div style={{ display: 'flex', gap: 4, marginTop: 16, overflowX: 'auto' }}>
            {([
              ['overview', 'نمای کلی', <BarChart2 size={14} />],
              ['registrations', `ثبت‌نام‌ها (${pending.length} در انتظار)`, <Users size={14} />],
              ['participants', `شرکت‌کنندگان (${approved.length})`, <CheckCircle size={14} />],
              ['story', 'استوری‌ساز', <Share2 size={14} />],
            ] as [AdminTab, string, React.ReactNode][]).map(([key, label, icon]) => (
              <button key={key} onClick={() => setTab(key)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '10px 16px', borderRadius: '10px 10px 0 0',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap',
                background: tab === key ? '#F7F7F5' : 'transparent',
                color: tab === key ? '#111' : '#888',
                borderBottom: tab === key ? '2px solid #C7A66A' : '2px solid transparent',
              }}>
                {icon} {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '28px clamp(16px,4vw,48px)' }}>

        {/* ── Overview ── */}
        {tab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Stat cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 14 }}>
              {[
                { label: 'در انتظار تایید', value: pending.length,   color: '#f59e0b', icon: <Clock size={20} />      },
                { label: 'تایید شده',        value: approved.length,  color: '#30C55A', icon: <CheckCircle size={20} /> },
                { label: 'رد شده',           value: rejected.length,  color: '#ef4444', icon: <XCircle size={20} />    },
                { label: 'ظرفیت باقی‌مانده', value: t.maxPlayers - approved.length, color: '#3b82f6', icon: <Users size={20} /> },
              ].map(s => (
                <div key={s.label} style={{
                  background: '#fff', borderRadius: 20, padding: '20px 22px',
                  border: '1px solid rgba(0,0,0,0.06)',
                }}>
                  <div style={{ color: s.color, marginBottom: 12 }}>{s.icon}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#111' }}>{toFa(s.value)}</div>
                  <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>{s.label}</div>
                </div>
              ))}
            </div>

            {/* Quick actions */}
            <div style={{ background: '#fff', borderRadius: 20, padding: '22px 24px',
              border: '1px solid rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: 16, fontWeight: 800, color: '#111', margin: '0 0 16px' }}>
                دسترسی سریع
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 12 }}>
                {[
                  { label: 'مدیریت ثبت‌نام‌ها',    icon: <Users size={18} />,   tab: 'registrations' as AdminTab, color: '#f59e0b' },
                  { label: 'ایجاد براکت',            icon: <GitBranch size={18} />, href: `/tournaments/${t.id}/bracket`, color: '#C7A66A' },
                  { label: 'نمای زنده',              icon: <Radio size={18} />,    href: `/tournaments/${t.id}/live`,    color: '#ef4444' },
                  { label: 'استوری‌ساز',             icon: <Camera size={18} />,   tab: 'story' as AdminTab,         color: '#8b5cf6' },
                ].map(a => (
                  <button key={a.label} onClick={() => a.tab ? setTab(a.tab) : a.href && router.push(a.href)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '16px 18px',
                    background: 'rgba(0,0,0,0.02)', borderRadius: 14,
                    border: '1.5px solid rgba(0,0,0,0.07)', cursor: 'pointer',
                    fontFamily: 'inherit', textAlign: 'right', transition: 'all 0.18s',
                  }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12,
                      background: `${a.color}15`, border: `1px solid ${a.color}30`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      color: a.color, flexShrink: 0 }}>
                      {a.icon}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#111' }}>{a.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── Registrations ── */}
        {tab === 'registrations' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Filters */}
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
                <Search size={14} style={{ position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)', color: '#bbb', pointerEvents: 'none' }} />
                <input value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="جستجوی نام یا تلفن..."
                  style={{ ...inputStyle, paddingRight: 38, width: '100%', boxSizing: 'border-box' }} />
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {(['all','pending','approved','rejected'] as const).map(s => (
                  <button key={s} onClick={() => setSF(s)} style={{
                    padding: '8px 14px', borderRadius: 10, border: 'none',
                    cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
                    background: statusFilter === s ? '#111' : 'rgba(0,0,0,0.05)',
                    color: statusFilter === s ? '#fff' : '#666',
                  }}>
                    {s === 'all' ? 'همه' : s === 'pending' ? 'در انتظار' : s === 'approved' ? 'تایید' : 'رد'}
                    {' '}{toFa(regsState.filter(r => s === 'all' || r.status === s).length)}
                  </button>
                ))}
              </div>
            </div>

            {/* Table */}
            <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.06)' }}>
              {filtered.map((r, i) => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
                  borderBottom: i < filtered.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                }}>
                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, color: '#111', fontSize: 14, marginBottom: 3 }}>{r.playerName}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: '#888', direction: 'ltr' }}>{r.phone}</span>
                      <span style={{ fontSize: 11, color: '#bbb' }}>{r.registeredAt}</span>
                    </div>
                    {r.playerInfo && (
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{r.playerInfo}</div>
                    )}
                    {r.receiptNote && (
                      <div style={{ fontSize: 12, color: '#aaa', marginTop: 4 }}>{r.receiptNote}</div>
                    )}
                  </div>

                  {/* Status + Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0, alignItems: 'flex-end' }}>
                    <StatusBadge status={r.status} />
                    <div style={{ display: 'flex', gap: 5 }}>
                      {r.status !== 'approved' && (
                        <button onClick={() => updateStatus(r.id, 'approved')} title="تایید" style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '5px 10px', borderRadius: 8, border: 'none',
                          background: 'rgba(48,197,90,0.10)', color: '#30C55A',
                          cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                        }}>
                          <Check size={12} /> تایید
                        </button>
                      )}
                      {r.status !== 'rejected' && (
                        <button onClick={() => updateStatus(r.id, 'rejected')} title="رد" style={{
                          display: 'flex', alignItems: 'center', gap: 4,
                          padding: '5px 10px', borderRadius: 8, border: 'none',
                          background: 'rgba(239,68,68,0.10)', color: '#ef4444',
                          cursor: 'pointer', fontSize: 11, fontWeight: 700, fontFamily: 'inherit',
                        }}>
                          <X size={12} /> رد
                        </button>
                      )}
                      <button onClick={() => remove(r.id)} title="حذف" style={{
                        width: 28, height: 28, borderRadius: 8, border: 'none',
                        background: 'rgba(0,0,0,0.05)', color: '#bbb',
                        cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                      }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {filtered.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#bbb' }}>
                  <Users size={32} style={{ opacity: 0.3, marginBottom: 10 }} />
                  <p style={{ margin: 0, fontSize: 14 }}>ثبت‌نامی یافت نشد</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Participants ── */}
        {tab === 'participants' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#111', margin: 0 }}>
                شرکت‌کنندگان تایید شده
                <span style={{ fontSize: 14, color: '#C7A66A', marginRight: 8 }}>
                  {toFa(approved.length)} / {toFa(t.maxPlayers)}
                </span>
              </h2>
              <button onClick={() => setAP(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
                borderRadius: 12, border: 'none',
                background: 'linear-gradient(135deg,#C7A66A,#A07840)',
                color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <UserPlus size={14} /> افزودن دستی
              </button>
            </div>

            {addingPlayer && (
              <div style={{ background: '#fff', borderRadius: 20, padding: '20px 24px',
                border: '1px solid rgba(199,166,106,0.25)',
                boxShadow: '0 4px 20px rgba(199,166,106,0.12)' }}>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#111', margin: '0 0 16px' }}>
                  افزودن بازیکن دستی
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 12, alignItems: 'end' }}>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#666',
                      display: 'block', marginBottom: 6 }}>نام و نام خانوادگی</label>
                    <input value={manualName} onChange={e => setMN(e.target.value)}
                      placeholder="نام کامل" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 700, color: '#666',
                      display: 'block', marginBottom: 6 }}>شماره موبایل</label>
                    <input value={manualPhone} onChange={e => setMP(e.target.value)}
                      placeholder="09xx" dir="ltr" style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <button onClick={() => {
                    if (manualName && manualPhone) {
                      const newReg: Registration = {
                        id: `r_${Date.now()}`, tournamentId: t.id,
                        playerName: manualName, phone: manualPhone,
                        playerInfo: 'افزوده شده توسط مدیر',
                        receiptNote: 'پرداخت نقدی', status: 'approved',
                        registeredAt: '۱۴۰۵/۰۴/۱۰',
                      };
                      setRegs(prev => [...prev, newReg]);
                      setMN(''); setMP(''); setAP(false);
                    }
                  }} style={{
                    padding: '11px 20px', borderRadius: 12, border: 'none',
                    background: '#111', color: '#fff', fontSize: 13, fontWeight: 700,
                    cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap',
                  }}>
                    <Plus size={14} style={{ verticalAlign: 'middle' }} /> افزودن
                  </button>
                </div>
              </div>
            )}

            <div style={{ background: '#fff', borderRadius: 20, overflow: 'hidden',
              border: '1px solid rgba(0,0,0,0.06)' }}>
              {approved.map((r, i) => (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px',
                  borderBottom: i < approved.length - 1 ? '1px solid rgba(0,0,0,0.05)' : 'none',
                }}>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#C7A66A',
                    width: 28, textAlign: 'center' }}>
                    {toFa(i + 1)}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, color: '#111', fontSize: 14 }}>{r.playerName}</div>
                    <div style={{ fontSize: 12, color: '#aaa', direction: 'ltr', display: 'inline-block' }}>
                      {r.phone}
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: '#bbb' }}>{r.registeredAt}</div>
                  <button onClick={() => updateStatus(r.id, 'rejected')} style={{
                    width: 32, height: 32, borderRadius: 9, border: 'none',
                    background: 'rgba(239,68,68,0.08)', color: '#ef4444',
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Story Generator ── */}
        {tab === 'story' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111', margin: '0 0 6px' }}>
                استوری‌ساز اینستاگرام
              </h2>
              <p style={{ fontSize: 14, color: '#777', margin: 0 }}>
                استوری‌های حرفه‌ای با برندینگ بیلیارد هاب برای مسابقات شما
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(220px,1fr))', gap: 16 }}>
              <StoryCard type="registration" label="اعلام ثبت‌نام"
                desc="جذب شرکت‌کنندگان جدید" />
              <StoryCard type="bracket" label="جدول مسابقات"
                desc="اعلام براکت به شرکت‌کنندگان" />
              <StoryCard type="semifinal" label="نیمه‌نهایی"
                desc="اعلام بازی‌های نیمه‌نهایی" />
              <StoryCard type="champion" label="اعلام قهرمان"
                desc="معرفی برنده مسابقه" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
