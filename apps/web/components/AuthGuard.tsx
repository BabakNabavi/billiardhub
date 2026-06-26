'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router    = useRouter();
  const user      = useAuthStore(s => s.user);
  const hydrated  = useAuthStore(s => s._hydrated);

  useEffect(() => {
    if (hydrated && !user) {
      router.replace('/login');
    }
  }, [hydrated, user, router]);

  // Still hydrating — show cinematic loader
  if (!hydrated) return (
    <div style={{
      minHeight: '100vh', background: '#F7F7F5',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '20px',
    }}>
      <div style={{ position: 'relative', width: '48px', height: '48px' }}>
        <div style={{ position: 'absolute', inset: 0, border: '2px solid rgba(199,166,106,0.1)', borderTop: '2px solid #C7A66A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <div style={{ position: 'absolute', inset: '8px', border: '2px solid rgba(6,182,212,0.1)', borderTop: '2px solid #06b6d4', borderRadius: '50%', animation: 'spin 1.2s linear infinite reverse' }} />
      </div>
      <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.30)' }}>در حال بارگذاری...</div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  // Hydrated but no user — redirect happening
  if (!user) return null;

  return <>{children}</>;
}