'use client';

/* ─────────────────────────────────────────────────────────────
   ProfileAdmin — قالبِ مشترکِ صفحات مدیریتِ پروفایل‌ها در پنل
   سوپرادمین (بازیکنان/تولیدکنندگان/متخصصان فنی). گاردِ hydration-safe،
   لیستِ ریسپانسیو، تأیید/تعلیق، مشاهده و حذف.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';
import { ArrowLeft, Eye, Trash2, ShieldCheck, ShieldOff, Inbox } from 'lucide-react';

const GOLD_D = '#9A6E38';
const TEXT   = '#1C1B17';
const SEC    = '#5B564B';
const MUT    = '#8A8474';
const LINE   = '#E7E2D6';

export interface AdminRow {
  slug: string;
  title: string;
  subtitle: string;
  status: 'approved' | 'rejected';
  href: string;
}

export default function ProfileAdmin({
  title, en, desc, panelHint, load, toggle, remove,
}: {
  title: string;
  en: string;
  desc: string;
  panelHint: string;         // توضیحِ حالت خالی — پروفایل‌ها از کدام پنل ساخته می‌شوند
  load: () => AdminRow[];
  toggle: (slug: string) => void;
  remove: (slug: string) => void;
}) {
  const router = useRouter();
  const { user, _hydrated } = useAuthStore();
  const [rows, setRows] = useState<AdminRow[]>([]);
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState('');

  const refresh = () => setRows(load());

  useEffect(() => { refresh(); setReady(true); }, []);

  useEffect(() => {
    if (_hydrated && (!user || user.primaryRole !== 'admin')) router.push('/');
  }, [_hydrated, user, router]);

  if (!_hydrated || !ready) return null;
  if (!user || user.primaryRole !== 'admin') return null;

  const flash = (m: string) => { setToast(m); setTimeout(() => setToast(''), 2200); };

  return (
    <div dir="rtl" style={{ minHeight: '70vh', background: '#F7F5F0', fontFamily: 'Vazirmatn,Tahoma,sans-serif', color: TEXT, paddingBottom: 64 }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '24px clamp(16px,3vw,28px) 0' }}>

        {/* سربرگ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <div>
            <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: '0.24em', color: MUT }}>{en}</span>
            <h1 style={{ fontSize: 'clamp(18px,2.4vw,22px)', fontWeight: 900, margin: '4px 0 0' }}>{title}</h1>
            <p style={{ fontSize: 12.5, color: MUT, margin: '6px 0 0', lineHeight: 1.8 }}>{desc}</p>
          </div>
          <Link href="/admin" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, textDecoration: 'none', fontSize: 12.5, fontWeight: 700, background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', color: GOLD_D }}>
            <ArrowLeft size={13} /> پنل ادمین
          </Link>
        </div>

        {toast && (
          <div style={{ marginBottom: 12, background: 'rgba(14,122,56,0.08)', border: '1px solid rgba(14,122,56,0.25)', color: '#0E7A38', borderRadius: 12, padding: '10px 14px', fontSize: 12.5, fontWeight: 700 }}>
            {toast}
          </div>
        )}

        {/* لیست */}
        {rows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '56px 20px', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 18 }}>
            <Inbox size={34} style={{ color: MUT, opacity: 0.5, marginBottom: 10 }} />
            <p style={{ fontSize: 14.5, fontWeight: 800, margin: '0 0 6px' }}>هنوز پروفایلی ثبت نشده</p>
            <p style={{ fontSize: 12.5, color: MUT, margin: 0, lineHeight: 1.9 }}>{panelHint}</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {rows.map(r => (
              <div key={r.slug} style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap', background: '#fff', border: `1px solid ${LINE}`, borderRadius: 14, padding: '12px 16px' }}>
                <span style={{ width: 40, height: 40, borderRadius: '50%', flexShrink: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: '#fff', background: 'linear-gradient(135deg,#C7A66A,#8A6020)' }}>
                  {r.title.slice(0, 1)}
                </span>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontSize: 13.5, fontWeight: 900, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.title}</div>
                  <div style={{ fontSize: 11.5, color: MUT, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.subtitle}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 800, borderRadius: 999, padding: '4px 12px', flexShrink: 0,
                  color: r.status === 'approved' ? '#0E7A38' : '#B23B2E',
                  background: r.status === 'approved' ? 'rgba(14,122,56,0.08)' : 'rgba(178,59,46,0.08)',
                  border: `1px solid ${r.status === 'approved' ? 'rgba(14,122,56,0.25)' : 'rgba(178,59,46,0.25)'}` }}>
                  {r.status === 'approved' ? 'منتشر شده' : 'معلق'}
                </span>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => { toggle(r.slug); refresh(); flash(r.status === 'approved' ? 'پروفایل معلق شد' : 'پروفایل منتشر شد'); }}
                    title={r.status === 'approved' ? 'تعلیق' : 'انتشار'}
                    style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${LINE}`, background: '#FAFAF7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: r.status === 'approved' ? '#B23B2E' : '#0E7A38' }}>
                    {r.status === 'approved' ? <ShieldOff size={15} /> : <ShieldCheck size={15} />}
                  </button>
                  <Link href={r.href} title="مشاهده صفحه"
                    style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${LINE}`, background: '#FAFAF7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: SEC }}>
                    <Eye size={15} />
                  </Link>
                  <button onClick={() => { remove(r.slug); refresh(); flash('پروفایل حذف شد'); }}
                    title="حذف"
                    style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${LINE}`, background: '#FAFAF7', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B23B2E' }}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
