'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Trophy, Users, Clock, Radio, ChevronLeft, Eye } from 'lucide-react';

interface LiveMatch {
  id: string;
  player1: string;
  player2: string;
  score1: number;
  score2: number;
  frames1: number;
  frames2: number;
  sport: string;
  sportLabel: string;
  event: string;
  round: string;
  status: 'live' | 'upcoming' | 'finished';
  startTime: string;
  viewers: number;
  color: string;
}

const sampleMatches: LiveMatch[] = [
  { id: '1', player1: 'علی محمدی', player2: 'رضا احمدی', score1: 3, score2: 2, frames1: 45, frames2: 38, sport: 'snooker', sportLabel: 'اسنوکر', event: 'مسابقات قهرمانی ایران ۱۴۰۳', round: 'نیمه نهایی', status: 'live', startTime: '۱۴:۳۰', viewers: 245, color: 'from-red-600 to-red-800' },
  { id: '2', player1: 'کاوه موسوی', player2: 'سعید رضایی', score1: 2, score2: 2, frames1: 62, frames2: 58, sport: 'snooker', sportLabel: 'اسنوکر', event: 'مسابقات قهرمانی ایران ۱۴۰۳', round: 'نیمه نهایی', status: 'live', startTime: '۱۵:۰۰', viewers: 189, color: 'from-blue-600 to-blue-800' },
  { id: '3', player1: 'محمد حسینی', player2: 'امیر کریمی', score1: 0, score2: 0, frames1: 0, frames2: 0, sport: 'pocket', sportLabel: 'پاکت بیلیارد', event: 'لیگ دسته برتر', round: 'هفته هفتم', status: 'upcoming', startTime: '۱۷:۰۰', viewers: 0, color: 'from-green-600 to-green-800' },
  { id: '4', player1: 'حسین علوی', player2: 'مجید صادقی', score1: 4, score2: 1, frames1: 0, frames2: 0, sport: 'pocket', sportLabel: 'پاکت بیلیارد', event: 'لیگ دسته برتر', round: 'هفته هفتم', status: 'finished', startTime: '۱۲:۰۰', viewers: 312, color: 'from-gray-600 to-gray-800' },
];

function LiveScoreCard({ match }: { match: LiveMatch }) {
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    if (match.status !== 'live') return;
    const i = setInterval(() => setBlink(b => !b), 1000);
    return () => clearInterval(i);
  }, [match.status]);

  return (
    <Link href={`/live/${match.id}`}>
      <div className={`bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-all cursor-pointer ${
        match.status === 'live' ? 'border-red-200' :
        match.status === 'upcoming' ? 'border-blue-100' : 'border-gray-100'
      }`}>
        {/* هدر */}
        <div className={`bg-gradient-to-l ${match.color} px-4 py-3 flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            {match.status === 'live' && (
              <div className={`flex items-center gap-1.5 bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ${blink ? 'opacity-100' : 'opacity-50'} transition-opacity`}>
                <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                زنده
              </div>
            )}
            {match.status === 'upcoming' && (
              <div className="flex items-center gap-1.5 bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                <Clock size={10} />
                {match.startTime}
              </div>
            )}
            {match.status === 'finished' && (
              <div className="bg-gray-500 text-white text-xs px-2 py-0.5 rounded-full">پایان</div>
            )}
            <span className="text-white text-xs opacity-80">{match.sportLabel}</span>
          </div>
          {match.status === 'live' && (
            <div className="flex items-center gap-1 text-white text-xs opacity-70">
              <Eye size={12} />
              {match.viewers.toLocaleString('fa-IR')}
            </div>
          )}
        </div>

        {/* اسکور */}
        <div className="p-5">
          <div className="text-xs text-gray-400 text-center mb-3">{match.event} — {match.round}</div>

          <div className="flex items-center justify-between">
            {/* بازیکن ۱ */}
            <div className="flex-1 text-center">
              <div className="font-bold text-gray-800 mb-2">{match.player1}</div>
              {match.status !== 'upcoming' && match.sport === 'snooker' && (
                <div className="text-xs text-gray-400 mb-1">بریک: {match.frames1.toLocaleString('fa-IR')}</div>
              )}
              <div className={`text-4xl font-black ${match.score1 > match.score2 ? 'text-green-600' : 'text-gray-700'}`}>
                {match.score1.toLocaleString('fa-IR')}
              </div>
            </div>

            {/* جداکننده */}
            <div className="px-4 text-center">
              <div className="text-gray-300 text-2xl font-bold">—</div>
              {match.status === 'live' && (
                <div className={`text-xs text-red-500 font-bold mt-1 ${blink ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                  در حال بازی
                </div>
              )}
            </div>

            {/* بازیکن ۲ */}
            <div className="flex-1 text-center">
              <div className="font-bold text-gray-800 mb-2">{match.player2}</div>
              {match.status !== 'upcoming' && match.sport === 'snooker' && (
                <div className="text-xs text-gray-400 mb-1">بریک: {match.frames2.toLocaleString('fa-IR')}</div>
              )}
              <div className={`text-4xl font-black ${match.score2 > match.score1 ? 'text-green-600' : 'text-gray-700'}`}>
                {match.score2.toLocaleString('fa-IR')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function LivePage() {
  const [activeTab, setActiveTab] = useState<'live' | 'upcoming' | 'finished'>('live');

  const live = sampleMatches.filter(m => m.status === 'live');
  const upcoming = sampleMatches.filter(m => m.status === 'upcoming');
  const finished = sampleMatches.filter(m => m.status === 'finished');

  const filtered = activeTab === 'live' ? live : activeTab === 'upcoming' ? upcoming : finished;

  return (
    <div className="max-w-5xl mx-auto pb-10">

      {/* هدر */}
      <div className="bg-gradient-to-l from-gray-900 to-gray-700 rounded-2xl p-6 mb-8 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black flex items-center gap-2 mb-1">
              <Radio size={24} className="text-red-400" />
              پخش زنده و نتایج
            </h1>
            <p className="text-gray-300 text-sm">نتایج لحظه‌ای مسابقات بیلیارد ایران</p>
          </div>
          <div className="flex items-center gap-2">
            {live.length > 0 && (
              <div className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-bold animate-pulse">
                <span className="w-2 h-2 bg-white rounded-full"></span>
                {live.length.toLocaleString('fa-IR')} بازی زنده
              </div>
            )}
          </div>
        </div>
      </div>

      {/* تب‌ها */}
      <div className="flex items-center gap-2 mb-6">
        {[
          { id: 'live', label: 'زنده', count: live.length, color: 'bg-red-500' },
          { id: 'upcoming', label: 'آینده', count: upcoming.length, color: 'bg-blue-500' },
          { id: 'finished', label: 'پایان یافته', count: finished.length, color: 'bg-gray-500' },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === tab.id ? 'bg-gray-900 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`${tab.color} text-white text-xs w-5 h-5 rounded-full flex items-center justify-center`}>
                {tab.count.toLocaleString('fa-IR')}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* کارت‌ها */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Radio size={48} className="mx-auto mb-4 text-gray-300" />
          <p>بازی‌ای در این بخش وجود ندارد</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filtered.map(match => (
            <LiveScoreCard key={match.id} match={match} />
          ))}
        </div>
      )}
    </div>
  );
}