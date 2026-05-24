'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Clock, MapPin, Trophy, Users, ChevronLeft, Flame, Calendar, Timer } from 'lucide-react';

interface Event {
  id: string;
  title: string;
  description: string;
  category: 'club' | 'provincial' | 'national' | 'open' | 'international';
  sport: 'snooker' | 'pocket' | 'highball';
  location: string;
  city: string;
  startDate: Date;
  endDate: Date;
  status: 'upcoming' | 'ongoing' | 'finished';
  participants: number;
  maxParticipants: number;
  prize: string;
  organizer: string;
  winner?: string;
  runnerUp?: string;
  third?: string;
  image: string;
  imageBg: string;
  registrationOpen: boolean;
}

const categoryLabels: Record<string, { label: string; color: string; bg: string }> = {
  club: { label: 'باشگاهی', color: '#16a34a', bg: '#dcfce7' },
  provincial: { label: 'استانی', color: '#2563eb', bg: '#dbeafe' },
  national: { label: 'کشوری', color: '#e8192c', bg: '#fee2e2' },
  open: { label: 'آزاد', color: '#d97706', bg: '#fef3c7' },
  international: { label: 'بین‌المللی', color: '#7c3aed', bg: '#ede9fe' },
};

const sportLabels: Record<string, string> = {
  snooker: 'اسنوکر',
  pocket: 'پاکت بیلیارد',
  highball: 'هی‌بال',
};

const now = new Date();

const sampleEvents: Event[] = [
  {
    id: '1',
    title: 'مسابقات قهرمانی اسنوکر ایران ۱۴۰۳',
    description: 'بزرگ‌ترین رویداد اسنوکر ایران با حضور ۱۲۸ بازیکن از سراسر کشور',
    category: 'national',
    sport: 'snooker',
    location: 'سالن المپیک تهران',
    city: 'تهران',
    startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
    status: 'upcoming',
    participants: 96,
    maxParticipants: 128,
    prize: '۵۰۰ میلیون تومان',
    organizer: 'فدراسیون بیلیارد ایران',
    image: '',
    imageBg: 'from-red-900 to-red-700',
    registrationOpen: true,
  },
  {
    id: '2',
    title: 'لیگ پاکت بیلیارد دسته برتر',
    description: 'رقابت‌های هفتگی لیگ دسته برتر پاکت بیلیارد با حضور ۳۲ بازیکن',
    category: 'national',
    sport: 'pocket',
    location: 'باشگاه مرکزی تهران',
    city: 'تهران',
    startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    status: 'ongoing',
    participants: 32,
    maxParticipants: 32,
    prize: '۲۰۰ میلیون تومان',
    organizer: 'فدراسیون بیلیارد ایران',
    image: '',
    imageBg: 'from-blue-900 to-blue-700',
    registrationOpen: false,
  },
  {
    id: '3',
    title: 'مسابقات استانی اسنوکر اصفهان',
    description: 'مسابقات سالانه استانی اسنوکر با حضور بازیکنان استان اصفهان',
    category: 'provincial',
    sport: 'snooker',
    location: 'باشگاه اسنوکر اصفهان',
    city: 'اصفهان',
    startDate: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
    status: 'upcoming',
    participants: 45,
    maxParticipants: 64,
    prize: '۵۰ میلیون تومان',
    organizer: 'هیئت بیلیارد استان اصفهان',
    image: '',
    imageBg: 'from-amber-900 to-amber-700',
    registrationOpen: true,
  },
  {
    id: '4',
    title: 'تورنومنت آزاد پاکت بیلیارد مشهد',
    description: 'مسابقه آزاد پاکت بیلیارد برای همه سطوح بازیکنان',
    category: 'open',
    sport: 'pocket',
    location: 'باشگاه ستاره مشهد',
    city: 'مشهد',
    startDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    endDate: new Date(now.getTime() + 11 * 24 * 60 * 60 * 1000),
    status: 'upcoming',
    participants: 28,
    maxParticipants: 64,
    prize: '۳۰ میلیون تومان',
    organizer: 'باشگاه ستاره مشهد',
    image: '',
    imageBg: 'from-green-900 to-green-700',
    registrationOpen: true,
  },
  {
    id: '5',
    title: 'جام باشگاه‌های اسنوکر تهران',
    description: 'رقابت باشگاه‌های برتر تهران در قالب تیمی',
    category: 'club',
    sport: 'snooker',
    location: 'باشگاه‌های تهران',
    city: 'تهران',
    startDate: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
    endDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    status: 'finished',
    participants: 16,
    maxParticipants: 16,
    prize: '۱۰۰ میلیون تومان',
    organizer: 'اتحادیه باشگاه‌های تهران',
    winner: 'باشگاه ستاره تهران',
    runnerUp: 'باشگاه پیروزی',
    third: 'باشگاه المپیک',
    image: '',
    imageBg: 'from-slate-800 to-slate-600',
    registrationOpen: false,
  },
  {
    id: '6',
    title: 'مسابقات بین‌المللی کاپ خلیج فارس',
    description: 'رویداد بین‌المللی با حضور تیم‌های ملی کشورهای منطقه',
    category: 'international',
    sport: 'snooker',
    location: 'مجموعه ورزشی آزادی',
    city: 'تهران',
    startDate: new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000),
    endDate: new Date(now.getTime() + 25 * 24 * 60 * 60 * 1000),
    status: 'upcoming',
    participants: 8,
    maxParticipants: 12,
    prize: '۲ میلیارد تومان',
    organizer: 'فدراسیون بیلیارد ایران',
    image: '',
    imageBg: 'from-purple-900 to-purple-700',
    registrationOpen: false,
  },
];

