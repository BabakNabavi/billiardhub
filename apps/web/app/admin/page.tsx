'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';
import {
  Users, ShoppingBag, Trophy, Newspaper, Settings,
  CheckCircle, TrendingUp, Building2, Star, Megaphone
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
  { title: 'مدیریت کاربران', desc: 'تأیید، ویرایش و مدیریت کاربران', icon: <Users size={28} />, color: 'bg-blue-600', link: '/admin/users' },
  { title: 'رنکینگ', desc: 'ورود و ویرایش رنکینگ بازیکنان', icon: <TrendingUp size={28} />, color: 'bg-green-600', link: '/admin/rankings' },
  { title: 'تأیید محصولات', desc: 'بررسی و تأیید محصولات فروشگاه', icon: <ShoppingBag size={28} />, color: 'bg-purple-600', link: '/admin/products' },
  { title: 'مسابقات', desc: 'ایجاد و مدیریت رویدادها', icon: <Trophy size={28} />, color: 'bg-amber-600', link: '/admin/events' },
  { title: 'اخبار', desc: 'نوشتن و مدیریت اخبار', icon: <Newspaper size={28} />, color: 'bg-red-600', link: '/admin/news' },
  { title: 'تأیید کاربران', desc: 'verify کردن مربیان و داوران', icon: <CheckCircle size={28} />, color: 'bg-teal-600', link: '/admin/verifications' },
  { title: 'مدیریت تبلیغات', desc: 'بنرها و تبلیغات سایت', icon: <Megaphone size={28} />, color: 'bg-orange-500', link: '/admin/ads' },
];

  return (
    <div className="max-w-6xl mx-auto pb-10 pt-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">پنل مدیریت</h1>
          <p className="text-gray-500 text-sm mt-1">بیلیارد هاب — داشبورد ادمین</p>
        </div>
        <div className="bg-red-100 text-red-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2">
          <Settings size={16} />
          ادمین
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat, i) => (
          <Link key={i} href={stat.link}>
            <div className={`${stat.bg} rounded-2xl p-4 text-center hover:shadow-md transition-all cursor-pointer`}>
              <div className={`${stat.color} flex justify-center mb-2`}>{stat.icon}</div>
              <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {menuItems.map((item, i) => (
          <Link key={i} href={item.link}>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-green-200 transition-all group cursor-pointer">
              <div className={`${item.color} w-14 h-14 rounded-2xl flex items-center justify-center text-white mb-4 group-hover:scale-110 transition-transform`}>
                {item.icon}
              </div>
              <h3 className="font-bold text-gray-800 text-lg mb-1">{item.title}</h3>
              <p className="text-gray-500 text-sm">{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}