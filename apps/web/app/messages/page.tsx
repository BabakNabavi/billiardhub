'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';
import AuthGuard from '../../components/AuthGuard';
import {
  Search, Send, Paperclip, Image, Smile, MoreVertical,
  ChevronRight, Check, CheckCheck, Circle, X, Phone,
  Video, Star, Shield, Trophy, ShoppingBag, Calendar,
  ArrowLeft, Mic, Plus, MessageCircle,
} from 'lucide-react';

/* ══ types ══ */
type ConvType = 'direct' | 'coach' | 'club' | 'seller' | 'booking' | 'tournament';
type MsgStatus = 'sent' | 'delivered' | 'read';

interface Message {
  id: string;
  senderId: string;
  text: string;
  time: string;
  status: MsgStatus;
  type: 'text' | 'image' | 'booking' | 'system';
  attachment?: { name: string; size: string; type: string };
  bookingCard?: { club: string; date: string; time: string; status: string };
}

interface Conversation {
  id: string;
  type: ConvType;
  name: string;
  subtitle: string;
  avatar: string;
  avatarColor: string;
  lastMsg: string;
  lastTime: string;
  unread: number;
  online: boolean;
  verified: boolean;
  pinned?: boolean;
  messages: Message[];
}

/* ══ sample data ══ */
const ME = 'me';

