'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';
import {
  Users, ShoppingBag, Trophy, Newspaper, Settings,
  CheckCircle, TrendingUp, Building2, Star, Megaphone, Scale
} from 'lucide-react';



export default function AdminPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setChecked(true), 500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!checked) return;
    if (!user) { router.push('/login'); return; }
    if (user.primaryRole !== 'admin') { router.push('/'); return; }
  }, [checked, user]);

  if (!checked) return <div className="text-center py-20 text-gray-400">در حال بارگذاری...</div>;
  if (!user || user.primaryRole !== 'admin') return null;

  const stats = [
    { label: 'کاربران', value: (124).toLocaleString('fa-IR'), icon: <Users size={24} />, color: 'text-blue-600', bg: 'bg-blue-50', link: '/admin/users' },
    { label: 'محصولات', value: (87).toLocaleString('fa-IR'), icon: <ShoppingBag size={24} />, color: 'text-purple-600', bg: 'bg-purple-50', link: '/admin/products' },
    { label: 'باشگاه‌ها', value: (43).toLocaleString('fa-IR'), icon: <Building2 size={24} />, color: 'text-green-600', bg: 'bg-green-50', link: '/admin/clubs' },
    { label: 'مسابقات', value: (12).toLocaleString('fa-IR'), icon: <Trophy size={24} />, color: 'text-amber-600', bg: 'bg-amber-50', link: '/admin/events' },
    { label: 'اخبار', value: (36).toLocaleString('fa-IR'), icon: <Newspaper size={24} />, color: 'text-red-600', bg: 'bg-red-50', link: '/admin/news' },
    { label: 'درخواست تأیید', value: (8).toLocaleString('fa-IR'), icon: <Star size={24} />, color: 'text-yellow-600', bg: 'bg-yellow-50', link: '/admin/verifications' },
  ];

  const menuItems = [
  { title: 'پنل مدیریت باشگاه', desc: 'مدیریت باشگاه‌ها، میزها، رزروها و مسابقات', icon: <Building2 size={28} />, color: 'bg-yellow-600', link: '/dashboard/club' },
  { title: 'تأیید باشگاه‌ها', desc: 'بررسی جواز کسب و صدور تیک تأیید رسمی', icon: <CheckCircle size={28} />, color: 'bg-emerald-600', link: '/admin/clubs' },
  { title: 'مدیریت کاربران', desc: 'تأیید، ویرایش و مدیریت کاربران', icon: <Users size={28} />, color: 'bg-blue-600', link: '/admin/users' },
  { title: 'رنکینگ', desc: 'ورود و ویرایش رنکینگ بازیکنان', icon: <TrendingUp size={28} />, color: 'bg-green-600', link: '/admin/rankings' },
  { title: 'تأیید محصولات', desc: 'بررسی و تأیید محصولات فروشگاه', icon: <ShoppingBag size={28} />, color: 'bg-purple-600', link: '/admin/products' },
  { title: 'مسابقات', desc: 'ایجاد و مدیریت رویدادها', icon: <Trophy size={28} />, color: 'bg-amber-600', link: '/admin/events' },
  { title: 'اخبار', desc: 'نوشتن و مدیریت اخبار', icon: <Newspaper size={28} />, color: 'bg-red-600', link: '/admin/news' },
  { title: 'تأیید کاربران', desc: 'verify کردن مربیان و داوران', icon: <CheckCircle size={28} />, color: 'bg-teal-600', link: '/admin/verifications' },
  { title: 'تأیید مربیان (پروفایل)', desc: 'بررسی پروفایل مربیان ثبت‌شده در داشبورد و صدور تیک آبی', icon: <Star size={28} />, color: 'bg-indigo-600', link: '/admin/coaches' },
  { title: 'تأیید داوران (پروفایل)', desc: 'بررسی پروفایل و مدرک داوران ثبت‌شده در داشبورد و صدور تیک آبی', icon: <Scale size={28} />, color: 'bg-cyan-700', link: '/admin/referees' },
  { title: 'مدیریت تبلیغات', desc: 'بنرها و تبلیغات سایت', icon: <Megaphone size={28} />, color: 'bg-orange-500', link: '/admin/ads' },
];

  return (
    <div className="max-w-6xl mx-auto pb-10 pt-6 px-4 sm:px-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800">پنل مدیریت</h1>
          <p className="text-gray-500 text-xs sm:text-sm mt-1">بیلیارد هاب — داشبورد ادمین</p>
        </div>
        <div className="bg-red-100 text-red-700 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-1.5 sm:gap-2 shrink-0">
          <Settings size={15} />
          ادمین
        </div>
      </div>

      <div className="grid grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-4 mb-8">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.link}>
            <div className={`${stat.bg} rounded-xl sm:rounded-2xl p-3 sm:p-4 text-center hover:shadow-md transition-all cursor-pointer h-full`}>
              <div className={`${stat.color} flex justify-center mb-1.5 sm:mb-2`}>{stat.icon}</div>
              <div className={`text-lg sm:text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 leading-tight">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2.5 sm:gap-5">
        {menuItems.map((item, i) => (
          <Link key={i} href={item.link}>
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-6 hover:shadow-md hover:border-green-200 transition-all group cursor-pointer h-full flex flex-col items-center text-center sm:items-start sm:text-right">
              <div className={`${item.color} w-11 h-11 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl flex items-center justify-center text-white mb-2 sm:mb-4 group-hover:scale-110 transition-transform shrink-0`}>
                {item.icon}
              </div>
              <h3 className="font-bold text-gray-800 text-xs sm:text-lg leading-tight mb-0.5 sm:mb-1">{item.title}</h3>
              <p className="hidden sm:block text-gray-500 text-sm">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}