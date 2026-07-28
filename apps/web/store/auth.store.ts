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
  verified?: boolean;          // شماره‌ی موبایل با کدِ پیامکی تأیید شده
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
  setAuth: (user: User, token: string) => void;
  login: (user: User, token: string) => void;
  logout: () => void;
  setHydrated: () => void;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      _hydrated: false,
      setAuth: (user, token) => set({ user, token }),
      login: (user, token) => set({ user, token }),
      logout: () => set({ user: null, token: null }),
      setHydrated: () => set({ _hydrated: true }),
      updateUser: (updates) => set((state) => ({
        user: state.user ? { ...state.user, ...updates } : null,
      })),
    }),
    {
      name: 'auth-storage',
      /* توکن دیگر ذخیره نمی‌شود. نشست روی کوکیِ httpOnly است و
         جاوااسکریپت نباید اصلاً به آن دسترسی داشته باشد. فقط اطلاعاتِ
         نمایشیِ کاربر (نام، نقش، آواتار) در localStorage می‌ماند. */
      partialize: (state) => ({ user: state.user }) as unknown as AuthStore,
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    }
  )
);

export default useAuthStore;