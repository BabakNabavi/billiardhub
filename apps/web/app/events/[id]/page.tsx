'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { MapPin, Trophy, Users, ChevronLeft, Calendar, Timer, CheckCircle } from 'lucide-react';

const now = new Date();

const sampleEvents = [
    {
        id: '1',
        title: 'مسابقات قهرمانی اسنوکر ایران ۱۴۰۳',
        description: `مسابقات قهرمانی اسنوکر ایران ۱۴۰۳ با حضور بیش از ۱۲۸ بازیکن از سراسر کشور در سالن المپیک تهران برگزار می‌شود.

این رویداد بزرگ‌ترین مسابقه اسنوکر ایران در ۵ سال گذشته است و با حمایت فدراسیون بیلیارد و اسنوکر جمهوری اسلامی ایران برگزار خواهد شد.

بازیکنان از ۳۱ استان کشور در این مسابقات شرکت می‌کنند و رقابت‌ها در قالب دو بخش آقایان و بانوان برگزار می‌شود.`,
        category: 'national', categoryLabel: 'کشوری', categoryColor: '#e8192c',
        sport: 'snooker', sportLabel: 'اسنوکر',
        location: 'سالن المپیک تهران', city: 'تهران',
        startDate: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000),
        status: 'upcoming',
        participants: 96, maxParticipants: 128,
        prize: '۵۰۰ میلیون تومان',
        organizer: 'فدراسیون بیلیارد ایران',
        registrationOpen: true,
        imageBg: 'from-red-900 to-red-700',
        schedule: [
            { day: 'روز اول', date: '۱۵ خرداد', matches: 'دور مقدماتی — ۶۴ بازیکن' },
            { day: 'روز دوم', date: '۱۶ خرداد', matches: 'دور ۳۲ نفر' },
            { day: 'روز سوم', date: '۱۷ خرداد', matches: 'دور ۱۶ نفر' },
            { day: 'روز چهارم', date: '۱۸ خرداد', matches: 'یک چهارم نهایی' },
            { day: 'روز پنجم', date: '۱۹ خرداد', matches: 'نیمه نهایی' },
            { day: 'روز آخر', date: '۲۲ خرداد', matches: 'فینال و اهدای جوایز' },
        ],
        prizes: [
            { place: '🥇 اول', amount: '۲۵۰ میلیون تومان' },
            { place: '🥈 دوم', amount: '۱۵۰ میلیون تومان' },
            { place: '🥉 سوم و چهارم', amount: '۵۰ میلیون تومان' },
        ],
    },
    {
        id: '2',
        title: 'لیگ پاکت بیلیارد دسته برتر',
        description: 'رقابت‌های هفتگی لیگ دسته برتر پاکت بیلیارد با حضور ۳۲ بازیکن برتر کشور.',
        category: 'national', categoryLabel: 'کشوری', categoryColor: '#2563eb',
        sport: 'pocket', sportLabel: 'پاکت بیلیارد',
        location: 'باشگاه مرکزی تهران', city: 'تهران',
        startDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(now.getTime() + 5 * 24 * 60 * 60 * 1000),
        status: 'ongoing',
        participants: 32, maxParticipants: 32,
        prize: '۲۰۰ میلیون تومان',
        organizer: 'فدراسیون بیلیارد ایران',
        registrationOpen: false,
        imageBg: 'from-blue-900 to-blue-700',
        schedule: [],
        prizes: [
            { place: '🥇 اول', amount: '۱۰۰ میلیون تومان' },
            { place: '🥈 دوم', amount: '۶۰ میلیون تومان' },
            { place: '🥉 سوم', amount: '۴۰ میلیون تومان' },
        ],
    },
];

