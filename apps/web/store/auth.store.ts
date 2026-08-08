import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  primaryRole: string;
  secondaryRoles: string[];
  isProfileComplete: boolean;
  verified?: boolean;          // شماره‌ی موبایل با کد پیامکی تأیید شده
  phone?: string;
  bio?: string;
  city?: string;
  role?: string;
  avatar?: string | null;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  _hydrated: boolean;
  /* ── چرا این جدا از `_hydrated` است ──
     `_hydrated` فقط می‌گوید «localStorage خوانده شد» — نه اینکه
     نتیجه‌اش درست است. منبعِ حقیقتِ نشست کوکیِ httpOnly است و
     `SessionBridge` آن را از سرور می‌پرسد، ولی آن پرسش چند صد
     میلی‌ثانیه طول می‌کشد.

     در آن فاصله، صفحه‌ای که فقط `_hydrated` را می‌بیند، کاربرِ
     واردشده را «مهمان» فرض می‌کند و «ابتدا وارد سایت شوید» نشان
     می‌دهد — بعد پیام خودش می‌رود. کاربر این را «گاهی می‌آید، گاهی
     نه» تجربه می‌کند، که بدترین نوعِ باگ برای گزارش‌کردن است.

     `authChecked` یعنی «سرور جواب داد». عمداً ذخیره نمی‌شود: هر بار
     بارگذاری باید از نو پرسیده شود. */
  authChecked: boolean;
  setAuth: (user: User, token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setHydrated: () => void;
  setAuthChecked: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      _hydrated: false,
      authChecked: false,
      setAuth: (user, token) => set({ user, token }),
      /* ورودِ موفق خودش یک تأییدِ سرور است */
      login: (user, token) => set({ user, token, authChecked: true }),
      logout: () => set({ user: null, token: null, authChecked: true }),
      setHydrated: () => set({ _hydrated: true }),
      setAuthChecked: () => set({ authChecked: true }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'auth-storage',
      /* توکن دیگر ذخیره نمی‌شود. نشست روی کوکی httpOnly است و
         جاوااسکریپت نباید اصلاً به آن دسترسی داشته باشد. فقط اطلاعات
         نمایشی کاربر (نام، نقش، آواتار) در localStorage می‌ماند. */
      partialize: (state) => ({ user: state.user }) as unknown as AuthStore,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

export default useAuthStore;