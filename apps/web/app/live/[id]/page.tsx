'use client';

/* تماشای پخش زنده — تصویر مستقیم از دوربین(های) باشگاه (WebRTC).
   خودِ پخش‌کننده در components/live/LivePlayer است تا صفحه‌ی مسابقات
   هم بتواند از همان استفاده کند. */

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { ArrowRight, Users, Building2 } from 'lucide-react';
import LivePlayer from '../../../components/live/LivePlayer';
import { fetchLiveSession, type LiveSession } from '../../../lib/live/client';

const GOLD_DARK = '#A07840';
const fa = (n: number) => Number(n || 0).toLocaleString('fa-IR');

export default function LiveWatchPage() {
  const params = useParams();
  const router = useRouter();
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? '';
  const [session, setSession] = useState<LiveSession | null | undefined>(undefined);

  /* اطلاعات جلسه + تازه‌سازی دوره‌ای.
     ⚠️ این فقط متادیتاست (عنوان، بیننده، فهرستِ دوربین‌ها). خودِ تصویر
     از WebRTC می‌آید و به این نظرسنجی وابسته نیست. */
  useEffect(() => {
    if (!id) return;
    let alive = true;
    const load = async () => {
      const s = await fetchLiveSession(id);
      /* undefined یعنی «نتوانستیم بپرسیم» ⇒ آخرین وضعیتِ معلوم نگه
         داشته می‌شود. نوشتنش روی state یعنی یک قطعیِ دو ثانیه‌ای
         پرده‌ی «پایان یافت» را روی پخشِ سالم می‌انداخت. */
      if (alive && s !== undefined) setSession(s);
    };
    void load();
    const iv = window.setInterval(() => {
      if (document.visibilityState === 'visible') void load();
    }, 20_000);
    return () => { alive = false; window.clearInterval(iv); };
  }, [id]);

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn, sans-serif', color: '#111' }}>
      <div style={{ maxWidth: 1040, margin: '0 auto', padding: '16px 16px 60px' }}>
        <Link href="/live" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(0,0,0,0.45)', textDecoration: 'none', marginBottom: 14 }}>
          <ArrowRight size={14} /> همه‌ی پخش‌های زنده
        </Link>

        <LivePlayer
          sessionId={id}
          angles={session?.angles ?? []}
          title={session?.title}
          viewers={session?.viewers ?? 0}
          startedAt={session?.startedAt}
          /* `undefined` یعنی «هنوز نخوانده‌ایم»، `null` یعنی «تمام شده».
             این دو نباید یکی شوند، وگرنه در لحظه‌ی اولِ بارگذاری
             «پخش پایان یافته» نشان داده می‌شود. */
          ended={session === null}
          onBack={() => router.push('/live')}
        />

        {/* اطلاعات */}
        <div style={{ marginTop: 18, background: '#fff', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, padding: 18 }}>
          {session === undefined ? (
            <div style={{ height: 54 }} />
          ) : session ? (
            <>
              <h1 style={{ fontSize: 'clamp(17px,2.4vw,22px)', fontWeight: 900, margin: '0 0 10px', lineHeight: 1.6 }}>{session.title}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 13, color: 'rgba(0,0,0,0.45)', flexWrap: 'wrap' }}>
                <Link href={`/clubs/${session.clubId}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: GOLD_DARK, textDecoration: 'none', fontWeight: 700 }}>
                  <Building2 size={14} /> {session.clubName}
                </Link>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Users size={14} /> {fa(session.viewers)} بیننده</span>
              </div>
            </>
          ) : (
            <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: 0 }}>این پخش دیگر در دسترس نیست.</p>
          )}
        </div>
      </div>
    </div>
  );
}
