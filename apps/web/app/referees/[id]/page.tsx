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
  'داور بین‌المللی': {dots:5, color:'#7C3AED'},
  'داور ملی':        {dots:4, color:GOLD_D},
  'داور درجه A':     {dots:3, color:'#C2410C'},
  'داور درجه B':     {dots:2, color:'#16A34A'},
  'داور درجه C':     {dots:1, color:TEXT_S},
}

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

interface RefereeFull {
  id:string; name:string; specialty:string; city:string
  badge:string; badgeColor:string; verified:boolean
  hasStory:boolean; storyImage:string
  bio:string; fullBio:string
  certifications:string[]; achievements:string[]; specialties:string[]
  phone:string; whatsapp:string; instagram?:string; telegram?:string
  gallery:GImg[]; videos:VItem[]
}

/* ─── Data ─── */
const D: RefereeFull[] = [
  {
    id:'1', name:'کاوه طالبی', specialty:'snooker', city:'تهران',
    badge:'داور بین‌المللی', badgeColor:'#7C3AED', verified:true,
    hasStory:true, storyImage:img(0),
    bio:'داور بین‌المللی WPBSA با ۲۰ سال سابقه در رویدادهای جهانی اسنوکر.',
    fullBio:'کاوه طالبی با بیش از ۲۰ سال سابقه در داوری اسنوکر، یکی از معدود داوران بین‌المللی ایرانی است که مدرک رسمی WPBSA دارد. وی تاکنون در ۴۵ مسابقه بین‌المللی داوری کرده و به‌عنوان داور ارشد در قهرمانی آسیا و چندین رویداد جهانی حضور داشته است. کاوه به‌عنوان مرجع قوانین اسنوکر در فدراسیون بیلیارد ایران شناخته می‌شود.',
    certifications:['مدرک بین‌المللی WPBSA','گواهی داور ارشد ACBS','عضو کمیته داوران فدراسیون'],
    achievements:['داور انتخابی قهرمانی آسیا ۱۴۰۲','داور رویداد جهانی اسنوکر ۲۰۲۳','داور ارشد ۵ دوره لیگ برتر ایران'],
    specialties:['اسنوکر','پاکت بیلیارد'],
    phone:'09121234567', whatsapp:'989121234567', instagram:'kaveh_referee',
    gallery:[
      {id:'g1',url:img(0),caption:'مسابقات قهرمانی آسیا'},
      {id:'g2',url:img(1),caption:'داوری لیگ برتر'},
      {id:'g3',url:img(2),caption:'تمرین داوران'},
      {id:'g4',url:img(3),caption:'مراسم اهدای جوایز'},
      {id:'g5',url:img(0),caption:'فینال قهرمانی'},
      {id:'g6',url:img(1),caption:'جلسه داوران'},
    ],
    videos:[
      {id:'v1',thumbnail:img(0),title:'قوانین رسمی اسنوکر WPBSA',duration:'۱۴:۲۰'},
      {id:'v2',thumbnail:img(1),title:'مدیریت فریم و امتیازدهی',duration:'۹:۳۰'},
      {id:'v3',thumbnail:img(2),title:'داوری فاول‌های رایج',duration:'۱۱:۱۵'},
    ],
  },
  {
    id:'2', name:'نیلوفر حسینی', specialty:'pocket', city:'مشهد',
    badge:'داور ملی', badgeColor:GOLD_D, verified:true,
    hasStory:true, storyImage:img(1),
    bio:'داور ملی پاکت بیلیارد — پیشگام داوری بانوان در ایران.',
    fullBio:'نیلوفر حسینی با ۱۲ سال سابقه، از پیشگامان داوری بانوان در پاکت بیلیارد ایران است. وی تاکنون در ۹۵ مسابقه ملی داوری کرده و عضو فعال کمیته بانوان فدراسیون است. نیلوفر در توسعه استانداردهای داوری برای مسابقات بانوان نقش مهمی ایفا کرده است.',
    certifications:['مدرک داور ملی فدراسیون','گواهی داوری پاکت بیلیارد درجه A','عضو کمیته بانوان فدراسیون'],
    achievements:['داور انتخابی مسابقات ملی بانوان ۱۴۰۲','داور ارشد لیگ برتر بانوان ۳ دوره'],
    specialties:['پاکت بیلیارد','اسنوکر'],
    phone:'09131234567', whatsapp:'989131234567', instagram:'nilufar.ref',
    gallery:[
      {id:'g1',url:img(1),caption:'مسابقات ملی بانوان'},
      {id:'g2',url:img(2),caption:'لیگ برتر'},
      {id:'g3',url:img(0),caption:'کلاس داوری'},
      {id:'g4',url:img(3),caption:'اهدای مدال بانوان'},
      {id:'g5',url:img(1),caption:'رویداد ملی مشهد'},
      {id:'g6',url:img(2),caption:'داوری فینال'},
    ],
    videos:[
      {id:'v1',thumbnail:img(1),title:'قوانین رسمی پاکت بیلیارد',duration:'۱۰:۴۵'},
      {id:'v2',thumbnail:img(2),title:'داوری مسابقات بانوان',duration:'۸:۲۰'},
    ],
  },
  {
    id:'3', name:'رامین فرهادی', specialty:'highball', city:'اصفهان',
    badge:'داور ملی', badgeColor:GOLD_D, verified:true,
    hasStory:false, storyImage:'',
    bio:'متخصص هی‌بال — عضو کمیته داوران فدراسیون.',
    fullBio:'رامین فرهادی با تخصص در هی‌بال، عضو فعال کمیته داوران فدراسیون بیلیارد و اسنوکر ایران است. وی در ۶۰+ مسابقه استانی و ملی داوری کرده و به‌عنوان مربی دوره‌های داوری نیز فعالیت دارد.',
    certifications:['مدرک داور ملی هی‌بال','گواهی مربیگری داوری'],
    achievements:['داور ارشد مسابقات ملی هی‌بال ۱۴۰۱','مدرس دوره آموزش داوری استان اصفهان'],
    specialties:['هی‌بال','پاکت بیلیارد'],
    phone:'09141234567', whatsapp:'989141234567', telegram:'ramin_ref',
    gallery:[
      {id:'g1',url:img(2),caption:'مسابقات ملی هی‌بال'},
      {id:'g2',url:img(3),caption:'دوره آموزشی داوری'},
      {id:'g3',url:img(0),caption:'جلسه استانی اصفهان'},
      {id:'g4',url:img(1),caption:'قضاوت فینال'},
    ],
    videos:[
      {id:'v1',thumbnail:img(2),title:'قوانین رسمی هی‌بال',duration:'۹:۱۰'},
      {id:'v2',thumbnail:img(3),title:'نکات کلیدی داوری هی‌بال',duration:'۷:۵۰'},
    ],
  },
  {
    id:'4', name:'سحر محمدی', specialty:'pocket', city:'تهران',
    badge:'داور درجه A', badgeColor:'#C2410C', verified:true,
    hasStory:true, storyImage:img(3),
    bio:'داور جوان پاکت بیلیارد — قضاوت ۳۰+ مسابقه استانی و کشوری.',
    fullBio:'سحر محمدی یکی از داوران جوان و باانرژی پاکت بیلیارد است که در ۵ سال اخیر با سرعت زیادی پیشرفت کرده. وی در ۳۰ مسابقه استانی و ۱۲ مسابقه ملی داوری کرده و هدفش رسیدن به مدرک بین‌المللی تا ۳ سال آینده است.',
    certifications:['گواهی داور درجه A فدراسیون','دوره تخصصی قوانین BCA'],
    achievements:['داور برگزیده استان تهران ۱۴۰۱','داور مسابقات دانشجویی کشور'],
    specialties:['پاکت بیلیارد'],
    phone:'09151234567', whatsapp:'989151234567', instagram:'sahar_ref',
    gallery:[
      {id:'g1',url:img(3),caption:'مسابقات دانشجویی'},
      {id:'g2',url:img(1),caption:'داوری استانی'},
      {id:'g3',url:img(0),caption:'رویداد کشوری'},
      {id:'g4',url:img(2),caption:'آموزش داوری'},
      {id:'g5',url:img(3),caption:'مسابقات بانوان'},
    ],
    videos:[
      {id:'v1',thumbnail:img(3),title:'اصول داوری پاکت بیلیارد',duration:'۶:۴۰'},
    ],
  },
  {
    id:'5', name:'حامد موسوی', specialty:'snooker', city:'تبریز',
    badge:'داور بین‌المللی', badgeColor:'#7C3AED', verified:true,
    hasStory:true, storyImage:img(0),
    bio:'داور ارشد IBSF — نماینده ایران در قهرمانی آسیا ۱۴۰۲.',
    fullBio:'حامد موسوی از داوران برجسته اسنوکر ایران است که با مدرک بین‌المللی IBSF، در رویدادهای آسیایی و بین‌المللی متعددی شرکت داشته. وی با ۱۵ سال تجربه، داور ارشد لیگ برتر ایران و عضو پانل داوران کنفدراسیون ACBS است.',
    certifications:['مدرک بین‌المللی IBSF','مدرک داور ارشد ACBS','عضو پانل داوران آسیا'],
    achievements:['داور قهرمانی آسیا ۱۴۰۲','داور جام ACBS ۲۰۲۲','داور ارشد ۶ دوره لیگ برتر'],
    specialties:['اسنوکر'],
    phone:'09161234567', whatsapp:'989161234567', telegram:'hamed_referee',
    gallery:[
      {id:'g1',url:img(0),caption:'قهرمانی آسیا ۱۴۰۲'},
      {id:'g2',url:img(1),caption:'لیگ برتر اسنوکر'},
      {id:'g3',url:img(2),caption:'جام ACBS'},
      {id:'g4',url:img(3),caption:'تمرین و آماده‌سازی'},
      {id:'g5',url:img(0),caption:'پانل داوران بین‌الملل'},
      {id:'g6',url:img(1),caption:'فینال جام آسیا'},
    ],
    videos:[
      {id:'v1',thumbnail:img(0),title:'قوانین بین‌المللی IBSF',duration:'۱۵:۰۰'},
      {id:'v2',thumbnail:img(1),title:'مدیریت مسابقات آسیایی',duration:'۱۲:۳۰'},
    ],
  },
  {
    id:'6', name:'علی رضایی', specialty:'highball', city:'شیراز',
    badge:'داور ملی', badgeColor:GOLD_D, verified:false,
    hasStory:false, storyImage:'',
    bio:'داور هی‌بال — قضاوت لیگ برتر هی‌بال و مسابقات جوانان.',
    fullBio:'علی رضایی در ۷ سال فعالیت در داوری هی‌بال، تجربه قضاوت در مسابقات مختلف استانی و ملی را کسب کرده. وی به‌ویژه در داوری مسابقات نوجوانان و جوانان تجربه خوبی دارد.',
    certifications:['مدرک داور ملی هی‌بال','گواهی داوری فدراسیون'],
    achievements:['داور لیگ برتر هی‌بال ۱۴۰۱','داور مسابقات جوانان کشوری'],
    specialties:['هی‌بال'],
    phone:'09171234567', whatsapp:'989171234567',
    gallery:[
      {id:'g1',url:img(1),caption:'مسابقات جوانان'},
      {id:'g2',url:img(2),caption:'لیگ برتر هی‌بال'},
      {id:'g3',url:img(3),caption:'داوری فینال'},
      {id:'g4',url:img(0),caption:'جلسه داوران شیراز'},
    ],
    videos:[
      {id:'v1',thumbnail:img(1),title:'داوری مسابقات جوانان',duration:'۸:۰۰'},
    ],
  },
  {
    id:'7', name:'مینا صالحی', specialty:'pocket', city:'کرج',
    badge:'داور درجه B', badgeColor:'#16A34A', verified:false,
    hasStory:false, storyImage:'',
    bio:'داور درجه B پاکت بیلیارد — فعال در مسابقات استانی.',
    fullBio:'مینا صالحی داور درجه B پاکت بیلیارد است که در ۳ سال گذشته تجربه خوبی در مسابقات استانی البرز و تهران کسب کرده. وی برای ارتقاء به درجه A در حال تکمیل دوره‌های آموزشی است.',
    certifications:['گواهی داور درجه B فدراسیون'],
    achievements:['داور برگزیده مسابقات استانی البرز ۱۴۰۱'],
    specialties:['پاکت بیلیارد'],
    phone:'09181234567', whatsapp:'989181234567',
    gallery:[
      {id:'g1',url:img(2),caption:'مسابقات استانی البرز'},
      {id:'g2',url:img(3),caption:'آموزش داوری درجه B'},
      {id:'g3',url:img(1),caption:'رویداد پاکت بیلیارد'},
    ],
    videos:[
      {id:'v1',thumbnail:img(2),title:'مقدمات داوری پاکت',duration:'۷:۱۵'},
    ],
  },
  {
    id:'8', name:'کیان نوری', specialty:'snooker', city:'تهران',
    badge:'داور ملی', badgeColor:GOLD_D, verified:true,
    hasStory:true, storyImage:img(3),
    bio:'داور ملی اسنوکر — عضو هیئت داوران کنفدراسیون ACBS.',
    fullBio:'کیان نوری با ۱۰ سال سابقه داوری اسنوکر، عضو هیئت داوران کنفدراسیون ACBS است. وی در مسابقات ملی و منطقه‌ای متعددی داوری کرده و به‌عنوان مشاور قوانین برای باشگاه‌های تهران فعال است.',
    certifications:['مدرک داور ملی اسنوکر','عضو هیئت داوران ACBS','گواهی مربیگری داوری'],
    achievements:['داور ارشد مسابقات ملی اسنوکر ۱۴۰۲','داور منطقه‌ای ACBS ۲۰۲۲'],
    specialties:['اسنوکر','پاکت بیلیارد'],
    phone:'09191234567', whatsapp:'989191234567', instagram:'kian_referee',
    gallery:[
      {id:'g1',url:img(3),caption:'مسابقات ملی اسنوکر'},
      {id:'g2',url:img(0),caption:'رویداد ACBS'},
      {id:'g3',url:img(1),caption:'لیگ برتر'},
      {id:'g4',url:img(2),caption:'داوری فینال ملی'},
      {id:'g5',url:img(3),caption:'پانل مشاوران قوانین'},
      {id:'g6',url:img(0),caption:'کنفرانس داوران آسیا'},
    ],
    videos:[
      {id:'v1',thumbnail:img(3),title:'قوانین اسنوکر ACBS',duration:'۱۳:۱۰'},
      {id:'v2',thumbnail:img(0),title:'مشاوره قوانین باشگاه',duration:'۹:۴۵'},
    ],
  },
]

