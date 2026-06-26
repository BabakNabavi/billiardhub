import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { colors } from '../../lib/tokens';
import { CSSProperties } from 'react';

interface SectionHeaderProps {
  label:      string;
  title:      string;
  labelColor?: string;
  lineColor?:  string;
  href?:       string;
  linkLabel?:  string;
  style?:      CSSProperties;
}

export function SectionHeader({
  label, title,
  labelColor = colors.accent.green,
  lineColor  = colors.accent.green,
  href, linkLabel = 'مشاهده همه',
  style,
}: SectionHeaderProps) {
  return (
    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-end', marginBottom:'32px', ...style }}>
      <div>
        <div style={{ fontSize: '10px', letterSpacing:'0.28em', fontWeight:700, color: labelColor, marginBottom:'10px', textTransform:'uppercase', opacity:0.85 }}>
          {label}
        </div>
        <h2 style={{ fontSize: 'clamp(24px, 3.3vw, 31px)', fontWeight:900, color: colors.text.primary, margin:0, letterSpacing:'-0.025em', lineHeight:1.1 }}>
          {title}
        </h2>
        <div style={{ height:'1px', width:'52px', marginTop:'14px', background:`linear-gradient(90deg,${lineColor},transparent)`, boxShadow:`0 0 10px ${lineColor}80` }} />
      </div>

      {href && (
        <Link href={href} style={{ display:'flex', alignItems:'center', gap:'6px', fontSize: '13px', color:'rgba(255,255,255,0.3)', textDecoration:'none', fontWeight:500, transition:'color 0.25s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = labelColor; }}
          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.3)'; }}>
          {linkLabel} <ArrowLeft size={13} />
        </Link>
      )}
    </div>
  );
}