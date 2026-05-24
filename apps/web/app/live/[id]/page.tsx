'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, Send, Eye, Radio, Trophy, Heart, Share2, Users, Lock, Unlock, Flag } from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';

interface ChatMessage {
  id: string;
  user: string;
  text: string;
  time: string;
  isSystem?: boolean;
}

const sampleMatch = {
  id: '1',
  player1: { name: 'علی محمدی', city: 'تهران', rank: 3, avatar: 'ع' },
  player2: { name: 'رضا احمدی', city: 'مشهد', rank: 7, avatar: 'ر' },
  sport: 'snooker',
  sportLabel: 'اسنوکر',
  event: 'مسابقات قهرمانی ایران ۱۴۰۳',
  round: 'نیمه نهایی',
  date: '۱۵ خرداد ۱۴۰۳',
  startTime: '۱۴:۳۰',
  youtubeId: 'dQw4w9WgXcQ',
  color: 'from-red-700 to-red-900',
};

const initialMessages: ChatMessage[] = [
  { id: '1', user: 'سیستم', text: '🎱 به پخش زنده بیلیارد پلاس خوش آمدید', time: '۱۴:۳۰', isSystem: true },
  { id: '2', user: 'بازیکن_۱', text: 'برو علی 💪', time: '۱۴:۳۱' },
  { id: '3', user: 'اسنوکر_فن', text: 'چه بریک خوبی زد!', time: '۱۴:۳۲' },
  { id: '4', user: 'محمد_ت', text: 'رضا قوی‌تره به نظرم', time: '۱۴:۳۳' },
  { id: '5', user: 'سیستم', text: 'فریم پنجم شروع شد', time: '۱۴:۳۴', isSystem: true },
  { id: '6', user: 'کاربر_۲۲', text: '🔥🔥🔥', time: '۱۴:۳۵' },
];

const botMessages = ['برو جلو! 💪', 'عالیه! 🎯', 'چه شات خوبی!', 'هیجان‌انگیزه 🔥', '🎱🎱🎱', 'مسابقه سختیه', 'فوق‌العاده!', 'باور نمیشه!'];
const botUsers = ['علی_ف', 'بازیکن۲۲', 'اسنوکرباز', 'تماشاگر_۱', 'فن_بیلیارد', 'محمد_ر', 'کاربر_جدید', 'حسین_م'];

