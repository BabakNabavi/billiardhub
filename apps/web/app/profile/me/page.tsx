'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import ProvinceCitySelect from '../../../components/ProvinceCitySelect'
import { useAuthStore } from '../../../store/auth.store'
import { fetchClubOptions, type ClubOption } from '../../../lib/clubs-data'
import { csrfToken, apiFetch } from '../../../lib/http'
import VerificationBadges from '../../../components/VerificationBadges'
import ChangePhone from '../../../components/auth/ChangePhone'
import ChangePassword from '../../../components/auth/ChangePassword'
import Select from '../../../components/ui/Select'
import Avatar from '../../../components/ui/Avatar'
import { uploadFile } from '../../../lib/supabase'
import {
  ArrowRight, Camera, Loader2, Search, ShieldCheck, Check, CreditCard, Save,
  User, Contact, MapPin, Store, LockOpen, Grid2x2, ShoppingBag, Eye, Plus,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────
interface UserProfile {
  id: string
  firstName: string
  lastName: string
  phone: string
  email?: string
  avatar?: string
  bio?: string
  province?: string
  city?: string
  birthDate?: string
  gender?: string
  instagram?: string
  telegram?: string
  nationalId?: string
  nationalIdVerified: boolean
  phoneVerified: boolean
  emailVerified: boolean
  verificationStatus: string
  isProfileComplete: boolean
  primaryRole: string
  secondaryRoles: string[]
  clubId?: string
  clubNameManual?: string
  bankCard?: string
  bankCardOwner?: string
  address?: string
  workPhone?: string
}


// ─── Helpers ──────────────────────────────────────────────────
function toFa(v: string | number) {
  return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)
}

function hexToRgba(hex: string, a: number) {
  const r = parseInt(hex.slice(1,3),16)
  const g = parseInt(hex.slice(3,5),16)
  const b = parseInt(hex.slice(5,7),16)
  return `rgba(${r},${g},${b},${a})`
}

function authHeader(): Record<string,string> {
  /* نشست روی کوکیِ httpOnly است؛ فقط توکنِ CSRF لازم است */
  const t = csrfToken()
  return t ? { 'x-csrf-token': t } : {}
}

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001'

const GOLD = '#C7A66A'
const GOLD_DARK = '#A07840'

// استان/شهر از ProvinceCitySelect می‌آید — لیست هاردکد حذف شد (single source of truth)