/* ─── Page ─── */
export default function RefereeProfilePage() {
  const { id } = useParams<{id:string}>()
  const referee = D.find(r => r.id === id) ?? D[0]!

  const [openStory,     setOpenStory]     = useState(false)
  const [copied,        setCopied]        = useState(false)
  const [tab,           setTab]           = useState<'photos'|'videos'|'albums'>('photos')
  const [albums,        setAlbums]        = useState<Album[]>([])
  const [showNewAlbum,  setShowNewAlbum]  = useState(false)
  const [newAlbumName,  setNewAlbumName]  = useState('')
  const [expandedAlbum, setExpandedAlbum] = useState<string|null>(null)
  const [lightbox,      setLightbox]      = useState<GImg|null>(null)

  const spec  = SPECS[referee.specialty as keyof typeof SPECS]
  const grade = GRADE_DOTS[referee.badge]
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
        .pcard{min-width:0;}
        /* mobile gallery grids: photos 4/row, videos 2/row, albums 3/row */
        @media(max-width:600px){
          .gphotos{grid-template-columns:repeat(4,1fr)!important;}
          .gvideos{grid-template-columns:repeat(2,1fr)!important;}
          .galbums{grid-template-columns:repeat(3,1fr)!important;}
        }
        /* mobile: single column; interleave main + sidebar cards in the requested order */
        @media(max-width:900px){
          .ln-cols{grid-template-columns:1fr!important;}
          .ln-main,.ln-side{display:contents!important;}
          .pcard-profile{order:1;}
          .pcard-about{order:2;}
          .pcard-grade{order:3;}
          .pcard-public{order:4;}
          .pcard-contact{order:5;}
          .pcard-gallery{order:6;}
        }
      `}</style>

      <div style={{ direction:'rtl', fontFamily:"'Vazirmatn',Tahoma,sans-serif", background:'#F1EFEC', minHeight:'100vh', color:TEXT }}>

        {/* ── Back ── */}
        <div style={{ maxWidth:1128, margin:'0 auto', padding:'18px clamp(12px,3vw,24px) 0' }}>
          <Link href="/referees" className="goldbtn" style={{ display:'inline-flex', alignItems:'center', gap:6, background:'rgba(199,166,106,0.12)', border:'1px solid rgba(199,166,106,0.34)', color:'#9A6E38', borderRadius:10, textDecoration:'none', fontSize:13, fontWeight:700, padding:'7px 14px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            بازگشت به داوران
          </Link>
        </div>

        {/* ── LinkedIn-style layout ── */}
        <div className="ln-cols" style={{ maxWidth:1128, margin:'0 auto', padding:'16px clamp(12px,3vw,24px) 64px', display:'grid', gridTemplateColumns:'1fr 320px', gap:24, alignItems:'start' }}>

          {/* ═══ MAIN COLUMN ═══ */}
          <div className="ln-main" style={{ minWidth:0, display:'flex', flexDirection:'column', gap:16 }}>

            {/* Profile card */}
            <div className="pcard pcard-profile" style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.10)', borderRadius:12, overflow:'hidden', boxShadow:'0 1px 3px rgba(0,0,0,0.06)', animation:'fadeUp .4s ease both' }}>
              {/* Cover — default referee poster */}
              <div style={{ position:'relative', height:'clamp(120px,20vw,200px)', overflow:'hidden', background:'linear-gradient(115deg,#0c1424 0%,#17253f 55%,#1e2f4d 100%)' }}>
                <div style={{ position:'absolute', inset:0, backgroundImage:'radial-gradient(circle, rgba(255,255,255,0.045) 1px, transparent 1px)', backgroundSize:'16px 16px' }}/>
                <div style={{ position:'absolute', left:'-6%', top:'-40%', width:'46%', height:'180%', background:'radial-gradient(ellipse, rgba(199,166,106,0.18) 0%, transparent 66%)', filter:'blur(18px)', pointerEvents:'none' }}/>
                <div style={{ position:'absolute', top:'-20%', bottom:'-20%', left:'54%', width:'1.5px', background:'linear-gradient(180deg,transparent,rgba(199,166,106,0.45),transparent)', transform:'rotate(-10deg)', pointerEvents:'none' }}/>
                <div style={{ position:'absolute', top:'50%', insetInlineEnd:'clamp(20px,4vw,40px)', transform:'translateY(-50%)', display:'flex', flexDirection:'column', gap:'10px' }}>
                  <img src="/images/Logo/BH.png" alt="بیلیارد هاب" style={{ height:'clamp(26px,4vw,40px)', width:'auto' }}/>
                  <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                    <span style={{ width:'22px', height:'1.5px', background:'linear-gradient(90deg,#C7A66A,transparent)', display:'inline-block' }}/>
                    <span style={{ fontSize:'clamp(9px,1.4vw,12px)', fontWeight:800, letterSpacing:'0.3em', color:'rgba(199,166,106,0.9)' }}>PROFESSIONAL REFEREE</span>
                  </div>
                </div>
              </div>
              {/* Body */}
              <div style={{ padding:'0 24px 20px', position:'relative', zIndex:2 }}>
                {/* avatar */}
                <div style={{ display:'flex', justifyContent:'flex-start', alignItems:'flex-end', marginTop:'clamp(-64px,-9vw,-72px)' }}>
                  <button onClick={() => referee.hasStory && setOpenStory(true)} aria-label="عکس پروفایل" style={{ background:'none', border:'none', padding:0, cursor: referee.hasStory ? 'pointer' : 'default', borderRadius:'50%', width:'clamp(104px,14vw,148px)', aspectRatio:'1 / 1', flexShrink:0 }}>
                    <div style={{ width:'100%', height:'100%', borderRadius:'50%', boxSizing:'border-box',
                      background: referee.hasStory ? 'linear-gradient(45deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)' : '#fff',
                      padding: referee.hasStory ? 4 : 0,
                      boxShadow: referee.hasStory ? '0 0 16px rgba(214,41,118,0.40), 0 2px 8px rgba(0,0,0,0.14)' : '0 2px 8px rgba(0,0,0,0.14)' }}>
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
                      <h1 style={{ fontSize:'clamp(21px,2.6vw,26px)', fontWeight:700, color:'#1c1c1c', lineHeight:1.2 }}>{referee.name}</h1>
                      {referee.verified && (
                        <svg width="20" height="20" viewBox="0 0 40 40" aria-label="تأیید شده" style={{ flexShrink:0 }}>
                          <path fill="#0095F6" d="M19.998 3.094L14.638 0l-2.972 5.15H5.432v6.354L0 14.64 3.094 20 0 25.359l5.432 3.137v5.905h5.975L14.638 40l5.36-3.094L25.358 40l3.232-5.6h6.162v-6.01L40 25.359 36.905 20 40 14.641l-5.248-3.03v-6.46h-6.419L25.358 0l-5.36 3.094z"/>
                          <path fill="#fff" d="M18.09 24.79l-4.28-4.28 1.53-1.53 2.75 2.75 6.57-6.57 1.53 1.53z"/>
                        </svg>
                      )}
                    </div>
                    <div style={{ fontSize:15, color:'rgba(0,0,0,0.9)', marginTop:4 }}>داور {spec?.label ?? 'بیلیارد'}</div>
                    {referee.badge && (
                      <div style={{ fontSize:13.5, color:'#0a66c2', fontWeight:600, marginTop:3 }}>{referee.badge}</div>
                    )}
                    <div style={{ fontSize:13, color:'rgba(0,0,0,0.55)', marginTop:6 }}>
                      {referee.city}، ایران
                    </div>
                  </div>
                </div>

              </div>
            </div>


          {/* About — explore-card style */}
          <div className="pcard pcard-about" style={{ background:'rgba(252,251,249,0.92)', backdropFilter:'blur(24px) saturate(1.6)', WebkitBackdropFilter:'blur(24px) saturate(1.6)', border:'1px solid rgba(28,28,26,0.08)', borderRadius:16, padding:'24px 26px', boxShadow:'0 8px 30px rgba(28,28,26,0.08), inset 0 1px 0 rgba(255,255,255,0.9)', position:'relative', overflow:'hidden', animation:'fadeUp .45s .08s ease both' }}>
            <div style={{ position:'absolute', top:0, left:0, right:0, height:'1px', background:'linear-gradient(90deg,transparent,rgba(184,147,58,0.55),transparent)' }}/>
            <h2 style={{ fontSize:15, fontWeight:800, color:'#1c1c1c', marginBottom:14, display:'flex', alignItems:'center', gap:9 }}>
              <span style={{ width:3, height:16, borderRadius:2, background:'linear-gradient(180deg,#C7A66A,#8A6020)', flexShrink:0 }}/>
              معرفی داور
            </h2>
            <p style={{ fontSize:14, color:'rgba(28,28,26,0.68)', lineHeight:2.1, textAlign:'justify' }}>{referee.fullBio}</p>
          </div>

          {/* ── Gallery ── */}
          <div className="pcard pcard-gallery" style={{ marginTop:20, background:CARD, border:CBOR, borderRadius:18, padding:26, boxShadow:CSHA, animation:'fadeUp .45s .18s ease both' }}>

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
              <div className="gphotos" style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:10 }}>
                {referee.gallery.map(g => (
                  <div key={g.id} className="gcard" onClick={() => setLightbox(g)} style={{ aspectRatio:'1', background:'rgba(17,17,16,0.05)' }}>
                    <img src={g.url} alt={g.caption} style={{ width:'100%', height:'100%', objectFit:'cover', display:'block' }} />
                  </div>
                ))}
              </div>
            )}

            {/* Videos */}
            {tab === 'videos' && (
              <div className="gvideos" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
                {referee.videos.map(v => (
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
              <div className="galbums" style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(170px,1fr))', gap:12 }}>

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
                  const preview = referee.gallery.find(g => album.imageIds.includes(g.id))
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
                            const g = referee.gallery.find(x => x.id === imgId)
                            return g ? <img key={imgId} src={g.url} alt={g.caption} onClick={() => setLightbox(g)} style={{ width:'100%', aspectRatio:'1', objectFit:'cover', borderRadius:7, display:'block', cursor:'pointer' }} /> : null
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
            <div className="pcard pcard-public" style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.10)', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <h3 style={{ fontSize:16, fontWeight:700, color:'#1c1c1c' }}>پروفایل عمومی و نشانی</h3>
                <button aria-label="کپی نشانی" onClick={() => { const u = `https://www.billiardhub.net/referees/${referee.id}`; if (navigator.clipboard?.writeText) { navigator.clipboard.writeText(u).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1600) }).catch(() => {}) } }} style={{ background:'transparent', border:'none', cursor:'pointer', color: copied ? '#057642' : 'rgba(0,0,0,0.55)', display:'flex', alignItems:'center', gap:4, padding:4, fontSize:12, fontWeight:700, fontFamily:'inherit' }}>
                  {copied ? (
                    <><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>کپی شد</>
                  ) : (
                    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                  )}
                </button>
              </div>
              <div style={{ marginTop:8, fontSize:13, color:'rgba(0,0,0,0.62)', direction:'ltr', textAlign:'right' }}>www.billiardhub.net/referees/{referee.id}</div>
            </div>

            {/* درجه داوری */}
            <div className="pcard pcard-grade" style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.10)', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#1c1c1c', marginBottom:14 }}>درجه داوری</h3>
              <div style={{ display:'flex', alignItems:'center', gap:12, marginBottom:16, flexWrap:'wrap' }}>
                <span style={{ background:`${referee.badgeColor}15`, border:`1.5px solid ${referee.badgeColor}48`, color:referee.badgeColor, borderRadius:100, fontSize:13, fontWeight:800, padding:'6px 16px' }}>{referee.badge}</span>
                {grade && (
                  <div style={{ display:'flex', gap:5 }}>
                    {[1,2,3,4,5].map(d => (<div key={d} style={{ width:9, height:9, borderRadius:'50%', background: d<=grade.dots ? grade.color : 'rgba(17,17,16,0.12)' }} />))}
                  </div>
                )}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
                {referee.certifications.map((c,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:8 }}>
                    <span style={{ color:GOLD, marginTop:2, flexShrink:0, fontSize:10 }}>✦</span>
                    <span style={{ fontSize:12.5, color:TEXT_S, lineHeight:1.65 }}>{c}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* راه‌های ارتباطی */}
            <div className="pcard pcard-contact" style={{ background:'#fff', border:'1px solid rgba(0,0,0,0.10)', borderRadius:12, padding:'16px 18px', boxShadow:'0 1px 3px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize:16, fontWeight:700, color:'#1c1c1c', marginBottom:14 }}>راه‌های ارتباطی</h3>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                <a href={`tel:${referee.phone}`} className="social-icn" aria-label="تماس" style={socialBtn}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.05 12.05 0 0 0 .64 2.57 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.05 12.05 0 0 0 2.57.64A2 2 0 0 1 22 16.92z"/></svg>
                </a>
                <a href={`https://wa.me/${referee.whatsapp}`} target="_blank" rel="noopener noreferrer" className="social-icn" aria-label="واتساپ" style={socialBtn}>
                  <svg width="19" height="19" viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.66.15-.2.3-.76.96-.93 1.16-.17.2-.34.22-.63.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.34.44-.51.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.66-1.6-.9-2.18-.24-.57-.48-.5-.66-.5l-.56-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.01-1.04 2.47s1.07 2.87 1.22 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.28.17-1.41-.07-.13-.27-.2-.56-.35zM12.05 21.5a9.5 9.5 0 0 1-4.85-1.33l-.35-.2-3.6.94.96-3.51-.23-.36a9.5 9.5 0 1 1 8.07 4.46zM12.05 2C6.5 2 2 6.5 2 12.04c0 1.77.46 3.5 1.35 5.03L2 22l5.05-1.32a10.02 10.02 0 0 0 5 1.28c5.54 0 10.05-4.5 10.05-10.04C22.1 6.5 17.6 2 12.05 2z"/></svg>
                </a>
                {referee.instagram && (
                  <a href={`https://instagram.com/${referee.instagram}`} target="_blank" rel="noopener noreferrer" className="social-icn" aria-label="اینستاگرام" style={socialBtn}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><circle cx="12" cy="12" r="4.5"/><circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/></svg>
                  </a>
                )}
                {referee.telegram && (
                  <a href={`https://t.me/${referee.telegram}`} target="_blank" rel="noopener noreferrer" className="social-icn" aria-label="تلگرام" style={socialBtn}>
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

        {/* ── Image Lightbox ── */}
        {lightbox && (
          <div onClick={() => setLightbox(null)} style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.90)', backdropFilter:'blur(10px)', WebkitBackdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center', padding:'clamp(16px,4vw,48px)', direction:'rtl', animation:'fadeUp .2s ease both' }}>
            <button aria-label="بستن" onClick={() => setLightbox(null)} style={{ position:'absolute', top:16, insetInlineStart:16, width:42, height:42, borderRadius:'50%', background:'rgba(255,255,255,0.12)', border:'1px solid rgba(255,255,255,0.28)', color:'#fff', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', backdropFilter:'blur(6px)' }}>
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
            <div onClick={e => e.stopPropagation()} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:14, maxWidth:'min(940px,94vw)', maxHeight:'90vh' }}>
              <img src={lightbox.url} alt={lightbox.caption} style={{ maxWidth:'100%', maxHeight:'82vh', objectFit:'contain', borderRadius:14, boxShadow:'0 24px 70px rgba(0,0,0,0.55)' }} />
              {lightbox.caption && (
                <div style={{ color:'rgba(255,255,255,0.86)', fontSize:14, fontWeight:600, textAlign:'center', maxWidth:640 }}>{lightbox.caption}</div>
              )}
            </div>
          </div>
        )}

        {/* ── Story Modal ── */}
        {openStory && referee.hasStory && (
          <ClubStoryModal
            club={{ name:referee.name, storyMediaUrl:referee.storyImage, storyType:'image', badge:'داور' }}
            onClose={() => setOpenStory(false)}
          />
        )}

      </div>
    </>
  )
}