export default function LiveMatchPage() {
  const params = useParams();
  const { user } = useAuthStore();
  const isAdmin = user?.primaryRole === 'admin';

  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [newMessage, setNewMessage] = useState('');
  const [likes, setLikes] = useState(128);
  const [liked, setLiked] = useState(false);
  const [viewers, setViewers] = useState(245);
  const [chatLocked, setChatLocked] = useState(false);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.3) {
        const randomMsg = botMessages[Math.floor(Math.random() * botMessages.length)];
        const randomUser = botUsers[Math.floor(Math.random() * botUsers.length)];
        const now = new Date();
        const time = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev.slice(-60), { id: Date.now().toString(), user: randomUser ?? 'کاربر', text: randomMsg ?? '', time }]);
      }
      setViewers(v => Math.max(200, v + Math.floor(Math.random() * 5) - 2));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (chatRef.current) chatRef.current.scrollTop = chatRef.current.scrollHeight;
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || chatLocked) return;
    const now = new Date();
    const time = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { id: Date.now().toString(), user: user?.firstName || 'شما', text: newMessage, time }]);
    setNewMessage('');
  };

  const toggleChat = () => {
    setChatLocked(!chatLocked);
    const now = new Date();
    const time = now.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      user: 'سیستم',
      text: chatLocked ? '✅ چت باز شد' : '🔒 چت توسط ادمین بسته شد',
      time,
      isSystem: true,
    }]);
  };

  return (
    <div className="max-w-7xl mx-auto pb-10">

      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
        <Link href="/live" className="hover:text-green-700">پخش زنده</Link>
        <ChevronLeft size={14} />
        <span className="text-gray-700 font-medium">{sampleMatch.player1.name} در برابر {sampleMatch.player2.name}</span>
      </div>

      <div className="grid grid-cols-12 gap-5">

        {/* ستون اصلی */}
        <div className="col-span-12 lg:col-span-8 space-y-4">

          {/* ویدیو */}
          <div className="relative bg-black rounded-2xl overflow-hidden shadow-2xl">
            <div style={{ paddingBottom: '56.25%', position: 'relative' }}>
              <iframe
                src={`https://www.youtube.com/embed/${sampleMatch.youtubeId}?autoplay=1&mute=1`}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
                allowFullScreen
                allow="autoplay; encrypted-media"
              />
            </div>
            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
              پخش زنده
            </div>
            <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-black bg-opacity-70 text-white text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
              <Eye size={12} className="text-green-400" />
              {viewers.toLocaleString('fa-IR')} تماشاگر
            </div>
          </div>

          {/* اطلاعات بازی */}
          <div className={`bg-gradient-to-l ${sampleMatch.color} rounded-2xl p-6 text-white shadow-xl`}>
            <div className="flex items-center justify-center gap-3 mb-5">
              <span className="bg-white bg-opacity-20 text-white text-xs px-3 py-1 rounded-full">{sampleMatch.sportLabel}</span>
              <span className="text-white opacity-50">•</span>
              <span className="text-white opacity-80 text-sm">{sampleMatch.event}</span>
              <span className="text-white opacity-50">•</span>
              <span className="bg-white bg-opacity-20 text-white text-xs px-3 py-1 rounded-full">{sampleMatch.round}</span>
            </div>

            <div className="flex items-center justify-between">
              {/* بازیکن ۱ */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-3 ring-2 ring-white ring-opacity-30">
                  {sampleMatch.player1.avatar}
                </div>
                <div className="font-black text-lg mb-1">{sampleMatch.player1.name}</div>
                <div className="text-xs opacity-60 mb-1">{sampleMatch.player1.city}</div>
                <div className="inline-flex items-center gap-1 bg-white bg-opacity-10 text-white text-xs px-2 py-0.5 rounded-full">
                  <Trophy size={10} className="text-yellow-300" />
                  رنک {sampleMatch.player1.rank.toLocaleString('fa-IR')}
                </div>
              </div>

              {/* وسط */}
              <div className="px-6 text-center flex-shrink-0">
                <div className="bg-black bg-opacity-30 rounded-2xl px-6 py-3 mb-2">
                  <div className="text-white opacity-50 text-xs mb-1">در حال بازی</div>
                  <div className="text-white font-black text-4xl">VS</div>
                  <div className="flex items-center justify-center gap-1 mt-2">
                    <span className="w-2 h-2 bg-red-400 rounded-full animate-pulse"></span>
                    <span className="text-red-300 text-xs font-bold">زنده</span>
                  </div>
                </div>
                <div className="text-white opacity-50 text-xs">{sampleMatch.date} — {sampleMatch.startTime}</div>
              </div>

              {/* بازیکن ۲ */}
              <div className="flex-1 text-center">
                <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center text-2xl font-black mx-auto mb-3 ring-2 ring-white ring-opacity-30">
                  {sampleMatch.player2.avatar}
                </div>
                <div className="font-black text-lg mb-1">{sampleMatch.player2.name}</div>
                <div className="text-xs opacity-60 mb-1">{sampleMatch.player2.city}</div>
                <div className="inline-flex items-center gap-1 bg-white bg-opacity-10 text-white text-xs px-2 py-0.5 rounded-full">
                  <Trophy size={10} className="text-yellow-300" />
                  رنک {sampleMatch.player2.rank.toLocaleString('fa-IR')}
                </div>
              </div>
            </div>
          </div>

          {/* دکمه‌های تعامل */}
          <div className="bg-white rounded-2xl p-4 flex items-center justify-between shadow-sm border border-gray-100">
            <div className="flex items-center gap-3">
              <button onClick={() => { setLiked(!liked); setLikes(l => liked ? l - 1 : l + 1); }}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all font-medium text-sm ${liked ? 'bg-red-50 text-red-500 border border-red-200' : 'bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-500'}`}>
                <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
                {likes.toLocaleString('fa-IR')} لایک
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-blue-50 hover:text-blue-500 transition-all text-sm font-medium">
                <Share2 size={18} />
                اشتراک‌گذاری
              </button>
              <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-all text-sm font-medium">
                <Flag size={18} />
                گزارش
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Radio size={14} className="text-red-500" />
              <span>{sampleMatch.sportLabel} — {sampleMatch.round}</span>
            </div>
          </div>
        </div>

        {/* چت زنده */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col" style={{ height: '650px' }}>

            {/* هدر */}
            <div className="bg-gray-900 px-4 py-3 flex items-center justify-between flex-shrink-0">
              <span className="text-white font-black text-sm flex items-center gap-2">
                <Radio size={14} className="text-red-400" />
                چت زنده
                {chatLocked && <span className="text-xs bg-red-600 text-white px-2 py-0.5 rounded-full">بسته</span>}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-gray-400 text-xs flex items-center gap-1">
                  <Users size={11} />
                  {viewers.toLocaleString('fa-IR')}
                </span>
                {isAdmin && (
                  <button onClick={toggleChat}
                    className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg transition-colors font-medium ${chatLocked ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-red-600 text-white hover:bg-red-700'}`}>
                    {chatLocked ? <><Unlock size={11} /> باز کن</> : <><Lock size={11} /> قفل</>}
                  </button>
                )}
              </div>
            </div>

            {/* پیام‌ها */}
            <div ref={chatRef} className="flex-1 overflow-y-auto p-4 space-y-2.5 bg-gray-50">
              {messages.map(msg => (
                <div key={msg.id} className={`${msg.isSystem ? 'flex justify-center' : 'flex gap-2.5'}`}>
                  {msg.isSystem ? (
                    <span className="text-xs text-gray-400 bg-white border border-gray-200 px-3 py-1 rounded-full shadow-sm">{msg.text}</span>
                  ) : (
                    <>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-black flex-shrink-0 shadow-sm ${
                        msg.user === (user?.firstName || 'شما') ? 'bg-green-600' :
                        msg.user === 'ادمین' ? 'bg-red-600' : 'bg-gradient-to-br from-gray-500 to-gray-700'
                      }`}>
                        {msg.user[0]}
                      </div>
                      <div className={`flex-1 min-w-0 rounded-2xl rounded-tr-sm px-3 py-2 shadow-sm ${
                        msg.user === (user?.firstName || 'شما') ? 'bg-green-50 border border-green-100' : 'bg-white border border-gray-100'
                      }`}>
                        <div className="flex items-baseline gap-2 mb-0.5">
                          <span className={`text-xs font-black ${
                            msg.user === (user?.firstName || 'شما') ? 'text-green-600' :
                            msg.user === 'ادمین' ? 'text-red-600' : 'text-gray-700'
                          }`}>
                            {msg.user}
                          </span>
                          <span className="text-xs text-gray-300">{msg.time}</span>
                        </div>
                        <p className="text-sm text-gray-700 leading-5">{msg.text}</p>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* ارسال پیام */}
            <div className="p-3 border-t border-gray-100 flex-shrink-0 bg-white">
              {chatLocked ? (
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-gray-400 bg-gray-50 rounded-xl">
                  <Lock size={14} />
                  چت توسط ادمین بسته شده است
                </div>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendMessage()}
                    placeholder="پیام بنویسید..."
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 bg-gray-50"
                  />
                  <button onClick={sendMessage}
                    className="bg-green-700 text-white p-2.5 rounded-xl hover:bg-green-800 transition-colors shadow-sm">
                    <Send size={16} />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}