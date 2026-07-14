'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ClubStoryModal from '@/components/ClubStoryModal'

/* ─── Tokens (same as listing) ─── */
const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const GOLD_G = 'linear-gradient(135deg,#7A4F10 0%,#C7A66A 50%,#8A6020 100%)'
const BG     = '#F6F4F0'
const TEXT   = '#111110'
const TEXT_S = 'rgba(17,17,16,0.52)'
const TEXT_M = 'rgba(17,17,16,0.28)'
const CARD   = 'rgba(255,255,255,0.90)'
const CBOR   = '1px solid rgba(17,17,16,0.07)'
const CSHA   = '0 2px 20px rgba(17,17,16,0.06)'

const SPECS: Record<string,{label:string;color:string}> = {
  snooker:  {label:'اسنوکر',       color:'#7C3AED'},
  pocket:   {label:'پاکت بیلیارد', color:GOLD_D},
  highball: {label:'هی‌بال',       color:'#C2410C'},
}

const GRADE_DOTS: Record<string,{dots:number;color:string}> = {
  'مربی بین‌المللی': {dots:5, color:'#7C3AED'},
  'مربی ملی':        {dots:4, color:GOLD_D},
  'مربی درجه A':     {dots:3, color:'#C2410C'},
  'مربی درجه B':     {dots:2, color:'#16A34A'},
  'مربی درجه C':     {dots:1, color:TEXT_S},
}

const GRADS: [string,string][] = [
  ['#C7A66A','#7A4F1E'],['#7C3AED','#4C1D95'],['#2563EB','#1E3A8A'],
  ['#16A34A','#14532D'],['#DC2626','#7F1D1D'],['#B45309','#78350F'],
  ['#6D28D9','#3B0764'],['#0891B2','#164E63'],['#BE185D','#831843'],
  ['#D97706','#78350F'],['#15803D','#14532D'],
]
const getGrad = (id:string):[string,string] => GRADS[parseInt(id,10)%GRADS.length]??[GOLD,'#7A4F1E']

const IMGS = [
  '/images/shop/snooker-table.jpg',
  '/images/shop/cue_billiard_2.jpg',
  '/images/shop/Ball-1.jpg',
  '/images/shop/pool_chalk_1.jpg',
]
const img = (i:number) => IMGS[i%IMGS.length]??IMGS[0]!

/* ─── LQ1 button (pill: rgba bg + border, no blur) ─── */
const lq1 = (color:string, bg:string): React.CSSProperties => ({
  background: bg,
  border: `1px solid ${color}`,
  borderRadius: 100,
  padding: '9px 20px',
  color,
  fontWeight: 700,
  fontSize: 13,
  cursor: 'pointer',
  fontFamily: "'Vazirmatn',Tahoma,sans-serif",
  display: 'inline-flex',
  alignItems: 'center',
  gap: 7,
  textDecoration: 'none',
  whiteSpace: 'nowrap' as const,
})

/* ─── Types ─── */
interface GImg  { id:string; url:string; caption:string }
interface VItem { id:string; thumbnail:string; title:string; duration:string }
interface Album { id:string; name:string; imageIds:string[] }

interface CoachFull {
  id:string; name:string; specialty:string; city:string
  badge:string; badgeColor:string; verified:boolean
  hasStory:boolean; storyImage:string
  bio:string; fullBio:string
  certifications:string[]; achievements:string[]; specialties:string[]
  phone:string; whatsapp:string; instagram?:string; telegram?:string
  gallery:GImg[]; videos:VItem[]
}

