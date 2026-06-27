// ==============================
// FILE: apps/web/app/live/[id]/page.tsx
// ==============================
'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const STREAMS: Record<string, {
  id: string; title: string; discipline: string; tournament: string;
  player1: string; player2: string; score1: number; score2: number;
  viewers: number; startedAt: string; frame: number; totalFrames: number;
}> = {
  '1': {
    id: '1', title: 'لیگ برتر ایران — هفته ۱۰',
    discipline: 'اسنوکر', tournament: 'لیگ برتر فصل ۱۴۰۴',
    player1: 'علیرضا حیدری', player2: 'محمد رضایی',
    score1: 3, score2: 2, viewers: 1842, startedAt: '۲۱:۳۰',
    frame: 6, totalFrames: 9,
  },
  '2': {
    id: '2', title: 'قهرمانی ملی اسنوکر',
    discipline: 'اسنوکر', tournament: 'قهرمانی ملی ۱۴۰۴',
    player1: 'سینا کریمی', player2: 'داریوش نوری',
    score1: 1, score2: 1, viewers: 964, startedAt: '۲۰:۰۰',
    frame: 3, totalFrames: 7,
  },
};

const INITIAL_COMMENTS = [
  { id: 1, user: 'بیلیاردباز', text: 'چه بازی فوق‌العاده‌ای! حیدری عالیه 🔥', time: '21:42', likes: 24 },
  { id: 2, user: 'snooker_fan', text: 'بالاخره لایو با کیفیت خوب 👏', time: '21:43', likes: 18 },
  { id: 3, user: 'تهران_بیلیارد', text: 'رضایی الان باید فشار بیاره وگرنه تموم میشه', time: '21:44', likes: 11 },
  { id: 4, user: 'کاربر۷۷۷', text: 'خوندم این فریم رو رضایی میبره', time: '21:45', likes: 7 },
  { id: 5, user: 'masterbreak', text: 'century break در راهه؟ 😯', time: '21:46', likes: 31 },
  { id: 6, user: 'billiard_ir', text: 'سایت بیلیارد پلاس خیلی حرفه‌ای شده 🎱', time: '21:47', likes: 15 },
];

