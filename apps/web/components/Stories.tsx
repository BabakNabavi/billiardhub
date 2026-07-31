'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Heart, Send, Check, Smile } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import api from '../lib/api';
import { getStoredStories, addStoredStory, pickStoryRole, STORY_ROLES, storyLimitFor, countTodayStories, type StoredStory } from '../lib/story-store';
import { addStoryReply } from '../lib/story-inbox';
import { useSocialInteractions } from './features/FeatureFlags';
import Avatar from './ui/Avatar';
import { uploadFile } from '../lib/supabase';
import { fetchStories, postStory, sendDM, fetchSeen, markSeen, type SStory } from '../lib/social';
import { listSellerProfiles } from '../lib/seller-store';
import { useVisualViewport } from '../lib/useVisualViewport';

interface StoryItem {
  id: string;
  caption?: string;
  createdAt: string;
  mediaUrl?: string;
  mediaType?: string;
}

interface StoryGroup {
  userId: string;
  userName: string;
  userAvatar: string;
  logoUrl?: string;
  userRole: string;
  roleColor: string;
  roleLabel: string;
  allSeen: boolean;
  stories: StoryItem[];
  ownerKey?: string;   // برای هدف‌گذاری ریپلای/دایرکت (استوری سمت‌سرور)
  /* عکس *زنده*ی صاحب استوری.  عکس لحظه‌ی انتشار است و با
     عوض‌شدن عکس پروفایل به‌روز نمی‌شود؛ این یکی می‌شود. */
  avatarSrc?: string;
}

/* استوری‌های نمونه حذف شدند — نوزده کاربر ساختگی (مربی، داور،
   فروشگاه) که روی صفحه‌ی اصلی کنار استوری‌های واقعی نشان داده
   می‌شدند و هیچ‌کدام وجود خارجی نداشتند. */

const emojis = ['❤️','🔥','👏','😮','😂','🎱','💪','🏆'];
/* استیکرهای سریع پاسخ استوری — ست مدرن و به‌روز */
const STICKERS = ['❤️','😍','😂','😮','🔥','👏','💯','🎯'];
const bgGradients: Record<string,string> = {
  club:    'linear-gradient(160deg,#011a0f 0%,#022c22 50%,#065f46 100%)',
  player:  'linear-gradient(160deg,#060e1a 0%,#0c1f35 50%,#075985 100%)',
  coach:   'linear-gradient(160deg,#0e0520 0%,#1e0a3c 50%,#4c1d95 100%)',
  shop:    'linear-gradient(160deg,#100900 0%,#1c1000 50%,#78350f 100%)',
  admin:   'linear-gradient(160deg,#0f0303 0%,#1a0505 50%,#7f1d1d 100%)',
  referee: 'linear-gradient(160deg,#060e12 0%,#0a1a24 50%,#0e4d6e 100%)',
  club_owner:   'linear-gradient(160deg,#011a0f 0%,#022c22 50%,#065f46 100%)',
  seller:       'linear-gradient(160deg,#100900 0%,#1c1000 50%,#78350f 100%)',
  manufacturer: 'linear-gradient(160deg,#04140d 0%,#06281c 50%,#047857 100%)',
  technician:   'linear-gradient(160deg,#0a0a1a 0%,#141433 50%,#3730a3 100%)',
};
const STORY_DURATION = 15000;

function relativeTime(expiresAt: string): string {
  const uploadedAt = new Date(new Date(expiresAt).getTime() - 24 * 60 * 60 * 1000);
  const diffMs = Date.now() - uploadedAt.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffH = Math.floor(diffMin / 60);
  if (diffH >= 1) return `${diffH} ساعت پیش`;
  return `${Math.max(1, diffMin)} دقیقه پیش`;
}

function relativeTimeFrom(createdAt: number): string {
  const diffMin = Math.floor((Date.now() - createdAt) / 60000);
  const diffH = Math.floor(diffMin / 60);
  if (diffH >= 1) return `${diffH} ساعت پیش`;
  return `${Math.max(1, diffMin)} دقیقه پیش`;
}

/* Group user-posted (localStorage) stories by owner → StoryGroup[]. */
function buildLocalGroups(stories: StoredStory[]): StoryGroup[] {
  const byOwner = new Map<string, StoredStory[]>();
  for (const s of stories) {
    const arr = byOwner.get(s.ownerKey) ?? [];
    arr.push(s);
    byOwner.set(s.ownerKey, arr);
  }
  return Array.from(byOwner.values()).map((arr): StoryGroup => {
    const sorted = [...arr].sort((a, b) => a.createdAt - b.createdAt);
    const first = sorted[0]!;
    return {
      userId: `local-${first.ownerKey}`,
      userName: first.userName,
      userAvatar: first.avatar,
      logoUrl: first.logoUrl,
      userRole: first.roleKey,
      roleColor: first.roleColor,
      roleLabel: first.roleLabel,
      allSeen: false,
      stories: sorted.map(s => ({
        id: s.id,
        caption: s.caption || undefined,
        createdAt: relativeTimeFrom(s.createdAt),
        mediaUrl: s.mediaUrl,
        mediaType: 'image',
      })),
    };
  });
}

/* استوری سمت‌سرور (Supabase) — بین همه‌ی دستگاه‌ها و کاربران دیده می‌شود. */
function buildServerGroups(stories: SStory[]): StoryGroup[] {
  const byOwner = new Map<string, SStory[]>();
  for (const s of stories) {
    const arr = byOwner.get(s.ownerKey) ?? [];
    arr.push(s); byOwner.set(s.ownerKey, arr);
  }
  return Array.from(byOwner.entries()).map(([ownerKey, arr]): StoryGroup => {
    const sorted = [...arr].sort((a, b) => a.createdAt - b.createdAt);
    const first = sorted[0]!;
    return {
      userId: `srv-${ownerKey}`, ownerKey,
      userName: first.userName, userAvatar: first.avatar, logoUrl: first.logoUrl,
      userRole: first.roleKey, roleColor: first.roleColor, roleLabel: first.roleLabel,
      allSeen: false,
      stories: sorted.map(s => ({ id: s.id, caption: s.caption || undefined, createdAt: relativeTimeFrom(s.createdAt), mediaUrl: s.mediaUrl, mediaType: 'image' as const })),
    };
  });
}

