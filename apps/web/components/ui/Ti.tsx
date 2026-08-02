/* ─────────────────────────────────────────────────────────────
   نگاشتِ نام‌های آیکونِ Tabler به کامپوننت‌های lucide-react.

   چرا این فایل هست: هفت صفحه، وب‌فونتِ Tabler را با یک <link> از
   cdn.jsdelivr.net می‌گرفتند — آن هم با تگِ `@latest`. دو مشکل داشت:

     ۱) وابستگی به سرورِ بیرونی برای چیزی که هیچ نیازی به آن نبود؛
        اگر CDN کند یا در دسترس نباشد، آیکون‌ها مربع خالی می‌شوند.
     ۲) `@latest` یعنی هر انتشارِ بالادست، بی‌خبر و بی‌بازبینی، وارد
        سایتِ ما می‌شود.

   میزبانیِ محلیِ همان وب‌فونت هم جواب نبود: کلِ فونت برای ۵۹۰۰ آیکون
   ۴۴۹ کیلوبایت woff2 است، در حالی که کلِ پروژه ۴۰ آیکون از آن به کار
   می‌برد. lucide-react از قبل وابستگیِ پروژه است و tree-shake می‌شود،
   پس این راه صفر بایتِ اضافه دارد.

   چرا کامپوننتِ نگاشت و نه جای‌گزینیِ مستقیم: چند جا نام آیکون از
   داده می‌آید (`icon: 'ti-scale'` در فهرستِ نقش‌ها، مراحل، روش‌های
   پرداخت). با جای‌گزینیِ مستقیم باید آن ساختارهای داده هم عوض می‌شد؛
   این‌طور دست‌نخورده می‌مانند.
   ───────────────────────────────────────────────────────────── */

import {
  AlertCircle, AlertTriangle, ArrowLeft, ArrowRight, BarChart3, Building2,
  Check, ClipboardCheck, Clock, CreditCard, Eye, Factory, File, FileUp,
  GraduationCap, Inbox, Info, Loader2, Lock, MapPin, MessageSquare,
  Receipt, RefreshCw, Save, Scale, Send, ShieldCheck, ShoppingBag,
  ShoppingCart, Store, Table, Tag, Trash2, Truck, Upload, User, Wallet,
  Wrench, X, Globe,
} from 'lucide-react'

type IconCmp = typeof Check

/* کلید بدونِ پیشوندِ `ti-` نگه داشته می‌شود تا فراخوان هر دو شکل را
   بپذیرد؛ چند جا `'ti-scale'` می‌فرستند و چند جا فقط `'scale'`. */
const MAP: Record<string, IconCmp> = {
  'alert-circle': AlertCircle,
  'alert-triangle': AlertTriangle,
  'arrow-left': ArrowLeft,
  'arrow-right': ArrowRight,
  'building-factory': Factory,
  'building-store': Store,
  'cash': Wallet,
  'chart-bar': BarChart3,
  'check': Check,
  'clipboard-check': ClipboardCheck,
  'clock': Clock,
  'credit-card': CreditCard,
  'device-floppy': Save,
  'device-mobile-message': MessageSquare,
  'eye': Eye,
  'file': File,
  'file-upload': FileUp,
  'inbox': Inbox,
  'info-circle': Info,
  'loader-2': Loader2,
  'lock': Lock,
  'map-pin': MapPin,
  'receipt': Receipt,
  'rotate': RefreshCw,
  'scale': Scale,
  'school': GraduationCap,
  'send': Send,
  'shield-check': ShieldCheck,
  'shopping-bag': ShoppingBag,
  'shopping-cart': ShoppingCart,
  /* lucide نسخه‌ی «سبدِ خالی» ندارد؛ همان سبد با رنگِ کم‌رنگ استفاده
     می‌شود — همان کاری که هر سه فراخوانِ این نام از قبل می‌کردند. */
  'shopping-cart-off': ShoppingCart,
  'table': Table,
  'tag': Tag,
  'tool': Wrench,
  'trash': Trash2,
  'truck': Truck,
  'upload': Upload,
  'user': User,
  'world': Globe,
  'x': X,
}

export default function Ti({ name, size = 18, color, style, className, ariaHidden = true }: {
  /** نامِ آیکون، با یا بدونِ پیشوندِ `ti-` */
  name: string
  size?: number
  color?: string
  style?: React.CSSProperties
  className?: string
  ariaHidden?: boolean
}) {
  const key = String(name ?? '').replace(/^ti\s+/, '').replace(/^ti-/, '')
  const Cmp = MAP[key]

  /* نامِ ناشناخته نباید صفحه را بشکند و نباید هم بی‌صدا ناپدید شود:
     جای خالی به اندازه‌ی همان آیکون می‌ماند تا چیدمان تکان نخورد و
     در کنسول هم گزارش می‌شود. */
  if (!Cmp) {
    if (process.env.NODE_ENV !== 'production') console.warn(`[Ti] آیکونِ ناشناخته: ${name}`)
    return <span style={{ display: 'inline-block', width: size, height: size, ...style }} aria-hidden />
  }

  return <Cmp size={size} color={color} className={className} style={style} aria-hidden={ariaHidden || undefined} />
}
