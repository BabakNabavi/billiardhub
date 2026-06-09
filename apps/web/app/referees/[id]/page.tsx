// ==============================
// FILE: apps/web/app/referees/[id]/page.tsx
// ==============================
'use client';

import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';

const REFEREES: Record<string, {
  id: string; name: string; level: string; city: string; experience: number;
  phone: string; email: string; certifications: string[]; specialties: string[];
  bio: string; tournaments: { name: string; year: number; role: string }[];
  stats: { total: number; national: number; international: number; rating: number };
  avatar: string; available: boolean;
}> = {
  '1': {
    id: '1', name: 'علی رضایی', level: 'بین‌المللی', city: 'تهران', experience: 12,
    phone: '09121234567', email: 'ali.rezaei@billiard.ir',
    certifications: ['WCBS International Referee', 'فدراسیون بیلیارد ایران - درجه A', 'CEB European Certificate'],
    specialties: ['اسنوکر', 'پول', 'کارامبول'],
    bio: 'علی رضایی با ۱۲ سال تجربه داوری در سطح بین‌المللی، یکی از برترین داوران بیلیارد ایران است. وی در بیش از ۵۰ مسابقه ملی و ۱۵ مسابقه بین‌المللی داوری کرده است.',
    tournaments: [
      { name: 'قهرمانی آسیا ۲۰۲۳', year: 2023, role: 'داور ارشد' },
      { name: 'لیگ برتر ایران', year: 2023, role: 'داور اصلی' },
      { name: 'جام فجر', year: 2022, role: 'داور اصلی' },
      { name: 'المپیاد ورزشی', year: 2022, role: 'داور' },
    ],
    stats: { total: 68, national: 53, international: 15, rating: 4.9 },
    avatar: 'AR', available: true,
  },
  '2': {
    id: '2', name: 'محمد کریمی', level: 'ملی', city: 'اصفهان', experience: 8,
    phone: '09131234567', email: 'mohammad.karimi@billiard.ir',
    certifications: ['فدراسیون بیلیارد ایران - درجه B', 'گواهینامه داوری اسنوکر'],
    specialties: ['اسنوکر', 'بالینوس'],
    bio: 'محمد کریمی داور ملی با ۸ سال سابقه در مسابقات داخلی کشور. متخصص در داوری اسنوکر و بالینوس.',
    tournaments: [
      { name: 'لیگ برتر ایران', year: 2023, role: 'داور اصلی' },
      { name: 'مسابقات استانی اصفهان', year: 2023, role: 'داور ارشد' },
      { name: 'جام رمضان', year: 2022, role: 'داور اصلی' },
    ],
    stats: { total: 41, national: 41, international: 0, rating: 4.7 },
    avatar: 'MK', available: true,
  },
  '3': {
    id: '3', name: 'سارا احمدی', level: 'ملی', city: 'مشهد', experience: 6,
    phone: '09151234567', email: 'sara.ahmadi@billiard.ir',
    certifications: ['فدراسیون بیلیارد ایران - درجه B'],
    specialties: ['پول آمریکایی', 'اسنوکر'],
    bio: 'سارا احمدی از پیشگامان داوری بانوان در بیلیارد ایران. با ۶ سال تجربه در مسابقات ملی بانوان.',
    tournaments: [
      { name: 'قهرمانی بانوان ایران', year: 2023, role: 'داور ارشد' },
      { name: 'لیگ بانوان', year: 2023, role: 'داور اصلی' },
    ],
    stats: { total: 28, national: 28, international: 0, rating: 4.8 },
    avatar: 'SA', available: false,
  },
};

const levelColors: Record<string, string> = {
  'بین‌المللی': 'from-amber-500 to-orange-500',
  'ملی': 'from-emerald-500 to-cyan-500',
  'استانی': 'from-violet-500 to-purple-500',
};