const CONVS: Conversation[] = [
  {
    id: 'c1', type: 'coach', name: 'استاد کاوه نوری', subtitle: 'مربی ارشد اسنوکر',
    avatar: 'ک', avatarColor: '#a78bfa', lastMsg: 'فردا جلسه رو یادت نره', lastTime: '۱۴:۳۲',
    unread: 2, online: true, verified: true, pinned: true,
    messages: [
      { id: 'm1', senderId: 'c1', text: 'سلام. نتیجه مسابقه امروز چی شد؟', time: '۱۳:۱۰', status: 'read', type: 'text' },
      { id: 'm2', senderId: ME,   text: 'سلام استاد. ۶-۳ بردم', time: '۱۳:۱۵', status: 'read', type: 'text' },
      { id: 'm3', senderId: 'c1', text: 'عالی! پوزیشن‌بازی‌ات خیلی بهتر شده. ادامه بده', time: '۱۳:۲۰', status: 'read', type: 'text' },
      { id: 'm4', senderId: ME,   text: 'ممنون. تمرین‌های شما خیلی کمک کرد', time: '۱۳:۲۵', status: 'read', type: 'text' },
      { id: 'm5', senderId: 'c1', text: 'فردا جلسه رو یادت نره', time: '۱۴:۳۲', status: 'delivered', type: 'text' },
      { id: 'm6', senderId: 'c1', text: 'ساعت ۱۰ صبح باشگاه سنچوری', time: '۱۴:۳۲', status: 'delivered', type: 'text' },
    ],
  },
  {
    id: 'c2', type: 'club', name: 'باشگاه سنچوری تهران', subtitle: 'مدیریت باشگاه',
    avatar: 'س', avatarColor: '#10b981', lastMsg: 'رزرو شما تأیید شد', lastTime: '۱۱:۰۵',
    unread: 1, online: true, verified: true,
    messages: [
      { id: 'm1', senderId: 'c2', text: 'سلام. رزرو شما برای فردا ساعت ۱۸:۰۰ ثبت شد', time: '۱۰:۰۰', status: 'read', type: 'text' },
      { id: 'm2', senderId: ME,   text: 'ممنون. میز VIP هست؟', time: '۱۰:۰۵', status: 'read', type: 'text' },
      {
        id: 'm3', senderId: 'c2', text: '', time: '۱۰:۱۰', status: 'read', type: 'booking',
        bookingCard: { club: 'باشگاه سنچوری', date: '۱۴۰۴/۰۳/۲۰', time: '۱۸:۰۰ – ۲۰:۰۰', status: 'confirmed' },
      },
      { id: 'm4', senderId: 'c2', text: 'رزرو شما تأیید شد', time: '۱۱:۰۵', status: 'delivered', type: 'text' },
    ],
  },
  {
    id: 'c3', type: 'seller', name: 'فروشگاه بیلیارد پلاس', subtitle: 'فروشنده تجهیزات',
    avatar: 'ف', avatarColor: '#f59e0b', lastMsg: 'سفارش شما ارسال شد 📦', lastTime: 'دیروز',
    unread: 0, online: false, verified: true,
    messages: [
      { id: 'm1', senderId: ME,   text: 'سلام. چوب Predator 314-3 موجوده؟', time: 'دیروز ۱۵:۳۰', status: 'read', type: 'text' },
      { id: 'm2', senderId: 'c3', text: 'بله موجوده. قیمت ۹.۶ میلیون با ۲۰٪ تخفیف', time: 'دیروز ۱۵:۳۵', status: 'read', type: 'text' },
      { id: 'm3', senderId: ME,   text: 'ارسال به تهران چند روز طول میکشه؟', time: 'دیروز ۱۵:۴۰', status: 'read', type: 'text' },
      { id: 'm4', senderId: 'c3', text: '۱-۲ روز کاری با پیک فوری', time: 'دیروز ۱۵:۴۵', status: 'read', type: 'text' },
      { id: 'm5', senderId: ME,   text: 'باشه سفارش میدم', time: 'دیروز ۱۶:۰۰', status: 'read', type: 'text' },
      { id: 'm6', senderId: 'c3', text: 'سفارش شما ارسال شد 📦', time: 'دیروز ۱۸:۳۰', status: 'read', type: 'text' },
    ],
  },
  {
    id: 'c4', type: 'direct', name: 'رضا کریمی', subtitle: 'بازیکن رنک ۴',
    avatar: 'ر', avatarColor: '#06b6d4', lastMsg: 'آماده‌ای برای فردا؟', lastTime: 'دیروز',
    unread: 0, online: false, verified: false,
    messages: [
      { id: 'm1', senderId: 'c4', text: 'هی رفیق! بازی فردا یادت نره', time: 'دیروز ۱۲:۰۰', status: 'read', type: 'text' },
      { id: 'm2', senderId: ME,   text: 'آره. ساعت چنده؟', time: 'دیروز ۱۲:۰۵', status: 'read', type: 'text' },
      { id: 'm3', senderId: 'c4', text: '۱۴:۰۰ میدان ملی', time: 'دیروز ۱۲:۰۸', status: 'read', type: 'text' },
      { id: 'm4', senderId: 'c4', text: 'آماده‌ای برای فردا؟', time: 'دیروز ۲۰:۱۵', status: 'read', type: 'text' },
    ],
  },
  {
    id: 'c5', type: 'tournament', name: 'لیگ برتر اسنوکر ۱۴۰۴', subtitle: 'اطلاعیه رسمی',
    avatar: '🏆', avatarColor: '#f59e0b', lastMsg: 'برنامه نیمه‌نهایی اعلام شد', lastTime: '۲ روز پیش',
    unread: 0, online: false, verified: true,
    messages: [
      { id: 'm1', senderId: 'c5', text: '🎉 شما به نیمه‌نهایی صعود کردید!', time: '۲ روز پیش', status: 'read', type: 'system' },
      { id: 'm2', senderId: 'c5', text: 'برنامه نیمه‌نهایی: ۱۵ خرداد ساعت ۱۶:۰۰', time: '۲ روز پیش', status: 'read', type: 'system' },
      { id: 'm3', senderId: 'c5', text: 'برنامه نیمه‌نهایی اعلام شد', time: '۲ روز پیش', status: 'read', type: 'text' },
    ],
  },
];

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

