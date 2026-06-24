'use client';

import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastProps {
  message:  string;
  type?:    ToastType;
  duration?: number;
  onClose:  () => void;
}

const config = {
  success: { icon: <CheckCircle size={16} />, color: '#C7A66A', bg: 'rgba(199,166,106,0.1)',  border: 'rgba(199,166,106,0.25)' },
  error:   { icon: <XCircle size={16} />,     color: '#ef4444', bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)'  },
  warning: { icon: <AlertCircle size={16} />, color: '#f59e0b', bg: 'rgba(245,158,11,0.1)',  border: 'rgba(245,158,11,0.25)' },
  info:    { icon: <Info size={16} />,        color: '#06b6d4', bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.25)'  },
};

export function Toast({ message, type = 'success', duration = 4000, onClose }: ToastProps) {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const c = config[type];

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
    const t = setTimeout(() => {
      setLeaving(true);
      setTimeout(onClose, 400);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onClose]);

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '14px 18px',
      background: `rgba(6,13,10,0.95)`,
      border: `1px solid ${c.border}`,
      borderRadius: '14px',
      backdropFilter: 'blur(24px)',
      boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${c.border}`,
      minWidth: '280px', maxWidth: '380px',
      transform: visible && !leaving ? 'translateY(0) scale(1)' : 'translateY(16px) scale(0.96)',
      opacity: visible && !leaving ? 1 : 0,
      transition: 'all 0.4s cubic-bezier(0.22,1,0.36,1)',
    }}>
      {/* Progress bar */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px', borderRadius: '0 0 14px 14px', overflow: 'hidden' }}>
        <div style={{
          height: '100%',
          background: `linear-gradient(90deg, ${c.color}, ${c.color}60)`,
          animation: `toastProgress ${duration}ms linear forwards`,
        }} />
      </div>

      <span style={{ color: c.color, flexShrink: 0 }}>{c.icon}</span>
      <span style={{ fontSize: '13px', color: '#111111', fontWeight: 500, flex: 1, lineHeight: 1.5 }}>{message}</span>
      <button onClick={() => { setLeaving(true); setTimeout(onClose, 400); }}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', padding: '2px', display: 'flex', flexShrink: 0, transition: 'color 0.2s' }}
        onMouseEnter={e => { (e.currentTarget).style.color = 'rgba(255,255,255,0.7)'; }}
        onMouseLeave={e => { (e.currentTarget).style.color = 'rgba(255,255,255,0.3)'; }}>
        <X size={14} />
      </button>

      <style>{`
        @keyframes toastProgress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

// Toast container + hook
interface ToastItem { id: string; message: string; type: ToastType; }

let _setToasts: React.Dispatch<React.SetStateAction<ToastItem[]>> | null = null;

export function toast(message: string, type: ToastType = 'success') {
  if (_setToasts) {
    const id = Math.random().toString(36).slice(2);
    _setToasts(prev => [...prev, { id, message, type }]);
  }
}

export function ToastProvider() {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  _setToasts = setToasts;

  return (
    <div style={{ position: 'fixed', bottom: '24px', left: '24px', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {toasts.map(t => (
        <Toast key={t.id} message={t.message} type={t.type}
          onClose={() => setToasts(prev => prev.filter(x => x.id !== t.id))} />
      ))}
    </div>
  );
}