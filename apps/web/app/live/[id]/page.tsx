'use client';

/* تماشای پخش زنده — تصویر مستقیم از گوشی باشگاه‌دار (WebRTC). */

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Users, Building2, Loader2, Radio, VideoOff, Volume2, VolumeX, Maximize2 } from 'lucide-react';
import { joinBroadcast, type Viewer } from '../../../lib/live/webrtc';
import { fetchLiveSession, type LiveSession } from '../../../lib/live/client';

const GOLD_DARK = '#A07840', RED = '#ef4444';
const fa = (n: number) => Number(n || 0).toLocaleString('fa-IR');

export default function LiveWatchPage() {
  const params = useParams();
  const id = (Array.isArray(params?.id) ? params.id[0] : params?.id) ?? '';
  const [session, setSession] = useState<LiveSession | null | undefined>(undefined);
  const [state, setState] = useState<'connecting' | 'live' | 'ended' | 'error'>('connecting');
  const [muted, setMuted] = useState(true);
  const [elapsed, setElapsed] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const viewerRef = useRef<Viewer | null>(null);

  /* اطلاعات جلسه + تازه‌سازی دوره‌ای */
  useEffect(() => {
    if (!id) return;
    let alive = true;
    const load = () => fetchLiveSession(id).then(s => { if (alive) setSession(s); });
    load();
    const iv = setInterval(load, 20_000);
    return () => { alive = false; clearInterval(iv); };
  }, [id]);

  /* اتصال به پخش */
  useEffect(() => {
    if (!id) return;
    const v = joinBroadcast(id, s => { if (videoRef.current) videoRef.current.srcObject = s; }, setState);
    viewerRef.current = v;
    if (!v) setState('error');
    return () => { viewerRef.current?.leave(); viewerRef.current = null; };
  }, [id]);

  useEffect(() => {
    if (!session) return;
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - session.startedAt) / 1000)), 1000);
    return () => clearInterval(t);
  }, [session]);

  const toggleSound = () => {
    const v = videoRef.current; if (!v) return;
    v.muted = !v.muted; setMuted(v.muted);
    if (!v.muted) v.play().catch(() => {});
  };
  const goFull = () => { videoRef.current?.requestFullscreen?.().catch(() => {}); };

  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0'), ss = String(elapsed % 60).padStart(2, '0');
  const ended = state === 'ended' || session === null;

  return (
    <div dir="rtl" style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn, sans-serif', color: '#111' }}>
      <style>{`@keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:.35 } } @keyframes lwspin { to { transform: rotate(360deg) } }`}</style>

      <div style={{ maxWidth: 900, margin: '0 auto', padding: '16px 16px 60px' }}>
        <Link href="/live" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'rgba(0,0,0,0.45)', textDecoration: 'none', marginBottom: 14 }}>
          <ArrowRight size={14} /> همه‌ی پخش‌های زنده
        </Link>

        {/* پخش‌کننده */}
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#000', aspectRatio: '16/9', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}>
          <video ref={videoRef} autoPlay playsInline muted={muted}
            style={{ width: '100%', height: '100%', objectFit: 'contain', display: ended ? 'none' : 'block' }} />

          {(state === 'connecting' && !ended) && (
            <div style={overlay}>
              <Loader2 size={30} style={{ animation: 'lwspin 1s linear infinite' }} />
              <span style={{ fontSize: 13.5, marginTop: 10 }}>در حال اتصال به پخش…</span>
            </div>
          )}
          {ended && (
            <div style={overlay}>
              <VideoOff size={30} />
              <span style={{ fontSize: 15, fontWeight: 800, marginTop: 12 }}>پخش پایان یافته است</span>
              <Link href="/live" style={{ marginTop: 14, padding: '10px 20px', borderRadius: 12, textDecoration: 'none', fontSize: 13, fontWeight: 800, background: 'rgba(255,255,255,0.12)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>
                پخش‌های دیگر
              </Link>
            </div>
          )}
          {state === 'error' && !ended && (
            <div style={overlay}>
              <VideoOff size={28} />
              <span style={{ fontSize: 13.5, marginTop: 10 }}>اتصال برقرار نشد</span>
            </div>
          )}

          {state === 'live' && !ended && (
            <>
              <div style={{ position: 'absolute', top: 12, insetInlineStart: 12, display: 'flex', gap: 8 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: RED, color: '#fff', borderRadius: 999, padding: '4px 11px', fontSize: 11, fontWeight: 900, letterSpacing: '.1em' }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#fff', animation: 'pulse 1.4s infinite' }} /> LIVE
                </span>
                <span style={{ background: 'rgba(0,0,0,0.55)', color: '#fff', borderRadius: 999, padding: '4px 10px', fontSize: 11.5, fontWeight: 700, fontVariantNumeric: 'tabular-nums' }}>
                  {fa(+mm)}:{fa(+ss)}
                </span>
              </div>
              <div style={{ position: 'absolute', bottom: 12, insetInlineEnd: 12, display: 'flex', gap: 8 }}>
                <button onClick={toggleSound} aria-label="صدا" style={ctrl}>{muted ? <VolumeX size={17} /> : <Volume2 size={17} />}</button>
                <button onClick={goFull} aria-label="تمام‌صفحه" style={ctrl}><Maximize2 size={17} /></button>
              </div>
            </>
          )}
        </div>

        {muted && state === 'live' && !ended && (
          <button onClick={toggleSound}
            style={{ width: '100%', marginTop: 10, padding: '11px', borderRadius: 12, cursor: 'pointer', fontFamily: 'inherit', fontSize: 13, fontWeight: 800, background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.4)', color: GOLD_DARK }}>
            🔊 برای شنیدن صدا بزنید
          </button>
        )}

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
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Radio size={14} /> {session.discipline}</span>
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

const overlay: React.CSSProperties = {
  position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column',
  alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.75)', background: '#000',
};
const ctrl: React.CSSProperties = {
  width: 38, height: 38, borderRadius: '50%', border: 'none', cursor: 'pointer',
  background: 'rgba(0,0,0,0.5)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)',
};