/* استوری فروشگاه‌ها — مستقیم از پروفایل فروشگاه (لوکال) خوانده می‌شود؛
   هر فروشگاه تاییدشده که عکس استوری دارد، خودکار در نوار می‌آید (بدون نیاز به ذخیره‌ی مجدد). */
function buildSellerStoreGroups(): StoryGroup[] {
  const meta = STORY_ROLES.seller ?? { label: 'فروشگاه', color: '#f59e0b' };
  return listSellerProfiles()
    .filter(p => p.storyImage && p.status === 'approved')
    .map(p => ({
      userId: `store-${p.slug}`,
      userName: p.title || 'فروشگاه',
      userAvatar: (p.title || 'ف').charAt(0) || 'ف',
      logoUrl: p.logo || undefined,
      userRole: 'seller',
      roleColor: meta.color,
      roleLabel: meta.label,
      allSeen: false,
      stories: [{ id: `store-story-${p.slug}`, caption: p.storyText || undefined, createdAt: 'به‌تازگی', mediaUrl: p.storyImage, mediaType: 'image' }],
    }));
}

/* Downscale + re-encode a story image before storing (localStorage quota). */
function compressStory(file: File): Promise<string> {
  return new Promise(resolve => {
    const reader = new FileReader();
    reader.onerror = () => resolve('');
    reader.onload = () => {
      const dataUrl = String(reader.result);
      const im = document.createElement('img');
      im.onerror = () => resolve(dataUrl);
      im.onload = () => {
        const maxDim = 1080;
        let w = im.naturalWidth || im.width;
        let h = im.naturalHeight || im.height;
        if (w >= h && w > maxDim)     { h = Math.round((h * maxDim) / w); w = maxDim; }
        else if (h > w && h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d');
        if (!ctx) { resolve(dataUrl); return; }
        ctx.drawImage(im, 0, 0, w, h);
        try { resolve(canvas.toDataURL('image/jpeg', 0.72)); } catch { resolve(dataUrl); }
      };
      im.src = dataUrl;
    };
    reader.readAsDataURL(file);
  });
}

/* ── Story viewer ── */
function StoryViewer({ groups, activeGroup, activeStory, liked, showEmojis, comment, sentReaction, paused, replySent, canReply, interactionsOn, onClose, onNext, onPrev, onLike, onReaction, onToggleEmojis, onComment, onSendComment, onReplyFocus, onReplyBlur }: any) {
  const currentGroup = groups[activeGroup];
  const currentStory = currentGroup?.stories[activeStory];

  /* استوری تمام‌صفحه و کاملاً ثابت می‌ماند (هیچ تغییری نمی‌کند)؛ فقط کیبورد + فیلد
     پاسخ رویش می‌آید. لایه‌ی پاسخ دقیقاً روی ناحیه‌ی دیدنی می‌نشیند و استوری با
     translateY(offsetTop) در جایش پین می‌شود تا روی iOS جابجا/نصفه نشود. */
  const vp = useVisualViewport();
  useEffect(() => {
    const html = document.documentElement, body = document.body;
    const prevH = html.style.overflow, prevB = body.style.overflow;
    const sy = window.scrollY;
    html.style.overflow = 'hidden'; body.style.overflow = 'hidden';
    /* iOS هنگام فوکوس اینپوت، سند را برنامه‌ای اسکرول می‌کند و overflow:hidden جلویش
       را نمی‌گیرد ⇒ استوری بالا می‌رفت و سایت زیر پیدا می‌شد. body را فیکس می‌کنیم تا
       سند اصلاً اسکرول‌پذیر نباشد؛ خود استوری inset:0 کامل و دست‌نخورده می‌ماند. */
    body.style.position = 'fixed'; body.style.top = `-${sy}px`;
    body.style.left = '0'; body.style.right = '0'; body.style.width = '100%';
    const block = (e: TouchEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && t.closest && t.closest('.story-msg-input')) return;
      e.preventDefault();
    };
    document.addEventListener('touchmove', block, { passive: false });
    /* هر تلاش اسکرول باقی‌مانده را همان لحظه خنثی کن */
    const keepTop = () => { if (window.scrollY !== 0) window.scrollTo(0, 0); };
    window.addEventListener('scroll', keepTop);
    return () => {
      html.style.overflow = prevH; body.style.overflow = prevB;
      body.style.position = ''; body.style.top = ''; body.style.left = ''; body.style.right = ''; body.style.width = '';
      document.removeEventListener('touchmove', block);
      window.removeEventListener('scroll', keepTop);
      window.scrollTo(0, sy);
    };
  }, []);

  if (!currentGroup || !currentStory) return null;

  const hasMedia = !!currentStory.mediaUrl;

  return createPortal(
    <>
      <style>{`
        @keyframes storyModalIn { from{opacity:0;transform:scale(0.92);}to{opacity:1;transform:none;} }
        @keyframes overlayFadeIn { from{opacity:0;}to{opacity:1;} }
        @keyframes storyProgress { from{width:0%;}to{width:100%;} }
        @keyframes stkIn { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;} }
        @keyframes reactionFloat {
          0%{opacity:1;transform:translateX(-50%) translateY(0) scale(0.5);}
          40%{opacity:1;transform:translateX(-50%) translateY(-60px) scale(1.6);}
          100%{opacity:0;transform:translateX(-50%) translateY(-130px) scale(1);}
        }
        .story-reaction-pop { position:absolute;bottom:28px;left:50%;font-size:52px;pointer-events:none;z-index:60;animation:reactionFloat 2.2s ease forwards; }
        /* پیل پاسخ — خط‌دار و شفاف روی نوار مشکی (مثل دایرکت اینستاگرام) */
        .story-msg-input { flex:1;min-width:0;background:transparent;border:1.5px solid rgba(255,255,255,0.55);border-radius:100px;padding:13px 20px;color:#fff;font-size:14px;font-weight:500;outline:none;font-family:inherit; }
        .story-msg-input::placeholder { color:rgba(255,255,255,0.7); }
        .story-msg-input:focus { border-color:rgba(255,255,255,0.9); }
        /* آیکون‌های خطی سفید، بدون پس‌زمینه */
        .story-ic { width:40px;height:40px;border-radius:50%;border:none;background:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:transform .2s ease;color:#fff; }
        .story-ic:hover { transform:scale(1.14); }
        .story-ic.on { color:#ef4444; }
        /* ردیف استیکر سریع — بار شیشه‌ای افقی */
        .story-stk { display:flex;justify-content:space-around;gap:4px;background:rgba(30,28,34,0.7);border:1px solid rgba(255,255,255,0.14);border-radius:100px;padding:9px 12px;margin-bottom:12px;backdrop-filter:blur(24px);animation:stkIn .22s cubic-bezier(.22,1,.36,1) both; }
        .story-stk button { background:none;border:none;cursor:pointer;font-size:28px;line-height:1;padding:2px;transition:transform .18s cubic-bezier(.22,1,.36,1); }
        .story-stk button:hover { transform:scale(1.35) translateY(-2px); }
      `}</style>
      {/* رَپر تمام‌صفحه و کاملاً ثابت — بدون transform (transform روی iOS فیکس‌بودن را
          می‌شکند و استوری با اسکرول حرکت می‌کند و سایت زیر پیدا می‌شود) */}
      <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:99999,background:'rgba(0,0,0,0.96)',backdropFilter:'blur(8px)',animation:'overlayFadeIn .2s ease' }}>

        {/* ── کارت استوری: تمام‌ارتفاع و ثابت ── */}
        <div onClick={e => e.stopPropagation()} style={{ position:'absolute',top:0,bottom:0,left:'50%',transform:'translateX(-50%)',width:'min(440px,100vw)',overflow:'hidden',animation:'storyModalIn .3s cubic-bezier(.22,1,.36,1)',boxShadow:'0 0 80px rgba(0,0,0,0.6)' }}>

          {hasMedia ? (
            <div style={{ position:'absolute', inset:0, background:'#0B0B0C' }}>
              {/* ── پس‌زمینه‌ی محو ──
                  همان عکس، بزرگ‌شده و بلور‌شده، فقط برای پرکردن قاب.
                  بدون این، عکسی که نسبت ابعادش با قاب فرق دارد یا باید
                  بریده شود یا کنارش نوار سیاه بیفتد. */}
              <img aria-hidden="true" src={currentStory.mediaUrl} alt=""
                style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
                         filter:'blur(28px) brightness(0.55)', transform:'scale(1.15)' }} />

              {/* ── خود عکس ──
                  `contain` به‌جای `cover`: کل تصویر دیده می‌شود. پیش‌تر
                  `cover` بود و هر عکسی که عمودی/افقی‌تر از قاب بود، نیمی
                  از آن بریده می‌شد.

                  `loading="eager"` عمدی است: این عکس همان لحظه‌ی باز شدن
                  دیده می‌شود. با lazy مرورگر گاهی بارگذاری را عقب
                  می‌انداخت و کاربر چند لحظه صفحه‌ی سیاه می‌دید. */}
              {currentStory.mediaType === 'video'
                ? <video src={currentStory.mediaUrl} autoPlay muted playsInline loop
                    style={{ position:'relative', width:'100%', height:'100%', objectFit:'contain' }} />
                : <img loading="eager" decoding="async" fetchPriority="high"
                    src={currentStory.mediaUrl} alt="story"
                    style={{ position:'relative', width:'100%', height:'100%', objectFit:'contain' }} />}
              <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 26%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.55) 100%)' }} />
            </div>
          ) : (
            <div style={{ position:'absolute',inset:0,background:bgGradients[currentGroup.userRole]||bgGradients.player }}>
              <div style={{ position:'absolute',top:'-100px',left:'50%',transform:'translateX(-50%)',width:'350px',height:'350px',borderRadius:'50%',background:`radial-gradient(${currentGroup.roleColor}25,transparent 65%)`,pointerEvents:'none' }} />
              <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'154px',opacity:0.05,userSelect:'none',pointerEvents:'none' }}>🎱</div>
            </div>
          )}

          {/* Progress bars */}
          <div style={{ position:'absolute',top:'calc(env(safe-area-inset-top) + 12px)',left:'12px',right:'12px',display:'flex',gap:'5px',zIndex:50,direction:'ltr' }}>
            {currentGroup.stories.map((_: any,si: number) => (
              <div key={si} style={{ flex:1,height:'3px',background:'rgba(255,255,255,0.25)',borderRadius:'3px',overflow:'hidden' }}>
                {si < activeStory ? (
                  <div style={{ width:'100%',height:'100%',background:'rgba(255,255,255,0.95)',borderRadius:'3px' }} />
                ) : si === activeStory ? (
                  <div key={`p-${activeGroup}-${activeStory}`} style={{ height:'100%',background:'rgba(255,255,255,0.95)',borderRadius:'3px',boxShadow:'0 0 6px rgba(255,255,255,0.7)',animation:`storyProgress ${STORY_DURATION}ms linear forwards`,animationPlayState: paused ? 'paused' : 'running' }} />
                ) : null}
              </div>
            ))}
          </div>

          {/* Header */}
          <div style={{ position:'absolute',top:'calc(env(safe-area-inset-top) + 26px)',left:'12px',right:'12px',display:'flex',alignItems:'center',gap:'10px',zIndex:50 }}>
            <div style={{ width:'40px',height:'40px',borderRadius:'50%',flexShrink:0,background:`${currentGroup.roleColor}25`,border:`2px solid ${currentGroup.roleColor}90`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden' }}>
              <Avatar src={currentGroup.avatarSrc ?? currentGroup.logoUrl} alt={currentGroup.userName}
                size={36} background="transparent" iconColor="rgba(255,255,255,0.9)" />
            </div>
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ color:'#fff',fontWeight:700,fontSize:'15px',textShadow:'0 1px 4px rgba(0,0,0,0.5)' }}>{currentGroup.userName}</div>
              <div style={{ color:'rgba(255,255,255,0.7)',fontSize:'12px',textShadow:'0 1px 4px rgba(0,0,0,0.5)' }}>{currentStory.createdAt}</div>
            </div>
            <span style={{ fontSize:'11px',color:'#fff',background:`${currentGroup.roleColor}`,borderRadius:'20px',padding:'3px 11px',fontWeight:700,flexShrink:0 }}>{currentGroup.roleLabel}</span>
            <button onClick={onClose} style={{ width:'32px',height:'32px',borderRadius:'50%',background:'none',border:'none',cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><X size={22} /></button>
          </div>

          {/* نواحی لمس قبلی/بعدی */}
          <button onClick={onNext} style={{ position:'absolute',right:0,top:'80px',bottom:'70px',width:'38%',background:'transparent',border:'none',cursor:'pointer',zIndex:10 }} />
          <button onClick={onPrev} style={{ position:'absolute',left:0,top:'80px',bottom:'70px',width:'38%',background:'transparent',border:'none',cursor:'pointer',zIndex:10 }} />

          {currentStory.caption && (
            <div style={{ position:'absolute',bottom:'calc(env(safe-area-inset-bottom) + 92px)',left:'14px',right:'14px',zIndex:20 }}>
              <div style={{ background:'rgba(0,0,0,0.42)',borderRadius:'16px',padding:'12px 16px',backdropFilter:'blur(14px)' }}>
                <p style={{ color:'#fff',fontSize:'15.5px',margin:0,lineHeight:1.8,fontWeight:500,direction:'rtl' }}>{currentStory.caption}</p>
              </div>
            </div>
          )}

          {sentReaction && <div className="story-reaction-pop">{sentReaction}</div>}
        </div>

      </div>{/* پایان رَپر استوری — استوری اینجا کامل و دست‌نخورده می‌ماند */}

      {/* ── لایه‌ی پاسخ: دقیقاً روی ناحیه‌ی دیدنی (بالای کیبورد)؛ pointerEvents:none تا
          لمس‌ها به استوری پشت برسند، فقط خود نوار پاسخ کلیک‌پذیر است ──

          کل این لایه پشت پرچم «تعاملات اجتماعی» است. وقتی خاموش باشد
          هیچ‌چیز آن رندر نمی‌شود — نه اینپوت پاسخ، نه لایک، نه استیکر،
          نه دکمه‌ی ارسال، و نه حتی CTAی «برای پاسخ وارد شوید» که برای
          مهمان نمایش داده می‌شد. چون لایه‌ی جداست، خود استوری (تصویر،
          نوار پیشرفت، ناوبری قبلی/بعدی، بستن) اصلاً دست نمی‌خورد. */}
      {interactionsOn && (
      <div style={{ position:'fixed',left:0,right:0,top:0,height:vp.height||'100dvh',transform: vp.offsetTop ? `translateY(${vp.offsetTop}px)` : undefined,zIndex:100000,pointerEvents:'none',display:'flex',flexDirection:'column',justifyContent:'flex-end',alignItems:'center' }}>
        <div onClick={e => e.stopPropagation()} style={{ pointerEvents:'auto',width:'min(440px,96vw)',padding: vp.kb>0 ? '0 0 8px' : '0 0 calc(env(safe-area-inset-bottom) + 10px)' }}>
          {replySent && (
            <div style={{ textAlign:'center',marginBottom:10 }}>
              <span style={{ display:'inline-flex',alignItems:'center',gap:6,fontSize:12.5,fontWeight:700,color:'#fff',background:'rgba(16,185,129,0.92)',borderRadius:100,padding:'6px 14px' }}>
                <Check size={13} /> پیام ارسال شد
              </span>
            </div>
          )}
          {canReply && showEmojis && (
            <div className="story-stk">
              {STICKERS.map((e: string) => (<button key={e} onClick={() => onReaction(e)}>{e}</button>))}
            </div>
          )}
          {canReply ? (
            <div style={{ display:'flex',gap:'6px',alignItems:'center' }}>
              <input className="story-msg-input" value={comment} onChange={e => onComment(e.target.value)} onFocus={onReplyFocus} onBlur={onReplyBlur} onKeyDown={e => e.key==='Enter' && onSendComment()} placeholder="پاسخ به استوری..." />
              <button className={`story-ic${liked ? ' on' : ''}`} onClick={onLike} aria-label="لایک">
                <Heart size={25} fill={liked?'#ef4444':'none'} />
              </button>
              <button className="story-ic" onClick={onToggleEmojis} aria-label="استیکر" style={{ color: showEmojis ? '#C7A66A' : '#fff' }}>
                <Smile size={25} />
              </button>
              <button className="story-ic" onClick={onSendComment} aria-label="ارسال" style={{ opacity: comment.trim() ? 1 : 0.5 }}>
                <Send size={23} />
              </button>
            </div>
          ) : (
            /* مهمان فقط می‌بیند */
            <a href="/login" style={{ display:'flex',alignItems:'center',justifyContent:'center',gap:8,textDecoration:'none',padding:'13px',borderRadius:100,background:'transparent',border:'1.5px solid rgba(255,255,255,0.5)',color:'#fff',fontSize:13.5,fontWeight:700,fontFamily:'inherit' }}>
              برای پاسخ به استوری وارد شوید
            </a>
          )}
        </div>
      </div>
      )}
    </>,
    document.body
  );
}