function CountdownTimer({ targetDate }: { targetDate: Date }) {
    const [t, setT] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const calc = () => {
            const diff = targetDate.getTime() - Date.now();
            if (diff > 0) setT({
                days: Math.floor(diff / (1000 * 60 * 60 * 24)),
                hours: Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
                seconds: Math.floor((diff % (1000 * 60)) / 1000),
            });
        };
        calc();
        const i = setInterval(calc, 1000);
        return () => clearInterval(i);
    }, [targetDate]);

    const fa = (n: number) => n.toLocaleString('fa-IR').padStart(2, '۰');

    return (
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '8px' }}>




            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '8px 12px', textAlign: 'center', minWidth: '56px' }}>
                <div style={{ color: 'white', fontWeight: 900, fontSize: '20px' }}>{fa(t.seconds)}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>ثانیه</div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', fontSize: '20px' }}>:</span>

            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '8px 12px', textAlign: 'center', minWidth: '56px' }}>
                <div style={{ color: 'white', fontWeight: 900, fontSize: '20px' }}>{fa(t.minutes)}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>دقیقه</div>
            </div>

            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', fontSize: '20px' }}>:</span>

            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '8px 12px', textAlign: 'center', minWidth: '56px' }}>
                <div style={{ color: 'white', fontWeight: 900, fontSize: '20px' }}>{fa(t.hours)}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>ساعت</div>
            </div>
            <span style={{ color: 'rgba(255,255,255,0.5)', fontWeight: 'bold', fontSize: '20px' }}>:</span>
            <div style={{ background: 'rgba(0,0,0,0.3)', borderRadius: '12px', padding: '8px 12px', textAlign: 'center', minWidth: '56px' }}>
                <div style={{ color: 'white', fontWeight: 900, fontSize: '20px' }}>{fa(t.days)}</div>
                <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '11px' }}>روز</div>
            </div>

        </div>
    );
}

