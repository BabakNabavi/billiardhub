'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ClubStoryModal from '@/components/ClubStoryModal'

/* ─── Tokens (same as listing) ─── */
const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const GOLD_G = 'linear-gradient(135deg,#7A4F10 0%,#C7A66A 50%,#8A6020 100%)'
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

/* ─── Page ─── */
export default function CoachProfilePage() {
  const { id } = useParams<{id:string}>()
  const coach = D.find(c => c.id === id) ?? D[0]!

  const [openStory,     setOpenStory]     = useState(false)
  const [copied,        setCopied]        = useState(false)
  const [tab,           setTab]           = useState<'photos'|'videos'|'albums'>('photos')
  const [albums,        setAlbums]        = useState<Album[]>([
    { id:'default', name:'مسابقات', imageIds: coach.gallery.slice(0,3).map(g=>g.id) },
  ])
  const [showNewAlbum,  setShowNewAlbum]  = useState(false)
  const [newAlbumName,  setNewAlbumName]  = useState('')
  const [expandedAlbum, setExpandedAlbum] = useState<string|null>(null)

  const spec  = SPECS[coach.specialty as keyof typeof SPECS]
  const grade = GRADE_DOTS[coach.badge]
  const [g1, g2] = getGrad(coach.id)
  const socialBtn: React.CSSProperties = { width:44, height:44, borderRadius:11, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(26,25,23,0.06)', border:'1px solid rgba(26,25,23,0.10)', color:'rgba(26,25,23,0.5)', textDecoration:'none', flexShrink:0, cursor:'pointer' }

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
        .social-icn{transition:all .25s ease;}
        .social-icn:hover{background:rgba(199,166,106,0.12)!important;border-color:rgba(199,166,106,0.38)!important;color:#C7A66A!important;transform:translateY(-2px);box-shadow:0 4px 14px rgba(199,166,106,0.18);}
        .gcard{overflow:hidden;border-radius:10px;transition:transform .3s,box-shadow .3s;cursor:pointer;}
        .gcard:hover{transform:scale(1.03);box-shadow:0 6px 20px rgba(0,0,0,0.12);}
        .gtab{transition:all .18s;cursor:pointer;}
        .gtab:hover{opacity:.85;}
        @media(max-width:740px){.pcols{grid-template-columns:1fr!important;}}
        @media(max-width:520px){.pgrid{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:900px){.ln-cols{grid-template-columns:1fr!important;}}
      `}</style>

      <div style={{ direction:'rtl', fontFamily:"'Vazirmatn',Tahoma,sans-serif", background:'#F1EFEC', minHeight:'100vh', color:TEXT }}>

        {/* ── Back ── */}
        <div style={{ maxWidth:1128, margin:'0 auto', padding:'18px clamp(12px,3vw,24px) 0' }}>
          <Link href="/coaches" className="goldbtn" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(199,166,106,0.12)', border:'1px solid rgba(199,166,106,0.34)', color:'#9A6E38', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:700, padding:'7px 14px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            بازگشت به مربیان
          </Link>
        </div>

        {/* ── LinkedIn-style layout ── */}
        <div className="ln-cols" style={{ maxWidth:1128, margin:'0 auto', padding:'16px clamp(12px,3vw,24px) 64px', display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start' }}>

          {/* ═══ MAIN COLUMN ═══ */}
          <div style={{ minWidth:0, display:'flex', flexDirection:'column', gap:16 }}>

            {/* Profile card */}
            <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.10)', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', animation:'fadeUp .4s ease both' }}>
              {/* Cover */}
              <div style={{ position:'relative', height:'clamp(120px,20vw,200px)' }}>
                {coach.storyImage
                  ? <img src={coach.storyImage} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  : <div style={{ width:'100%', height:'100%', background:`linear-gradient(120deg,${g1},${g2})` }} />}
              </div>
              {/* Body */}
              <div style={{ padding:'0 24px 20px', position:'relative', zIndex:2 }}>
                {/* avatar + edit */}
                <div style={{ display:'flex', justifyContent:'flex-start', alignItems:'flex-end', marginTop:'clamp(-64px,-9vw,-72px)' }}>
                  <button onClick={() => coach.hasStory && setOpenStory(true)} aria-label="عکس پروفایل" style={{ background:'none', border:'none', padding:0, cursor: coach.hasStory ? 'pointer' : 'default', borderRadius:'50%', width:'clamp(104px,14vw,148px)', aspectRatio:'1 / 1', flexShrink:0 }}>
                    <div style={{ width:'100%', height:'100%', borderRadius:'50%', boxSizing:'border-box',
                      background: coach.hasStory ? 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)' : '#fff',
                      padding: coach.hasStory ? 4 : 0,
                      boxShadow: coach.hasStory ? '0 0 16px rgba(214,41,118,0.40), 0 2px 8px rgba(0,0,0,0.14)' : '0 2px 8px rgba(0,0,0,0.14)' }}>
                      <div style={{ width:'100%', height:'100%', borderRadius:'50%', border:'3px solid #fff', overflow:'hidden', background:'#E7ECF1', display:'flex', alignItems:'flex-end', justifyContent:'center' }}>
                        <svg viewBox="0 0 100 100" width="100%" height="100%" style={{ display:'block' }} aria-hidden="true">
                          <circle cx="50" cy="37" r="19" fill="#93A3B8"/>
                          <path d="M15 100 C15 74 31 65 50 65 C69 65 85 74 85 100 Z" fill="#A9B8CC"/>
                        </svg>
                      </div>
                    </div>
                  </button>
                </div>

                {/* name + affiliation */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:20, marginTop:10, flexWrap:'wrap' }}>
                  <div style={{ minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:7, flexWrap:'wrap' }}>
                      <h1 style={{ fontSize:'clamp(21px,2.6vw,26px)', fontWeight:700, color:'#1c1c1c', lineHeight:1.2 }}>{coach.name}</h1>
                      {coach.verified && (
                        <svg width="20" height="20" viewBox="0 0 40 40" aria-label="تأیید شده" style={{ flexShrink:0 }}>
                          <path fill="#0095F6" d="M19.998 3.094L14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094z"/>
                          <path fill="#fff" d="M18.09 24.79l-4.28-4.28 1.53-1.53 2.75 2.75 6.57-6.57 1.53 1.53z"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ fontSize:15, color:'rgba(0,0,0,0.9)', marginTop:4 }}>مربی {spec?.label ?? 'بیلیارد'}</div>
                    {coach.badge && (
                      <div style={{ fontSize:13.5, color:'#0a66c2', fontWeight:600, marginTop:3 }}>{coach.badge}</div>
                    )}
                    <div style={{ fontSize:13, color:'rgba(0,0,0,0.55)', marginTop:6 }}>
                      {coach.city}، ایران
                    </div>
                  </div>
                </div>

              </div>
            </div>


          {/* About — explore-card style */}
          <div style={{ background:'rgba(252,251,249,0.92)', backdropFilter:'blur(24px) saturate(1.6)', WebkitBackdropFilter:'blur(24px) saturate(1.6)', border:'1px solid rgba(28,28,26,0.08)', borderRadius:16, padding:'24px 26px', boxShadow:'0 8px 30px rgba(28,28,26,0.08), inset 0 1px 0 rgba(255,255,255,0.9)', position:'relative', overflow:'hidden', animation:'fadeUp .45s .08s ease both' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(184,147,58,0.55),transparent)' }}/>
            <h2 style={{ fontSize:15, fontWeight:800, color:'#1c1c1c', marginBottom:14, display:'flex', alignItems:'center', gap:9 }}>
              <span style={{ width:3, height:16, borderRadius:2, background:'linear-gradient(180deg,#C7A66A,#8A6020)', flexShrink:0 }}/>
              معرفی مربی
            </h2>
            <p style={{ fontSize:14, color:'rgba(28,28,26,0.68)', lineHeight:2.1, textAlign:'justify' }}>{coach.fullBio}</p>
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
                    padding:'6px 15px', borderRadius:10, cursor:'pointer',
                    border:`1px solid ${tab===k ? 'rgba(199,166,106,0.40)' : 'rgba(17,17,16,0.12)'}`,
                    background: tab===k ? 'rgba(199,166,106,0.12)' : 'transparent',
                    color: tab===k ? '#9A6E38' : TEXT_S,
                    fontSize:12, fontWeight: tab===k ? 800 : 600,
                    fontFamily:"'Vazirmatn',Tahoma,sans-serif",
                  }}>{l}</button>
                ))}
              </div>
            </div>

            {/* Photos */}
            {tab === 'photos' && (
              <div className="pgrid" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
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

          {/* ═══ SIDEBAR ═══ */}
          <aside className="ln-side" style={{ display:'flex', flexDirection:'column', gap:16, animation:'fadeUp .45s .12s ease both' }}>

            {/* Public profile & URL */}
            <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.10)', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ fontSize:16, fontWeight:700, color:'#1c1c1c' }}>پروفایل عمومی و نشانی</h3>
                <button aria-label="کپی نشانی" onClick={() => { const u = `https://www.billiardhub.net/coaches/${coach.id}`; if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(u).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600) }).catch(() => {}) } }} style={{ background:'transparent', border:'none', cursor:'pointer', color: copied ? '#057642' : 'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', gap:4, padding:4, fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                  {copied ? (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>کپی شد</>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  )}
                </button>
              </div>
              <div style={{ marginTop:8, fontSize:13, color:'rgba(0,0,0,0.62)', direction:'ltr', textAlign:'right' }}>www.billiardhub.net/coaches/{coach.id}</div>
            </div>

            {/* درجه مربیگری */}
            <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.10)', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#1c1c1c', marginBottom:14 }}>درجه مربیگری</h3>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
                <span style={{ background:`${coach.badgeColor}15`, border:`1.5px solid ${coach.badgeColor}48`, color:coach.badgeColor, borderRadius:100, fontSize:13, fontWeight:800, padding:'6px 16px' }}>{coach.badge}</span>
                {grade && (
                  <div style={{ display:'flex', gap:5 }}>
                    {[1,2,3,4,5].map(d => (<div key={d} style={{ width:9, height:9, borderRadius:'50%', background: d<=grade.dots ? grade.color : 'rgba(17,17,16,0.12)' }} />))}
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
            </div>

            {/* راه‌های ارتباطی */}
            <div style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.10)', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#1c1c1c', marginBottom:14 }}>راه‌های ارتباطی</h3>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <a href={`tel:${coach.phone}`} className="social-icn" aria-label="تماس" style={socialBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .64 2.57 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.57.64A2 2 0 0 1 22 16.92z"/></svg>
                </a>
                <a href={`https://wa.me/${coach.whatsapp}`} target="_blank" rel="noopener noreferrer" className="social-icn" aria-label="واتساپ" style={socialBtn}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.63.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.66-1.6-.9-2.18-.24-.57-.48-.5-.66-.5l-.56-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.56-.35zM12.05 21.5a9.5 9.5 0 0 1-4.85-1.33l-.35-.2-3.6.94.96-3.51-.23-.36a9.5 9.5 0 1 1 8.07 4.46zM12.05 2C6.5 2 2 6.5 2 12.04c0 1.77.46 3.5 1.35 5.03L2 22l5.05-1.32a10.02 10.02 0 0 0 5 1.28c5.54 0 10.05-4.5 10.05-10.04C22.1 6.5 17.6 2 12.05 2z"/></svg>
                </a>
                {coach.instagram && (
                  <a href={`https://instagram.com/${coach.instagram}`} target="_blank" rel="noopener noreferrer" className="social-icn" aria-label="اینستاگرام" style={socialBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>
                  </a>
                )}
                {coach.telegram && (
                  <a href={`https://t.me/${coach.telegram}`} target="_blank" rel="noopener noreferrer" className="social-icn" aria-label="تلگرام" style={socialBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22 2L11 13" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/><path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  </a>
                )}
              </div>
            </div>

          </aside>
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
