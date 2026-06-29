'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Heart, Send } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import api from '../lib/api';

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
  userRole: 'player' | 'coach' | 'club' | 'shop' | 'admin';
  roleColor: string;
  roleLabel: string;
  allSeen: boolean;
  stories: StoryItem[];
}

const sampleGroups: StoryGroup[] = [
  { userId:'1', userName:'باشگاه ستاره', userAvatar:'س', userRole:'club',   roleColor:'#C7A66A', roleLabel:'باشگاه', allSeen:false, stories:[{id:'1',caption:'میز جدید اسنوکر نصب شد 🎱',createdAt:'۲ ساعت پیش'},{id:'1b',caption:'رزرو آنلاین فعال شد ✅',createdAt:'۲ ساعت پیش'}] },
  { userId:'2', userName:'علی محمدی',    userAvatar:'ع', userRole:'player', roleColor:'#06b6d4', roleLabel:'بازیکن', allSeen:false, stories:[{id:'2a',caption:'تمرین امروز 💪',createdAt:'۳ ساعت پیش'},{id:'2b',caption:'آماده مسابقه‌ام!',createdAt:'۳ ساعت پیش'}] },
  { userId:'3', userName:'Predator Shop', userAvatar:'P', userRole:'shop',   roleColor:'#f59e0b', roleLabel:'فروشگاه', allSeen:false, stories:[{id:'3',caption:'تخفیف ۳۰٪ چوب‌های حرفه‌ای 🔥',createdAt:'۴ ساعت پیش'}] },
  { userId:'4', userName:'رضا احمدی',    userAvatar:'ر', userRole:'coach',  roleColor:'#a78bfa', roleLabel:'مربی',   allSeen:true,  stories:[{id:'4',caption:'کلاس آموزشی فردا ساعت ۱۰',createdAt:'۵ ساعت پیش'}] },
  { userId:'5', userName:'باشگاه المپیک', userAvatar:'ا', userRole:'club',   roleColor:'#C7A66A', roleLabel:'باشگاه', allSeen:true,  stories:[{id:'5',caption:'مسابقات هفتگی جمعه',createdAt:'۶ ساعت پیش'}] },
  { userId:'6', userName:'کاوه موسوی',   userAvatar:'ک', userRole:'player', roleColor:'#06b6d4', roleLabel:'بازیکن', allSeen:true,  stories:[{id:'6',caption:'قهرمان هفته 🏆',createdAt:'۸ ساعت پیش'}] },
];

