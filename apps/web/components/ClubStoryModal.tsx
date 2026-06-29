'use client';

import { createPortal } from 'react-dom';
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

interface ClubStoryData {
  name: string;
  logo?: string;
  storyMediaUrl: string;
  storyType?: string;
  storyText?: string;
}

interface Props {
  club: ClubStoryData;
  onClose: () => void;
}

const STORY_DURATION = 12000;

export default function ClubStoryModal({ club, onClose }: Props) {
  const [mounted, setMounted] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    setProgress(0);
    const start = Date.now();
    const raf = () => {
      const p = Math.min(100, ((Date.now() - start) / STORY_DURATION) * 100);
      setProgress(p);
      if (p < 100) requestAnimationFrame(raf);
      else onClose();
    };
    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
  }, [club.storyMediaUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes csModalIn { from{opacity:0;transform:translate(-50%,-50%) scale(0.88);}to{opacity:1;transform:translate(-50%,-50%) scale(1);} }
        @keyframes csOverlay { from{opacity:0;}to{opacity:1;} }
      `}</style>

      {/* Backdrop */}
      <div onClick={onClose} style={{
        position: 'fixed', inset: 0, zIndex: 99998,
        background: 'rgba(0,0,0,0.88)',
        backdropFilter: 'blur(20px)',
        animation: 'csOverlay .2s ease',
      }} />

      {/* Story card */}
      <div onClick={e => e.stopPropagation()} style={{
        position: 'fixed', top: '50%', left: '50%',
        transform: 'translate(-50%,-50%)',
        zIndex: 99999,
        width: 'min(400px, 94vw)',
        height: 'min(700px, 88vh)',
        borderRadius: 10,
        overflow: 'hidden',
        animation: 'csModalIn .3s cubic-bezier(.4,0,.2,1)',
        boxShadow: '0 40px 100px rgba(0,0,0,0.8), 0 0 80px rgba(199,166,106,0.15)',
      }}>
        {/* Media */}
        {club.storyType === 'video'
          ? <video src={club.storyMediaUrl} autoPlay muted playsInline loop style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
          : <img src={club.storyMediaUrl} alt="story" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none' }} />

        {/* Progress bar */}
        <div style={{ position: 'absolute', top: 14, left: 14, right: 14, zIndex: 10, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.25)', overflow: 'hidden', direction: 'ltr' }}>
          <div style={{ height: '100%', width: `${progress}%`, background: 'rgba(255,255,255,0.95)', borderRadius: 3, transition: 'none', boxShadow: '0 0 6px rgba(255,255,255,0.6)' }} />
        </div>

        {/* Header */}
        <div style={{ position: 'absolute', top: 28, left: 14, right: 14, zIndex: 10, display: 'flex', alignItems: 'center', gap: 10, paddingTop: 6 }}>
          <div style={{
            width: 44, height: 44, borderRadius: '50%', flexShrink: 0, overflow: 'hidden',
            background: 'rgba(199,166,106,0.25)',
            border: '2px solid rgba(199,166,106,0.7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontWeight: 900, color: '#fff', fontSize: 19,
            boxShadow: '0 0 16px rgba(199,166,106,0.5)',
          }}>
            {club.logo
              ? <img src={club.logo} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : club.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{club.name}</div>
          </div>
          <span style={{ fontSize: 12, color: '#C7A66A', background: 'rgba(199,166,106,0.18)', border: '1px solid rgba(199,166,106,0.4)', borderRadius: 20, padding: '4px 11px', fontWeight: 700, backdropFilter: 'blur(10px)' }}>
            باشگاه
          </span>
          <button onClick={onClose} style={{
            width: 34, height: 34, borderRadius: '50%',
            background: 'rgba(0,0,0,0.35)', border: '1px solid rgba(255,255,255,0.1)',
            cursor: 'pointer', color: 'rgba(255,255,255,0.85)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          }}>
            <X size={15} />
          </button>
        </div>

        {/* Caption / storyText */}
        {club.storyText && (
          <div style={{ position: 'absolute', bottom: 30, left: 16, right: 16, zIndex: 10 }}>
            <div style={{ background: 'rgba(0,0,0,0.5)', borderRadius: 18, padding: '14px 18px', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <p style={{ color: '#fff', fontSize: 17, margin: 0, lineHeight: 1.7, fontWeight: 500, direction: 'rtl' }}>{club.storyText}</p>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}