/* ─── Data ─── */
const D: CoachFull[] = [
  {
    id:'1', name:'احمد رضایی', specialty:'snooker', city:'تهران',
    badge:'مربی بین‌المللی', badgeColor:'#7C3AED', verified:true,
    hasStory:true, storyImage:img(0),
    bio:'مربی ملی‌پوش با ۱۵ سال سابقه — پرورش‌دهنده ۳ قهرمان ملی',
    fullBio:'با ۱۵ سال سابقه تدریس در بالاترین سطح بیلیارد ایران، تخصص اصلی من اسنوکر حرفه‌ای و آماده‌سازی بازیکنان برای مسابقات ملی و بین‌المللی است. شاگردانم شامل ۳ قهرمان ملی و بیش از ۱۵ نفر از اعضای تیم ملی ایران هستند. روش تدریس من ترکیبی از تحلیل تکنیکی دقیق، روانشناسی ورزشی پیشرفته و برنامه‌های تمرینی شخصی‌سازی‌شده است.',
    certifications:['مدرک A فدراسیون جهانی WPBSA','مربی درجه یک فدراسیون ایران','گواهینامه داوری بین‌المللی'],
    achievements:['قهرمانی آسیا ۱۳۹۶','تیم ملی ۱۰ دوره متوالی','مربی برتر سال ۱۳۹۹','پرورش ۳ قهرمان ملی'],
    specialties:['اسنوکر پیشرفته','پوزیشن‌بازی','بریک‌بیلدینگ','روانشناسی ورزشی'],
    phone:'09121234567', whatsapp:'989121234567', instagram:'coach.rezaei', telegram:'coachrezaei',
    gallery:[
      {id:'g1',url:img(0),caption:'کلاس خصوصی اسنوکر پیشرفته'},
      {id:'g2',url:img(1),caption:'تمرین تکنیک ضربه با شاگردان'},
      {id:'g3',url:img(2),caption:'آموزش بریک‌بیلدینگ'},
      {id:'g4',url:img(3),caption:'جلسه گروهی مبتدیان'},
      {id:'g5',url:img(0),caption:'تدریس پوزیشن‌بازی'},
      {id:'g6',url:img(1),caption:'کلاس آمادگی مسابقات'},
    ],
    videos:[
      {id:'v1',thumbnail:img(0),title:'تکنیک نشانه‌گیری حرفه‌ای اسنوکر',duration:'۱۲:۳۴'},
      {id:'v2',thumbnail:img(1),title:'کنترل کیوبال',duration:'۸:۱۵'},
      {id:'v3',thumbnail:img(2),title:'ضربات دفاعی پیشرفته',duration:'۱۵:۰۰'},
    ],
  },
  {
    id:'2', name:'حسین نوری', specialty:'snooker', city:'مشهد',
    badge:'مربی ملی', badgeColor:GOLD_D, verified:true,
    hasStory:true, storyImage:img(1),
    bio:'قهرمان آسیا ۱۳۹۸ — تکنیک‌های پیشرفته اسنوکر',
    fullBio:'قهرمان آسیا در سال ۱۳۹۸ و مربی تیم ملی جوانان. با بیش از ۱۲ سال سابقه تدریس، تخصص در تکنیک‌های پیشرفته اسنوکر و برنامه‌ریزی ذهنی برای مسابقات دارم. تا کنون بیش از ۱۸۰ هنرجو تحت آموزشم بوده‌اند.',
    certifications:['مدرک ملی فدراسیون بیلیارد ایران','مربی درجه یک ایران','عضو کمیته فنی فدراسیون'],
    achievements:['قهرمان آسیا ۱۳۹۸','نائب‌قهرمان کشوری ۱۳۹۵','مربی تیم ملی جوانان'],
    specialties:['اسنوکر حرفه‌ای','آمادگی مسابقات','کنترل ذهنی'],
    phone:'09131234568', whatsapp:'989131234568', instagram:'noori.snooker',
    gallery:[
      {id:'g1',url:img(1),caption:'تمرین صبحگاهی'},
      {id:'g2',url:img(0),caption:'کلاس پیشرفته'},
      {id:'g3',url:img(2),caption:'مسابقات باشگاه'},
      {id:'g4',url:img(3),caption:'آموزش گروهی'},
    ],
    videos:[
      {id:'v1',thumbnail:img(1),title:'تکنیک استراحت حرفه‌ای',duration:'۹:۴۵'},
      {id:'v2',thumbnail:img(0),title:'پلانینگ فریم پیشرفته',duration:'۱۴:۲۰'},
    ],
  },
  {
    id:'3', name:'مریم کاظمی', specialty:'pocket', city:'اصفهان',
    badge:'مربی درجه A', badgeColor:'#C2410C', verified:true,
    hasStory:false, storyImage:'',
    bio:'قهرمان کشوری بانوان ۱۴۰۱ — متخصص پاکت بیلیارد',
    fullBio:'قهرمان کشوری بانوان در سال ۱۴۰۱ و متخصص پاکت بیلیارد. با ۸ سال سابقه تدریس تخصصی در کنار تیم بانوان فدراسیون، برنامه‌های آموزشی خاص برای نوجوانان و بانوان طراحی کرده‌ام.',
    certifications:['مدرک درجه A فدراسیون ایران','مربی مجاز بانوان','گواهی تدریس به نوجوانان'],
    achievements:['قهرمان کشوری بانوان ۱۴۰۱','مربی برتر بانوان ۱۴۰۲','نفر اول لیگ برتر بانوان'],
    specialties:['پاکت بیلیارد','آموزش بانوان','تکنیک ضربه'],
    phone:'09151234569', whatsapp:'989151234569', telegram:'maryam.kazemi',
    gallery:[
      {id:'g1',url:img(2),caption:'کلاس بانوان'},
      {id:'g2',url:img(3),caption:'مسابقات قهرمانی'},
      {id:'g3',url:img(0),caption:'تمرین تکنیکی'},
      {id:'g4',url:img(1),caption:'آموزش نوجوانان'},
    ],
    videos:[
      {id:'v1',thumbnail:img(2),title:'تکنیک پاکت حرفه‌ای',duration:'۱۱:۰۰'},
      {id:'v2',thumbnail:img(3),title:'آموزش ضربه برگشت',duration:'۷:۳۰'},
    ],
  },
  {
    id:'4', name:'سینا محمدی', specialty:'pocket', city:'شیراز',
    badge:'مربی درجه B', badgeColor:'#16A34A', verified:false,
    hasStory:true, storyImage:img(3),
    bio:'قهرمان لیگ برتر جوانان — آموزش با آنالیز ویدیویی',
    fullBio:'قهرمان لیگ برتر جوانان با رویکردی نوین در تدریس مبتنی بر آنالیز ویدیویی. با ۵ سال سابقه، سیستم آموزشی منحصربه‌فردی طراحی کرده‌ام که پیشرفت هنرجویان را چند برابر می‌کند.',
    certifications:['مدرک درجه B فدراسیون ایران','گواهی تجزیه‌وتحلیل ویدیویی'],
    achievements:['قهرمان لیگ برتر جوانان ۱۴۰۲','نفر سوم مسابقات کشوری'],
    specialties:['پاکت بیلیارد','آنالیز ویدیویی','مبتدیان تا پیشرفته'],
    phone:'09171234570', whatsapp:'989171234570', instagram:'sina.pool',
    gallery:[
      {id:'g1',url:img(3),caption:'آنالیز ویدیویی'},
      {id:'g2',url:img(2),caption:'کلاس خصوصی'},
      {id:'g3',url:img(0),caption:'مسابقات جوانان'},
    ],
    videos:[
      {id:'v1',thumbnail:img(3),title:'آموزش آنالیز ضربه',duration:'۶:۴۵'},
    ],
  },
  {
    id:'5', name:'علی حسینی', specialty:'highball', city:'تهران',
    badge:'مربی ملی', badgeColor:GOLD_D, verified:true,
    hasStory:false, storyImage:'',
    bio:'مربی تیم ملی جوانان هی‌بال — متخصص تکنیک ضربات',
    fullBio:'مربی تیم ملی جوانان هی‌بال با ۱۰ سال سابقه. تخصص اصلی من تحلیل بیومکانیک ضربات و بهینه‌سازی تکنیک شخصی هر هنرجو است. شاگردانم در مسابقات داخلی و منطقه‌ای موفقیت‌های چشمگیری داشته‌اند.',
    certifications:['مدرک ملی فدراسیون هی‌بال','مربی رسمی تیم ملی','گواهی بیومکانیک ورزشی'],
    achievements:['مربی تیم ملی جوانان هی‌بال','پرورش ۳ قهرمان منطقه‌ای'],
    specialties:['هی‌بال','بیومکانیک ضربه','تکنیک شخصی‌سازی'],
    phone:'09191234571', whatsapp:'989191234571', telegram:'ali.highball',
    gallery:[
      {id:'g1',url:img(0),caption:'تمرین تکنیک ضربه'},
      {id:'g2',url:img(1),caption:'کلاس گروهی هی‌بال'},
      {id:'g3',url:img(2),caption:'مسابقات ملی'},
      {id:'g4',url:img(3),caption:'آموزش پیشرفته'},
    ],
    videos:[
      {id:'v1',thumbnail:img(0),title:'تکنیک ضربه هی‌بال',duration:'۱۰:۱۵'},
      {id:'v2',thumbnail:img(1),title:'تمرینات مبتدیان',duration:'۸:۰۰'},
    ],
  },
  {
    id:'6', name:'رضا ابراهیمی', specialty:'carom', city:'تبریز',
    badge:'مربی بین‌المللی', badgeColor:'#7C3AED', verified:true,
    hasStory:true, storyImage:img(1),
    bio:'پیشکسوت کارامبول — استاد اول ایران با ۱۸ سال تجربه',
    fullBio:'پیشکسوت کارامبول ایران با ۱۸ سال سابقه تدریس. عضو افتخاری فدراسیون جهانی کارامبول و مدرس دوره‌های ملی و بین‌المللی. بیش از ۳۱۰ هنرجو در طول دوران مربیگری‌ام آموزش دیده‌اند.',
    certifications:['مدرک A فدراسیون جهانی کارامبول UMB','مربی بین‌المللی درجه یک','عضو افتخاری فدراسیون ایران'],
    achievements:['پرورش ۱۲ قهرمان ملی','مربی برتر آسیا ۱۴۰۰','دریافت نشان خدمت فدراسیون'],
    specialties:['کارامبول حرفه‌ای','تکنیک سری‌بازی','روانشناسی مسابقات'],
    phone:'09141234572', whatsapp:'989141234572', instagram:'reza.carom', telegram:'rezaebrahimi',
    gallery:[
      {id:'g1',url:img(1),caption:'کلاس کارامبول پیشرفته'},
      {id:'g2',url:img(0),caption:'تمرین سری‌بازی'},
      {id:'g3',url:img(2),caption:'مسابقات بین‌المللی'},
      {id:'g4',url:img(3),caption:'آموزش جوانان'},
      {id:'g5',url:img(1),caption:'جلسه تکنیکی'},
    ],
    videos:[
      {id:'v1',thumbnail:img(1),title:'تکنیک سری‌بازی کارامبول',duration:'۱۸:۲۰'},
      {id:'v2',thumbnail:img(0),title:'آموزش پوزیشن',duration:'۱۲:۰۰'},
      {id:'v3',thumbnail:img(2),title:'ضربات دفاعی',duration:'۹:۳۰'},
    ],
  },
  {
    id:'7', name:'نیلوفر صادقی', specialty:'snooker', city:'تهران',
    badge:'مربی درجه A', badgeColor:'#C2410C', verified:true,
    hasStory:true, storyImage:img(2),
    bio:'مربی تیم بانوان فدراسیون اسنوکر — قهرمان کشوری ۱۴۰۲',
    fullBio:'قهرمان کشوری اسنوکر بانوان در سال ۱۴۰۲ و مربی رسمی تیم بانوان فدراسیون. با ۷ سال تجربه تدریس، فضایی انگیزه‌بخش و حرفه‌ای برای بانوان علاقه‌مند به اسنوکر ایجاد کرده‌ام.',
    certifications:['مدرک درجه A فدراسیون اسنوکر ایران','مربی رسمی تیم ملی بانوان'],
    achievements:['قهرمان کشوری بانوان ۱۴۰۲','نایب‌قهرمان آسیا بانوان ۱۴۰۱'],
    specialties:['اسنوکر بانوان','تکنیک نشانه‌گیری','روح تیمی'],
    phone:'09121234573', whatsapp:'989121234573', instagram:'niloofar.snooker',
    gallery:[
      {id:'g1',url:img(2),caption:'کلاس بانوان اسنوکر'},
      {id:'g2',url:img(0),caption:'تمرین مسابقاتی'},
      {id:'g3',url:img(1),caption:'جلسه تیمی'},
      {id:'g4',url:img(3),caption:'مسابقات قهرمانی'},
    ],
    videos:[
      {id:'v1',thumbnail:img(2),title:'تکنیک نشانه‌گیری اسنوکر',duration:'۱۱:۴۵'},
    ],
  },
  {
    id:'8', name:'کامران یوسفی', specialty:'carom', city:'تهران',
    badge:'مربی ملی', badgeColor:GOLD_D, verified:true,
    hasStory:true, storyImage:img(3),
    bio:'نائب‌قهرمان آسیا کارامبول — مدرس سیستم‌های ضربه‌ای',
    fullBio:'نائب‌قهرمان آسیا کارامبول و طراح سیستم‌های نوین تدریس ضربات. با ۱۴ سال تجربه در سطح ملی، روشی سیستماتیک و علمی برای پیشرفت سریع هنرجویان ارائه می‌دهم.',
    certifications:['مدرک ملی فدراسیون کارامبول','مربی درجه یک ایران','گواهی تحلیل بیومکانیک'],
    achievements:['نائب‌قهرمان آسیا کارامبول','قهرمان کشوری ۳ دوره'],
    specialties:['کارامبول','سیستم ضربه‌ای','پیشرفت سریع'],
    phone:'09121234574', whatsapp:'989121234574', telegram:'kamran.carom',
    gallery:[
      {id:'g1',url:img(3),caption:'تمرین ضربه‌های سری'},
      {id:'g2',url:img(1),caption:'کلاس خصوصی'},
      {id:'g3',url:img(0),caption:'مسابقات آسیایی'},
    ],
    videos:[
      {id:'v1',thumbnail:img(3),title:'سیستم ضربه‌ای کارامبول',duration:'۱۳:۱۵'},
      {id:'v2',thumbnail:img(1),title:'تکنیک مبتدیان',duration:'۷:۰۰'},
    ],
  },
  {
    id:'9', name:'زهرا شریفی', specialty:'pocket', city:'کرج',
    badge:'مربی درجه B', badgeColor:'#16A34A', verified:false,
    hasStory:false, storyImage:'',
    bio:'متخصص پاکت بیلیارد بانوان — سیستم آموزشی گام به گام',
    fullBio:'متخصص پاکت بیلیارد با سیستم آموزشی گام‌به‌گام منحصربه‌فرد برای مبتدیان. ۶ سال تجربه تدریس با تمرکز ویژه روی پایه‌های اصولی بازی.',
    certifications:['مدرک درجه B فدراسیون ایران','گواهی تدریس به مبتدیان'],
    achievements:['مربی برتر باشگاه کرج ۱۴۰۲'],
    specialties:['پاکت بیلیارد','مبتدیان','گام‌به‌گام'],
    phone:'09361234575', whatsapp:'989361234575',
    gallery:[
      {id:'g1',url:img(0),caption:'کلاس مبتدیان'},
      {id:'g2',url:img(2),caption:'تمرین پایه'},
    ],
    videos:[
      {id:'v1',thumbnail:img(0),title:'آموزش مقدماتی پاکت',duration:'۸:۳۰'},
    ],
  },
  {
    id:'10', name:'محسن طاهری', specialty:'highball', city:'تهران',
    badge:'مربی ملی', badgeColor:GOLD_D, verified:true,
    hasStory:true, storyImage:img(1),
    bio:'مربی تیم ملی هی‌بال ۱۴۰۳ — متخصص آنالیز بازی',
    fullBio:'مربی تیم ملی هی‌بال ۱۴۰۳ با تخصص در آنالیز بازی و طراحی استراتژی. ۹ سال سابقه تدریس در باشگاه‌های معتبر تهران.',
    certifications:['مدرک ملی فدراسیون هی‌بال','مربی رسمی تیم ملی ۱۴۰۳'],
    achievements:['مربی تیم ملی ۱۴۰۳','پرورش ۴ قهرمان ملی'],
    specialties:['هی‌بال','آنالیز بازی','استراتژی مسابقه'],
    phone:'09121234576', whatsapp:'989121234576', instagram:'mohsen.highball', telegram:'mohsentaheri',
    gallery:[
      {id:'g1',url:img(1),caption:'تمرین آنالیزی'},
      {id:'g2',url:img(0),caption:'جلسه استراتژی'},
      {id:'g3',url:img(2),caption:'مسابقات ملی'},
      {id:'g4',url:img(3),caption:'کلاس گروهی'},
    ],
    videos:[
      {id:'v1',thumbnail:img(1),title:'آنالیز بازی هی‌بال',duration:'۱۵:۳۰'},
      {id:'v2',thumbnail:img(0),title:'استراتژی مسابقه',duration:'۱۱:۰۰'},
    ],
  },
]