const emojis = ['❤️','🔥','👏','😮','😂','🎱','💪','🏆'];
const bgGradients: Record<string,string> = {
  club:   'linear-gradient(160deg,#011a0f 0%,#022c22 50%,#065f46 100%)',
  player: 'linear-gradient(160deg,#060e1a 0%,#0c1f35 50%,#075985 100%)',
  coach:  'linear-gradient(160deg,#0e0520 0%,#1e0a3c 50%,#4c1d95 100%)',
  shop:   'linear-gradient(160deg,#100900 0%,#1c1000 50%,#78350f 100%)',
  admin:  'linear-gradient(160deg,#0f0303 0%,#1a0505 50%,#7f1d1d 100%)',
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

/* ── Story viewer ── */
function StoryViewer({ groups, activeGroup, activeStory, liked, showEmojis, comment, sentReaction, onClose, onNext, onPrev, onLike, onReaction, onToggleEmojis, onComment, onSendComment }: any) {
  const currentGroup = groups[activeGroup];
  const currentStory = currentGroup?.stories[activeStory];
  if (!currentGroup || !currentStory) return null;

  const hasMedia = !!currentStory.mediaUrl;

  return createPortal(
    <>
      <style>{`
        @keyframes storyModalIn { from{opacity:0;transform:translate(-50%,-50%) scale(0.88);}to{opacity:1;transform:translate(-50%,-50%) scale(1);} }
        @keyframes overlayFadeIn { from{opacity:0;}to{opacity:1;} }
        @keyframes storyProgress { from{width:0%;}to{width:100%;} }
        @keyframes reactionFloat {
          0%{opacity:1;transform:translateX(-50%) translateY(0) scale(0.5);}
          40%{opacity:1;transform:translateX(-50%) translateY(-50px) scale(1.6);}
          100%{opacity:0;transform:translateX(-50%) translateY(-100px) scale(1);}
        }
        .story-reaction-pop { position:absolute;bottom:140px;left:50%;font-size:48px;pointer-events:none;z-index:60;animation:reactionFloat 2.2s ease forwards; }
        .story-emoji-btn { font-size:24px;padding:10px;background:rgba(0,0,0,0.05);border:1px solid rgba(0,0,0,0.06);border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s ease; }
        .story-emoji-btn:hover { transform:scale(1.35);background:rgba(255,255,255,0.14); }
        .story-msg-input { flex:1;background:rgba(0,0,0,0.06);border:1px solid rgba(0,0,0,0.09);border-radius:100px;padding:11px 18px;color:#fff;font-size:13px;outline:none;font-family:inherit; }
        .story-msg-input::placeholder { color:rgba(255,255,255,0.3); }
        .story-msg-input:focus { background:rgba(0,0,0,0.09);border-color:rgba(255,255,255,0.2); }
        .story-icon-btn { width:42px;height:42px;border-radius:50%;border:1px solid rgba(0,0,0,0.09);background:rgba(0,0,0,0.06);cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:all .3s ease;color:#fff; }
        .story-icon-btn:hover { background:rgba(255,255,255,0.15);transform:scale(1.08); }
      `}</style>
      <div style={{ position:'fixed',inset:0,zIndex:99998,background:'rgba(0,0,0,0.85)',backdropFilter:'blur(20px)',animation:'overlayFadeIn .2s ease' }} onClick={onClose} />
      <div style={{ position:'fixed',top:'50%',left:'50%',transform:'translate(-50%,-50%)',zIndex:99999,width:'min(400px,94vw)',height:'min(700px,88vh)',borderRadius:'10px',overflow:'hidden',animation:'storyModalIn .3s cubic-bezier(.4,0,.2,1)',boxShadow:`0 40px 100px rgba(0,0,0,0.8),0 0 0 1px rgba(0,0,0,0.06),0 0 80px ${currentGroup.roleColor}25` }} onClick={e => e.stopPropagation()}>

        {/* Background — real media OR gradient */}
        {hasMedia ? (
          <div style={{ position:'absolute', inset:0 }}>
            {currentStory.mediaType === 'video'
              ? <video src={currentStory.mediaUrl} autoPlay muted playsInline loop style={{ width:'100%', height:'100%', objectFit:'cover' }} />
              : <img src={currentStory.mediaUrl} alt="story" style={{ width:'100%', height:'100%', objectFit:'cover' }} />}
            {/* Dark overlay so text/UI is readable */}
            <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(0,0,0,0.45) 0%, rgba(0,0,0,0) 35%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.6) 100%)' }} />
          </div>
        ) : (
          <div style={{ position:'absolute',inset:0,background:bgGradients[currentGroup.userRole]||bgGradients.player }}>
            <div style={{ position:'absolute',top:'-100px',left:'50%',transform:'translateX(-50%)',width:'350px',height:'350px',borderRadius:'50%',background:`radial-gradient(${currentGroup.roleColor}25,transparent 65%)`,pointerEvents:'none' }} />
            <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',fontSize:'154px',opacity:0.05,userSelect:'none',pointerEvents:'none' }}>🎱</div>
          </div>
        )}

        <div style={{ position:'absolute',inset:0,borderRadius:'10px',border:'1px solid rgba(0,0,0,0.08)',pointerEvents:'none',zIndex:55 }} />

        {/* Progress bars */}
        <div style={{ position:'absolute',top:'16px',left:'14px',right:'14px',display:'flex',gap:'5px',zIndex:50,direction:'ltr' }}>
          {currentGroup.stories.map((_: any,si: number) => (
            <div key={si} style={{ flex:1,height:'3px',background:'rgba(255,255,255,0.2)',borderRadius:'3px',overflow:'hidden' }}>
              {si < activeStory ? (
                <div style={{ width:'100%',height:'100%',background:'rgba(255,255,255,0.95)',borderRadius:'3px' }} />
              ) : si === activeStory ? (
                <div key={`p-${activeGroup}-${activeStory}`} style={{ height:'100%',background:'rgba(255,255,255,0.95)',borderRadius:'3px',boxShadow:'0 0 6px rgba(255,255,255,0.7)',animation:`storyProgress ${STORY_DURATION}ms linear forwards` }} />
              ) : null}
            </div>
          ))}
        </div>

        {/* Header */}
        <div style={{ position:'absolute',top:'30px',left:'14px',right:'14px',display:'flex',alignItems:'center',gap:'10px',zIndex:50,paddingTop:'6px' }}>
          <div style={{ width:'44px',height:'44px',borderRadius:'50%',flexShrink:0,background:`${currentGroup.roleColor}25`,border:`2px solid ${currentGroup.roleColor}80`,display:'flex',alignItems:'center',justifyContent:'center',fontWeight:900,color:'#fff',fontSize:'19px',boxShadow:`0 0 16px ${currentGroup.roleColor}50`,overflow:'hidden' }}>
            {currentGroup.logoUrl
              ? <img src={currentGroup.logoUrl} alt={currentGroup.userName} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
              : currentGroup.userAvatar}
          </div>
          <div style={{ flex:1 }}>
            <div style={{ color:'#fff',fontWeight:700,fontSize:'16px' }}>{currentGroup.userName}</div>
            <div style={{ color:'rgba(255,255,255,0.4)',fontSize:'13px' }}>{currentStory.createdAt}</div>
          </div>
          <span style={{ fontSize:'12px',color:currentGroup.roleColor,background:`${currentGroup.roleColor}18`,border:`1px solid ${currentGroup.roleColor}40`,borderRadius:'20px',padding:'4px 11px',fontWeight:700,backdropFilter:'blur(10px)',flexShrink:0 }}>{currentGroup.roleLabel}</span>
          <button onClick={onClose} style={{ width:'34px',height:'34px',borderRadius:'50%',background:'rgba(0,0,0,0.35)',border:'1px solid rgba(0,0,0,0.09)',cursor:'pointer',color:'rgba(255,255,255,0.8)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}><X size={15} /></button>
        </div>

        <button onClick={onPrev} style={{ position:'absolute',right:0,top:'95px',bottom:'140px',width:'38%',background:'transparent',border:'none',cursor:'pointer',zIndex:10 }} />
        <button onClick={onNext} style={{ position:'absolute',left:0,top:'95px',bottom:'140px',width:'38%',background:'transparent',border:'none',cursor:'pointer',zIndex:10 }} />

        {currentStory.caption && (
          <div style={{ position:'absolute',bottom:'130px',left:'16px',right:'16px',zIndex:20 }}>
            <div style={{ background:'rgba(0,0,0,0.5)',borderRadius:'18px',padding:'14px 18px',backdropFilter:'blur(16px)',border:'1px solid rgba(0,0,0,0.06)' }}>
              <p style={{ color:'#fff',fontSize:'17px',margin:0,lineHeight:1.7,fontWeight:500,direction:'rtl' }}>{currentStory.caption}</p>
            </div>
          </div>
        )}

        {sentReaction && <div className="story-reaction-pop">{sentReaction}</div>}
        {showEmojis && (
          <div style={{ position:'absolute',bottom:'135px',left:'16px',right:'16px',zIndex:40,background:'rgba(4,12,8,0.96)',borderRadius:'20px',padding:'16px',border:'1px solid rgba(0,0,0,0.06)',backdropFilter:'blur(24px)',display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'10px' }}>
            {emojis.map((e: string) => (<button key={e} className="story-emoji-btn" onClick={() => onReaction(e)}>{e}</button>))}
          </div>
        )}

        <div style={{ position:'absolute',bottom:0,left:0,right:0,zIndex:30,padding:'14px 16px 26px',background:'linear-gradient(to top,rgba(0,0,0,0.7) 0%,rgba(0,0,0,0.2) 70%,transparent 100%)' }}>
          <div style={{ display:'flex',gap:'8px',alignItems:'center' }}>
            <input className="story-msg-input" value={comment} onChange={e => onComment(e.target.value)} onKeyDown={e => e.key==='Enter' && onSendComment()} placeholder="پیام بفرست..." />
            <button className="story-icon-btn" onClick={onToggleEmojis} style={{ background:showEmojis?'rgba(199,166,106,0.2)':'rgba(0,0,0,0.06)',borderColor:showEmojis?'rgba(199,166,106,0.4)':'rgba(0,0,0,0.09)',fontSize:'22px' }}>😊</button>
            <button className="story-icon-btn" onClick={onLike} style={{ background:liked?'rgba(239,68,68,0.2)':'rgba(0,0,0,0.06)',borderColor:liked?'rgba(239,68,68,0.5)':'rgba(0,0,0,0.09)' }}>
              <Heart size={17} fill={liked?'#ef4444':'none'} style={{ color:liked?'#ef4444':'rgba(255,255,255,0.7)' }} />
            </button>
            {comment.trim() && (
              <button className="story-icon-btn" onClick={onSendComment} style={{ background:'rgba(199,166,106,0.15)',borderColor:'rgba(199,166,106,0.35)' }}>
                <Send size={16} style={{ color:'#C7A66A' }} />
              </button>
            )}
          </div>
        </div>
      </div>
    </>,
    document.body
  );
}

/* ── Stories strip ── */
export default function Stories() {
  const { user } = useAuthStore();
  const [groups, setGroups] = useState<StoryGroup[]>(sampleGroups);
  const [seenGroups, setSeenGroups] = useState<Set<string>>(new Set());
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const [activeStory, setActiveStory] = useState(0);
  const [liked, setLiked] = useState(false);
  const [showEmojis, setShowEmojis] = useState(false);
  const [comment, setComment] = useState('');
  const [sentReaction, setSentReaction] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fetch real clubs with active stories and prepend to groups
  useEffect(() => {
    api.get('/clubs').then(r => {
      const now = new Date();
      const apiGroups: StoryGroup[] = (r.data || [])
        .filter((c: any) => c.storyMediaUrl && c.storyExpiresAt && new Date(c.storyExpiresAt) > now)
        .map((c: any): StoryGroup => ({
          userId: `api-${c.id}`,
          userName: c.name,
          userAvatar: c.name?.[0] ?? '؟',
          logoUrl: c.logo || undefined,
          userRole: 'club',
          roleColor: '#C7A66A',
          roleLabel: 'باشگاه',
          allSeen: false,
          stories: [{
            id: `api-${c.id}-story`,
            caption: c.storyText || undefined,
            createdAt: relativeTime(c.storyExpiresAt),
            mediaUrl: c.storyMediaUrl,
            mediaType: c.storyType || 'image',
          }],
        }));
      if (apiGroups.length > 0) {
        setGroups([...apiGroups, ...sampleGroups]);
      }
    }).catch(() => {});
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
  };

  useEffect(() => {
    if (activeGroup === null) return;
    const timer = setTimeout(() => { nextStory(); }, STORY_DURATION);
    return () => clearTimeout(timer);
  }, [activeGroup, activeStory]);

  const handleReaction = (emoji: string) => {
    setSentReaction(emoji); setShowEmojis(false);
    setTimeout(() => setSentReaction(''), 2500);
  };

  return (
    <>
      <style>{`
        .st-strip {
          display: flex; gap: 14px; overflow-x: auto;
          padding: 6px 2px 10px; scrollbar-width: none;
          -ms-overflow-style: none; direction: ltr;
        }
        .st-strip::-webkit-scrollbar { display: none; }
        .st-item {
          display: flex; flex-direction: column; align-items: center;
          gap: 6px; cursor: pointer; flex-shrink: 0;
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
          width: 78px; height: 78px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-weight: 900; font-size: 28px; color: #fff;
          border: 2px solid rgba(4,2,10,0.55); overflow: hidden;
        }
        .st-name {
          font-size: 11px; font-weight: 600; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis; max-width: 88px;
          line-height: 1.2;
        }
      `}</style>

      <div className="st-strip">
        {/* Add story button */}
        {user && (
          <div className="st-item">
            <div className="st-ring" style={{ background: 'rgba(199,166,106,0.16)', border: '1.5px dashed rgba(199,166,106,0.45)' }}>
              <div className="st-inner" style={{ background: 'rgba(199,166,106,0.08)', border: 'none' }}>
                <Plus size={20} style={{ color: '#C7A66A' }} />
              </div>
            </div>
            <span className="st-name" style={{ color: 'rgba(199,166,106,0.80)' }}>جدید</span>
          </div>
        )}

        {groups.map((g, i) => {
          const isSeen = seenGroups.has(g.userId) || g.allSeen;
          const firstStory = g.stories[0];
          return (
            <button key={g.userId} className="st-item" onClick={() => openStory(i)}>
              <div className="st-ring" style={{
                background: isSeen
                  ? 'rgba(255,255,255,0.08)'
                  : `conic-gradient(from 135deg, ${g.roleColor} 0%, #06b6d4 50%, ${g.roleColor} 100%)`,
                boxShadow: isSeen ? 'none' : `0 0 14px ${g.roleColor}30`,
              }}>
                <div className="st-inner" style={{ background: `linear-gradient(135deg,${g.roleColor}28,${g.roleColor}0E)` }}>
                  {g.logoUrl
                    ? <img src={g.logoUrl} alt={g.userName} style={{ width:'100%',height:'100%',objectFit:'cover' }} />
                    : g.userAvatar}
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
          groups={groups} activeGroup={activeGroup} activeStory={activeStory}
          liked={liked} showEmojis={showEmojis} comment={comment} sentReaction={sentReaction}
          onClose={closeStory} onNext={nextStory} onPrev={prevStory}
          onLike={() => { setLiked(p => !p); if (!liked) handleReaction('❤️'); }}
          onReaction={handleReaction} onToggleEmojis={() => setShowEmojis(p => !p)}
          onComment={setComment} onSendComment={() => setComment('')}
        />
      )}
    </>
  );
}