function CountdownTimer({ targetDate }: { targetDate: Date }) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const calc = () => {
      const diff = targetDate.getTime() - Date.now();
      if (diff > 0) {
        setTimeLeft({
          days: Math.floor(diff / (1000 * 60 * 60 * 24)),
          hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((diff % (1000 * 60)) / 1000),
        });
      }
    };
    calc();
    const i = setInterval(calc, 1000);
    return () => clearInterval(i);
  }, [targetDate]);

  const fa = (n: number) => n.toLocaleString('fa-IR').padStart(2, '۰');

  return (
    <div className="flex items-center gap-1">
      {[
        { v: timeLeft.days, l: 'روز' },
        { v: timeLeft.hours, l: 'ساعت' },
        { v: timeLeft.minutes, l: 'دقیقه' },
        { v: timeLeft.seconds, l: 'ثانیه' },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-1">
          <div className="bg-gray-900 text-white rounded-lg px-2 py-1 text-center min-w-[2.5rem]">
            <div className="text-sm font-bold">{fa(item.v)}</div>
            <div className="text-xs opacity-60">{item.l}</div>
          </div>
          {i < 3 && <span className="text-gray-500 font-bold">:</span>}
        </div>
      ))}
    </div>
  );
}

export default function EventsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'ongoing' | 'finished'>('upcoming');
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeSport, setActiveSport] = useState('all');

  const filtered = sampleEvents.filter(e => {
    if (e.status !== activeTab) return false;
    if (activeCategory !== 'all' && e.category !== activeCategory) return false;
    if (activeSport !== 'all' && e.sport !== activeSport) return false;
    return true;
  });

  const ongoing = sampleEvents.filter(e => e.status === 'ongoing');
  const featured = sampleEvents.find(e => e.status === 'upcoming' && e.category === 'national');

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-gray-800 mb-6 flex items-center gap-2">
        <Trophy size={24} className="text-amber-500" />
        مسابقات و رویدادها
      </h1>

      {/* رویداد ویژه */}
      {featured && (
        <div className={`bg-gradient-to-l ${featured.imageBg} rounded-2xl p-6 mb-8 text-white relative overflow-hidden`}>
          <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-32 -translate-y-32"></div>
          <div className="relative grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-white bg-opacity-20 text-white text-xs px-3 py-1 rounded-full">
                  {categoryLabels[featured.category]?.label}
                </span>
                <span className="bg-white bg-opacity-20 text-white text-xs px-3 py-1 rounded-full">
                  {sportLabels[featured.sport]}
                </span>
              </div>
              <h2 className="text-2xl font-black mb-3">{featured.title}</h2>
              <p className="text-white opacity-80 mb-4">{featured.description}</p>
              <div className="space-y-2 text-sm opacity-80 mb-4">
                <div className="flex items-center gap-2">
                  <MapPin size={14} />
                  {featured.location}، {featured.city}
                </div>
                <div className="flex items-center gap-2">
                  <Trophy size={14} />
                  جایزه: {featured.prize}
                </div>
                <div className="flex items-center gap-2">
                  <Users size={14} />
                  {featured.participants.toLocaleString('fa-IR')} از {featured.maxParticipants.toLocaleString('fa-IR')} نفر ثبت‌نام کرده‌اند
                </div>
              </div>
              {featured.registrationOpen && (
                <button className="bg-white text-gray-900 px-6 py-2.5 rounded-xl font-bold hover:bg-gray-100 text-sm">
                  ثبت‌نام در مسابقه
                </button>
              )}
            </div>
            <div className="text-center">
              <div className="text-white opacity-70 text-sm mb-3 flex items-center justify-center gap-2">
                <Timer size={14} />
                شروع مسابقات تا:
              </div>
              <CountdownTimer targetDate={featured.startDate} />
            </div>
          </div>
        </div>
      )}

      {/* مسابقات در حال برگزاری */}
      {ongoing.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-1 h-6 bg-red-500 rounded-full"></div>
            <h2 className="font-black text-gray-900 flex items-center gap-2">
              <Flame size={18} className="text-red-500" />
              در حال برگزاری
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {ongoing.map(event => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="bg-white rounded-2xl border-2 border-red-200 p-5 hover:border-red-400 transition-all group">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                          <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                          زنده
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: categoryLabels[event.category].bg, color: categoryLabels[event.category].color }}>
                          {categoryLabels[event.category].label}
                        </span>
                      </div>
                      <h3 className="font-bold text-gray-900 group-hover:text-green-700 transition-colors">{event.title}</h3>
                    </div>
                  </div>
                  <div className="space-y-1.5 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-2"><MapPin size={13} />{event.location}</div>
                    <div className="flex items-center gap-2"><Trophy size={13} />{event.prize}</div>
                    <div className="flex items-center gap-2"><Users size={13} />{event.participants.toLocaleString('fa-IR')} بازیکن</div>
                  </div>
                  {/* progress bar */}
                  <div>
                    <div className="flex justify-between text-xs text-gray-400 mb-1">
                      <span>پیشرفت مسابقه</span>
                      <span>{Math.round((Date.now() - event.startDate.getTime()) / (event.endDate.getTime() - event.startDate.getTime()) * 100).toLocaleString('fa-IR')}٪</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-red-500 rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.round((Date.now() - event.startDate.getTime()) / (event.endDate.getTime() - event.startDate.getTime()) * 100))}%` }}>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* تب‌ها */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-2xl p-1 mb-6 w-fit">
        {[
          { id: 'upcoming', label: 'آینده', count: sampleEvents.filter(e => e.status === 'upcoming').length },
          { id: 'ongoing', label: 'در حال برگزاری', count: ongoing.length },
          { id: 'finished', label: 'پایان یافته', count: sampleEvents.filter(e => e.status === 'finished').length },
        ].map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
            className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === tab.id ? 'bg-white shadow-sm text-gray-900 font-bold' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab.label}
            {tab.count > 0 && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === tab.id ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-500'}`}>
                {tab.count.toLocaleString('fa-IR')}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* فیلترها */}
      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex gap-2 overflow-x-auto">
          <button onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium flex-shrink-0 border transition-colors ${activeCategory === 'all' ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}>
            همه دسته‌ها
          </button>
          {Object.entries(categoryLabels).map(([key, val]) => (
            <button key={key} onClick={() => setActiveCategory(key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex-shrink-0 border transition-colors ${activeCategory === key ? 'text-white border-transparent' : 'border-gray-200 text-gray-600 hover:border-gray-400'}`}
              style={activeCategory === key ? { backgroundColor: val.color } : {}}>
              {val.label}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          {[
            { value: 'all', label: 'همه رشته‌ها' },
            { value: 'snooker', label: 'اسنوکر' },
            { value: 'pocket', label: 'پاکت بیلیارد' },
            { value: 'highball', label: 'هی‌بال' },
          ].map(s => (
            <button key={s.value} onClick={() => setActiveSport(s.value)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${activeSport === s.value ? 'bg-green-700 text-white border-green-700' : 'border-gray-200 text-gray-600 hover:border-green-400'}`}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* لیست رویدادها */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <Trophy size={48} className="mx-auto mb-4 text-gray-300" />
          <p>رویدادی در این دسته وجود ندارد</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map(event => (
            <Link key={event.id} href={`/events/${event.id}`}>
              <div className="bg-white rounded-2xl border border-gray-100 hover:border-green-200 hover:shadow-md transition-all group overflow-hidden">
                <div className="flex">
                  {/* رنگ کنار */}
                  <div className={`w-2 flex-shrink-0 bg-gradient-to-b ${event.imageBg}`}></div>

                  <div className="flex-1 p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: categoryLabels[event.category].bg, color: categoryLabels[event.category].color }}>
                            {categoryLabels[event.category].label}
                          </span>
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            {sportLabels[event.sport]}
                          </span>
                          {event.registrationOpen && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                              ثبت‌نام باز
                            </span>
                          )}
                        </div>

                        <h3 className="font-bold text-gray-900 text-lg mb-2 group-hover:text-green-700 transition-colors">
                          {event.title}
                        </h3>
                        <p className="text-gray-500 text-sm mb-3">{event.description}</p>

                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                          <span className="flex items-center gap-1.5"><MapPin size={13} />{event.location}، {event.city}</span>
                          <span className="flex items-center gap-1.5"><Calendar size={13} />
                            {event.startDate.toLocaleDateString('fa-IR')} تا {event.endDate.toLocaleDateString('fa-IR')}
                          </span>
                          <span className="flex items-center gap-1.5"><Users size={13} />
                            {event.participants.toLocaleString('fa-IR')}/{event.maxParticipants.toLocaleString('fa-IR')} نفر
                          </span>
                          <span className="flex items-center gap-1.5 text-amber-600 font-medium">
                            <Trophy size={13} />{event.prize}
                          </span>
                        </div>
                      </div>

                      {/* سمت راست */}
                      <div className="flex-shrink-0 text-left">
                        {event.status === 'upcoming' && (
                          <div>
                            <div className="text-xs text-gray-400 mb-2 text-center">شروع تا:</div>
                            <CountdownTimer targetDate={event.startDate} />
                            {event.registrationOpen && (
                              <button className="mt-3 w-full bg-green-700 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-green-800 transition-colors">
                                ثبت‌نام
                              </button>
                            )}
                          </div>
                        )}
                        {event.status === 'finished' && event.winner && (
                          <div className="bg-amber-50 rounded-xl p-3 text-sm min-w-[180px]">
                            <div className="font-bold text-amber-700 mb-2 flex items-center gap-1">
                              <Trophy size={14} />
                              نتایج
                            </div>
                            <div className="space-y-1 text-gray-600">
                              <div>🥇 {event.winner}</div>
                              {event.runnerUp && <div>🥈 {event.runnerUp}</div>}
                              {event.third && <div>🥉 {event.third}</div>}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* progress bar برای ongoing */}
                    {event.status === 'ongoing' && (
                      <div className="mt-4">
                        <div className="flex justify-between text-xs text-gray-400 mb-1">
                          <span>پیشرفت</span>
                          <span>{Math.min(100, Math.round((Date.now() - event.startDate.getTime()) / (event.endDate.getTime() - event.startDate.getTime()) * 100)).toLocaleString('fa-IR')}٪</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full">
                          <div className="h-full bg-red-500 rounded-full"
                            style={{ width: `${Math.min(100, Math.round((Date.now() - event.startDate.getTime()) / (event.endDate.getTime() - event.startDate.getTime()) * 100))}%` }}>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}