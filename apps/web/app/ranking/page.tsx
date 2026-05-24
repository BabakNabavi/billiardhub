'use client';

import { useState } from 'react';
import Link from 'next/link';

interface RankingPlayer {
  rank: number;
  previousRank?: number;
  name: string;
  city?: string;
  points: number;
  userId?: string;
  avatar?: string;
}

const samplePlayers: RankingPlayer[] = [
  { rank: 1, previousRank: 2, name: 'علی محمدی', city: 'تهران', points: 12500 },
  { rank: 2, previousRank: 1, name: 'رضا احمدی', city: 'مشهد', points: 11800 },
  { rank: 3, previousRank: 3, name: 'محمد حسینی', city: 'اصفهان', points: 10900 },
  { rank: 4, previousRank: 6, name: 'امیر کریمی', city: 'تهران', points: 10200 },
  { rank: 5, previousRank: 4, name: 'سعید رضایی', city: 'شیراز', points: 9800 },
  { rank: 6, previousRank: 5, name: 'حسین علوی', city: 'تبریز', points: 9400 },
  { rank: 7, previousRank: 9, name: 'مجید صادقی', city: 'کرج', points: 8900 },
  { rank: 8, previousRank: 7, name: 'داود نظری', city: 'تهران', points: 8500 },
  { rank: 9, previousRank: 8, name: 'کاوه موسوی', city: 'اهواز', points: 8100 },
  { rank: 10, previousRank: 12, name: 'بهروز طاهری', city: 'قم', points: 7800 },
  { rank: 11, previousRank: 10, name: 'فرهاد جعفری', city: 'مشهد', points: 7400 },
  { rank: 12, previousRank: 11, name: 'نادر قاسمی', city: 'تهران', points: 7100 },
  { rank: 13, previousRank: 15, name: 'وحید ابراهیمی', city: 'اصفهان', points: 6800 },
  { rank: 14, previousRank: 13, name: 'مهدی شریفی', city: 'رشت', points: 6500 },
  { rank: 15, previousRank: 14, name: 'پیمان کمالی', city: 'تهران', points: 6200 },
  { rank: 16, previousRank: 16, name: 'آرش ولی‌زاده', city: 'کرمانشاه', points: 5900 },
  { rank: 17, previousRank: 18, name: 'سینا حیدری', city: 'تهران', points: 5600 },
  { rank: 18, previousRank: 17, name: 'امین رستمی', city: 'تبریز', points: 5300 },
  { rank: 19, previousRank: 20, name: 'شاهین نوری', city: 'شیراز', points: 5000 },
  { rank: 20, previousRank: 19, name: 'کیان صفوی', city: 'مشهد', points: 4700 },
  { rank: 21, previousRank: 22, name: 'دانیال یوسفی', city: 'تهران', points: 4400 },
  { rank: 22, previousRank: 21, name: 'آرمان فتحی', city: 'اهواز', points: 4100 },
  { rank: 23, previousRank: 24, name: 'حامد زارع', city: 'اصفهان', points: 3800 },
  { rank: 24, previousRank: 23, name: 'نیما خلیلی', city: 'تهران', points: 3500 },
  { rank: 25, previousRank: 26, name: 'صادق منصوری', city: 'قزوین', points: 3200 },
  { rank: 26, previousRank: 25, name: 'رامین عباسی', city: 'تهران', points: 2900 },
  { rank: 27, previousRank: 28, name: 'میلاد ناصری', city: 'ساری', points: 2600 },
  { rank: 28, previousRank: 27, name: 'یاسر حسن‌زاده', city: 'تهران', points: 2300 },
  { rank: 29, previousRank: 30, name: 'کامران بهرامی', city: 'اراک', points: 2000 },
  { rank: 30, previousRank: 29, name: 'سجاد معینی', city: 'تهران', points: 1700 },
  { rank: 31, previousRank: 32, name: 'ایمان قربانی', city: 'همدان', points: 1400 },
  { rank: 32, previousRank: 31, name: 'پارسا طالبی', city: 'تهران', points: 1100 },
];

