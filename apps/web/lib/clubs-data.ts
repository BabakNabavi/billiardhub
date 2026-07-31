import api from './api'

/* ─────────────────────────────────────────────────────────────
   منبع واحد باشگاه‌ها — همان داده‌ای که صفحه‌ی /clubs نمایش می‌دهد:
   باشگاه‌های واقعی ثبت‌شده. هر جای سایت که «انتخاب باشگاه» لازم دارد
   باید از همین‌جا بخواند.
   ───────────────────────────────────────────────────────────── */

export interface Club {
  id: string; name: string; managerName: string; description: string;
  address: string; city: string; province: string;
  latitude?: number; longitude?: number;
  phone: string; website: string; slug?: string;
  snookerTables: number; pocketTables: number; highballTables: number;
  vipSnookerTables: number; vipPocketTables: number; airHockeyTables: number;
  dartBoards: number; playstations: number;
  hasCafe: boolean; hasParking: boolean; hasWifi: boolean; hasProfessionalCoach: boolean;
  images: string[]; rating?: number; reviewCount?: number;
  isVerified?: boolean; isOpen?: boolean; closeTime?: string;
  memberCount?: number; totalTables?: number; distance?: number;
  hasActiveStory?: boolean; storyMediaUrl?: string; storyType?: string; storyText?: string; logo?: string;
}

/* SAMPLE_CLUBS حذف شد — شش باشگاه ساختگی که روی صفحه‌ی عمومی
   نمایش داده می‌شدند و باشگاه‌های واقعی هم‌نام را پنهان می‌کردند. */

export interface ClubOption { id: string; name: string; city: string }

/* فقط باشگاه‌های واقعی.

   پیش‌تر شش باشگاه نمونه اینجا بودند و همیشه اول فهرست می‌آمدند، و
   باشگاه‌های واقعی هم‌نام با آن‌ها فیلتر می‌شدند. نتیجه‌اش این بود که
   باشگاه‌دار واقعی، نسخه‌ی ساختگی را به‌جای باشگاه خودش می‌دید. */
export async function fetchClubOptions(): Promise<ClubOption[]> {
  try {
    const r = await api.get('/clubs')
    const apiClubs: Club[] = Array.isArray(r.data) ? r.data : []
    return apiClubs.map(c => ({ id: c.id, name: c.name, city: c.city }))
  } catch { return [] }
}
