'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Plus, Heart, Send } from 'lucide-react';
import { useAuthStore } from '../store/auth.store';
import api from '../lib/api';
import { getStoredStories, addStoredStory, pickStoryRole, type StoredStory } from '../lib/story-store';

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
}

const sampleGroups: StoryGroup[] = [
  { userId:'shop-procue', userName:'پروکیو', userAvatar:'پ', userRole:'shop', roleColor:'#f59e0b', roleLabel:'فروشگاه', allSeen:false, stories:[{id:'procue-s1', caption:'جدیدترین کالکشن چوب‌های کربنی Predator رسید — همین حالا ببینید!', createdAt:'۱ ساعت پیش', mediaUrl:'/images/shop/Pro_table.jpg', mediaType:'image'}] },
  { userId:'1',   userName:'باشگاه ستاره',  userAvatar:'س', userRole:'club',    roleColor:'#C7A66A', roleLabel:'باشگاه',  allSeen:false, stories:[{id:'1',   caption:'میز جدید اسنوکر نصب شد 🎱',           createdAt:'۲ ساعت پیش', mediaUrl:'/images/shop/snooker-table.jpg', mediaType:'image'},{id:'1b',caption:'رزرو آنلاین فعال شد ✅',createdAt:'۲ ساعت پیش'}] },
  { userId:'c1',  userName:'احمد رضایی',    userAvatar:'ا', userRole:'coach',   roleColor:'#a78bfa', roleLabel:'مربی',    allSeen:false, stories:[{id:'c1s1', caption:'کلاس خصوصی اسنوکر فردا ساعت ۱۰ 🎱', createdAt:'۱ ساعت پیش', mediaUrl:'/images/shop/snooker-table.jpg', mediaType:'image'}] },
  { userId:'c7',  userName:'نیلوفر صادقی',  userAvatar:'ن', userRole:'coach',   roleColor:'#a78bfa', roleLabel:'مربی',    allSeen:false, stories:[{id:'c7s1', caption:'مسابقات بانوان این هفته 🏆',        createdAt:'۲ ساعت پیش', mediaUrl:'/images/shop/Ball-1.jpg',        mediaType:'image'}] },
  { userId:'c2',  userName:'حسین نوری',     userAvatar:'ح', userRole:'coach',   roleColor:'#a78bfa', roleLabel:'مربی',    allSeen:false, stories:[{id:'c2s1', caption:'تمرین گروهی امشب در باشگاه 🎱',    createdAt:'۲ ساعت پیش', mediaUrl:'/images/shop/cue_billiard_2.jpg',mediaType:'image'}] },
  { userId:'c3',  userName:'مریم کاظمی',    userAvatar:'م', userRole:'coach',   roleColor:'#a78bfa', roleLabel:'مربی',    allSeen:false, stories:[{id:'c3s1', caption:'کلاس پاکت بیلیارد بانوان شروع شد 🎱', createdAt:'۱ ساعت پیش', mediaUrl:'/images/shop/Ball-1.jpg',        mediaType:'image'}] },
  { userId:'c5',  userName:'علی حسینی',     userAvatar:'ع', userRole:'coach',   roleColor:'#a78bfa', roleLabel:'مربی',    allSeen:false, stories:[{id:'c5s1', caption:'تکنیک‌های پیشرفته هی‌بال 🎱',       createdAt:'۲ ساعت پیش', mediaUrl:'/images/shop/pool_chalk_1.jpg',  mediaType:'image'}] },
  { userId:'c9',  userName:'زهرا شریفی',    userAvatar:'ز', userRole:'coach',   roleColor:'#a78bfa', roleLabel:'مربی',    allSeen:false, stories:[{id:'c9s1', caption:'آموزش گام‌به‌گام پاکت بیلیارد ✅',   createdAt:'۳ ساعت پیش', mediaUrl:'/images/shop/Ball-1.jpg',        mediaType:'image'}] },
  { userId:'r1',  userName:'کاوه طالبی',    userAvatar:'ک', userRole:'referee', roleColor:'#0891b2', roleLabel:'داور',    allSeen:false, stories:[{id:'r1s1', caption:'آماده قضاوت فینال هفته آینده 🏆',  createdAt:'۱ ساعت پیش', mediaUrl:'/images/shop/snooker-table.jpg', mediaType:'image'}] },
  { userId:'2',   userName:'علی محمدی',     userAvatar:'ع', userRole:'player',  roleColor:'#06b6d4', roleLabel:'بازیکن',  allSeen:false, stories:[{id:'2a',   caption:'تمرین امروز 💪',                  createdAt:'۳ ساعت پیش'},{id:'2b',caption:'آماده مسابقه‌ام!',createdAt:'۳ ساعت پیش'}] },
  { userId:'3',   userName:'Predator Shop',  userAvatar:'P', userRole:'shop',    roleColor:'#f59e0b', roleLabel:'فروشگاه', allSeen:false, stories:[{id:'3',    caption:'تخفیف ۳۰٪ چوب‌های حرفه‌ای 🔥',      createdAt:'۴ ساعت پیش'}] },
  { userId:'c10', userName:'محسن طاهری',    userAvatar:'م', userRole:'coach',   roleColor:'#a78bfa', roleLabel:'مربی',    allSeen:false, stories:[{id:'c10s1',caption:'آموزش تکنیک‌های پیشرفته هی‌بال 🎱',createdAt:'۶ ساعت پیش', mediaUrl:'/images/shop/pool_chalk_1.jpg',  mediaType:'image'}] },
  { userId:'r5',  userName:'حامد موسوی',    userAvatar:'ح', userRole:'referee', roleColor:'#0891b2', roleLabel:'داور',    allSeen:false, stories:[{id:'r5s1', caption:'گواهینامه بین‌المللی تمدید شد ✅',  createdAt:'۳ ساعت پیش', mediaUrl:'/images/shop/cue_billiard_2.jpg',mediaType:'image'}] },
  { userId:'c4',  userName:'سینا محمدی',    userAvatar:'س', userRole:'coach',   roleColor:'#a78bfa', roleLabel:'مربی',    allSeen:true,  stories:[{id:'c4s1', caption:'برنامه هفتگی کلاس‌ها آپدیت شد ✅',  createdAt:'۳ ساعت پیش', mediaUrl:'/images/shop/pool_chalk_1.jpg',  mediaType:'image'}] },
  { userId:'c6',  userName:'رضا ابراهیمی',  userAvatar:'ر', userRole:'coach',   roleColor:'#a78bfa', roleLabel:'مربی',    allSeen:true,  stories:[{id:'c6s1', caption:'مسابقات ماه آینده آماده می‌شویم 🏆',createdAt:'۴ ساعت پیش', mediaUrl:'/images/shop/cue_billiard_2.jpg',mediaType:'image'}] },
  { userId:'c8',  userName:'کامران یوسفی',  userAvatar:'ک', userRole:'coach',   roleColor:'#a78bfa', roleLabel:'مربی',    allSeen:true,  stories:[{id:'c8s1', caption:'تمرین امروز عالی بود 💪',           createdAt:'۵ ساعت پیش', mediaUrl:'/images/shop/cue_billiard_2.jpg',mediaType:'image'}] },
  { userId:'5',   userName:'باشگاه المپیک', userAvatar:'ا', userRole:'club',    roleColor:'#C7A66A', roleLabel:'باشگاه',  allSeen:true,  stories:[{id:'5',    caption:'مسابقات هفتگی جمعه',              createdAt:'۶ ساعت پیش'}] },
  { userId:'r2',  userName:'نیلوفر حسینی',  userAvatar:'ن', userRole:'referee', roleColor:'#0891b2', roleLabel:'داور',    allSeen:true,  stories:[{id:'r2s1', caption:'مسابقات پاکت بیلیارد بانوان 🎱',   createdAt:'۷ ساعت پیش', mediaUrl:'/images/shop/Ball-1.jpg',        mediaType:'image'}] },
  { userId:'6',   userName:'کاوه موسوی',    userAvatar:'ک', userRole:'player',  roleColor:'#06b6d4', roleLabel:'بازیکن',  allSeen:true,  stories:[{id:'6',    caption:'قهرمان هفته 🏆',                  createdAt:'۸ ساعت پیش'}] },
];