/* ── Stories strip ── */
export default function Stories() {
  const { user } = useAuthStore();
  /* پرچم تعاملات. دیدن استوری هرگز به این وابسته نیست — فقط
     لایک/ری‌اکشن/پاسخ. */
  const interactionsOn = useSocialInteractions();
  const [apiGroups, setApiGroups]     = useState<StoryGroup[]>([]);
  const [localGroups, setLocalGroups] = useState<StoryGroup[]>([]);
  const [serverGroups, setServerGroups] = useState<StoryGroup[]>([]);
  const [storeGroups, setStoreGroups] = useState<StoryGroup[]>([]);
  const [seenGroups, setSeenGroups] = useState<Set<string>>(new Set());
  const [seenIds, setSeenIds] = useState<Set<string>>(new Set());   // storyId‌های دیده‌شده (سروری، per-viewer)
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const [activeStory, setActiveStory] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [comment, setComment] = useState('');
  const [sentReaction, setSentReaction] = useState('');
  const [mounted, setMounted] = useState(false);
  const [posting, setPosting] = useState(false);
  const [storyImg, setStoryImg] = useState('');
  const [storyCaption, setStoryCaption] = useState('');

  // استوری سمت‌سرور (بین دستگاه‌ها) اولویت دارد؛ اگر سرور خالی/آفلاین بود، لوکال فالبک
  const userStoryGroups = serverGroups.length > 0 ? serverGroups : localGroups;
  const groups: StoryGroup[] = [...userStoryGroups, ...storeGroups, ...apiGroups];
  const roleInfo = pickStoryRole(user ? [user.primaryRole, ...(user.secondaryRoles ?? [])] : []);
  const myRoles = user ? [user.primaryRole, ...(user.secondaryRoles ?? [])] : [];
  const ownerKey = user ? (user.phone || user.id || (user.firstName ?? 'user')) : '';
  const localLimit = storyLimitFor(myRoles);   // ۰ = کاربر عادی، مجاز نیست

  /* عکس آواتار یک گروه.

     `logoUrl` عکسی است که *لحظه‌ی انتشار استوری* ذخیره شده. اگر کاربر
     بعداً عکس پروفایلش را عوض کند، آن اسنپ‌شات قدیمی می‌ماند — و اگر
     موقع انتشار عکسی نداشته، تا ابد خالی می‌ماند. برای استوری *خود
     کاربر* عکس زنده‌ی نشست را ترجیح می‌دهیم؛ برای بقیه همان اسنپ‌شات
     تنها چیزی است که در دست داریم (کلید مالک در پاسخ عمومی هش شده و
     قابل تطبیق نیست). */
  const isMine = (g: StoryGroup) =>
    !!user && (g.ownerKey === user.id || g.ownerKey === ownerKey || g.userId === `local-${ownerKey}`);
  const avatarOf = (g: StoryGroup): string | undefined =>
    (isMine(g) ? (user?.avatar || g.avatarSrc || g.logoUrl) : (g.avatarSrc || g.logoUrl)) || undefined;

  /* سهمیه‌ی واقعی از سرور.
     تا امروز این کادر عدد localStorage را نشان می‌داد؛ یعنی روی هر
     دستگاه تازه از صفر شروع می‌شد و با پاک‌کردن حافظه‌ی مرورگر ریست
     می‌شد — کاربر «۰ از ۲» می‌دید در حالی که سرور چیز دیگری می‌دانست.
     منبع حقیقت همان چیزی است که موقع انتشار سنجیده می‌شود. */
  const [quota, setQuota] = useState<{ used: number; limit: number; allowed: boolean; enabled: boolean } | null>(null);
  const dailyLimit = quota ? quota.limit : localLimit;
  const usedToday = quota ? quota.used : countTodayStories(ownerKey);
  const canPost = quota ? (quota.limit > 0 || !quota.enabled) : localLimit > 0;
  const [postErr, setPostErr] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [replyFocus, setReplyFocus] = useState(false);
  const [replySent, setReplySent] = useState(false);
  /* سهمیه را هر بار که کادر انتشار باز می‌شود تازه می‌گیریم — و بعد از
     هر انتشار موفق هم، تا شمارنده بلافاصله درست شود. */
  const refreshQuota = async () => {
    if (!user) return;
    try {
      const r = await fetch('/api/stories/quota', { cache: 'no-store', credentials: 'include' });
      if (!r.ok) return;
      const j = await r.json() as { quota?: { used: number; limit: number; allowed: boolean; enabled: boolean } };
      if (j?.quota) setQuota(j.quota);
    } catch { /* آفلاین ⇒ همان عدد محلی نشان داده می‌شود */ }
  };
  useEffect(() => { if (posting) void refreshQuota(); }, [posting]);   // eslint-disable-line react-hooks/exhaustive-deps

  const reloadLocal = () => {
    setLocalGroups(buildLocalGroups(getStoredStories()));
    setStoreGroups(buildSellerStoreGroups());
  };
  const reloadServer = async () => {
    const s = await fetchStories();
    if (Array.isArray(s)) setServerGroups(buildServerGroups(s));
  };

  useEffect(() => {
    setMounted(true); reloadLocal(); reloadServer();
    /* تازه‌سازی دوره‌ای تا استوری دستگاه‌های دیگر هم بیاید */
    const iv = setInterval(reloadServer, 25000);
    return () => clearInterval(iv);
  }, []);

  /* «دیده‌شدن» ماندگار را از سرور بخوان (وقتی کاربر لاگین شد/کلید آماده شد) */
  useEffect(() => {
    if (!ownerKey) return;
    fetchSeen(ownerKey).then(ids => { if (Array.isArray(ids) && ids.length) setSeenIds(new Set(ids)); });
  }, [ownerKey]);

  /* یک گروه را دیده‌شده علامت بزن: هم لوکال (فوری) هم سرور (ماندگار) */
  const markGroupSeen = (g?: StoryGroup) => {
    if (!g) return;
    const ids = g.stories.map(s => s.id).filter(Boolean);
    if (!ids.length) return;
    setSeenIds(prev => { const n = new Set(prev); ids.forEach(i => n.add(i)); return n; });
    if (ownerKey) markSeen(ownerKey, ids);
  };

  const onStoryFile = async (file?: File) => { if (file) setStoryImg(await compressStory(file)); };

  /* dataURL → File برای آپلود در Supabase */
  const dataUrlToFile = (dataUrl: string, name: string): File | null => {
    try {
      const [head, b64] = dataUrl.split(',');
      const mime = /data:(.*?);/.exec(head || '')?.[1] || 'image/jpeg';
      const bin = atob(b64 || ''); const arr = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
      return new File([arr], name, { type: mime });
    } catch { return null; }
  };

  const meName = () => `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'کاربر';

  const publishStory = async () => {
    if (!user || !storyImg || publishing) return;
    if (!canPost) { setPostErr('حساب شما امکان انتشار استوری ندارد'); return; }
    setPublishing(true); setPostErr('');
    try {
      const id = `st-${Date.now()}-${Math.floor(Math.random() * 1e4)}`;
      const file = dataUrlToFile(storyImg, `${id}.jpg`);
      const mediaUrl = file ? (await uploadFile('club-media', file, `social/stories/img/${id}.jpg`)) || '' : '';
      if (!mediaUrl) throw new Error('upload');   // ⇒ فالبک آفلاین
      const res = await postStory({
        ownerKey, userName: meName(),
        roleKey: roleInfo.key, roleLabel: roleInfo.label, roleColor: roleInfo.color,
        avatar: (user.firstName ?? 'ک').charAt(0) || 'ک',
        logoUrl: user.avatar || undefined, mediaUrl, caption: storyCaption.trim(),
      });
      if (!res.ok) {
        /* خطای واقعی سرور (سقف/عدم‌مجوز) — فالبک لوکال نکن */
        if (res.status >= 400 && res.status < 500) { setPostErr(res.message || 'انتشار ممکن نشد'); setPublishing(false); return; }
        throw new Error('server');   // ۵xx/شبکه ⇒ فالبک
      }
      await reloadServer();
      void refreshQuota();
      setPosting(false); setStoryImg(''); setStoryCaption('');
    } catch {
      /* آفلاین ⇒ ذخیره‌ی محلی (تک‌دستگاهی) */
      if (countTodayStories(ownerKey) >= dailyLimit) { setPostErr(`سقف استوری امروز شما (${dailyLimit.toLocaleString('fa-IR')}) پر شده است`); setPublishing(false); return; }
      addStoredStory({
        id: `st-${Date.now()}-${Math.floor(Math.random() * 1e4)}`, ownerKey,
        userName: meName(), roleKey: roleInfo.key, roleLabel: roleInfo.label, roleColor: roleInfo.color,
        avatar: (user.firstName ?? 'ک').charAt(0) || 'ک', logoUrl: user.avatar || undefined,
        mediaUrl: storyImg, caption: storyCaption.trim(), createdAt: Date.now(),
      });
      reloadLocal();
      setPosting(false); setStoryImg(''); setStoryCaption('');
    } finally { setPublishing(false); }
  };

  // Fetch real clubs + sellers with active stories and prepend to groups
  useEffect(() => {
    const fetchAllStories = async () => {
      const [clubsRes, sellersRes] = await Promise.allSettled([
        fetch('/api/clubs').then(r => r.json()).catch(() => []),
        fetch('/api/sellers').then(r => r.json()).catch(() => []),
      ]);

      const clubs: any[] = clubsRes.status === 'fulfilled' ? (clubsRes.value || []) : [];
      const sellers: any[] = sellersRes.status === 'fulfilled' ? (sellersRes.value || []) : [];

      const [clubResults, sellerResults] = await Promise.all([
        Promise.all(
          clubs.filter((c: any) => c.id).map((c: any) =>
            fetch(`/api/clubs/${c.id}/stories`)
              .then(r => r.json())
              .then((stories: any[]) => ({ c, stories: Array.isArray(stories) ? stories : [] }))
              .catch(() => ({ c, stories: [] as any[] }))
          )
        ),
        Promise.all(
          sellers.filter((s: any) => s.id).map((s: any) =>
            fetch(`/api/sellers/${s.id}/stories`)
              .then(r => r.json())
              .then((stories: any[]) => ({ s, stories: Array.isArray(stories) ? stories : [] }))
              .catch(() => ({ s, stories: [] as any[] }))
          )
        ),
      ]);

      const clubGroups: StoryGroup[] = clubResults
        .filter(({ stories }) => stories.length > 0)
        .map(({ c, stories }): StoryGroup => ({
          userId: `api-club-${c.id}`,
          userName: c.name,
          userAvatar: c.name?.[0] ?? '؟',
          logoUrl: c.logo || undefined,
          userRole: 'club',
          roleColor: '#C7A66A',
          roleLabel: 'باشگاه',
          allSeen: false,
          stories: stories.map((s: any) => ({
            id: s.id,
            caption: s.text || undefined,
            createdAt: relativeTime(s.expiresAt),
            mediaUrl: s.mediaUrl,
            mediaType: s.mediaType || 'image',
          })),
        }));

      const sellerGroups: StoryGroup[] = sellerResults
        .filter(({ stories }) => stories.length > 0)
        .map(({ s, stories }): StoryGroup => ({
          userId: `api-seller-${s.id}`,
          userName: (s.sellerProfile as any)?.shopName || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'فروشگاه',
          userAvatar: ((s.sellerProfile as any)?.shopName || s.firstName || 'ف')[0],
          logoUrl: s.avatar || undefined,
          userRole: 'shop',
          roleColor: '#f59e0b',
          roleLabel: 'فروشگاه',
          allSeen: false,
          stories: stories.map((st: any) => ({
            id: st.id,
            caption: st.text || undefined,
            createdAt: relativeTime(st.expiresAt),
            mediaUrl: st.mediaUrl,
            mediaType: st.mediaType || 'image',
          })),
        }));

      const allApiGroups = [...clubGroups, ...sellerGroups];
      setApiGroups(allApiGroups);
    };

    fetchAllStories().catch(() => {});
  }, []);

  const closeStory = () => { setActiveGroup(null); setShowEmojis(false); setComment(''); };

  const nextStory = () => {
    if (activeGroup === null) return;
    const group = groups[activeGroup];
    if (!group) return;
    if (activeStory < group.stories.length - 1) {
      setActiveStory(p => p + 1);
    } else if (activeGroup < groups.length - 1) {
      const next = activeGroup + 1;
      setActiveGroup(next);
      setActiveStory(0);
      setLiked(false);
      setSentReaction('');
      setSeenGroups(prev => new Set([...prev, groups[next]?.userId ?? '']));
      markGroupSeen(groups[next]);
    } else {
      closeStory();
    }
  };

  const prevStory = () => {
    if (activeGroup === null) return;
    if (activeStory > 0) { setActiveStory(p => p - 1); }
    else if (activeGroup > 0) { setActiveGroup(p => p! - 1); setActiveStory(0); }
  };

  const openStory = (index: number) => {
    setActiveGroup(index); setActiveStory(0);
    setLiked(false); setSentReaction(''); setShowEmojis(false);
    setSeenGroups(prev => new Set([...prev, groups[index]?.userId ?? '']));
    markGroupSeen(groups[index]);
  };

  /* استوری هنگام نوشتن ریپلای، تمرکز روی فیلد یا بازبودن استیکرها متوقف می‌شود */
  const storyPaused = showEmojis || replyFocus || comment.trim().length > 0;
  useEffect(() => {
    if (activeGroup === null || storyPaused) return;
    const timer = setTimeout(() => { nextStory(); }, STORY_DURATION);
    return () => clearTimeout(timer);
  }, [activeGroup, activeStory, storyPaused]);

  /* ریپلای/استیکر → دایرکت صاحب استوری (سمت‌سرور؛ آفلاین ⇒ فالبک لوکال) */
  const sendReply = async (text: string, kind: 'text' | 'reaction') => {
    /* لایه‌ی دوم، نه فقط مخفی‌کردن دکمه. مهم است چون پایین‌تر یک فالبک
       محلی هست: اگر سرور «نه» بگوید، پاسخ در localStorage می‌نشیند و به
       کاربر «ارسال شد» نشان داده می‌شود. با پرچم خاموش، ۴۰۳ی سرور دقیقاً
       همان مسیر را فعال می‌کرد. */
    if (!interactionsOn) return;
    if (activeGroup === null || !text.trim() || !user) return;   // مهمان نمی‌تواند پاسخ بدهد
    const g = groups[activeGroup];
    const st = g?.stories[activeStory];
    if (!g || !st) return;
    const owner = g.ownerKey || g.userId.replace(/^(local|srv|store|api-club|api-seller|sample)-/, '');
    const dmKind = kind === 'reaction' ? 'reaction' : 'reply';
    const res = await sendDM({
      from: { key: ownerKey, name: meName(), role: roleInfo.label },
      to:   { key: owner,    name: g.userName, role: g.roleLabel },
      text: text.trim(), kind: dmKind, storyRef: st.id,
    });
    if (!(res as { ok?: boolean }).ok) {
      /* آفلاین ⇒ اینباکس لوکال */
      addStoryReply({ ownerKey: owner, storyId: st.id, fromName: meName(), fromRole: roleInfo.label, kind: kind === 'reaction' ? 'reaction' : 'text', text: text.trim(), caption: st.caption || undefined });
    }
    setReplySent(true);
    setTimeout(() => setReplySent(false), 2000);
  };

  const handleReaction = (emoji: string) => {
    setSentReaction(emoji); setShowEmojis(false);
    sendReply(emoji, 'reaction');
    setTimeout(() => setSentReaction(''), 2500);
  };

  const handleSendComment = () => {
    if (!comment.trim()) return;
    sendReply(comment, 'text');
    setComment('');
  };

  /* نه استوری‌ای هست و نه کاربر اجازه‌ی ساختن دارد ⇒ نوار خالی نشان
     نده. پیش‌تر این حالت پیش نمی‌آمد چون همیشه استوری‌های نمونه بودند. */
  if (groups.length === 0 && !(user && canPost)) return null;

  return (
    <>
      <style>{`
        .st-strip {
          display: flex; gap: 13px; overflow-x: auto;
          padding: 6px 2px 9px; scrollbar-width: none;
          -ms-overflow-style: none; direction: ltr;
        }
        .st-strip::-webkit-scrollbar { display: none; }
        .st-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 5px; cursor: pointer; flex-shrink: 0;
          transition: transform 0.22s cubic-bezier(0.4,0,0.2,1);
          background: none; border: none; padding: 0;
        }
        .st-item:hover { transform: translateY(-2px) scale(1.05); }
        .st-ring {
          padding: 3px; border-radius: 50%;
          transition: box-shadow 0.22s ease;
        }
        .st-item:hover .st-ring { box-shadow: 0 6px 20px rgba(0,0,0,0.36); }
        .st-inner {
          width: 67px; height: 67px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 24px; color: #fff;
          border: 2px solid rgba(4,2,10,0.55); overflow: hidden;
        }
        .st-name {
          font-size: 10px; font-weight: 600; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis; max-width: 79px;
          line-height: 1.2;
        }
      `}</style>

      <div className="st-strip">
        {/* Add story button — فقط نقش‌های واجد استوری (کاربر عادی نمی‌بیند) */}
        {user && canPost && (
          <div className="st-item" onClick={() => { setPostErr(''); setPosting(true); }} role="button">
            <div className="st-ring" style={{ background: 'rgba(199,166,106,0.16)', border: '1.5px dashed rgba(199,166,106,0.45)' }}>
              <div className="st-inner" style={{ background: 'rgba(199,166,106,0.08)', border: 'none' }}>
                <Plus size={18} style={{ color: '#C7A66A' }} />
              </div>
            </div>
            <span className="st-name" style={{ color: 'rgba(199,166,106,0.80)' }}>جدید</span>
          </div>
        )}

        {groups.map((g, i) => {
          const isSeen = seenGroups.has(g.userId) || g.allSeen || (g.stories.length > 0 && g.stories.every(s => seenIds.has(s.id)));
          const firstStory = g.stories[0];
          return (
            <button key={g.userId} className="st-item" onClick={() => openStory(i)}>
              <div className="st-ring" style={{
                background: isSeen
                  ? 'rgba(255,255,255,0.08)'
                  : 'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)',
                boxShadow: isSeen ? 'none' : '0 0 14px rgba(214,41,118,0.45)',
              }}>
                {/* عکس پروفایل؛ اگر نبود آدمک استاندارد — نه حرف اول نام.
                    این نوار روی صفحه‌ی اول است و یک حرف فارسی روی دایره‌ی
                    رنگی، هم ناخوانا بود هم ظاهر صفحه را می‌شکست.

                    `avatarOf` عکس زنده‌ی خود کاربر را بر `logoUrl`
                    ذخیره‌شده در استوری ترجیح می‌دهد: آن یکی عکس لحظه‌ی
                    انتشار است و با عوض‌کردن عکس پروفایل به‌روز نمی‌شد. */}
                <div className="st-inner" style={{ background: `linear-gradient(135deg,${g.roleColor}28,${g.roleColor}0E)`, padding: 0 }}>
                  <Avatar
                    src={avatarOf(g)}
                    alt={g.userName}
                    size={63}
                    background="transparent"
                    iconColor={isSeen ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.88)'}
                  />
                </div>
              </div>
              <span className="st-name" style={{ color: isSeen ? 'rgba(255,255,255,0.28)' : 'rgba(255,255,255,0.65)' }}>
                {g.userName}
              </span>
            </button>
          );
        })}
      </div>

      {mounted && activeGroup !== null && (
        <StoryViewer
          groups={groups.map(g => ({ ...g, avatarSrc: avatarOf(g) }))} activeGroup={activeGroup} activeStory={activeStory}
          liked={liked} showEmojis={showEmojis} comment={comment} sentReaction={sentReaction}
          paused={storyPaused} replySent={replySent} canReply={!!user} interactionsOn={interactionsOn}
          onClose={() => { closeStory(); setReplyFocus(false); }} onNext={nextStory} onPrev={prevStory}
          onLike={() => { setLiked(p => !p); if (!liked) handleReaction('❤️'); }}
          onReaction={handleReaction} onToggleEmojis={() => setShowEmojis(p => !p)}
          onComment={setComment} onSendComment={handleSendComment}
          onReplyFocus={() => setReplyFocus(true)} onReplyBlur={() => setReplyFocus(false)}
        />
      )}

      {/* Story composer — any logged-in role can post; appears in the strip instantly.
         با portal به body رندر می‌شود: کانتینر نوار استوری opacity وابسته به اسکرول دارد
         و stacking-context می‌سازد؛ بدون portal، با بازشدن کیبورد مودال محو و پشت هرو می‌افتاد. */}
      {mounted && posting && createPortal(
        <div onClick={() => setPosting(false)} style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, direction:'rtl' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'min(420px,94vw)', padding:22, boxShadow:'0 30px 80px rgba(0,0,0,0.4)', fontFamily:"'Vazirmatn',Tahoma,sans-serif" }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:'#111110', margin:0 }}>افزودن استوری</h3>
              <button onClick={() => setPosting(false)} aria-label="بستن" style={{ background:'none', border:'none', cursor:'pointer', color:'#888', display:'flex' }}><X size={18} /></button>
            </div>
            <div style={{ fontSize:12.5, color:'#777', marginBottom:12 }}>به‌عنوان <span style={{ color:roleInfo.color, fontWeight:800 }}>{roleInfo.label}</span> منتشر می‌شود و ۲۴ ساعت در نوار استوری صفحه‌ی اول نمایش داده می‌شود.</div>
            {/* شمارنده‌ی سقف روزانه */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, padding:'8px 12px', borderRadius:10, background:'rgba(199,166,106,0.08)', border:'1px solid rgba(199,166,106,0.22)' }}>
              <span style={{ fontSize:11.5, fontWeight:700, color:'#9A6E38' }}>سقف امروز:</span>
              <span style={{ fontSize:12, fontWeight:800, color:'#1C1B17' }}>{usedToday.toLocaleString('fa-IR')} از {dailyLimit.toLocaleString('fa-IR')}</span>
              <span style={{ marginInlineStart:'auto', display:'flex', gap:4 }}>
                {Array.from({ length: dailyLimit }).map((_, i) => (
                  <span key={i} style={{ width:8, height:8, borderRadius:'50%', background: i < usedToday ? '#C7A66A' : 'rgba(199,166,106,0.25)' }} />
                ))}
              </span>
            </div>
            {postErr && (
              <div style={{ fontSize:12, fontWeight:700, color:'#B23B2E', background:'rgba(178,59,46,0.07)', border:'1px solid rgba(178,59,46,0.25)', borderRadius:10, padding:'9px 12px', marginBottom:14 }}>{postErr}</div>
            )}
            {storyImg ? (
              <div style={{ position:'relative', borderRadius:14, overflow:'hidden', marginBottom:14, maxHeight:340, background:'#000', display:'flex', justifyContent:'center' }}>
                <img loading="lazy" decoding="async" src={storyImg} alt="" style={{ maxWidth:'100%', maxHeight:340, objectFit:'contain' }} />
                <button onClick={() => setStoryImg('')} aria-label="حذف" style={{ position:'absolute', top:8, insetInlineStart:8, width:30, height:30, borderRadius:'50%', background:'rgba(0,0,0,0.6)', border:'none', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}><X size={15} /></button>
              </div>
            ) : (
              <label style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:8, border:'1.5px dashed rgba(199,166,106,0.5)', borderRadius:14, padding:'34px 16px', cursor:'pointer', color:'#9A6E38', fontWeight:700, marginBottom:14 }}>
                <Plus size={26} style={{ color:'#C7A66A' }} />
                انتخاب تصویر استوری
                <input type="file" accept="image/*" hidden onChange={e => onStoryFile(e.target.files?.[0])} />
              </label>
            )}
            <input value={storyCaption} onChange={e => setStoryCaption(e.target.value)} placeholder="کپشن (اختیاری)..." style={{ width:'100%', padding:'10px 13px', border:'1px solid rgba(17,17,16,0.14)', borderRadius:10, fontSize:14, fontFamily:'inherit', outline:'none', marginBottom:16, direction:'rtl' }} />
            <button onClick={publishStory} disabled={!storyImg || publishing} style={{ width:'100%', padding:'12px', borderRadius:10, border:'1px solid rgba(199,166,106,0.34)', background: (storyImg && !publishing) ? 'rgba(199,166,106,0.14)' : 'rgba(17,17,16,0.05)', color: (storyImg && !publishing) ? '#9A6E38' : '#aaa', fontWeight:800, fontSize:14, cursor: (storyImg && !publishing) ? 'pointer' : 'not-allowed', fontFamily:'inherit' }}>{publishing ? 'در حال انتشار…' : 'انتشار استوری'}</button>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
