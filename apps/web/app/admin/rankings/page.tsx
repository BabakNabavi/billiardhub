'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/auth.store';
import { Trophy, Save } from 'lucide-react';
import {
  buildEmptyRankings, getStoredRankings, saveRankings, categorySize,
  type RankingPlayer, type RankingsStructure,
} from '../../../lib/rankings-store';

export default function AdminRankingsPage() {
  const router = useRouter();
  const { user, _hydrated } = useAuthStore();
  const [sport, setSport] = useState('snooker');
  const [gender, setGender] = useState('آقایان');
  const [category, setCategory] = useState('دسته برتر');
  const [rankings, setRankings] = useState<RankingsStructure>(() => buildEmptyRankings());
  const [saved, setSaved] = useState(false);

  /* داده‌ی ذخیره‌شده بعد از mount لود می‌شود */
  useEffect(() => { setRankings(getStoredRankings()); }, []);

  /* گارد بعد از hydrate — وگرنه ادمین موقع رفرش بی‌دلیل bounce می‌شد */
  useEffect(() => {
    if (_hydrated && (!user || user.primaryRole !== 'admin')) router.push('/');
  }, [_hydrated, user, router]);

  if (!_hydrated) return null;
  if (!user || user.primaryRole !== 'admin') return null;

  const players = rankings[sport]?.[gender]?.[category] || [];

  const updatePlayer = (index: number, field: keyof RankingPlayer, value: string | number) => {
    const newRankings = JSON.parse(JSON.stringify(rankings)) as RankingsStructure;
    newRankings[sport]![gender]![category]![index] = {
      ...newRankings[sport]![gender]![category]![index]!,
      [field]: value,
    };
    setRankings(newRankings);
  };

  /* ذخیره‌ی واقعی — همین داده در /ranking سایت نمایش داده می‌شود */
  const handleSave = () => {
    saveRankings(rankings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toFa = (n: number) => n.toLocaleString('fa-IR');

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <Trophy size={24} className="text-amber-500" />
          مدیریت رنکینگ
        </h1>
        <button onClick={handleSave}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm transition-all ${saved ? 'bg-green-100 text-green-700' : 'bg-green-700 text-white hover:bg-green-800'}`}>
          <Save size={16} />
          {saved ? '✅ ذخیره شد' : 'ذخیره'}
        </button>
      </div>

      {/* انتخاب رشته */}
      <div className="flex gap-3 mb-5">
        {[
          { value: 'snooker', label: 'اسنوکر' },
          { value: 'pocket', label: 'پاکت بیلیارد' },
        ].map(s => (
          <button key={s.value} onClick={() => { setSport(s.value); setGender('آقایان'); setCategory('دسته برتر'); }}
            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${sport === s.value ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:border-green-400'}`}>
            {s.label}
          </button>
        ))}
      </div>

      {/* موبایل: انتخاب‌گرهای افقی به‌جای سایدبار */}
      <div className="md:hidden mb-4 space-y-2">
        <div className="flex gap-2">
          {['آقایان', 'بانوان'].map(g => (
            <button key={g} onClick={() => { setGender(g); setCategory(Object.keys(rankings[sport]?.[g] ?? {})[0] ?? 'دسته برتر'); }}
              className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-bold transition-all ${gender === g ? 'bg-green-700 text-white' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {g}
            </button>
          ))}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {Object.keys(rankings[sport]?.[gender] ?? {}).map(cat => (
            <button key={cat} onClick={() => setCategory(cat)}
              className={`shrink-0 rounded-xl px-3.5 py-2 text-xs font-bold transition-all ${category === cat ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-white border border-gray-200 text-gray-600'}`}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-5">
        {/* منوی چپ — فقط دسکتاپ */}
        <div className="hidden md:block w-44 flex-shrink-0 space-y-3">
          {['آقایان', 'بانوان'].map(g => (
            <div key={g} className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <button onClick={() => { setGender(g); setCategory(Object.keys(rankings[sport]?.[g] ?? {})[0] ?? 'دسته برتر'); }}
                className={`w-full text-right px-4 py-3 font-bold text-sm ${gender === g ? 'bg-green-700 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'}`}>
                {g === 'آقایان' ? '👨 آقایان' : '👩 بانوان'}
              </button>
              {gender === g && (
                <div className="p-1">
                  {Object.keys(rankings[sport]?.[g] ?? {}).map(cat => (
                    <button key={cat} onClick={() => setCategory(cat)}
                      className={`w-full text-right px-3 py-2 rounded-lg text-sm transition-all ${category === cat ? 'bg-green-100 text-green-800 font-medium' : 'text-gray-600 hover:bg-gray-50'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* جدول */}
        <div className="flex-1 bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-green-700 text-white px-5 py-3 flex items-center justify-between">
            <span className="font-bold">{gender} — {category}</span>
            <span className="text-sm opacity-80">{toFa(categorySize(sport, category))} نفر</span>
          </div>

          {/* هدر — فقط دسکتاپ */}
          <div className="hidden sm:grid grid-cols-12 px-4 py-2 bg-gray-50 text-xs text-gray-500 font-medium border-b">
            <div className="col-span-1 text-center">رتبه</div>
            <div className="col-span-4">نام و نام خانوادگی</div>
            <div className="col-span-3">شهر</div>
            <div className="col-span-3">امتیاز</div>
            <div className="col-span-1">رتبه قبل</div>
          </div>

          <div className="divide-y divide-gray-50 max-h-[600px] overflow-y-auto">
            {players.map((player, index) => (
              <div key={index} className={`grid grid-cols-6 sm:grid-cols-12 items-center gap-y-1.5 px-3 sm:px-4 py-2.5 sm:py-2 ${index < 16 ? 'bg-green-50' : ''}`}>
                <div className="col-span-1 text-center">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold mx-auto ${index === 0 ? 'bg-yellow-400 text-white' :
                      index === 1 ? 'bg-gray-400 text-white' :
                        index === 2 ? 'bg-amber-600 text-white' :
                          index < 16 ? 'bg-green-200 text-green-800' :
                            'bg-gray-100 text-gray-600'
                    }`}>
                    {toFa(index + 1)}
                  </span>
                </div>
                <div className="col-span-5 sm:col-span-4">
                  <input
                    type="text"
                    value={player.name}
                    onChange={e => updatePlayer(index, 'name', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="نام بازیکن"
                  />
                </div>
                <div className="col-span-3 sm:col-span-3 sm:px-2">
                  <input
                    type="text"
                    value={player.city}
                    onChange={e => updatePlayer(index, 'city', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="شهر"
                  />
                </div>
                <div className="col-span-2 sm:col-span-3 sm:px-2">
                  <input
                    type="number"
                    value={player.points || ''}
                    onChange={e => updatePlayer(index, 'points', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="۰"
                  />
                </div>
                <div className="col-span-1 sm:px-1">
                  <input
                    type="number"
                    value={player.previousRank || ''}
                    onChange={e => updatePlayer(index, 'previousRank', parseInt(e.target.value) || 0)}
                    className="w-full border border-gray-200 rounded-lg px-1 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 text-center"
                    placeholder="-"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}