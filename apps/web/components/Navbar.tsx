'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/auth.store';
import { Search, Bell, ShoppingCart, ChevronDown, User, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [search, setSearch] = useState('');
  const showWarning = user && !user.isProfileComplete;
  const profileRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const menuItems = [
    { href: '/players', label: '🎱 بازیکنان' },
    { href: '/coaches', label: '👨‍🏫 مربیان' },
    { href: '/referees', label: '🏁 داوران' },
    { href: '/sellers', label: '🛍️ فروشندگان' },
    { href: '/manufacturers', label: '🏭 تولیدکنندگان' },
    { href: '/installers', label: '🔧 متخصصین نصب' },
  ];

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-4">

        {/* سبد خرید */}
        <Link href="/shop" className="text-gray-600 hover:text-green-700 transition-colors flex-shrink-0">
          <ShoppingCart size={24} />
        </Link>

        {/* ورود/ثبت‌نام یا پروفایل */}
        {!user ? (
          <Link href="/login"
            className="flex items-center gap-2 border border-gray-300 rounded-full px-4 py-1.5 text-sm text-gray-700 hover:border-green-500 hover:text-green-700 transition-all flex-shrink-0">
            <User size={16} />
            ورود | ثبت‌نام
          </Link>
        ) : (
          <div className="relative flex-shrink-0" ref={profileRef}>
            <button onClick={() => setProfileOpen(p => !p)}
              className="flex items-center gap-2 border border-gray-300 rounded-full px-3 py-1.5 text-sm hover:border-green-500 transition-all">
              {showWarning && <span>⚠️</span>}
              <div className="w-6 h-6 bg-green-700 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {user.firstName?.[0]}
              </div>
              {user.firstName}
              <ChevronDown size={14} />
            </button>
            {profileOpen && (
              <div className="absolute top-11 right-0 bg-white rounded-2xl shadow-xl border border-gray-100 p-2 w-52 z-50">
                <Link href="/dashboard" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 rounded-xl text-sm text-gray-700">
                  داشبورد
                </Link>
                {user.primaryRole === 'admin' && (
                  <Link href="/admin" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 rounded-xl text-sm text-red-600 font-medium">
                    پنل ادمین
                  </Link>
                )}
                <Link href="/dashboard/shop" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 rounded-xl text-sm text-gray-700">
                  فروشگاه من
                </Link>
                {(user.primaryRole === 'club_owner' || (user.secondaryRoles || []).includes('club_owner')) && (
                  <Link href="/dashboard/club" onClick={() => setProfileOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 rounded-xl text-sm text-gray-700">
                    مدیریت باشگاه
                  </Link>
                )}
                <Link href="/profile" onClick={() => setProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 hover:bg-gray-50 rounded-xl text-sm text-gray-700">
                  ویرایش پروفایل
                </Link>
                <div className="border-t border-gray-100 mt-1 pt-1">
                  <button onClick={() => { logout(); setProfileOpen(false); router.push('/'); }}
                    className="w-full text-right flex items-center gap-2 px-3 py-2.5 hover:bg-red-50 rounded-xl text-sm text-red-500">
                    خروج
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* زنگوله */}
        <button className="text-gray-600 hover:text-green-700 transition-colors flex-shrink-0 relative">
          <Bell size={22} />
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-xs flex items-center justify-center">
            ۳
          </span>
        </button>

        {/* سرچ */}
        <div className="flex-1">
          <div className="relative flex items-center bg-gray-100 rounded-full px-4 py-2.5 hover:bg-gray-200 transition-colors">
            <Search size={18} className="text-gray-400 flex-shrink-0" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="جستجو در بیلیارد پلاس..."
              className="flex-1 bg-transparent px-3 text-sm focus:outline-none text-gray-700 placeholder-gray-400" />
            {search && (
              <button onClick={() => setSearch('')} className="text-gray-400 hover:text-gray-600">
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* لوگو */}
        <Link href="/" className="text-xl font-black text-green-800 flex-shrink-0 flex items-center gap-2">
          <div className="w-8 h-8 bg-green-700 rounded-full flex items-center justify-center text-white text-sm font-black">B</div>
          بیلیارد پلاس
        </Link>

        {/* لینک‌ها */}
        <div className="hidden md:flex items-center gap-5 flex-shrink-0">
          <Link href="/clubs" className="text-sm text-gray-600 hover:text-green-700 transition-colors">باشگاه‌ها</Link>
          <Link href="/news" className="text-sm text-gray-600 hover:text-green-700 transition-colors">اخبار</Link>
          <Link href="/events" className="text-sm text-gray-600 hover:text-green-700 transition-colors">مسابقات</Link>
          <Link href="/live" className="text-sm text-gray-600 hover:text-green-700 transition-colors flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            زنده
          </Link>
          <Link href="/rankings" className="text-sm text-gray-600 hover:text-green-700 transition-colors">رنکینگ</Link>
          <div className="relative" ref={searchRef}>
            <button onClick={() => setSearchOpen(p => !p)}
              className="text-sm text-gray-600 hover:text-green-700 transition-colors flex items-center gap-1">
              جستجو
              <ChevronDown size={14} />
            </button>
            {searchOpen && (
              <div className="absolute top-8 right-0 bg-white text-gray-800 rounded-2xl shadow-lg p-2 w-52 z-50 border border-gray-100">
                {menuItems.map(item => (
                  <Link key={item.href} href={item.href} onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-2 px-3 py-2.5 hover:bg-green-50 rounded-xl text-sm transition-colors">
                    {item.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}