export default function RefereeProfilePage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const referee = REFEREES[id];

  if (!referee) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#010604', color: '#f0faf5' }}>
        <div className="text-6xl mb-4">🎱</div>
        <h2 className="text-2xl font-bold mb-2" style={{ color: '#10b981' }}>داور مورد نظر یافت نشد</h2>
        <p className="mb-6" style={{ color: '#6b7280' }}>شناسه داور معتبر نیست</p>
        <button onClick={() => router.push('/referees')}
          className="px-6 py-3 rounded-xl font-bold"
          style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#010604' }}>
          بازگشت به داوران
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#010604', color: '#f0faf5', fontFamily: 'Vazirmatn, sans-serif' }} dir="rtl">
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#050c08 0%,#0a1a0f 50%,#050c08 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, #10b981 0%, transparent 50%), radial-gradient(circle at 80% 20%, #06b6d4 0%, transparent 50%)' }} />
        <div className="relative max-w-4xl mx-auto px-4 py-12">
          <Link href="/referees" className="inline-flex items-center gap-2 mb-8 text-sm hover:opacity-80 transition-opacity" style={{ color: '#10b981' }}>
            ← بازگشت به لیست داوران
          </Link>
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative flex-shrink-0">
              <div className="w-28 h-28 rounded-2xl flex items-center justify-center text-3xl font-black"
                style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#010604' }}>
                {referee.avatar}
              </div>
              {referee.available && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full border-2"
                  style={{ background: '#10b981', borderColor: '#010604' }} />
              )}
            </div>
            <div className="flex-1 text-center sm:text-right">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-1">
                <span className={`text-xs font-bold px-3 py-1 rounded-full bg-gradient-to-r ${levelColors[referee.level] ?? 'from-gray-500 to-gray-600'} text-white`}>
                  {referee.level}
                </span>
                {referee.available
                  ? <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(16,185,129,0.15)', color: '#10b981', border: '1px solid rgba(16,185,129,0.3)' }}>در دسترس</span>
                  : <span className="text-xs px-3 py-1 rounded-full" style={{ background: 'rgba(239,68,68,0.15)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>مشغول</span>
                }
              </div>
              <h1 className="text-3xl font-black mt-2 mb-1">{referee.name}</h1>
              <p style={{ color: '#6b7280' }}>{referee.city} · {referee.experience} سال تجربه</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'کل مسابقات', value: referee.stats.total, color: '#10b981' },
            { label: 'ملی', value: referee.stats.national, color: '#06b6d4' },
            { label: 'بین‌المللی', value: referee.stats.international, color: '#f59e0b' },
            { label: 'امتیاز', value: referee.stats.rating + ' ⭐', color: '#a78bfa' },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-4 text-center" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
              <div className="text-2xl font-black mb-1" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs" style={{ color: '#6b7280' }}>{s.label}</div>
            </div>
          ))}
        </div>

        <div className="md:col-span-2 space-y-6">
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#10b981' }}>درباره داور</h2>
            <p className="leading-relaxed" style={{ color: '#9ca3af' }}>{referee.bio}</p>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#10b981' }}>سابقه مسابقات</h2>
            <div className="space-y-3">
              {referee.tournaments.map((t, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-xl" style={{ background: 'rgba(16,185,129,0.05)', border: '1px solid rgba(16,185,129,0.1)' }}>
                  <div>
                    <div className="font-semibold text-sm">{t.name}</div>
                    <div className="text-xs mt-0.5" style={{ color: '#6b7280' }}>{t.role}</div>
                  </div>
                  <span className="text-xs font-bold" style={{ color: '#f59e0b' }}>{t.year}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#10b981' }}>تخصص‌ها</h2>
            <div className="flex flex-wrap gap-2">
              {referee.specialties.map(s => (
                <span key={s} className="text-xs px-3 py-1 rounded-full font-medium"
                  style={{ background: 'rgba(6,182,212,0.15)', color: '#06b6d4', border: '1px solid rgba(6,182,212,0.3)' }}>
                  {s}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#10b981' }}>گواهینامه‌ها</h2>
            <div className="space-y-2">
              {referee.certifications.map((c, i) => (
                <div key={i} className="flex items-start gap-2 text-sm" style={{ color: '#9ca3af' }}>
                  <span style={{ color: '#10b981', marginTop: 2 }}>✓</span>
                  <span>{c}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-6" style={{ background: '#050c08', border: '1px solid rgba(16,185,129,0.15)' }}>
            <h2 className="text-lg font-bold mb-3" style={{ color: '#10b981' }}>تماس</h2>
            <div className="space-y-2 text-sm" style={{ color: '#9ca3af' }}>
              <div>📞 {referee.phone}</div>
              <div>✉️ {referee.email}</div>
              <div>📍 {referee.city}</div>
            </div>
            {referee.available && (
              <button className="w-full mt-4 py-2.5 rounded-xl font-bold text-sm"
                style={{ background: 'linear-gradient(135deg,#10b981,#06b6d4)', color: '#010604' }}>
                درخواست داوری
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
