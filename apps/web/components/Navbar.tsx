'use client';

import Link from 'next/link';
import { useAuthStore } from '../store/auth.store';

export default function Navbar() {
  const { user, logout } = useAuthStore();

  const showWarning = user && !user.isProfileComplete;

  return (
    <nav className="bg-green-800 text-white px-6 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-xl font-bold">
          🎱 بیلیارد پلاس
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/clubs" className="hover:text-green-300 text-sm">
            باشگاه‌ها
          </Link>

          {user ? (
            <div className="flex items-center gap-4">
              <Link href="/dashboard" className="hover:text-green-300 text-sm">
                داشبورد
              </Link>
              {(user.primaryRole === 'club_owner' || user.secondaryRoles.includes('club_owner')) && (
                <Link href="/dashboard/club" className="hover:text-green-300 text-sm">
                  مدیریت باشگاه
                </Link>
              )}
              <Link href="/dashboard" className="flex items-center gap-1 bg-green-600 px-3 py-1 rounded-lg text-sm">
                {showWarning && <span title="پروفایل تکمیل نشده">⚠️</span>}
                {user.firstName}
              </Link>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login" className="hover:text-green-300 text-sm">
                ورود
              </Link>
              <Link href="/register" className="bg-green-600 px-4 py-2 rounded-lg hover:bg-green-700 text-sm">
                ثبت‌نام
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}