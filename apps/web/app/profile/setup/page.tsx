'use client'

/* ═══════════════════════════════════════════════════════════════
   «پروفایل کاری» — حالا تابلوی راهنما است، نه فرمِ دوم.
   ───────────────────────────────────────────────────────────────
   این صفحه یک فرمِ عمومی داشت که از روی `profileFields` ساخته
   می‌شد و برای هر هشت نقش یکسان بود. دو خرابیِ کشنده داشت:

   ۱. ذخیره روی `PUT /api/roles/<role>/profile` می‌رفت — مسیری که
      در این پروژه وجود ندارد. در تولید ۴۰۴ برمی‌گشت، ولی کد
      جوابِ سرور را نگاه نمی‌کرد و «✓ ذخیره شد» نشان می‌داد.
      کاربر برای هر نقش فرم را پر می‌کرد و هیچ‌چیز ذخیره نمی‌شد.
   ۲. فهرستِ نقش‌ها را هم نمی‌ساخت: `/api/roles/my` شیءِ
      `{ requests, current }` برمی‌گرداند، ولی این‌جا آرایه فرض
      می‌شد و `data.filter` خطا می‌داد — خطا در `.catch` خاموش
      می‌شد و صفحه همیشه «هنوز نقشی تأیید نشده» نشان می‌داد.

   پروفایلِ واقعیِ هر نقش در پنلِ خودش ساخته و ویرایش می‌شود و
   همان‌جا روی جدولِ `profiles` می‌نشیند. پس این صفحه دیگر فرمِ
   موازی نمی‌سازد؛ کاربر را به پنلِ درست می‌فرستد. نشانیِ پنل‌ها
   در `lib/roles.ts` (ROLE_PANEL) است — منبعِ واحد.

   فهرستِ نقش‌ها هم که این‌جا کپیِ سومِ `lib/roles.ts` بود، حذف شد.
   ═══════════════════════════════════════════════════════════════ */

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { apiFetch } from '../../../lib/http'
import Ti from '../../../components/ui/Ti'
import {
  ROLE_MAP, ROLE_PANEL, hexToRgba, toFarsiDigits,
  type RoleValue,
} from '../../../lib/roles'

const API = process.env.NEXT_PUBLIC_API_URL ?? '/api'

interface MyRoles {
  requests?: { role: RoleValue; status: string }[]
  current?: { primaryRole?: string; secondaryRoles?: string[] }
}

function ProfileSetupInner() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initRole = (searchParams.get('role') ?? '') as RoleValue

  const [roles, setRoles] = useState<RoleValue[]>([])
  const [primary, setPrimary] = useState<RoleValue | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiFetch(`${API}/roles/my`)
      .then(r => (r.ok ? r.json() : {}))
      .then((j: MyRoles) => {
        /* نقشِ واقعی از `current` می‌آید نه از درخواست‌ها: نقشی که
           ادمین مستقیم داده هیچ ردیفِ درخواستی ندارد و با خواندنِ
           فقطِ `requests` نامرئی می‌ماند. */
        const cur = j.current ?? {}
        const own = new Set<string>([
          ...(cur.primaryRole ? [cur.primaryRole] : []),
          ...(cur.secondaryRoles ?? []),
          ...((j.requests ?? []).filter(r => r.status === 'approved').map(r => r.role)),
        ])
        own.delete('admin')
        const list = [...own].filter((r): r is RoleValue => !!ROLE_MAP[r as RoleValue])
        setRoles(list)
        setPrimary((cur.primaryRole as RoleValue) ?? null)
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  /* اگر با `?role=` آمده و همان نقش را دارد، مستقیم به پنلش می‌رود —
     یک صفحه‌ی واسط که فقط یک دکمه دارد ارزشِ یک کلیک را ندارد. */
  useEffect(() => {
    if (loading || !initRole) return
    if (roles.includes(initRole)) router.replace(ROLE_PANEL[initRole].path)
  }, [loading, initRole, roles, router])

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      <div style={{ textAlign: 'center', color: 'rgba(0,0,0,0.45)', fontSize: 15 }}>
        <Ti name="loader-2" size={31} color={'#C7A66A'} style={{ display: 'block', marginBottom: 12 }} />
        در حال بارگذاری...
      </div>
    </div>
  )

  if (roles.length === 0) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl' }}>
      <div style={{ textAlign: 'center', padding: 32 }}>
        <Ti name="lock" size={44} color={'rgba(0,0,0,0.35)'} style={{ display: 'block', marginBottom: 16 }} />
        <div style={{ color: '#111111', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>هنوز نقشی تأیید نشده</div>
        <div style={{ color: 'rgba(0,0,0,0.45)', fontSize: 15, marginBottom: 24, lineHeight: 1.7 }}>ابتدا نقش درخواست بدهید و منتظر تأیید ادمین بمانید.</div>
        <button onClick={() => router.push('/profile/role')} style={{ background: '#C7A66A', color: '#FFFFFF', border: 'none', borderRadius: 12, padding: '12px 24px', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
          درخواست نقش
        </button>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', width: 300, height: 300, background: 'radial-gradient(circle, rgba(199,166,106,0.15) 0%, transparent 70%)', top: -80, right: -60, pointerEvents: 'none', filter: 'blur(50px)', zIndex: 0 }} />

      <div style={{ position: 'relative', zIndex: 1, maxWidth: 520, margin: '0 auto', padding: '24px 16px 100px' }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button onClick={() => router.push('/profile/role')} style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: 10, width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(0,0,0,0.50)' }}>
            <Ti name="arrow-right" size={19} />
          </button>
          <div>
            <div style={{ fontSize: 19, fontWeight: 700, color: '#111111' }}>پروفایل کاری</div>
            <div style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.45)' }}>{toFarsiDigits(roles.length)} نقش فعال</div>
          </div>
        </div>

        <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', lineHeight: 1.85, margin: '0 0 18px' }}>
          هر نقش پنلِ خودش را دارد و پروفایلش همان‌جا ساخته و ویرایش می‌شود.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {roles.map(r => {
            const m = ROLE_MAP[r]
            const panel = ROLE_PANEL[r]
            if (!m || !panel) return null
            return (
              <Link key={r} href={panel.path} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 15px', borderRadius: 15,
                  background: hexToRgba(m.color, 0.06), border: `1.5px solid ${hexToRgba(m.color, 0.24)}`,
                  transition: 'all 0.22s',
                }}>
                  <span style={{ width: 38, height: 38, borderRadius: 12, flexShrink: 0, background: hexToRgba(m.color, 0.13), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Ti name={m.icon} size={20} color={m.color} />
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ fontSize: 14.5, fontWeight: 800, color: '#111111' }}>{m.label}</span>
                      {primary === r && (
                        <span style={{ fontSize: 10.5, fontWeight: 700, color: '#9A6E38', background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.32)', borderRadius: 8, padding: '1px 6px' }}>نقش اصلی</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.description}</div>
                  </div>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, flexShrink: 0, fontSize: 12.5, fontWeight: 700, color: m.color }}>
                    {panel.label}
                    <Ti name="arrow-left" size={15} color={m.color} />
                  </span>
                </div>
              </Link>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function ProfileSetupPage() {
  return (
    <Suspense>
      <ProfileSetupInner />
    </Suspense>
  )
}
