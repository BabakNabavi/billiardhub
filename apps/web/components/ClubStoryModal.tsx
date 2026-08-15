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
  badge?: string;  // defaults to 'باشگاه'
}

interface Props {
  club: ClubStoryData;
  onClose: () => void;
  /* پخشِ چندتایی — اختیاری تا صفحه‌ی باشگاه که یک استوری دارد
     دست‌نخورده بماند. `onNext` فقط با *تمام‌شدنِ تایمر* صدا زده
     می‌شود؛ بستنِ دستی (ضربدر، پس‌زمینه، Esc) همیشه `onClose` است. */
  index?: number;
  count?: number;
  onNext?: () => void;
  onPrev?: () => void;
}

const STORY_DURATION = 12000;

export default function ClubStoryModal({ club, onClose, index = 0, count = 1, onNext, onPrev }: Props) {
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
      else (onNext ?? onClose)();
    };
    const id = requestAnimationFrame(raf);
    return () => cancelAnimationFrame(id);
    /* ⚠️ `index` هم باید این‌جا باشد: دو استوری با یک فایلِ یکسان
       (همان عکس دوباره آپلود شده) نشانیِ رسانه‌شان برابر است، و بدونِ
       `index` افکت دوباره اجرا نمی‌شد — نوار پر می‌ماند و پخش می‌ایستاد. */
  }, [index, club.storyMediaUrl]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      /* در راست‌به‌چپ، «جلو» سمتِ چپ است */
      if (e.key === 'ArrowLeft') onNext?.();
      if (e.key === 'ArrowRight') onPrev?.();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose, onNext, onPrev]);

  if (!mounted) return null;

  return createPortal(
    <>
      <style>{`
        @keyframes csModalIn { from{opacity:0;transform:translate(-50%,-50%) scale(0.88);}to{opacity:1;transform:translate(-50%,-50%) scale(1);} }
        @keyframes csOverlay { from{opacity:0;}to{opacity:1;} }
        /* دو ناحیه‌ی ضربه دکمه‌اند و باید حلقه‌ی focus داشته باشند،
           وگرنه دو توقفگاهِ نامرئی برای کیبورد می‌شوند. */
        .cs-tap:focus-visible { outline: 2px solid rgba(255,255,255,0.9); outline-offset: -6px; border-radius: 8px; }
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
          : <img loading="lazy" decoding="async" src={club.storyMediaUrl} alt="story" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />}

        {/* ناحیه‌ی ضربه برای جابه‌جایی — ده استوریِ دوازده‌ثانیه‌ای یعنی
            دو دقیقه پخشِ بی‌گریز. جهت‌ها منطقی‌اند: «بعدی» سمتِ پایانِ
            خط (در فارسی چپ) و «قبلی» سمتِ آغاز. */}
        {count > 1 && (
          <>
            <button type="button" className="cs-tap" aria-label="استوری قبلی" onClick={onPrev} disabled={index === 0}
              style={{ position: 'absolute', insetBlock: 0, insetInlineStart: 0, width: '32%', zIndex: 5, background: 'transparent', border: 'none', padding: 0, cursor: index === 0 ? 'default' : 'pointer' }} />
            <button type="button" className="cs-tap" aria-label="استوری بعدی" onClick={onNext}
              style={{ position: 'absolute', insetBlock: 0, insetInlineEnd: 0, width: '32%', zIndex: 5, background: 'transparent', border: 'none', padding: 0, cursor: 'pointer' }} />
          </>
        )}

        {/* Gradient overlays */}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 30%, transparent 55%, rgba(0,0,0,0.65) 100%)', pointerEvents: 'none' }} />

        {/* نوارِ پیشرفت — بخش‌بخش، و در RTL از راست شروع می‌شود
            (نه `direction:'ltr'`؛ اولین استوری باید کنارِ نامِ صاحبش
            باشد که خودش سمتِ راست است). */}
        <div style={{ position: 'absolute', top: 14, insetInline: 14, zIndex: 10, display: 'flex', gap: 4 }}>
          {Array.from({ length: Math.max(1, count) }, (_, i) => (
            <div key={i} style={{ flex: 1, height: 3, borderRadius: 3, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: i < index ? '100%' : i === index ? `${progress}%` : '0%', background: 'rgba(255,255,255,0.95)', borderRadius: 3, transition: 'none', boxShadow: '0 0 6px rgba(255,255,255,0.6)' }} />
            </div>
          ))}
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
              ? <img loading="lazy" decoding="async" src={club.logo} alt={club.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              : club.name[0]}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ color: '#fff', fontWeight: 700, fontSize: 16 }}>{club.name}</div>
          </div>
          <span style={{ fontSize: 12, color: '#C7A66A', background: 'rgba(199,166,106,0.18)', border: '1px solid rgba(199,166,106,0.4)', borderRadius: 20, padding: '4px 11px', fontWeight: 700, backdropFilter: 'blur(10px)' }}>
            {club.badge ?? 'باشگاه'}
          </span>
          <button type="button" onClick={onClose} aria-label="بستن استوری" style={{
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
