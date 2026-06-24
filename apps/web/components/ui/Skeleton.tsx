'use client';

import { CSSProperties } from 'react';

interface SkeletonProps {
  width?:  string | number;
  height?: string | number;
  radius?: string;
  style?:  CSSProperties;
}

export function Skeleton({ width = '100%', height = '16px', radius = '8px', style }: SkeletonProps) {
  return (
    <div style={{
      width, height,
      borderRadius: radius,
      background: 'linear-gradient(90deg, rgba(0,0,0,0.04) 25%, rgba(0,0,0,0.06) 50%, rgba(0,0,0,0.04) 75%)',
      backgroundSize: '200% 100%',
      animation: 'skeletonShimmer 1.6s ease-in-out infinite',
      ...style,
    }} />
  );
}

export function ClubCardSkeleton() {
  return (
    <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
      <Skeleton height="190px" radius="0" />
      <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Skeleton height="18px" width="70%" />
        <Skeleton height="13px" width="50%" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <Skeleton height="13px" width="80px" />
          <Skeleton height="26px" width="80px" radius="20px" />
        </div>
      </div>
    </div>
  );
}

export function NewsCardSkeleton() {
  return (
    <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
      <Skeleton height="160px" radius="0" />
      <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Skeleton height="14px" />
        <Skeleton height="14px" width="80%" />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
          <Skeleton height="11px" width="80px" />
          <Skeleton height="11px" width="60px" />
        </div>
      </div>
    </div>
  );
}

export function ProductCardSkeleton() {
  return (
    <div style={{ background: 'rgba(0,0,0,0.03)', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', overflow: 'hidden' }}>
      <Skeleton height="140px" radius="0" />
      <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <Skeleton height="13px" />
        <Skeleton height="13px" width="70%" />
        <Skeleton height="18px" width="50%" style={{ marginTop: '4px' }} />
      </div>
    </div>
  );
}