const emojis = ['❤️','🔥','👏','😮','😂','🎱','💪','🏆'];
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

        <button onClick={onNext} style={{ position:'absolute',right:0,top:'95px',bottom:'140px',width:'38%',background:'transparent',border:'none',cursor:'pointer',zIndex:10 }} />
        <button onClick={onPrev} style={{ position:'absolute',left:0,top:'95px',bottom:'140px',width:'38%',background:'transparent',border:'none',cursor:'pointer',zIndex:10 }} />

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
  const [apiGroups, setApiGroups]     = useState<StoryGroup[]>([]);
  const [localGroups, setLocalGroups] = useState<StoryGroup[]>([]);
  const [seenGroups, setSeenGroups] = useState<Set<string>>(new Set());
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

  // user-posted stories first, then live club/seller API stories, then the sample strip
  const groups: StoryGroup[] = [...localGroups, ...apiGroups, ...sampleGroups];
  const roleInfo = pickStoryRole(user ? [user.primaryRole, ...(user.secondaryRoles ?? [])] : []);
  const reloadLocal = () => setLocalGroups(buildLocalGroups(getStoredStories()));

  useEffect(() => { setMounted(true); reloadLocal(); }, []);

  const onStoryFile = async (file?: File) => { if (file) setStoryImg(await compressStory(file)); };
  const publishStory = () => {
    if (!user || !storyImg) return;
    addStoredStory({
      id: `st-${Date.now()}-${Math.floor(Math.random() * 1e4)}`,
      ownerKey: user.phone || user.id || (user.firstName ?? 'user'),
      userName: `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || 'کاربر',
      roleKey: roleInfo.key, roleLabel: roleInfo.label, roleColor: roleInfo.color,
      avatar: (user.firstName ?? 'ک').charAt(0) || 'ک',
      logoUrl: user.avatar || undefined,
      mediaUrl: storyImg,
      caption: storyCaption.trim(),
      createdAt: Date.now(),
    });
    reloadLocal();
    setPosting(false); setStoryImg(''); setStoryCaption('');
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
        {/* Add story button */}
        {user && (
          <div className="st-item" onClick={() => setPosting(true)} role="button">
            <div className="st-ring" style={{ background: 'rgba(199,166,106,0.16)', border: '1.5px dashed rgba(199,166,106,0.45)' }}>
              <div className="st-inner" style={{ background: 'rgba(199,166,106,0.08)', border: 'none' }}>
                <Plus size={18} style={{ color: '#C7A66A' }} />
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
                  : 'linear-gradient(45deg, #feda75, #fa7e1e, #d62976, #962fbf, #4f5bd5)',
                boxShadow: isSeen ? 'none' : '0 0 14px rgba(214,41,118,0.45)',
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

      {/* Story composer — any logged-in role can post; appears in the strip instantly */}
      {mounted && posting && (
        <div onClick={() => setPosting(false)} style={{ position:'fixed', inset:0, zIndex:99999, background:'rgba(0,0,0,0.6)', backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:16, direction:'rtl' }}>
          <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:20, width:'min(420px,94vw)', padding:22, boxShadow:'0 30px 80px rgba(0,0,0,0.4)', fontFamily:"'Vazirmatn',Tahoma,sans-serif" }}>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:14 }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:'#111110', margin:0 }}>افزودن استوری</h3>
              <button onClick={() => setPosting(false)} aria-label="بستن" style={{ background:'none', border:'none', cursor:'pointer', color:'#888', display:'flex' }}><X size={18} /></button>
            </div>
            <div style={{ fontSize:12.5, color:'#777', marginBottom:14 }}>به‌عنوان <span style={{ color:roleInfo.color, fontWeight:800 }}>{roleInfo.label}</span> منتشر می‌شود و ۲۴ ساعت در نوار استوری صفحه‌ی اول نمایش داده می‌شود.</div>
            {storyImg ? (
              <div style={{ position:'relative', borderRadius:14, overflow:'hidden', marginBottom:14, maxHeight:340, background:'#000', display:'flex', justifyContent:'center' }}>
                <img src={storyImg} alt="" style={{ maxWidth:'100%', maxHeight:340, objectFit:'contain' }} />
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
            <button onClick={publishStory} disabled={!storyImg} style={{ width:'100%', padding:'12px', borderRadius:10, border:'1px solid rgba(199,166,106,0.34)', background: storyImg ? 'rgba(199,166,106,0.14)' : 'rgba(17,17,16,0.05)', color: storyImg ? '#9A6E38' : '#aaa', fontWeight:800, fontSize:14, cursor: storyImg ? 'pointer' : 'not-allowed', fontFamily:'inherit' }}>انتشار استوری</button>
          </div>
        </div>
      )}
    </>
  );
}