export default function EventDetailPage() {
    const params = useParams();
    const id = params.id as string;
    const event = sampleEvents.find(e => e.id === id) || sampleEvents[0];

    return (
        <div className="max-w-6xl mx-auto pb-10">

            {/* breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-400 mb-6">
                <Link href="/events" className="hover:text-green-700">مسابقات</Link>
                <ChevronLeft size={14} />
                <span className="text-gray-600 line-clamp-1">{event?.title}</span>
            </div>

            {/* هدر */}
            <div className={`bg-gradient-to-l ${event?.imageBg} rounded-2xl p-8 mb-8 text-white relative overflow-hidden`}>
                <div className="absolute top-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full -translate-x-32 -translate-y-32"></div>
                <div className="relative flex flex-col lg:flex-row gap-8">

                    {/* اطلاعات — سمت راست */}
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-3">
                            <span className="bg-white bg-opacity-20 text-white text-xs px-3 py-1 rounded-full">{event?.categoryLabel}</span>
                            <span className="bg-white bg-opacity-20 text-white text-xs px-3 py-1 rounded-full">{event?.sportLabel}</span>
                            {event?.status === 'ongoing' && (
                                <span className="bg-red-500 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1 animate-pulse">
                                    <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
                                    زنده
                                </span>
                            )}
                        </div>
                        <h1 className="text-3xl font-black mb-4 leading-10">{event?.title}</h1>
                        <div className="space-y-2 text-white opacity-80 text-sm">
                            <div className="flex items-center gap-2"><MapPin size={14} />{event?.location}، {event?.city}</div>
                            <div className="flex items-center gap-2"><Calendar size={14} />{event?.startDate.toLocaleDateString('fa-IR')} تا {event?.endDate.toLocaleDateString('fa-IR')}</div>
                            <div className="flex items-center gap-2"><Trophy size={14} />جایزه: {event?.prize}</div>
                            <div className="flex items-center gap-2"><Users size={14} />{event?.participants.toLocaleString('fa-IR')} از {event?.maxParticipants.toLocaleString('fa-IR')} نفر ثبت‌نام کرده‌اند</div>
                        </div>
                    </div>

                    {/* تایمر — سمت چپ */}
                    <div className="lg:w-80 flex flex-col justify-center">
                        {event?.status === 'upcoming' && (
                            <div className="bg-black bg-opacity-20 rounded-2xl p-5">
                                <div className="text-white opacity-70 text-sm mb-4 flex items-center gap-2">
                                    <Timer size={14} />
                                    شروع مسابقات تا:
                                </div>
                                <CountdownTimer targetDate={event?.startDate} />
                                {event?.registrationOpen && (
                                    <button className="mt-5 w-full bg-white text-gray-900 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors">
                                        ثبت‌نام در مسابقه
                                    </button>
                                )}
                            </div>
                        )}
                        {event?.status === 'ongoing' && (
                            <div className="bg-black bg-opacity-20 rounded-2xl p-5">
                                <div className="text-white font-bold mb-3 text-center">در حال برگزاری</div>
                                <div className="h-3 bg-white bg-opacity-20 rounded-full mb-2">
                                    <div className="h-full bg-white rounded-full" style={{ width: '40%' }}></div>
                                </div>
                                <div className="text-white opacity-70 text-sm text-center">۴۰٪ پیشرفت</div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-12 gap-6">
                {/* محتوای اصلی */}
                <div className="col-span-12 lg:col-span-8 space-y-6">

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-green-600 rounded-full"></span>
                            درباره مسابقه
                        </h2>
                        {event?.description.split('\n\n').map((p, i) => (
                            p.trim() && <p key={i} className="text-gray-700 leading-8 mb-3">{p}</p>
                        ))}
                    </div>

                    {(event?.schedule?.length ?? 0) > 0 && (
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
                                <span className="w-1 h-5 bg-blue-600 rounded-full"></span>
                                برنامه مسابقات
                            </h2>
                            <div className="space-y-3">
                                {event?.schedule.map((item, i) => (
                                    <div key={i} className="flex items-center gap-4 p-3 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold text-sm flex-shrink-0">
                                            {(i + 1).toLocaleString('fa-IR')}
                                        </div>
                                        <div>
                                            <div className="font-bold text-sm text-gray-800">{item.day} — {item.date}</div>
                                            <div className="text-xs text-gray-500">{item.matches}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl shadow-sm p-6">
                        <h2 className="font-black text-gray-900 text-lg mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-amber-500 rounded-full"></span>
                            جوایز
                        </h2>
                        <div className="space-y-3">
                            {event?.prizes.map((prize, i) => (
                                <div key={i} className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-100">
                                    <span className="font-bold text-gray-800">{prize.place}</span>
                                    <span className="font-black text-amber-700">{prize.amount}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ستون کنار */}
                <div className="col-span-12 lg:col-span-4">
                    <div className="sticky top-24 space-y-5">
                        <div className="bg-white rounded-2xl shadow-sm p-5">
                            <h3 className="font-black text-gray-900 text-sm mb-4">اطلاعات رویداد</h3>
                            <div className="space-y-3">
                                {[
                                    { label: 'برگزارکننده', value: event?.organizer },
                                    { label: 'محل برگزاری', value: `${event?.location}، ${event?.city}` },
                                    { label: 'رشته', value: event?.sportLabel },
                                    { label: 'دسته', value: event?.categoryLabel },
                                    { label: 'کل جایزه', value: event?.prize },
                                    { label: 'ظرفیت', value: `${event?.maxParticipants.toLocaleString('fa-IR')} نفر` },
                                ].map((item, i) => (
                                    <div key={i} className="flex justify-between text-sm border-b border-gray-50 pb-2">
                                        <span className="text-gray-400">{item.label}</span>
                                        <span className="font-medium text-gray-800">{item.value}</span>
                                    </div>
                                ))}
                            </div>
                            {event?.registrationOpen && (
                                <button className="w-full mt-4 bg-green-700 text-white py-3 rounded-xl font-bold hover:bg-green-800 transition-colors flex items-center justify-center gap-2">
                                    <CheckCircle size={18} />
                                    ثبت‌نام در مسابقه
                                </button>
                            )}
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm p-5">
                            <h3 className="font-black text-gray-900 text-sm mb-3">اشتراک‌گذاری</h3>
                            <div className="flex gap-2">
                                <button className="flex-1 py-2 bg-green-500 text-white rounded-xl text-sm font-bold hover:bg-green-600">واتساپ</button>
                                <button className="flex-1 py-2 bg-blue-500 text-white rounded-xl text-sm font-bold hover:bg-blue-600">تلگرام</button>
                                <button className="flex-1 py-2 bg-gray-800 text-white rounded-xl text-sm font-bold hover:bg-gray-900">کپی</button>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                            <div className="bg-gray-900 px-5 py-3">
                                <span className="text-white font-black text-sm">رویدادهای مشابه</span>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {sampleEvents.map(e => (
                                    <Link key={e.id} href={`/events/${e.id}`}>
                                        <div className="flex gap-3 p-4 hover:bg-gray-50 transition-colors group">
                                            <div className={`bg-gradient-to-br ${e.imageBg} w-14 h-14 rounded-xl flex-shrink-0`}></div>
                                            <div>
                                                <h4 className="font-bold text-xs text-gray-800 line-clamp-2 group-hover:text-green-700 transition-colors mb-1">
                                                    {e.title}
                                                </h4>
                                                <div className="text-xs text-gray-400 flex items-center gap-1">
                                                    <Trophy size={9} className="text-amber-500" />
                                                    {e.prize}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}