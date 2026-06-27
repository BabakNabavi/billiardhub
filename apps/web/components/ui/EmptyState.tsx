import { ReactNode } from 'react';
import Link from 'next/link';

interface EmptyStateProps {
  icon?:    string;
  title:    string;
  desc?:    string;
  action?:  { label: string; href?: string; onClick?: () => void; };
}

export function EmptyState({ icon = '🎱', title, desc, action }: EmptyStateProps) {
  return (
    <div style={{ textAlign: 'center', padding: '80px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
      {/* Icon with glow */}
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <div style={{ fontSize: '57px', opacity: 0.18, filter: 'blur(20px)', position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>
          {icon}
        </div>
        <div style={{ fontSize: '53px', position: 'relative' }}>{icon}</div>
      </div>

      <h3 style={{ fontSize: '20px', fontWeight: 800, color: '#111111', margin: 0, letterSpacing: '-0.02em' }}>
        {title}
      </h3>

      {desc && (
        <p style={{ fontSize: '16px', color: 'rgba(0,0,0,0.40)', margin: 0, lineHeight: 1.7, maxWidth: '320px' }}>
          {desc}
        </p>
      )}

      {action && (
        action.href ? (
          <Link href={action.href} style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            marginTop: '8px', padding: '11px 24px', borderRadius: '12px',
            background: 'linear-gradient(135deg,#C7A66A,#A07840)',
            color: '#fff', fontSize: '15px', fontWeight: 700,
            textDecoration: 'none',
            boxShadow: '0 8px 24px rgba(199,166,106,0.25)',
          }}>
            {action.label}
          </Link>
        ) : (
          <button onClick={action.onClick} style={{
            marginTop: '8px', padding: '11px 24px', borderRadius: '12px',
            background: 'linear-gradient(135deg,#C7A66A,#A07840)',
            color: '#fff', fontSize: '15px', fontWeight: 700,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            boxShadow: '0 8px 24px rgba(199,166,106,0.25)',
          }}>
            {action.label}
          </button>
        )
      )}
    </div>
  );
}