const data: Record<string, Record<string, Record<string, RankingPlayer[]>>> = {
  snooker: {
    آقایان: {
      'دسته برتر': samplePlayers,
      'دسته یک': samplePlayers.map(p => ({ ...p, name: p.name + ' (نمونه)', points: p.points - 500 })),
      'زیر ۲۱ سال': [],
      'پیشکسوتان': [],
    },
    بانوان: {
      'دسته برتر': [],
      'زیر ۲۱ سال': [],
      'پیشکسوتان': [],
    },
  },
  pocket: {
    آقایان: {
      'دسته برتر': [],
      'دسته یک': [],
      'زیر ۲۱ سال': [],
      'پیشکسوتان': [],
    },
    بانوان: {
      'دسته برتر': [],
      'زیر ۲۱ سال': [],
      'پیشکسوتان': [],
    },
  },
};

export default function RankingsPage() {
  const [sport, setSport] = useState('snooker');
  const [gender, setGender] = useState('آقایان');
  const [category, setCategory] = useState('دسته برتر');

  const currentCategories = sport !== 'highball' ? Object.keys(data[sport]?.[gender] || {}) : [];
  const players = sport !== 'highball' ? (data[sport]?.[gender]?.[category] || []) : [];
  const hasData = players.some(p => p.name);

  const getRowBg = (index: number) => {
    if (category === 'دسته برتر' && index >= 24) return 'bg-red-50 hover:bg-red-100';
    if (category === 'دسته یک' && index < 8) return 'bg-blue-50 hover:bg-blue-100';
    if (index < 16) return 'bg-green-50 hover:bg-green-100';
    return 'hover:bg-gray-50';
  };

  const getRankBg = (index: number, rank: number) => {
    if (rank === 1) return 'bg-yellow-400 text-white';
    if (rank === 2) return 'bg-gray-400 text-white';
    if (rank === 3) return 'bg-amber-600 text-white';
    if (category === 'دسته برتر' && index >= 24) return 'bg-red-200 text-red-800';
    if (category === 'دسته یک' && index < 8) return 'bg-blue-200 text-blue-800';
    if (index < 16) return 'bg-green-200 text-green-800';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-green-800 mb-6">🏆 رنکینگ ایران</h1>

      {/* انتخاب رشته */}
      <div className="flex gap-3 mb-6">
        {[
          { value: 'snooker', label: 'اسنوکر' },
          { value: 'pocket', label: 'پاکت بیلیارد' },
          { value: 'highball', label: 'هی‌بال' },
        ].map(s => (
          <button key={s.value}
            onClick={() => { setSport(s.value); setGender('آقایان'); setCategory('دسته برتر'); }}
            disabled={s.value === 'highball'}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition-all ${sport === s.value ? 'bg-green-700 text-white' :
                s.value === 'highball' ? 'bg-gray-100 text-gray-400 cursor-not-allowed' :
                  'border border-green-300 text-green-700 hover:bg-green-50'
              }`}>
            {s.label}
            {s.value === 'highball' && <span className="text-xs mr-1">(به زودی)</span>}
          </button>
        ))}
      </div>

      {sport !== 'highball' && (
        <div className="flex gap-4">
          {/* منوی چپ */}
          <div className="w-44 flex-shrink-0 space-y-3">
            {['آقایان', 'بانوان'].map(g => (
              <div key={g} className="bg-white rounded-xl shadow overflow-hidden">
                <button
                  onClick={() => {
                    setGender(g);
                    const first = Object.keys(rankings[sport]?.[g] ?? {})[0];
                    if (first) setCategory(first);
                  }}
                  className={`w-full text-right px-4 py-3 font-bold text-sm ${gender === g ? 'bg-green-700 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                    }`}>
                  {g === 'آقایان' ? '👨 آقایان' : '👩 بانوان'}
                </button>
                {gender === g && (
                  <div className="p-1">
                    {Object.keys(data[sport][g]).map(cat => (
                      <button key={cat}
                        onClick={() => setCategory(cat)}
                        className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all ${category === cat
                            ? 'bg-green-100 text-green-800 font-medium'
                            : 'text-gray-600 hover:bg-gray-50'
                          }`}>
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* جدول */}
          <div className="flex-1">
            <div className="bg-white rounded-xl shadow overflow-hidden">
              <div className="bg-green-700 text-white px-4 py-3 flex items-center justify-between">
                <span className="font-bold">{gender} — {category}</span>
                <span className="text-sm opacity-80">۳۲ نفر</span>
              </div>

              <div className="grid grid-cols-12 px-4 py-2 bg-gray-50 text-xs text-gray-500 font-medium border-b">
                <div className="col-span-1 text-center">رتبه</div>
                <div className="col-span-1 text-center">±</div>
                <div className="col-span-1"></div>
                <div className="col-span-5">نام بازیکن</div>
                <div className="col-span-2 text-center">شهر</div>
                <div className="col-span-2 text-center">امتیاز</div>
              </div>

              {!hasData ? (
                <div className="text-center py-16 text-gray-400">
                  <div className="text-5xl mb-4">🏆</div>
                  <p>رنکینگ این دسته هنوز اعلام نشده</p>
                </div>
              ) : (
                players.filter(p => p.name).map((player, index) => {
                  const diff = player.previousRank ? player.previousRank - player.rank : 0;
                  return (
                    <Link key={player.rank} href={player.userId ? `/users/${player.userId}` : '#'}>
                      <div className={`grid grid-cols-12 items-center px-4 py-3 border-b transition-all ${getRowBg(index)}`}>
                        <div className="col-span-1 text-center">
                          <span className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mx-auto ${getRankBg(index, player.rank)}`}>
                            {player.rank.toLocaleString('fa-IR')}
                          </span>
                        </div>
                        <div className="col-span-1 text-center text-xs">
                          {diff > 0 ? <span className="text-green-600 font-bold">▲{diff}</span> :
                            diff < 0 ? <span className="text-red-500 font-bold">▼{Math.abs(diff)}</span> :
                              <span className="text-gray-300">-</span>}
                        </div>
                        <div className="col-span-1">
                          <div className="w-9 h-9 bg-green-700 rounded-full flex items-center justify-center text-white text-sm font-bold overflow-hidden">
                            {player.avatar
                              ? <img src={player.avatar} alt="" className="w-full h-full object-cover" />
                              : player.name?.[0]}
                          </div>
                        </div>
                        <div className="col-span-5 font-medium text-gray-800">{player.name}</div>
                        <div className="col-span-2 text-center text-sm text-gray-500">{player.city || '-'}</div>
                        <div className="col-span-2 text-center font-bold text-green-700">
                          {player.points.toLocaleString('fa-IR')}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>

            {/* راهنما */}
            <div className="flex flex-wrap gap-4 mt-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 bg-green-100 border border-green-300 rounded-full inline-block"></span>
                ۱۶ نفر اول
              </span>
              {category === 'دسته برتر' && (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-red-100 border border-red-300 rounded-full inline-block"></span>
                  سقوط به دسته یک (۸ نفر آخر)
                </span>
              )}
              {category === 'دسته یک' && (
                <span className="flex items-center gap-1">
                  <span className="w-3 h-3 bg-blue-100 border border-blue-300 rounded-full inline-block"></span>
                  ارتقا به دسته برتر (۸ نفر اول)
                </span>
              )}
              <span className="flex items-center gap-1 text-green-600 font-bold">▲ صعود</span>
              <span className="flex items-center gap-1 text-red-500 font-bold">▼ نزول</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}