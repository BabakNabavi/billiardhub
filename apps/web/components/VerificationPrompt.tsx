'use client'

/* دعوت به آپلودِ مدرک برای گرفتنِ تیکِ تأیید.
   جز داور که مدرکش اجباری است، برای بقیه‌ی نقش‌ها اختیاری است و فقط
   همین پیام — با نامِ مدرکِ همان شغل — نشان داده می‌شود. */

import { ShieldCheck, Upload } from 'lucide-react'

export type VerifiableRole = 'coach' | 'club' | 'seller' | 'manufacturer' | 'installer' | 'referee'

/* نامِ مدرکِ هر شغل — هرجای سایت باید از همین‌جا خوانده شود */
export const DOC_LABEL: Record<VerifiableRole, string> = {
  coach:        'آخرین مدرک مربیگری خود',
  club:         'جواز کسب باشگاه خود',
  seller:       'جواز کسب فروشگاه خود',
  manufacturer: 'جواز کسب یا پروانه بهره‌برداری خود',
  installer:    'آخرین مدرک فنی خود',
  referee:      'مدرک داوری خود',
}

/* داور تنها نقشی است که بدونِ مدرک ثبت نمی‌شود */
export const DOC_REQUIRED: Record<VerifiableRole, boolean> = {
  coach: false, club: false, seller: false, manufacturer: false, installer: false, referee: true,
}

export function verificationText(role: VerifiableRole): string {
  return DOC_REQUIRED[role]
    ? `برای ثبت پروفایل، آپلود ${DOC_LABEL[role]} الزامی است.`
    : `برای درخواست تیک تأیید و افزایش اعتبار پروفایل، لطفاً ${DOC_LABEL[role]} را آپلود نمایید.`
}

const GOLD_D = '#9A6E38', FELT = '#0E7A38', LINE = '#EAE5DA'

export default function VerificationPrompt({
  role, done = false, compact = false, style,
}: { role: VerifiableRole; done?: boolean; compact?: boolean; style?: React.CSSProperties }) {
  const required = DOC_REQUIRED[role]

  if (done) return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 9, padding: compact ? '10px 13px' : '13px 16px',
      borderRadius: 13, background: 'rgba(14,122,56,0.07)', border: '1px solid rgba(14,122,56,0.24)',
      fontSize: compact ? 12 : 12.5, fontWeight: 700, color: FELT, lineHeight: 1.9, ...style,
    }}>
      <ShieldCheck size={16} style={{ flexShrink: 0 }} />
      مدرک شما ثبت شد و پس از بررسی کارشناسان، تیک تأیید روی پروفایل‌تان قرار می‌گیرد.
    </div>
  )

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 10, padding: compact ? '11px 13px' : '14px 16px',
      borderRadius: 13, lineHeight: 2, ...style,
      background: required ? 'rgba(178,59,46,0.06)' : 'rgba(199,166,106,0.09)',
      border: `1px solid ${required ? 'rgba(178,59,46,0.22)' : 'rgba(199,166,106,0.32)'}`,
    }}>
      <span style={{
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        width: 30, height: 30, borderRadius: 9, marginTop: 1,
        background: required ? 'rgba(178,59,46,0.10)' : 'rgba(199,166,106,0.16)',
        color: required ? '#B23B2E' : GOLD_D,
      }}>
        {required ? <Upload size={15} /> : <ShieldCheck size={15} />}
      </span>
      <span style={{ minWidth: 0, fontSize: compact ? 12 : 12.5, color: 'rgba(0,0,0,0.62)' }}>
        <b style={{ color: required ? '#B23B2E' : GOLD_D, fontWeight: 800 }}>{verificationText(role)}</b>
        {!required && (
          <>
            {' '}
            <span style={{ color: 'rgba(0,0,0,0.45)' }}>
              آپلود مدرک اختیاری است و نبودِ آن مانع ثبت پروفایل شما نمی‌شود.
            </span>
          </>
        )}
      </span>
    </div>
  )
}