export default function LiveStreamPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const DEFAULT_STREAM = STREAMS['1'] as NonNullable<typeof STREAMS[string]>;
  const stream: NonNullable<typeof STREAMS[string]> = STREAMS[params.id] ?? DEFAULT_STREAM;
  const [comments, setComments] = useState(INITIAL_COMMENTS);
  const [newComment, setNewComment] = useState('');
  const [chatOpen, setChatOpen] = useState(true);
  const [viewers] = useState(stream.viewers + Math.floor(Math.random() * 50));
  const [liked, setLiked] = useState<Record<number, boolean>>({});
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [comments]);

  const sendComment = () => {
    if (!newComment.trim()) return;
    setComments(prev => [...prev, {
      id: Date.now(), user: 'شما', text: newComment.trim(),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      likes: 0,
    }]);
    setNewComment('');
  };

  const toggleLike = (id: number) => {
    setLiked(prev => ({ ...prev, [id]: !prev[id] }));
    setComments(prev => prev.map(c =>
      c.id === id ? { ...c, likes: c.likes + (liked[id] ? -1 : 1) } : c
    ));
  };

  const fillPct = Math.round((stream.score1 / stream.totalFrames) * 100);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#F7F7F5', color: '#111111', fontFamily: 'Vazirmatn, sans-serif', direction: 'rtl' }}>

      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', flexShrink: 0, background: '#050c08', borderBottom: '1px solid rgba(199,166,106,0.15)' }}>
        <button onClick={() => router.push('/live')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C7A66A', fontSize: 16, fontFamily: 'Vazirmatn, sans-serif', padding: 0, textDecoration: 'none' }}>
          ← زنده
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 'auto' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: '#ef4444' }}>LIVE</span>
          <span style={{ fontSize: 13, color: '#6b7280' }}>👁 {viewers.toLocaleString('fa')}</span>
        </div>
        <button onClick={() => setChatOpen(o => !o)} style={{ padding: '4px 12px', borderRadius: 999, fontSize: 13, fontFamily: 'Vazirmatn, sans-serif', cursor: 'pointer', background: chatOpen ? 'rgba(199,166,106,0.15)' : 'rgba(107,114,128,0.15)', color: chatOpen ? '#C7A66A' : '#6b7280', border: `1px solid ${chatOpen ? 'rgba(199,166,106,0.3)' : 'rgba(107,114,128,0.2)'}` }}>
          {chatOpen ? '💬 بستن چت' : '💬 باز کردن چت'}
        </button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

          {/* Video */}
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16/9', background: '#000', maxHeight: '56vw' }}>
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'radial-gradient(ellipse at center,#0d3320 0%,#061a0f 60%,#010604 100%)' }}>
              <div style={{ position: 'relative', width: '70%', height: '55%', borderRadius: 16, background: 'linear-gradient(135deg,#0a5c2e,#0d7a3c)', border: '4px solid #5c3a1e', boxShadow: '0 0 40px rgba(199,166,106,0.2)' }}>
                <div style={{ position: 'absolute', inset: 8, borderRadius: 12, border: '2px solid rgba(0,0,0,0.06)' }} />
                <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, background: 'rgba(0,0,0,0.08)' }} />
                <div style={{ position: 'absolute', bottom: 8, right: 12, fontSize: 12, fontWeight: 700, opacity: 0.4, color: '#C7A66A', letterSpacing: 2 }}>BILLIARDHUB</div>
                {[
                  { x: '30%', y: '40%', color: '#ef4444' },
                  { x: '55%', y: '35%', color: '#f59e0b' },
                  { x: '65%', y: '55%', color: '#111111' },
                  { x: '40%', y: '60%', color: '#3b82f6' },
                ].map((b, i) => (
                  <div key={i} style={{ position: 'absolute', width: 12, height: 12, borderRadius: '50%', left: b.x, top: b.y, background: b.color, boxShadow: `0 0 6px ${b.color}88`, transform: 'translate(-50%,-50%)' }} />
                ))}
              </div>
              <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', alignItems: 'center', gap: 5, padding: '4px 8px', borderRadius: 8, background: 'rgba(239,68,68,0.9)' }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', display: 'inline-block' }} />
                <span style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>LIVE</span>
              </div>
              <div style={{ position: 'absolute', top: 10, right: 10, padding: '4px 8px', borderRadius: 8, background: 'rgba(0,0,0,0.6)', fontSize: 13, color: '#111111', fontFamily: 'monospace' }}>
                ▶ {stream.startedAt}
              </div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10, background: 'linear-gradient(0deg,rgba(0,0,0,0.85),transparent)' }}>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 20, padding: 0 }}>⏸</button>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18, padding: 0 }}>🔊</button>
              <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)', margin: '0 4px' }}>
                <div style={{ width: '35%', height: '100%', borderRadius: 2, background: '#ef4444' }} />
              </div>
              <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#fff', fontSize: 18, padding: 0 }}>⛶</button>
            </div>
          </div>

          {/* Scoreboard */}
          <div style={{ margin: '12px 16px 0', borderRadius: 16, overflow: 'hidden', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)' }}>
            <div style={{ textAlign: 'center', padding: '6px 0', fontSize: 13, fontWeight: 700, color: '#ef4444', background: 'rgba(239,68,68,0.08)', borderBottom: '1px solid rgba(199,166,106,0.08)' }}>
              ● LIVE · فریم {stream.frame} از {stream.totalFrames}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 80px 1fr', alignItems: 'center', padding: '14px 16px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{stream.player1}</div>
                <div style={{ fontSize: 44, fontWeight: 900, color: '#C7A66A', lineHeight: 1 }}>{stream.score1}</div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#4b5563', marginBottom: 6 }}>{stream.discipline}</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#6b7280' }}>VS</div>
                <div style={{ marginTop: 8, height: 4, borderRadius: 2, background: 'rgba(0,0,0,0.04)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${fillPct}%`, background: 'linear-gradient(90deg,#C7A66A,#A07840)', transition: 'width 0.7s' }} />
                </div>
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{stream.player2}</div>
                <div style={{ fontSize: 44, fontWeight: 900, color: '#a78bfa', lineHeight: 1 }}>{stream.score2}</div>
              </div>
            </div>
          </div>

          {/* Title */}
          <div style={{ padding: '12px 16px 16px' }}>
            <div style={{ fontSize: 18, fontWeight: 900, margin: '0 0 4px', color: '#111111' }}>{stream.title}</div>
            <div style={{ fontSize: 14, color: '#6b7280' }}>{stream.tournament}</div>
          </div>
        </div>

        {/* Chat */}
        {chatOpen && (
          <div style={{ display: 'flex', flexDirection: 'column', background: '#050c08', borderTop: '1px solid rgba(199,166,106,0.1)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', flexShrink: 0, borderBottom: '1px solid rgba(199,166,106,0.1)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: '#111111' }}>💬 نظرات زنده</span>
                <span style={{ fontSize: 12, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(199,166,106,0.15)', color: '#C7A66A' }}>{comments.length}</span>
              </div>
              <button onClick={() => setChatOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#4b5563', fontSize: 15, fontFamily: 'Vazirmatn, sans-serif' }}>
                ✕ بستن
              </button>
            </div>

            <div ref={chatRef} style={{ overflowY: 'auto', padding: '10px 12px', maxHeight: 280, display: 'flex', flexDirection: 'column', gap: 10 }}>
              {comments.map(c => (
                <div key={c.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 900, background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#010604' }}>
                    {c.user[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#C7A66A' }}>{c.user}</span>
                      <span style={{ fontSize: 12, color: '#4b5563' }}>{c.time}</span>
                    </div>
                    <div style={{ fontSize: 15, lineHeight: 1.4, color: '#d1d5db', wordBreak: 'break-word' }}>{c.text}</div>
                    <button onClick={() => toggleLike(c.id)} style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', color: liked[c.id] ? '#ef4444' : '#4b5563', fontSize: 13, fontFamily: 'Vazirmatn, sans-serif', padding: 0 }}>
                      <span>{liked[c.id] ? '❤️' : '🤍'}</span>
                      <span>{c.likes}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ padding: '10px 12px', flexShrink: 0, borderTop: '1px solid rgba(199,166,106,0.1)', display: 'flex', gap: 8 }}>
              <input value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && sendComment()} placeholder="نظر بنویس..." style={{ flex: 1, minWidth: 0, padding: '8px 12px', borderRadius: 12, fontSize: 15, outline: 'none', background: 'rgba(199,166,106,0.07)', border: '1px solid rgba(199,166,106,0.15)', color: '#111111', fontFamily: 'Vazirmatn, sans-serif' }} />
              <button onClick={sendComment} style={{ padding: '8px 14px', borderRadius: 12, flexShrink: 0, fontSize: 15, fontWeight: 700, cursor: 'pointer', border: 'none', fontFamily: 'Vazirmatn, sans-serif', background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#010604' }}>
                ارسال
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