/* ─── Avatar with optional story ring ─── */
function Avatar({ coach, size, onOpen }: { coach:CoachFull; size:number; onOpen:()=>void }) {
  const [g1,g2] = getGrad(coach.id)
  const inner = (
    <div style={{
      width: size, height: size, borderRadius: '50%',
      background: `linear-gradient(135deg,${g1},${g2})`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: '#fff', fontWeight: 900, fontSize: size * 0.38,
      border: '2.5px solid rgba(255,255,255,0.65)',
      overflow: 'hidden',
    }}>
      {coach.name[0]}
    </div>
  )
  if (!coach.hasStory) return inner
  return (
    <button onClick={onOpen} style={{ background:'none', border:'none', cursor:'pointer', padding:0, borderRadius:'50%' }}>
      <div style={{
        width: size+6, height: size+6, borderRadius: '50%',
        background: 'linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)',
        padding: 3, boxShadow: '0 0 20px rgba(214,41,118,0.55)',
      }}>
        {inner}
      </div>
    </button>
  )
}

/* ─── Page ─── */
export default function CoachProfilePage() {
  const { id } = useParams<{id:string}>()
  const coach = D.find(c => c.id === id) ?? D[0]!

  const [openStory,     setOpenStory]     = useState(false)
  const [tab,           setTab]           = useState<'photos'|'videos'|'albums'>('photos')
  const [albums,        setAlbums]        = useState<Album[]>([
    { id:'default', name:'مسابقات', imageIds: coach.gallery.slice(0,3).map(g=>g.id) },
  ])
  const [showNewAlbum,  setShowNewAlbum]  = useState(false)
  const [newAlbumName,  setNewAlbumName]  = useState('')
  const [expandedAlbum, setExpandedAlbum] = useState<string|null>(null)

  const spec  = SPECS[coach.specialty as keyof typeof SPECS]
  const grade = GRADE_DOTS[coach.badge]

  const createAlbum = () => {
    if (!newAlbumName.trim()) return
    setAlbums(prev => [...prev, { id:`a${Date.now()}`, name:newAlbumName.trim(), imageIds:[] }])
    setNewAlbumName('')
    setShowNewAlbum(false)
  }

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
        .lq1{transition:filter .18s,transform .14s;}
        .lq1:hover{filter:brightness(1.08);transform:translateY(-1px);}
        .goldbtn{transition:all .3s cubic-bezier(0.22,1,0.36,1);}
        .goldbtn:hover{transform:translateY(-2px);}
        .gcard{overflow:hidden;border-radius:10px;transition:transform .3s,box-shadow .3s;cursor:pointer;}
        .gcard:hover{transform:scale(1.03);box-shadow:0 6px 20px rgba(0,0,0,0.12);}
        .gtab{transition:all .18s;cursor:pointer;}
        .gtab:hover{opacity:.85;}
        @media(max-width:740px){.pcols{grid-template-columns:1fr!important;}}
        @media(max-width:520px){.pgrid{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>

      <div style={{ direction:'rtl', fontFamily:"'Vazirmatn',Tahoma,sans-serif", background:BG, minHeight:'100vh', color:TEXT }}>

        {/* ── Back ── */}
        <div style={{ maxWidth:1020, margin:'0 auto', padding:'20px clamp(16px,4vw,48px) 0' }}>
          <Link href="/coaches" className="goldbtn" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(199,166,106,0.12)', border:'1px solid rgba(199,166,106,0.34)', color:'#9A6E38', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:700, padding:'7px 14px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            بازگشت به مربیان
          </Link>
        </div>

        {/* ── Hero ── */}
        <section style={{ position:'relative', height:248, overflow:'hidden', marginTop:14 }}>
          {coach.storyImage ? (
            <img src={coach.storyImage} alt="" style={{ position:'absolute', inset:'-12% 0', width:'100%', height:'124%', objectFit:'cover', filter:'blur(22px) saturate(0.6)', transform:'scale(1.08)', pointerEvents:'none' }} />
          ) : (
            <div style={{ position:'absolute', inset:0, background:`linear-gradient(135deg,${BG} 0%, rgba(199,166,106,0.18) 100%)` }} />
          )}
          {/* Light overlay */}
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom, rgba(246,244,240,0.55) 0%, rgba(246,244,240,0.82) 100%)' }} />
          {/* Bottom fade */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:64, background:`linear-gradient(to top,${BG},transparent)` }} />

          <div style={{ position:'relative', zIndex:2, height:'100%', display:'flex', alignItems:'center', maxWidth:1020, margin:'0 auto', padding:'0 clamp(16px,4vw,48px)', gap:24 }}>
            <Avatar coach={coach} size={80} onOpen={() => setOpenStory(true)} />

            <div style={{ flex:1 }}>
              <div style={{ display:'flex', alignItems:'center', gap:10, flexWrap:'wrap' }}>
                <h1 style={{ fontSize:'clamp(22px,3.5vw,36px)', fontWeight:900, color:TEXT, lineHeight:1.1 }}>
                  {coach.name}
                </h1>
                {coach.verified && (
                  <span style={{ background:'rgba(37,99,235,0.10)', border:'1px solid rgba(37,99,235,0.25)', color:'#1d4ed8', borderRadius:100, fontSize:11, fontWeight:700, padding:'3px 10px' }}>
                    ✓ تأییدشده
                  </span>
                )}
              </div>
              <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:7, flexWrap:'wrap' }}>
                <span style={{ background:GOLD_G, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', fontSize:13, fontWeight:800 }}>
                  {coach.badge}
                </span>
                <span style={{ color:TEXT_M }}>·</span>
                {spec && (
                  <span style={{ background:`${spec.color}14`, border:`1px solid ${spec.color}38`, color:spec.color, borderRadius:100, fontSize:12, fontWeight:700, padding:'3px 11px' }}>
                    {spec.label}
                  </span>
                )}
                <span style={{ color:TEXT_S, fontSize:13 }}>📍 {coach.city}</span>
              </div>
              {coach.hasStory && (
                <button onClick={() => setOpenStory(true)} className="goldbtn" style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(199,166,106,0.12)', border:'1px solid rgba(199,166,106,0.34)', borderRadius:10, padding:'9px 20px', color:'#9A6E38', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Vazirmatn',Tahoma,sans-serif", textDecoration:'none', whiteSpace:'nowrap' as const, marginTop:12 }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="10"/></svg>
                  مشاهده استوری
                </button>
              )}
            </div>
          </div>
        </section>

        {/* ── Content ── */}
        <div style={{ maxWidth:1020, margin:'0 auto', padding:'22px clamp(16px,4vw,48px) 64px' }}>

          {/* Top two-column grid */}
          <div className="pcols" style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:18, animation:'fadeUp .45s .08s ease both' }}>

            {/* About */}
            <div style={{ background:CARD, border:CBOR, borderRadius:18, padding:26, boxShadow:CSHA }}>
              <h2 style={{ fontSize:14, fontWeight:800, color:TEXT, marginBottom:14, display:'flex', alignItems:'center', gap:9 }}>
                <span style={{ width:3, height:17, background:GOLD_G, borderRadius:2, display:'inline-block', flexShrink:0 }}/>
                معرفی مربی
              </h2>
              <p style={{ fontSize:13.5, color:TEXT_S, lineHeight:2.0 }}>{coach.fullBio}</p>
              {coach.specialties.length > 0 && (
                <div style={{ marginTop:16, display:'flex', flexWrap:'wrap', gap:7 }}>
                  {coach.specialties.map(s => (
                    <span key={s} style={{ background:'rgba(17,17,16,0.055)', border:'1px solid rgba(17,17,16,0.09)', color:TEXT, borderRadius:100, fontSize:12, fontWeight:600, padding:'4px 13px' }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Right column: grade + contact */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* Coaching grade */}
              <div style={{ background:CARD, border:CBOR, borderRadius:18, padding:26, boxShadow:CSHA }}>
                <h2 style={{ fontSize:14, fontWeight:800, color:TEXT, marginBottom:14, display:'flex', alignItems:'center', gap:9 }}>
                  <span style={{ width:3, height:17, background:GOLD_G, borderRadius:2, display:'inline-block', flexShrink:0 }}/>
                  درجه مربیگری
                </h2>
                <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
                  <span style={{ background:`${coach.badgeColor}15`, border:`1.5px solid ${coach.badgeColor}48`, color:coach.badgeColor, borderRadius:100, fontSize:13, fontWeight:800, padding:'6px 18px' }}>
                    {coach.badge}
                  </span>
                  {grade && (
                    <div style={{ display:'flex', gap:5 }}>
                      {[1,2,3,4,5].map(d => (
                        <div key={d} style={{ width:9, height:9, borderRadius:'50%', background: d<=grade.dots ? grade.color : 'rgba(17,17,16,0.12)', transition:'background .2s' }} />
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                  {coach.certifications.map((c,i) => (
                    <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                      <span style={{ color:GOLD, marginTop:2, flexShrink:0, fontSize:10 }}>✦</span>
                      <span style={{ fontSize:12.5, color:TEXT_S, lineHeight:1.65 }}>{c}</span>
                    </div>
                  ))}
                </div>
                {coach.achievements.length > 0 && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid rgba(17,17,16,0.07)' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:TEXT_M, marginBottom:9, letterSpacing:'0.07em' }}>افتخارات</div>
                    <div style={{ display:'flex', flexWrap:'wrap', gap:6 }}>
                      {coach.achievements.map((a,i) => (
                        <span key={i} style={{ background:`${GOLD}12`, border:`1px solid ${GOLD}32`, color:GOLD_D, borderRadius:100, fontSize:11, fontWeight:600, padding:'3px 11px' }}>
                          🏆 {a}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Contact */}
              <div style={{ background:CARD, border:CBOR, borderRadius:18, padding:26, boxShadow:CSHA }}>
                <h2 style={{ fontSize:14, fontWeight:800, color:TEXT, marginBottom:14, display:'flex', alignItems:'center', gap:9 }}>
                  <span style={{ width:3, height:17, background:GOLD_G, borderRadius:2, display:'inline-block', flexShrink:0 }}/>
                  راه‌های ارتباطی
                </h2>
                <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                  <a href={`tel:${coach.phone}`} className="goldbtn"
                    style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(199,166,106,0.12)', border:'1px solid rgba(199,166,106,0.34)', borderRadius:10, padding:'9px 20px', color:'#9A6E38', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Vazirmatn',Tahoma,sans-serif", textDecoration:'none', whiteSpace:'nowrap' as const }}>
                    📞 {coach.phone}
                  </a>
                  <a href={`https://wa.me/${coach.whatsapp}`} target="_blank" rel="noopener" className="lq1"
                    style={{ ...lq1('rgba(22,163,74,0.70)', 'rgba(22,163,74,0.08)') }}>
                    💬 واتساپ
                  </a>
                  {coach.instagram && (
                    <a href={`https://instagram.com/${coach.instagram}`} target="_blank" rel="noopener" className="lq1"
                      style={{ ...lq1('rgba(194,65,12,0.65)', 'rgba(194,65,12,0.08)') }}>
                      📸 @{coach.instagram}
                    </a>
                  )}
                  {coach.telegram && (
                    <a href={`https://t.me/${coach.telegram}`} target="_blank" rel="noopener" className="lq1"
                      style={{ ...lq1('rgba(37,99,235,0.55)', 'rgba(37,99,235,0.07)') }}>
                      ✈️ @{coach.telegram}
                    </a>
                  )}
                </div>
              </div>

            </div>
          </div>

          {/* ── Gallery ── */}
          <div style={{ marginTop:20, background:CARD, border:CBOR, borderRadius:18, padding:26, boxShadow:CSHA, animation:'fadeUp .45s .18s ease both' }}>

            {/* Header + tabs */}
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:18, flexWrap:'wrap', gap:12 }}>
              <h2 style={{ fontSize:14, fontWeight:800, color:TEXT, display:'flex', alignItems:'center', gap:9 }}>
                <span style={{ width:3, height:17, background:GOLD_G, borderRadius:2, display:'inline-block', flexShrink:0 }}/>
                گالری
              </h2>
              <div style={{ display:'flex', gap:6 }}>
                {([['photos','تصاویر'],['videos','ویدیوها'],['albums','آلبوم‌ها']] as [string,string][]).map(([k,l]) => (
                  <button key={k} className="gtab" onClick={() => setTab(k as typeof tab)} style={{
                    padding:'6px 15px', borderRadius:100,
                    border:`1px solid ${tab===k ? 'transparent' : 'rgba(17,17,16,0.12)'}`,
                    background: tab===k ? TEXT : 'transparent',
                    color: tab===k ? '#fff' : TEXT_S,
                    fontSize:12, fontWeight:600,
                    fontFamily:"'Vazirmatn',Tahoma,sans-serif",
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Photos */}
            {tab === 'photos' && (
              <div className="pgrid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {coach.gallery.map(g => (
                  <div key={g.id} className="gcard" style={{ aspectRatio:'1', background:'rgba(17,17,16,0.05)' }}>
                    <img src={g.url} alt={g.caption} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Videos */}
            {tab === 'videos' && (
              <div className="pgrid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {coach.videos.map(v => (
                  <div key={v.id} className="gcard" style={{ aspectRatio:'16/9', background:'rgba(17,17,16,0.05)', position:'relative' }}>
                    <img src={v.thumbnail} alt={v.title} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                    <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top, rgba(0,0,0,0.62) 0%, rgba(0,0,0,0) 55%)', borderRadius:'inherit' }} />
                    {/* Play */}
                    <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-58%)', width:38, height:38, borderRadius:'50%', background:'rgba(255,255,255,0.22)', backdropFilter:'blur(4px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                    </div>
                    <div style={{ position:'absolute', bottom:10, right:10, left:10, color:'#fff' }}>
                      <div style={{ fontSize:12, fontWeight:700, lineHeight:1.4 }}>{v.title}</div>
                      <div style={{ fontSize:11, color:'rgba(255,255,255,0.60)', marginTop:2 }}>{v.duration}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Albums */}
            {tab === 'albums' && (
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12 }}>

                {/* Create new album */}
                <button onClick={() => setShowNewAlbum(true)} style={{ aspectRatio:'1', borderRadius:14, border:'1.5px dashed rgba(199,166,106,0.45)', background:'rgba(199,166,106,0.06)', cursor:'pointer', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', gap:9, fontFamily:"'Vazirmatn',Tahoma,sans-serif" }}>
                  <div style={{ width:42, height:42, borderRadius:'50%', background:'rgba(199,166,106,0.14)', display:'flex', alignItems:'center', justifyContent:'center' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2">
                      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </div>
                  <span style={{ fontSize:12, fontWeight:700, color:GOLD_D }}>آلبوم جدید</span>
                </button>

                {/* Albums list */}
                {albums.map(album => {
                  const preview = coach.gallery.find(g => album.imageIds.includes(g.id))
                  const isExp   = expandedAlbum === album.id
                  return (
                    <div key={album.id} style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      <button onClick={() => setExpandedAlbum(isExp ? null : album.id)}
                        style={{ width:'100%', aspectRatio:'1', borderRadius:14, overflow:'hidden', position:'relative', cursor:'pointer', border:CBOR, background:'rgba(17,17,16,0.05)' }}>
                        {preview && (
                          <img src={preview.url} alt={album.name} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                        )}
                        <div style={{ position:'absolute', inset:0, background:'linear-gradient(to top,rgba(0,0,0,0.62) 0%,transparent 55%)' }} />
                        <div style={{ position:'absolute', bottom:10, right:10, left:10, color:'#fff', fontWeight:700, fontSize:12, display:'flex', justifyContent:'space-between', alignItems:'flex-end' }}>
                          <span>{album.name}</span>
                          <span style={{ color:'rgba(255,255,255,0.55)', fontSize:11 }}>{album.imageIds.length} عکس</span>
                        </div>
                        <div style={{ position:'absolute', top:8, left:8, background:isExp?TEXT:'transparent', border:`1px solid ${isExp?'transparent':'rgba(255,255,255,0.3)'}`, borderRadius:6, width:20, height:20, display:'flex', alignItems:'center', justifyContent:'center', transition:'all .2s' }}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5">
                            {isExp ? <polyline points="18 15 12 9 6 15"/> : <polyline points="6 9 12 15 18 9"/>}
                          </svg>
                        </div>
                      </button>
                      {isExp && album.imageIds.length > 0 && (
                        <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:5 }}>
                          {album.imageIds.map(imgId => {
                            const g = coach.gallery.find(x => x.id === imgId)
                            return g ? <img key={imgId} src={g.url} alt={g.caption} style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:7, display:'block' }} /> : null
                          })}
                        </div>
                      )}
                      {isExp && album.imageIds.length === 0 && (
                        <p style={{ fontSize:12, color:TEXT_M, textAlign:'center', padding:'8px 0' }}>هنوز عکسی اضافه نشده</p>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

        </div>

        {/* ── Create Album Modal ── */}
        {showNewAlbum && (
          <div onClick={() => setShowNewAlbum(false)} style={{ position:'fixed', inset:0, zIndex:9998, background:'rgba(0,0,0,0.38)', backdropFilter:'blur(12px)', display:'flex', alignItems:'center', justifyContent:'center' }}>
            <div onClick={e => e.stopPropagation()} style={{ background:'#fff', borderRadius:22, padding:30, width:'min(380px,90vw)', boxShadow:'0 28px 70px rgba(0,0,0,0.18)', direction:'rtl', fontFamily:"'Vazirmatn',Tahoma,sans-serif" }}>
              <h3 style={{ fontSize:16, fontWeight:800, color:TEXT, marginBottom:18 }}>آلبوم جدید</h3>
              <input
                autoFocus
                value={newAlbumName}
                onChange={e => setNewAlbumName(e.target.value)}
                onKeyDown={e => e.key==='Enter' && createAlbum()}
                placeholder="نام آلبوم..."
                style={{ width:'100%', padding:'11px 15px', border:'1px solid rgba(17,17,16,0.14)', borderRadius:11, fontSize:14, fontFamily:"'Vazirmatn',Tahoma,sans-serif", color:TEXT, outline:'none', background:'rgba(17,17,16,0.02)' }}
              />
              <div style={{ display:'flex', gap:10, marginTop:18, justifyContent:'flex-end' }}>
                <button onClick={() => setShowNewAlbum(false)} className="goldbtn"
                  style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(199,166,106,0.12)', border:'1px solid rgba(199,166,106,0.34)', borderRadius:10, padding:'9px 20px', color:'#9A6E38', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Vazirmatn',Tahoma,sans-serif", textDecoration:'none', whiteSpace:'nowrap' as const }}>
                  انصراف
                </button>
                <button onClick={createAlbum} className="goldbtn"
                  style={{ display:'inline-flex', alignItems:'center', gap:7, background:'rgba(199,166,106,0.12)', border:'1px solid rgba(199,166,106,0.34)', borderRadius:10, padding:'9px 20px', color:'#9A6E38', fontWeight:700, fontSize:13, cursor:'pointer', fontFamily:"'Vazirmatn',Tahoma,sans-serif", textDecoration:'none', whiteSpace:'nowrap' as const }}>
                  ایجاد آلبوم
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── Story Modal ── */}
        {openStory && coach.hasStory && (
          <ClubStoryModal
            club={{ name:coach.name, storyMediaUrl:coach.storyImage, storyType:'image', badge:'مربی' }}
            onClose={() => setOpenStory(false)}
          />
        )}

      </div>
    </>
  )
}