// ─── Section wrapper ──────────────────────────────────────────
function Section({ title, icon, color = '#C7A66A', children }: {
  title: string; icon: React.ReactNode; color?: string; children: React.ReactNode
}) {
  return (
    <div style={{ background: '#FFFFFF', border: `1px solid ${hexToRgba(color, 0.15)}`, borderRadius: 18, padding: '20px', marginBottom: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18 }}>
        <span style={{ width: 34, height: 34, borderRadius: 10, background: hexToRgba(color, 0.12), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color, display: 'flex' }}>{icon}</span>
        </span>
        <span style={{ fontSize: 16, fontWeight: 700, color: '#111111' }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

// ─── Field ────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: 'block', fontSize: 13, color: 'rgba(0,0,0,0.50)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  )
}

/* فیلدهای استعلام‌شده — دیده می‌شوند ولی نوشته نمی‌شوند */
const lockedStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: 'rgba(14,122,56,0.04)', border: '1px solid rgba(14,122,56,0.16)',
  borderRadius: 10, padding: '10px 12px', color: 'rgba(0,0,0,0.62)',
  fontSize: 15, fontFamily: 'inherit', outline: 'none', cursor: 'not-allowed',
}

const toEnDigits = (v: string) => v.replace(/[۰-۹]/g, d => String('۰۱۲۳۴۵۶۷۸۹'.indexOf(d))).replace(/[^0-9]/g, '')

const inputStyle: React.CSSProperties = {
  width: '100%', boxSizing: 'border-box',
  background: '#F7F7F5', border: '1px solid rgba(0,0,0,0.08)',
  borderRadius: 10, padding: '10px 12px', color: '#111111',
  fontSize: 15, fontFamily: 'inherit', outline: 'none',
}

// ─── Club Search ──────────────────────────────────────────────
/* فقط باشگاه‌های ثبت‌شده (همان لیستِ صفحه‌ی /clubs) — ورودی دستی مجاز نیست */
function ClubSearch({ onSelect }: { onSelect: (clubId: string, name: string) => void }) {
  const [q, setQ]         = useState('')
  const [clubs, setClubs] = useState<ClubOption[]>([])
  const [open, setOpen]   = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => { fetchClubOptions().then(setClubs) }, [])
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', fn)
    return () => document.removeEventListener('mousedown', fn)
  }, [])

  const filtered = clubs.filter(c => !q.trim() || c.name.includes(q.trim()) || c.city.includes(q.trim()))

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={17} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'rgba(0,0,0,0.38)' }} />
        <input
          value={q}
          onChange={e => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder="جستجو در باشگاه‌های ثبت‌شده..."
          style={{ ...inputStyle, paddingRight: 34 }}
        />
      </div>

      {open && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 20px rgba(0,0,0,0.08)', borderRadius: 12, marginTop: 4, maxHeight: 220, overflowY: 'auto' }}>
          {filtered.map(c => (
            <button key={c.id} onClick={() => { onSelect(c.id, c.name); setQ(''); setOpen(false) }} style={{ width: '100%', padding: '10px 14px', background: 'none', border: 'none', borderBottom: '1px solid rgba(0,0,0,0.04)', color: '#111111', fontSize: 15, fontFamily: 'inherit', cursor: 'pointer', textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span>{c.name}</span>
              <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.38)' }}>{c.city}</span>
            </button>
          ))}
          {filtered.length === 0 && (
            <div style={{ padding: '12px 14px', fontSize: 13, color: 'rgba(0,0,0,0.4)', lineHeight: 1.8 }}>
              باشگاهی با این نام ثبت نشده — فقط باشگاه‌های ثبت‌شده در «باشگاه‌ها» قابل انتخاب‌اند.
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Bank card formatter ──────────────────────────────────────
function formatCard(v: string) {
  return v.replace(/\D/g,'').slice(0,16).replace(/(.{4})/g,'$1-').replace(/-$/,'')
}

// ─── Page ─────────────────────────────────────────────────────
export default function ProfileMePage() {
  const router = useRouter()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [toast, setToast]     = useState<{ msg: string; type: 'success'|'error' } | null>(null)

  // editable fields
  const [bio, setBio]           = useState('')
  const [province, setProvince] = useState('')
  const [city, setCity]         = useState('')
  const [birthDate, setBirthDate] = useState('')
  const [gender, setGender]     = useState('')
  const [instagram, setInstagram] = useState('')
  const [bankCard, setBankCard] = useState('')
  const [bankOwner, setBankOwner] = useState('')
  const [clubName, setClubName] = useState('')
  const [address, setAddress]   = useState('')
  const [workPhone, setWorkPhone] = useState('')
  const [clubMembers, setClubMembers] = useState<number | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)

  /* اگر API در دسترس نبود، از حسابِ محلی (store) پر می‌کنیم —
     قبلاً به /login می‌فرستاد که خودش به /dashboard برمی‌گشت و
     «ویرایش پروفایل» عملاً بی‌اثر می‌شد */
  const buildLocalProfile = (): UserProfile | null => {
    const u = useAuthStore.getState().user
    if (!u) return null
    return {
      id: u.id, firstName: u.firstName ?? '', lastName: u.lastName ?? '',
      phone: u.phone ?? '', email: u.email || undefined, avatar: u.avatar || undefined,
      bio: u.bio ?? '', province: undefined, city: u.city ?? '',
      birthDate: undefined, gender: undefined, instagram: undefined, telegram: undefined,
      nationalId: undefined, nationalIdVerified: false, phoneVerified: false,
      emailVerified: false, verificationStatus: 'none', isProfileComplete: u.isProfileComplete,
      primaryRole: u.primaryRole, secondaryRoles: u.secondaryRoles ?? [],
      clubId: undefined, clubNameManual: undefined, bankCard: undefined, bankCardOwner: undefined,
    }
  }

  const applyProfile = (j: UserProfile) => {
    setProfile(j)
    setBio(j.bio ?? '')
    setProvince(j.province ?? '')
    setCity(j.city ?? '')
    setBirthDate(j.birthDate ?? '')
    setGender(j.gender ?? '')
    setInstagram(j.instagram ?? '')
    setBankOwner(j.bankCardOwner ?? '')
    setClubName(j.clubNameManual ?? '')
    setAddress(j.address ?? '')
    setWorkPhone(j.workPhone ?? '')
  }

  useEffect(() => {
    const fallback = () => {
      const local = buildLocalProfile()
      if (local) applyProfile(local)
      else router.push('/login')
    }
    apiFetch('/api/users/profile', { headers: authHeader(), cache: 'no-store' })
      .then(r => r.ok ? r.json() : null)
      .then(j => { if (j) applyProfile(j); else fallback() })
      .catch(fallback)
      .finally(() => setLoading(false))
    /* باشگاهِ انتخاب‌شده‌ی قبلی (ذخیره‌ی محلی) */
    try {
      const saved = JSON.parse(localStorage.getItem('bh_my_club') ?? 'null')
      if (saved?.name) setClubName(saved.name)
    } catch {}
  }, [])

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 2500)
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      /* فقط فیلدهای قابلِ ویرایش؛ نام، کد ملی و تاریخ تولد اصلاً فرستاده
         نمی‌شوند — سرور هم اگر بیایند نادیده‌شان می‌گیرد. */
      const res = await apiFetch('/api/users/profile', {
        method: 'PATCH',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio, province, city, gender, instagram, address, workPhone }),
      })
      if (!res.ok) throw new Error()
      showToast('پروفایل ذخیره شد')
    } catch {
      /* API در دسترس نیست ⇒ ذخیره‌ی محلی در حسابِ کاربر (persist می‌شود) */
      useAuthStore.getState().updateUser({ bio, city })
      showToast('پروفایل به‌صورت محلی ذخیره شد')
    } finally { setSaving(false) }
  }

  /* برش مربعی + فشرده‌سازی سمتِ کلاینت. خروجی یک File است تا مستقیم
     آپلود شود؛ dataURL دیگر ذخیره نمی‌شود (پایین‌تر توضیح داده شده). */
  const compressAvatar = (file: File): Promise<File> =>
    new Promise((resolve, reject) => {
      const img = new Image()
      const url = URL.createObjectURL(file)
      img.onload = () => {
        URL.revokeObjectURL(url)
        const size = 420
        const c = document.createElement('canvas')
        const s = Math.min(img.width, img.height)
        c.width = size; c.height = size
        const ctx = c.getContext('2d')
        if (!ctx) { reject(new Error('canvas')); return }
        ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size)
        c.toBlob(
          b => b ? resolve(new File([b], 'avatar.jpg', { type: 'image/jpeg' })) : reject(new Error('blob')),
          'image/jpeg', 0.82,
        )
      }
      img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image')) }
      img.src = url
    })

  /* ─────────────────────────────────────────────────────────────
     عکسِ پروفایل — چرا این تابع کاملاً بازنویسی شد.

     نسخه‌ی قبلی به `${API}/user/profile/avatar` می‌زد، یعنی بک‌اندِ
     NestJS روی `localhost:3001` که در پروداکشن اصلاً وجود ندارد. آن
     درخواست همیشه شکست می‌خورد و مسیرِ fallback اجرا می‌شد: عکس به شکلِ
     dataURL فقط در localStorage می‌نشست.

     نتیجه دقیقاً همان چیزی بود که کاربر گزارش کرد — عکس عوض می‌شد،
     ولی با خروج و ورودِ دوباره ناپدید می‌شد. چون هرگز به دیتابیس
     نرفته بود: `logout()` استورِ محلی را پاک می‌کرد و ورودِ بعدی
     کاربر را از دیتابیس می‌خواند، جایی که `avatar` خالی بود.

     حالا از همان زیرساختی استفاده می‌شود که استوری‌ها استفاده می‌کنند:
       ۱) آپلود روی Supabase Storage با `/api/upload`
       ۲) ذخیره‌ی نشانی در ستونِ `users.avatar` با PATCHِ پروفایل
          (`avatar` از قبل در فهرستِ سفیدِ آن مسیر بود)

     dataURL دیگر در localStorage ذخیره نمی‌شود: هم سهمیه‌ی مرورگر را
     می‌بلعید و هم توهمِ ذخیره‌شدن می‌ساخت. اگر آپلود شکست بخورد، صادقانه
     خطا نشان داده می‌شود.
     ───────────────────────────────────────────────────────────── */
  const [avatarBusy, setAvatarBusy] = useState(false)

  const handleAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (!file.type.startsWith('image/')) { showToast('فقط فایل تصویری مجاز است', 'error'); return }

    setAvatarBusy(true)
    try {
      const squared = await compressAvatar(file)
      /* `profiles/` — یکی از پیشوندهای مجازِ /api/upload.
         مهر زمانی در نام هست تا کشِ CDN عکسِ قبلی را برنگرداند. */
      const key = `profiles/${profile?.id ?? 'me'}-${Date.now()}.jpg`
      const url = await uploadFile('club-media', squared, key)
      if (!url) throw new Error('upload')

      const res = await apiFetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: url }),
      })
      if (!res.ok) throw new Error('save')

      setProfile(p => p ? { ...p, avatar: url } : p)
      useAuthStore.getState().updateUser({ avatar: url })
      showToast('عکس پروفایل ذخیره شد')
    } catch {
      showToast('ذخیره‌ی عکس انجام نشد؛ دوباره تلاش کنید', 'error')
    } finally {
      setAvatarBusy(false)
    }
  }

  const handleBankCard = async () => {
    const clean = bankCard.replace(/-/g,'')
    if (clean.length !== 16) { showToast('شماره کارت باید ۱۶ رقم باشد', 'error'); return }
    const res = await apiFetch(`${API}/user/profile/bank-card`, {
      method: 'PUT',
      headers: { ...authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ bankCard: clean, bankCardOwner: bankOwner }),
    })
    if (res.ok) showToast('کارت بانکی ثبت شد')
    else showToast('خطا در ثبت کارت', 'error')
  }

  /* انتخابِ باشگاه = عضویت در آن. شمارشِ اعضا از روی همین ردیف‌هاست،
     پس انتخابِ دوباره‌ی همان باشگاه عدد را بالا نمی‌برد و جابه‌جایی
     بین دو باشگاه هم خودبه‌خود درست حساب می‌شود. */
  const handleClub = async (clubId: string, name: string) => {
    setClubName(name)
    try { localStorage.setItem('bh_my_club', JSON.stringify({ id: clubId, name })) } catch {}
    try {
      const r = await apiFetch('/api/clubs/membership', {
        method: 'POST',
        headers: { ...authHeader(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ clubId }),
      })
      const j = await r.json().catch(() => ({}))
      if (!r.ok) { showToast(j?.message || 'ثبتِ عضویت انجام نشد', 'error'); return }
      setClubMembers(typeof j.members === 'number' ? j.members : null)
      showToast(`عضو باشگاه ${name} شدید`)
    } catch {
      showToast('خطا در ارتباط با سرور', 'error')
    }
  }

  const leaveClub = async () => {
    try {
      await apiFetch('/api/clubs/membership', { method: 'DELETE', headers: authHeader() })
      setClubName(''); setClubMembers(null)
      try { localStorage.removeItem('bh_my_club') } catch {}
      showToast('عضویت شما لغو شد')
    } catch { showToast('خطا در ارتباط با سرور', 'error') }
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#F7F7F5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Vazirmatn, Tahoma, sans-serif' }}>
      <Loader2 size={34} className="bh-spin" style={{ color: '#C7A66A' }} />
    </div>
  )

  if (!profile) return null

  /* کد ملی هنگام ثبت‌نام گرفته می‌شود؛ تطبیق نهایی با وب‌سرویس احراز هویت
     در بک‌اند انجام خواهد شد — اینجا درخواست مجدد از کاربر نمی‌کنیم */
  const fullName = `${profile.firstName} ${profile.lastName}`

  return (
    <>
      <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn, Tahoma, sans-serif', direction: 'rtl', position: 'relative' }}>

        {/* orbs */}
        <div style={{ position: 'fixed', width: 400, height: 400, background: 'radial-gradient(circle,rgba(199,166,106,0.12) 0%,transparent 70%)', top: -100, right: -80, filter: 'blur(60px)', zIndex: 0, pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, maxWidth: 480, margin: '0 auto', padding: '0 0 100px' }}>

          {/* ── سربرگ ──
              نوارِ کاورِ ۱۴۰ پیکسلی حذف شد. این صفحه فقط برای خودِ کاربر
              است و هیچ‌کس دیگری آن را نمی‌بیند، پس یک بنرِ تزئینی فقط
              محتوا را پایین می‌برد. */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px 4px' }}>
            <button onClick={() => router.push('/dashboard')} aria-label="بازگشت"
              style={{ background: '#fff', border: '1px solid rgba(0,0,0,0.08)', borderRadius: 11, width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'rgba(0,0,0,0.55)', flexShrink: 0 }}>
              <ArrowRight size={19} />
            </button>
            <span style={{ fontSize: 15, fontWeight: 800, color: '#111' }}>پروفایل من</span>
          </div>

          <div style={{ padding: '0 16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 8, marginBottom: 20 }}>
              {/* ── آواتار ──
                  کلِ دایره دکمه است، نه فقط نشانِ گوشه — کاربر معمولاً
                  روی خودِ عکس می‌زند. نشانِ دوربین هم بزرگ‌تر و واضح‌تر
                  شد و دیگر از فونتِ CDN نمی‌آید (که در ایران اغلب
                  بارگذاری نمی‌شد و آیکون نامرئی می‌ماند). */}
              <div style={{ position: 'relative', flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={avatarBusy}
                  aria-label="تغییر عکس پروفایل"
                  title="تغییر عکس پروفایل"
                  style={{
                    padding: 0, border: '3px solid #FFFFFF', borderRadius: '50%',
                    background: 'none', cursor: avatarBusy ? 'wait' : 'pointer',
                    display: 'block', boxShadow: '0 2px 10px rgba(0,0,0,0.10)', position: 'relative',
                  }}>
                  <Avatar src={profile.avatar} size={84} alt="" />
                  {avatarBusy && (
                    <span style={{
                      position: 'absolute', inset: 0, borderRadius: '50%', display: 'flex',
                      alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.45)', color: '#fff',
                    }}>
                      <Loader2 size={22} className="bh-spin" />
                    </span>
                  )}
                </button>

                {/* نشانِ دوربین — تزئینیِ محض، چون خودِ دایره دکمه است */}
                <span aria-hidden="true" style={{
                  position: 'absolute', bottom: 0, left: 0,
                  width: 28, height: 28, borderRadius: '50%',
                  background: '#141413', border: '2.5px solid #FFFFFF',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: '#fff', pointerEvents: 'none',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.18)',
                }}>
                  <Camera size={14} />
                </span>

                <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatar} />
              </div>

              <div style={{ paddingBottom: 4, flex: 1 }}>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#111111' }}>{fullName}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>{profile.phone}</span>
                  <span style={{ fontSize: 10, color: '#C7A66A', background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.25)', borderRadius: 20, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <ShieldCheck size={12} />کد ملی ثبت شده
                  </span>
                </div>
              </div>
            </div>

            {/* ── وضعیتِ تأیید ── */}
            <div style={{ marginBottom: 16 }}><VerificationBadges /></div>

            {/* ── اطلاعات هویتی — استعلام‌شده، قفل ──
                این‌ها هنگام ثبت‌نام از ثبت‌احوال و شاهکار گرفته شده‌اند.
                تغییرشان یعنی هویتِ تأییدشده دیگر معنایی ندارد، پس نه این‌جا
                و نه از راهِ API نوشته نمی‌شوند. */}
            <Section title="اطلاعات هویتی" icon={<ShieldCheck size={18} />} color="#0E7A38">
              <p style={{ fontSize: 12.5, color: 'rgba(0,0,0,0.45)', margin: '0 0 14px', lineHeight: 1.95 }}>
                این اطلاعات هنگام ثبت‌نام از ثبت‌احوال استعلام شده و قابلِ ویرایش نیست.
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                <Field label="نام">
                  <input value={profile.firstName} disabled style={lockedStyle} />
                </Field>
                <Field label="نام خانوادگی">
                  <input value={profile.lastName} disabled style={lockedStyle} />
                </Field>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 12px' }}>
                <Field label="کد ملی">
                  <input value={toFa(profile.nationalId ?? '—')} disabled style={{ ...lockedStyle, direction: 'ltr', textAlign: 'right' }} />
                </Field>
                <Field label="تاریخ تولد">
                  <input value={toFa(profile.birthDate ?? '—')} disabled style={{ ...lockedStyle, direction: 'ltr', textAlign: 'right' }} />
                </Field>
              </div>

              <Field label="شماره موبایل">
                <ChangePhone
                  current={profile.phone}
                  onChanged={p => {
                    setProfile(prev => (prev ? { ...prev, phone: p } : prev))
                    useAuthStore.getState().updateUser({ phone: p })
                    showToast('شماره موبایل شما تغییر کرد')
                  }}
                />
              </Field>

              <Field label="رمز عبور">
                {/* سرور همه‌ی نشست‌ها را باطل می‌کند؛ پس این‌جا هم حسابِ محلی
                    را پاک می‌کنیم و کاربر را به صفحه‌ی ورود می‌فرستیم. */}
                <ChangePassword
                  onChanged={() => {
                    showToast('رمز عبور تغییر کرد؛ دوباره وارد شوید')
                    setTimeout(() => {
                      useAuthStore.getState().logout()
                      router.replace('/login')
                    }, 1800)
                  }}
                />
              </Field>
            </Section>

            {/* ── اطلاعات پایه ── */}
            <Section title="اطلاعات شخصی" icon={<User size={18} />}>
              <Field label="بیوگرافی">
                <textarea value={bio} onChange={e => setBio(e.target.value)} rows={3} placeholder="چند جمله درباره خودت..." style={{ ...inputStyle, resize: 'vertical', minHeight: 70 }} />
              </Field>
              <Field label="جنسیت">
                {/* استایلِ حرفه‌ای select از globals.css می‌آید — اینلاین override نکن */}
                <select value={gender} onChange={e => setGender(e.target.value)} style={{ width: '100%', boxSizing: 'border-box' }}>
                  <option value="">انتخاب کنید</option>
                  <option value="male">مرد</option>
                  <option value="female">زن</option>
                </select>
              </Field>
              <Field label="اینستاگرام">
                <input value={instagram} onChange={e => setInstagram(e.target.value)} placeholder="https://instagram.com/..." style={inputStyle} />
              </Field>
            </Section>

            {/* ── اطلاعات تماس — هر وقت خواستید عوضشان کنید ── */}
            <Section title="اطلاعات تماس" icon={<Contact size={18} />} color="#3D63E6">
              <Field label="نشانی">
                <textarea value={address} onChange={e => setAddress(e.target.value)} rows={2}
                  placeholder="استان، شهر، خیابان، پلاک…" style={{ ...inputStyle, resize: 'vertical', minHeight: 58 }} />
              </Field>
              <Field label="تلفن محل کار">
                <input value={toFa(workPhone)} onChange={e => setWorkPhone(toEnDigits(e.target.value).slice(0, 15))}
                  placeholder="۰۲۱۲۲۸۵۹۵۵۱" inputMode="numeric"
                  style={{ ...inputStyle, direction: 'ltr', textAlign: 'right' }} />
              </Field>
            </Section>

            {/* ── موقعیت ── */}
            <Section title="موقعیت" icon={<MapPin size={18} />} color="#06b6d4">
              <ProvinceCitySelect
                value={{ province, city }}
                onChange={v => { setProvince(v.province); setCity(v.city) }}
              />
            </Section>

            {/* ── باشگاه ── */}
            <Section title="باشگاه" icon={<Store size={18} />} color="#a78bfa">
              <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', margin: '0 0 12px', lineHeight: 1.6 }}>
                باشگاهی که در آن بازی می‌کنید را از میان باشگاه‌های ثبت‌شده انتخاب کنید
              </p>
              {clubName && (
                <div style={{ background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: 10, padding: '10px 12px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <Check size={15} style={{ color: '#a78bfa' }} />
                  <span style={{ fontSize: 15, color: '#a78bfa', fontWeight: 700 }}>{clubName}</span>
                  {clubMembers !== null && (
                    <span style={{ fontSize: 12, color: 'rgba(0,0,0,0.45)' }}>
                      · {toFa(clubMembers)} عضو
                    </span>
                  )}
                  <button onClick={leaveClub}
                    style={{ marginInlineStart: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12, fontWeight: 700, color: '#B23B2E' }}>
                    لغو عضویت
                  </button>
                </div>
              )}
              <ClubSearch onSelect={handleClub} />
            </Section>

            {/* ── کارت بانکی ── */}
            <Section title="کارت بانکی" icon={<CreditCard size={18} />} color="#f59e0b">
              <p style={{ fontSize: 13, color: 'rgba(0,0,0,0.45)', margin: '0 0 12px', lineHeight: 1.6 }}>
                برای لغو رزرو و تسویه حساب — کارت باید به نام خودتان باشد
              </p>
              {profile.bankCard && (
                <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '8px 14px', marginBottom: 12, fontSize: 15, color: '#fbbf24', fontFamily: 'monospace', letterSpacing: 2, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CreditCard size={17} />
                  {toFa(profile.bankCard)}
                </div>
              )}
              <Field label="شماره کارت">
                <input
                  value={toFa(bankCard)}
                  onChange={e => setBankCard(formatCard(toEnDigits(e.target.value)))}
                  placeholder="---- ---- ---- ----"
                  inputMode="numeric"
                  style={{ ...inputStyle, letterSpacing: 3, direction: 'ltr', textAlign: 'center' }}
                />
              </Field>
              <Field label="نام صاحب کارت">
                <input value={bankOwner} onChange={e => setBankOwner(e.target.value)} placeholder="نام و نام خانوادگی" style={inputStyle} />
              </Field>
              <button onClick={handleBankCard} style={{ width: '100%', padding: '10px', borderRadius: 10, border: 'none', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontSize: 15, fontWeight: 700, fontFamily: 'inherit', cursor: 'pointer' }}>
                ثبت کارت
              </button>
            </Section>

            {/* ── دسترسی‌ها — همه با ثبتِ کد ملی هنگام ثبت‌نام فعال‌اند ── */}
            <Section title="دسترسی‌ها" icon={<LockOpen size={18} />} color="#C7A66A">
              {[
                { label: 'رزرو میز', icon: <Grid2x2 size={17} /> },
                { label: 'خرید و فروش', icon: <ShoppingBag size={17} /> },
                { label: 'مشاهده استوری', icon: <Eye size={17} /> },
                { label: 'ثبت آگهی', icon: <Plus size={17} /> },
                { label: 'پروفایل عمومی', icon: <User size={17} /> },
              ].map(f => (
                <div key={f.label} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', borderBottom: '1px solid rgba(0,0,0,0.04)' }}>
                  <span style={{ color: '#C7A66A', flexShrink: 0, display: 'flex' }}>{f.icon}</span>
                  <span style={{ fontSize: 15, color: '#111111', flex: 1 }}>{f.label}</span>
                  <Check size={15} style={{ color: '#C7A66A' }} />
                </div>
              ))}
            </Section>

            {/* ── Save button ── */}
            <button
              onClick={handleSave}
              disabled={saving}
              style={{ width: '100%', padding: '14px', borderRadius: 12, border: 'none', background: saving ? 'rgba(199,166,106,0.10)' : 'linear-gradient(135deg,#C7A66A,#A07840)', color: saving ? 'rgba(0,0,0,0.35)' : '#FFFFFF', fontSize: 16, fontWeight: 700, fontFamily: 'inherit', cursor: saving ? 'not-allowed' : 'pointer', transition: 'all 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: saving ? 'none' : '0 4px 16px rgba(199,166,106,0.3)' }}>
              {saving
                ? <><Loader2 size={17} className="bh-spin" />در حال ذخیره...</>
                : <><Save size={17} />ذخیره پروفایل</>
              }
            </button>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div style={{ position: 'fixed', bottom: 32, left: '50%', transform: 'translateX(-50%)', background: toast.type === 'success' ? '#C7A66A' : '#ef4444', color: '#FFFFFF', fontSize: 14, fontWeight: 700, fontFamily: 'Vazirmatn, Tahoma, sans-serif', padding: '10px 24px', borderRadius: 24, zIndex: 100, whiteSpace: 'nowrap', boxShadow: '0 4px 24px rgba(0,0,0,0.4)' }}>
            {toast.type === 'success' ? '✓' : '✕'} {toast.msg}
          </div>
        )}
      </div>
    </>
  )
}