const TYPE_CONFIG: Record<ConvType, { icon: React.ReactNode; color: string; label: string }> = {
  direct:     { icon: <MessageCircle size={11} />, color: '#06b6d4', label: 'پیام مستقیم' },
  coach:      { icon: <Star size={11} />,          color: '#a78bfa', label: 'مربی' },
  club:       { icon: <Shield size={11} />,        color: '#10b981', label: 'باشگاه' },
  seller:     { icon: <ShoppingBag size={11} />,   color: '#f59e0b', label: 'فروشنده' },
  booking:    { icon: <Calendar size={11} />,      color: '#10b981', label: 'رزرو' },
  tournament: { icon: <Trophy size={11} />,        color: '#f59e0b', label: 'مسابقه' },
};

/* ══ Message Bubble ══ */
function MsgBubble({ msg, isMe }: { msg: Message; isMe: boolean }) {
  if (msg.type === 'system') return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0' }}>
      <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '6px 16px', fontSize: '12px', color: 'rgba(245,158,11,0.8)', fontWeight: 600, maxWidth: '80%', textAlign: 'center' }}>
        {msg.text}
      </div>
    </div>
  );

  if (msg.type === 'booking' && msg.bookingCard) return (
    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-start' : 'flex-end', margin: '4px 0' }}>
      <div style={{ maxWidth: '280px', background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: '16px', overflow: 'hidden' }}>
        <div style={{ background: 'linear-gradient(135deg,#064e3b,#065f46)', padding: '12px 14px' }}>
          <div style={{ fontSize: '9px', color: 'rgba(255,255,255,0.5)', letterSpacing: '0.15em', fontWeight: 700, marginBottom: '4px' }}>تأییدیه رزرو</div>
          <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff' }}>{msg.bookingCard.club}</div>
        </div>
        <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {[
            { l: 'تاریخ', v: msg.bookingCard.date },
            { l: 'ساعت',  v: msg.bookingCard.time },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px' }}>
              <span style={{ color: 'rgba(240,250,245,0.4)' }}>{r.l}</span>
              <span style={{ color: '#f0faf5', fontWeight: 600 }}>{r.v}</span>
            </div>
          ))}
          <div style={{ marginTop: '4px', padding: '5px 10px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: '20px', fontSize: '10px', color: '#10b981', fontWeight: 700, textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <Check size={10} /> تأیید شده
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', justifyContent: isMe ? 'flex-start' : 'flex-end', margin: '3px 0', animation: 'msgIn 0.25s cubic-bezier(0.22,1,0.36,1) both' }}>
      <div style={{
        maxWidth: '72%',
        padding: '10px 14px',
        borderRadius: isMe ? '18px 18px 18px 4px' : '18px 18px 4px 18px',
        background: isMe
          ? 'rgba(255,255,255,0.06)'
          : 'linear-gradient(135deg,#10b981,#059669)',
        border: isMe ? '1px solid rgba(255,255,255,0.08)' : 'none',
        boxShadow: isMe ? 'none' : '0 4px 16px rgba(16,185,129,0.25)',
        position: 'relative',
      }}>
        <p style={{ fontSize: '14px', color: isMe ? 'rgba(240,250,245,0.8)' : '#fff', margin: 0, lineHeight: 1.55, wordBreak: 'break-word' }}>
          {msg.text}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px', justifyContent: isMe ? 'flex-start' : 'flex-end' }}>
          <span style={{ fontSize: '10px', color: isMe ? 'rgba(240,250,245,0.25)' : 'rgba(255,255,255,0.5)' }}>{msg.time}</span>
          {!isMe && (
            msg.status === 'read'      ? <CheckCheck size={12} style={{ color: 'rgba(255,255,255,0.7)' }} /> :
            msg.status === 'delivered' ? <CheckCheck size={12} style={{ color: 'rgba(255,255,255,0.4)' }} /> :
                                         <Check size={12} style={{ color: 'rgba(255,255,255,0.4)' }} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ══ Conversation Item ══ */
function ConvItem({ conv, active, onClick }: { conv: Conversation; active: boolean; onClick: () => void }) {
  const cfg = TYPE_CONFIG[conv.type];
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 16px', cursor: 'pointer', borderRadius: '14px',
      background: active ? 'rgba(16,185,129,0.08)' : 'transparent',
      border: `1px solid ${active ? 'rgba(16,185,129,0.2)' : 'transparent'}`,
      transition: 'all 0.2s',
      position: 'relative',
    }}
      onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.03)'; }}
      onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>

      {/* Avatar */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: `linear-gradient(135deg,${conv.avatarColor},${conv.avatarColor}90)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: conv.avatar.length > 1 ? '20px' : '18px', fontWeight: 900, color: '#fff', boxShadow: active ? `0 0 14px ${conv.avatarColor}40` : 'none', transition: 'box-shadow 0.3s' }}>
          {conv.avatar}
        </div>
        {/* Online dot */}
        {conv.online && (
          <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '11px', height: '11px', borderRadius: '50%', background: '#10b981', border: '2px solid rgba(6,13,10,0.98)', boxShadow: '0 0 6px #10b981' }} />
        )}
        {/* Type badge */}
        <div style={{ position: 'absolute', top: '-3px', left: '-3px', width: '18px', height: '18px', borderRadius: '6px', background: `${cfg.color}20`, border: `1px solid ${cfg.color}35`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color }}>
          {cfg.icon}
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', minWidth: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: conv.unread > 0 ? 800 : 600, color: active ? '#10b981' : '#f0faf5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {conv.name}
            </span>
            {conv.verified && <Check size={11} style={{ color: '#10b981', flexShrink: 0 }} />}
            {conv.pinned && <span style={{ fontSize: '9px' }}>📌</span>}
          </div>
          <span style={{ fontSize: '10px', color: 'rgba(240,250,245,0.25)', flexShrink: 0, marginRight: '4px' }}>{conv.lastTime}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: '12px', color: conv.unread > 0 ? 'rgba(240,250,245,0.65)' : 'rgba(240,250,245,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: conv.unread > 0 ? 600 : 400 }}>
            {conv.lastMsg}
          </span>
          {conv.unread > 0 && (
            <div style={{ flexShrink: 0, minWidth: '20px', height: '20px', borderRadius: '10px', background: 'linear-gradient(135deg,#10b981,#059669)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 900, color: '#fff', padding: '0 5px', boxShadow: '0 4px 10px rgba(16,185,129,0.4)' }}>
              {toFa(conv.unread)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ══ MAIN ══ */
function MessagesContent() {
  const { user } = useAuthStore();
  const [convs, setConvs]           = useState<Conversation[]>(CONVS);
  const [activeId, setActiveId]     = useState<string | null>('c1');
  const [input, setInput]           = useState('');
  const [search, setSearch]         = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [mobileList, setMobileList] = useState(true);
  const [typing, setTyping]         = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef       = useRef<HTMLInputElement>(null);

  const activeConv = convs.find(c => c.id === activeId) ?? null;
  const filtered   = convs.filter(c =>
    !search || c.name.includes(search) || c.lastMsg.includes(search)
  );
  const totalUnread = convs.reduce((a, c) => a + c.unread, 0);

  /* scroll to bottom */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeId, activeConv?.messages.length]);

  /* mark as read when opening */
  useEffect(() => {
    if (!activeId) return;
    setConvs(prev => prev.map(c => c.id === activeId ? { ...c, unread: 0 } : c));
  }, [activeId]);

  /* simulate typing indicator */
  useEffect(() => {
    if (!activeConv) return;
    const t = setTimeout(() => setTyping(false), 3000);
    return () => clearTimeout(t);
  }, [activeConv]);

  const sendMessage = useCallback(() => {
    if (!input.trim() || !activeId) return;
    const newMsg: Message = {
      id: `m_${Date.now()}`,
      senderId: ME,
      text: input.trim(),
      time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
      type: 'text',
    };
    setConvs(prev => prev.map(c => c.id === activeId
      ? { ...c, messages: [...c.messages, newMsg], lastMsg: input.trim(), lastTime: newMsg.time }
      : c
    ));
    setInput('');
    setTyping(true);
    // simulate reply
    setTimeout(() => {
      setTyping(false);
      const reply: Message = {
        id: `r_${Date.now()}`,
        senderId: activeId,
        text: 'پیامت رو دریافت کردم. به زودی جواب میدم.',
        time: new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
        type: 'text',
      };
      setConvs(prev => prev.map(c => c.id === activeId
        ? { ...c, messages: [...c.messages, reply], lastMsg: reply.text, lastTime: reply.time }
        : c
      ));
    }, 2000 + Math.random() * 1500);
  }, [input, activeId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const openConv = (id: string) => {
    setActiveId(id);
    setMobileList(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const cfg = activeConv ? TYPE_CONFIG[activeConv.type] : null;

  return (
    <>
      <style>{`
        @keyframes msgIn    { from{opacity:0;transform:translateY(8px) scale(0.97);}to{opacity:1;transform:none;} }
        @keyframes typing   { 0%,100%{transform:translateY(0);}50%{transform:translateY(-4px);} }
        @keyframes fadeUp   { from{opacity:0;transform:translateY(12px);}to{opacity:1;transform:none;} }
        @keyframes pulse    { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes shimmer  { from{background-position:-200% center;}to{background-position:200% center;} }

        .msg-input {
          flex:1; background:transparent; border:none; outline:none;
          color:#f0faf5; font-size:14px; font-family:inherit;
          resize:none; line-height:1.5;
        }
        .msg-input::placeholder { color:rgba(240,250,245,0.22); }

        .icon-btn {
          width:36px; height:36px; border-radius:10px;
          background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07);
          cursor:pointer; color:rgba(240,250,245,0.45);
          display:flex; align-items:center; justify-content:center;
          transition:all 0.2s; flex-shrink:0;
        }
        .icon-btn:hover { background:rgba(255,255,255,0.08); color:rgba(240,250,245,0.8); }

        .send-btn {
          width:46px; height:46px; border-radius:13px; border:none;
          background:linear-gradient(135deg,#10b981,#059669);
          color:#fff; cursor:pointer; display:flex; align-items:center;
          justify-content:center; transition:all 0.3s; flex-shrink:0;
          box-shadow:0 6px 18px rgba(16,185,129,0.3);
        }
        .send-btn:hover { transform:scale(1.05); box-shadow:0 8px 24px rgba(16,185,129,0.45); }
        .send-btn:active { transform:scale(0.95); }
        .send-btn:disabled { opacity:0.4; cursor:not-allowed; transform:none; box-shadow:none; }

        .typing-dot { width:6px; height:6px; border-radius:50%; background:rgba(240,250,245,0.4); animation:typing 1.2s ease infinite; }

        ::-webkit-scrollbar { width:4px; }
        ::-webkit-scrollbar-track { background:transparent; }
        ::-webkit-scrollbar-thumb { background:rgba(255,255,255,0.08); border-radius:2px; }

        @media(min-width:769px) {
          .mobile-back-btn { display:none !important; }
          .conv-list-panel { display:flex !important; }
          .chat-panel { display:flex !important; }
        }
        @media(max-width:768px) {
          .messages-layout { grid-template-columns:1fr !important; }
        }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(180deg,#020806,#060d0a)', display: 'flex', flexDirection: 'column' }}>

        {/* ── Top bar ── */}
        <div style={{ background: 'rgba(2,8,6,0.98)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '0 clamp(16px,3vw,32px)', position: 'sticky', top: '62px', zIndex: 90, backdropFilter: 'blur(24px)' }}>
          <div style={{ maxWidth: '1280px', margin: '0 auto', height: '52px', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ position: 'relative' }}>
                <MessageCircle size={20} style={{ color: '#10b981' }} />
                {totalUnread > 0 && (
                  <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: '16px', height: '16px', borderRadius: '50%', background: '#ef4444', fontSize: '9px', fontWeight: 900, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 8px rgba(239,68,68,0.5)' }}>
                    {toFa(totalUnread)}
                  </div>
                )}
              </div>
              <div>
                <div style={{ fontSize: '9px', color: 'rgba(16,185,129,0.6)', letterSpacing: '0.2em', fontWeight: 700 }}>MESSAGES</div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', letterSpacing: '-0.01em' }}>پیام‌ها</div>
              </div>
            </div>
            <div style={{ marginRight: 'auto', fontSize: '12px', color: 'rgba(240,250,245,0.3)' }}>
              {toFa(convs.length)} مکالمه
            </div>
            <button className="icon-btn"><Plus size={15} /></button>
          </div>
        </div>

        {/* ── Main layout ── */}
        <div style={{ flex: 1, maxWidth: '1280px', width: '100%', margin: '0 auto', padding: 'clamp(16px,3vw,24px)', display: 'flex', gap: '0', minHeight: 0, height: 'calc(100vh - 114px)' }}>
          <div className="messages-layout" style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '16px', width: '100%', height: '100%' }}>

            {/* ══ CONVERSATION LIST ══ */}
            <div className="conv-list-panel"
              style={{ display: (mobileList || window?.innerWidth > 768) ? 'flex' : 'none', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '22px', overflow: 'hidden' }}>

              {/* Search */}
              <div style={{ padding: '14px 14px 10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.04)', border: `1px solid ${searchFocus ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.08)'}`, borderRadius: '12px', padding: '10px 14px', transition: 'all 0.2s' }}>
                  <Search size={14} style={{ color: 'rgba(240,250,245,0.25)', flexShrink: 0 }} />
                  <input
                    value={search} onChange={e => setSearch(e.target.value)}
                    onFocus={() => setSearchFocus(true)} onBlur={() => setSearchFocus(false)}
                    placeholder="جستجو در مکالمات..."
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#f0faf5', fontSize: '13px', fontFamily: 'inherit' }} />
                  {search && <button onClick={() => setSearch('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,250,245,0.3)', padding: 0, display: 'flex' }}><X size={12} /></button>}
                </div>
              </div>

              {/* Filter chips */}
              <div style={{ padding: '0 14px 10px', display: 'flex', gap: '6px', overflowX: 'auto' }}>
                {[{l:'همه',k:'all'},{l:'مربیان',k:'coach'},{l:'باشگاه‌ها',k:'club'},{l:'فروشندگان',k:'seller'}].map((f,i) => (
                  <button key={i} style={{ padding: '5px 13px', borderRadius: '20px', fontSize: '11px', fontWeight: 600, border: '1px solid', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.2s', background: i === 0 ? 'rgba(16,185,129,0.1)' : 'transparent', borderColor: i === 0 ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)', color: i === 0 ? '#10b981' : 'rgba(240,250,245,0.4)' }}>
                    {f.l}
                  </button>
                ))}
              </div>

              {/* List */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '0 10px 10px' }}>
                {/* Pinned */}
                {filtered.filter(c => c.pinned).length > 0 && (
                  <div style={{ padding: '8px 6px 4px', fontSize: '10px', color: 'rgba(240,250,245,0.25)', fontWeight: 700, letterSpacing: '0.1em' }}>📌 پین شده</div>
                )}
                {filtered.filter(c => c.pinned).map(c => <ConvItem key={c.id} conv={c} active={activeId === c.id} onClick={() => openConv(c.id)} />)}

                {/* All */}
                {filtered.filter(c => c.pinned).length > 0 && (
                  <div style={{ padding: '10px 6px 4px', fontSize: '10px', color: 'rgba(240,250,245,0.25)', fontWeight: 700, letterSpacing: '0.1em' }}>همه مکالمات</div>
                )}
                {filtered.filter(c => !c.pinned).map(c => <ConvItem key={c.id} conv={c} active={activeId === c.id} onClick={() => openConv(c.id)} />)}

                {filtered.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '40px 16px', color: 'rgba(240,250,245,0.25)', fontSize: '13px' }}>
                    <MessageCircle size={28} style={{ margin: '0 auto 10px', opacity: 0.2 }} />
                    مکالمه‌ای یافت نشد
                  </div>
                )}
              </div>
            </div>

            {/* ══ CHAT PANEL ══ */}
            <div className="chat-panel"
              style={{ display: (!mobileList || window?.innerWidth > 768) ? 'flex' : 'none', flexDirection: 'column', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '22px', overflow: 'hidden' }}>

              {!activeConv ? (
                /* Empty state */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', color: 'rgba(240,250,245,0.25)', animation: 'fadeUp 0.4s ease both' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '24px', background: 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MessageCircle size={36} style={{ color: 'rgba(16,185,129,0.3)' }} />
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: 'rgba(240,250,245,0.4)', marginBottom: '6px' }}>یک مکالمه انتخاب کنید</div>
                    <div style={{ fontSize: '13px' }}>یا گفتگوی جدیدی شروع کنید</div>
                  </div>
                  <button style={{ padding: '10px 24px', background: 'linear-gradient(135deg,#10b981,#059669)', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', boxShadow: '0 6px 18px rgba(16,185,129,0.3)', display: 'flex', alignItems: 'center', gap: '7px' }}>
                    <Plus size={14} /> پیام جدید
                  </button>
                </div>
              ) : (
                <>
                  {/* Chat header */}
                  <div style={{ padding: '14px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '12px', flexShrink: 0, background: 'rgba(255,255,255,0.01)' }}>

                    {/* Mobile back */}
                    <button className="mobile-back-btn" onClick={() => setMobileList(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,250,245,0.5)', padding: 0, display: 'none', alignItems: 'center' }}>
                      <ChevronRight size={20} />
                    </button>

                    {/* Avatar */}
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <div style={{ width: '42px', height: '42px', borderRadius: '13px', background: `linear-gradient(135deg,${activeConv.avatarColor},${activeConv.avatarColor}90)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: activeConv.avatar.length > 1 ? '18px' : '16px', fontWeight: 900, color: '#fff' }}>
                        {activeConv.avatar}
                      </div>
                      {activeConv.online && <div style={{ position: 'absolute', bottom: '1px', right: '1px', width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', border: '2px solid rgba(6,13,10,0.98)', boxShadow: '0 0 6px #10b981' }} />}
                    </div>

                    {/* Name */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
                        <span style={{ fontSize: '15px', fontWeight: 800, color: '#f0faf5', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{activeConv.name}</span>
                        {activeConv.verified && <Check size={12} style={{ color: '#10b981', flexShrink: 0 }} />}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px' }}>
                        {cfg && <span style={{ color: cfg.color, display: 'flex', alignItems: 'center', gap: '3px' }}>{cfg.icon}{cfg.label}</span>}
                        <span style={{ color: 'rgba(240,250,245,0.2)' }}>·</span>
                        <span style={{ color: activeConv.online ? '#10b981' : 'rgba(240,250,245,0.3)' }}>
                          {activeConv.online ? 'آنلاین' : 'آخرین بازدید: ' + activeConv.lastTime}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                      <button className="icon-btn"><Phone size={15} /></button>
                      <button className="icon-btn"><Video size={15} /></button>
                      <button className="icon-btn"><MoreVertical size={15} /></button>
                    </div>
                  </div>

                  {/* Messages */}
                  <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 8px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                    {activeConv.messages.map((msg, i) => {
                      const isMe = msg.senderId === ME;
                      const showDate = i === 0 || activeConv.messages[i-1]?.time !== msg.time;
                      return (
                        <div key={msg.id}>
                          {showDate && i === 0 && (
                            <div style={{ display: 'flex', justifyContent: 'center', margin: '8px 0 14px' }}>
                              <span style={{ fontSize: '10px', color: 'rgba(240,250,245,0.25)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '20px', padding: '4px 12px' }}>
                                امروز
                              </span>
                            </div>
                          )}
                          <MsgBubble msg={msg} isMe={isMe} />
                        </div>
                      );
                    })}

                    {/* Typing indicator */}
                    {typing && (
                      <div style={{ display: 'flex', justifyContent: 'flex-end', margin: '6px 0', animation: 'fadeUp 0.25s ease both' }}>
                        <div style={{ display: 'flex', gap: '5px', padding: '12px 16px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px 18px 4px 18px', alignItems: 'center' }}>
                          {[0,1,2].map(i => (
                            <div key={i} className="typing-dot" style={{ animationDelay: `${i * 0.2}s` }} />
                          ))}
                        </div>
                      </div>
                    )}

                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input area */}
                  <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,0.05)', flexShrink: 0, background: 'rgba(255,255,255,0.01)' }}>

                    {/* Quick replies */}
                    <div style={{ display: 'flex', gap: '7px', overflowX: 'auto', marginBottom: '10px', paddingBottom: '4px' }}>
                      {['👍 باشه', '🕐 بعداً پیام میدم', '✅ تأیید میکنم', '❓ توضیح بیشتر'].map((q, i) => (
                        <button key={i} onClick={() => setInput(q.replace(/^[\u{1F300}-\u{1F9FF}]\s/u,''))}
                          style={{ padding: '5px 12px', borderRadius: '20px', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(240,250,245,0.5)', fontSize: '11px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', transition: 'all 0.2s', flexShrink: 0 }}
                          onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(16,185,129,0.08)'; (e.currentTarget).style.borderColor = 'rgba(16,185,129,0.2)'; (e.currentTarget).style.color = '#10b981'; }}
                          onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget).style.color = 'rgba(240,250,245,0.5)'; }}>
                          {q}
                        </button>
                      ))}
                    </div>

                    {/* Input box */}
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button className="icon-btn"><Paperclip size={15} /></button>
                        <button className="icon-btn"><Image size={15} /></button>
                      </div>

                      <div style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: '16px', padding: '12px 16px', transition: 'all 0.2s', boxShadow: input ? '0 0 0 2px rgba(16,185,129,0.15)' : 'none', borderColor: input ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.09)' }}>
                        <input
                          ref={inputRef}
                          className="msg-input"
                          value={input}
                          onChange={e => setInput(e.target.value)}
                          onKeyDown={handleKeyDown}
                          placeholder={`پیام به ${activeConv.name}...`}
                          style={{ width: '100%' }}
                        />
                      </div>

                      <button className="icon-btn"><Smile size={15} /></button>

                      <button className="send-btn" onClick={sendMessage} disabled={!input.trim()}>
                        <Send size={17} />
                      </button>
                    </div>

                    {/* Mic hint */}
                    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '8px' }}>
                      <button style={{ display: 'flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(240,250,245,0.2)', fontSize: '11px', fontFamily: 'inherit', transition: 'color 0.2s' }}
                        onMouseEnter={e => { (e.currentTarget).style.color = 'rgba(240,250,245,0.5)'; }}
                        onMouseLeave={e => { (e.currentTarget).style.color = 'rgba(240,250,245,0.2)'; }}>
                        <Mic size={11} /> نگه دارید برای ارسال پیام صوتی
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function MessagesPage() {
  return (
    <AuthGuard>
      <MessagesContent />
    </AuthGuard>
  );
}