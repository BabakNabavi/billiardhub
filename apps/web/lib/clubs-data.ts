import api from './api'

/* ─────────────────────────────────────────────────────────────
   منبعِ واحدِ باشگاه‌ها — همان داده‌ای که صفحه‌ی /clubs نمایش
   می‌دهد (نمونه‌ها + باشگاه‌های ثبت‌شده‌ی API). هر جای سایت که
   «انتخاب باشگاه» لازم دارد باید از همین‌جا بخواند.
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

export const SAMPLE_CLUBS: Club[] = [
  { id:'1', name:'باشگاه سنچوری تهران', managerName:'محمد احمدی', description:'مجهزترین باشگاه اسنوکر تهران با ۱۵ سال سابقه.', address:'خ ولیعصر، بالاتر از ونک', city:'تهران', province:'تهران', latitude:35.7575, longitude:51.4079, phone:'021-88001234', website:'', snookerTables:4, pocketTables:3, highballTables:2, vipSnookerTables:2, vipPocketTables:1, airHockeyTables:1, dartBoards:3, playstations:4, hasCafe:true, hasParking:true, hasWifi:true, hasProfessionalCoach:true, images:['/images/clubs/club6.jpeg'], rating:4.8, reviewCount:124, isVerified:true, isOpen:true, closeTime:'۲۴:۰۰', memberCount:1200, totalTables:13 },
  { id:'2', name:'باشگاه المپیک مشهد', managerName:'رضا کریمی', description:'باشگاه تخصصی پاکت بیلیارد با بهترین تجهیزات.', address:'بلوار احمدآباد', city:'مشهد', province:'خراسان رضوی', latitude:36.2972, longitude:59.6067, phone:'051-33001234', website:'', snookerTables:2, pocketTables:5, highballTables:1, vipSnookerTables:1, vipPocketTables:0, airHockeyTables:0, dartBoards:2, playstations:2, hasCafe:true, hasParking:true, hasWifi:true, hasProfessionalCoach:true, images:['/images/clubs/club7.jpeg'], rating:4.6, reviewCount:89, isVerified:true, isOpen:true, closeTime:'۲۳:۰۰', memberCount:800, totalTables:11 },
  { id:'3', name:'باشگاه پیروزی اصفهان', managerName:'علی موسوی', description:'محیطی دوستانه برای علاقه‌مندان به بیلیارد.', address:'خ چهارباغ عباسی', city:'اصفهان', province:'اصفهان', latitude:32.6546, longitude:51.6680, phone:'031-33001234', website:'', snookerTables:3, pocketTables:2, highballTables:3, vipSnookerTables:0, vipPocketTables:0, airHockeyTables:0, dartBoards:1, playstations:3, hasCafe:false, hasParking:true, hasWifi:false, hasProfessionalCoach:false, images:['/images/clubs/club8.jpg'], rating:4.3, reviewCount:56, isVerified:false, isOpen:false, closeTime:'۲۲:۰۰', memberCount:450, totalTables:9 },
  { id:'4', name:'باشگاه شاهین شیراز', managerName:'حسین نوری', description:'باشگاه VIP با جو لوکس و مربیان حرفه‌ای.', address:'خ زند', city:'شیراز', province:'فارس', latitude:29.5918, longitude:52.5837, phone:'071-33001234', website:'', snookerTables:2, pocketTables:1, highballTables:1, vipSnookerTables:3, vipPocketTables:2, airHockeyTables:0, dartBoards:0, playstations:2, hasCafe:true, hasParking:true, hasWifi:true, hasProfessionalCoach:true, images:['/images/clubs/club9.jpeg'], rating:4.9, reviewCount:201, isVerified:true, isOpen:true, closeTime:'۲۴:۰۰', memberCount:320, totalTables:9 },
  { id:'5', name:'باشگاه آریا تبریز', managerName:'کاوه رستمی', description:'بزرگترین مجموعه بیلیارد شمال غرب کشور.', address:'خ شریعتی', city:'تبریز', province:'آذربایجان شرقی', latitude:38.0800, longitude:46.2919, phone:'041-33001234', website:'', snookerTables:5, pocketTables:4, highballTables:2, vipSnookerTables:1, vipPocketTables:0, airHockeyTables:2, dartBoards:4, playstations:6, hasCafe:true, hasParking:false, hasWifi:true, hasProfessionalCoach:true, images:['/images/clubs/club1.png'], rating:4.5, reviewCount:143, isVerified:true, isOpen:true, closeTime:'۲۳:۳۰', memberCount:950, totalTables:18 },
  { id:'6', name:'باشگاه مروارید کرج', managerName:'سارا حسینی', description:'فضایی مدرن با تجهیزات استاندارد.', address:'میدان توحید', city:'کرج', province:'البرز', latitude:35.8400, longitude:50.9391, phone:'026-33001234', website:'', snookerTables:2, pocketTables:2, highballTables:1, vipSnookerTables:0, vipPocketTables:0, airHockeyTables:1, dartBoards:2, playstations:2, hasCafe:false, hasParking:true, hasWifi:true, hasProfessionalCoach:false, images:['/images/clubs/club2.jpg'], rating:4.1, reviewCount:34, isVerified:false, isOpen:true, closeTime:'۲۳:۰۰', memberCount:280, totalTables:8 },
]

export interface ClubOption { id: string; name: string; city: string }

/* همان ادغامِ صفحه‌ی /clubs: نمونه‌ها همیشه اول، بعد باشگاه‌های ثبت‌شده‌ی API */
export async function fetchClubOptions(): Promise<ClubOption[]> {
  let extras: Club[] = []
  try {
    const r = await api.get('/clubs')
    const apiClubs: Club[] = Array.isArray(r.data) ? r.data : []
    const names = new Set(SAMPLE_CLUBS.map(c => c.name))
    extras = apiClubs.filter(c => !names.has(c.name))
  } catch { /* آفلاین ⇒ فقط نمونه‌ها */ }
  return [...SAMPLE_CLUBS, ...extras].map(c => ({ id: c.id, name: c.name, city: c.city }))
}
