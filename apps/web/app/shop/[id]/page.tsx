'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

/* ─── Design Tokens ─── */
const BG     = '#07070A'
const CARD   = 'rgba(255,255,255,0.04)'
const CBOR   = 'rgba(255,255,255,0.07)'
const CBORHV = 'rgba(199,166,106,0.38)'
const GOLD   = '#C7A66A'
const GOLDB  = '#E4C688'
const GOLDD  = '#9A6E38'
const TEXT   = '#F2EFE9'
const TEXTD  = 'rgba(242,239,233,0.50)'
const TEXTM  = 'rgba(242,239,233,0.24)'
const GREEN  = '#25D366'

function toFa(v: string | number) { return String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d) }
function fmtN(n: number) { return n.toLocaleString('fa-IR') }

interface ShopProduct { id: number; name: string; category: string; price: number; old: number; disc: number; image: string }
interface Shop {
  id: string; name: string; tagline: string; city: string
  founded: number; rating: number; reviews: number
  verified: boolean; specialties: string[]
  bio: string; fullBio: string
  phone: string; whatsapp: string
  instagram?: string; telegram?: string
  cover: string; g1: string; g2: string
  products: ShopProduct[]
  gallery: string[]
}

const SHOPS: Record<string, Shop> = {
  '1': {
    id:'1', name:'چوب طلایی', tagline:'بهترین چوب‌های بیلیارد دنیا — مستقیم از منبع اصلی',
    city:'تهران', founded:1395, rating:4.8, reviews:342, verified:true,
    specialties:['چوب بیلیارد','شفت کربن','تیپ حرفه‌ای','جوینت','اکسسوری'],
    bio:'واردکننده رسمی Predator، Mezz و Kamui در ایران با گارانتی اصالت کالا',
    fullBio:'فروشگاه چوب طلایی از سال ۱۳۹۵ با هدف ارائه محصولات اصل به بازیکنان حرفه‌ای بیلیارد ایران فعالیت می‌کند. ما واردکننده رسمی Predator، Mezz، Kamui و بیش از ۱۵ برند معتبر دیگر هستیم. هر محصول با گارانتی اصالت کالا و پشتیبانی پس از فروش ارسال می‌شود.',
    phone:'09121110001', whatsapp:'989121110001', instagram:'golden_cue_shop',
    cover:'/images/shop/cue_billiard_2.jpg', g1:'#C7A66A', g2:'#7A4F1E',
    products:[
      {id:1,name:'چوب حرفه‌ای Predator 314³',category:'چوب بیلیارد',price:2800000,old:3300000,disc:15,image:'/images/shop/cue_billiard_2.jpg'},
      {id:7,name:'چوب کربن فایبر Mezz EC7-CF',category:'چوب بیلیارد',price:6500000,old:7100000,disc:8,image:'/images/shop/cue_billiard.jpg'},
    ],
    gallery:['/images/shop/cue_billiard_2.jpg','/images/shop/cue_billiard.jpg','/images/shop/accessori.png','/images/shop/pool_chalk_1.jpg','/images/shop/Ball-1.jpg','/images/shop/snooker-table.jpg'],
  },
  '2': {
    id:'2', name:'بیلیارد حرفه‌ای ایران', tagline:'تجهیز باشگاه‌ها با استانداردهای مسابقاتی جهانی',
    city:'تهران', founded:1388, rating:4.6, reviews:518, verified:true,
    specialties:['میز اسنوکر','میز پاکت','پارچه Simonis','نصب','تعمیر'],
    bio:'تأمین‌کننده رسمی میزهای مسابقاتی فدراسیون بیلیارد و ۲۰۰+ باشگاه در ایران',
    fullBio:'بیلیارد حرفه‌ای ایران از سال ۱۳۸۸ با تخصص در تأمین تجهیزات باشگاهی فعالیت دارد. ما تاکنون بیش از ۲۰۰ باشگاه در سراسر کشور را تجهیز کرده‌ایم و تأمین‌کننده رسمی میزهای مسابقاتی لیگ برتر ایران هستیم.',
    phone:'09351110002', whatsapp:'989351110002', telegram:'billiard_pro_iran',
    cover:'/images/shop/snooker-table.jpg', g1:'#1E3A8A', g2:'#0F172A',
    products:[
      {id:2,name:'میز اسنوکر Dynamo Tournament',category:'میز',price:45000000,old:50000000,disc:10,image:'/images/shop/snooker-table.jpg'},
      {id:11,name:'میز اسنوکر Pro-Line ۱۲ فوتی',category:'میز',price:68000000,old:75000000,disc:9,image:'/images/shop/snooker-table-2.jpg'},
    ],
    gallery:['/images/shop/snooker-table.jpg','/images/shop/snooker-table-2.jpg','/images/shop/Pro_table.jpg','/images/shop/Home_table.jpg','/images/shop/cue_billiard_2.jpg','/images/shop/Ball-1.jpg'],
  },
  '3': {
    id:'3', name:'فروشگاه توپ اصل', tagline:'توپ‌های اصل Aramith و Cyclop با گارانتی کارخانه',
    city:'مشهد', founded:1398, rating:4.7, reviews:215, verified:true,
    specialties:['توپ اسنوکر','توپ پاکت','توپ کارامبول','لوازم'],
    bio:'نماینده رسمی Aramith و Cyclop در ایران — سریال اصالت برای هر محصول',
    fullBio:'فروشگاه توپ اصل از سال ۱۳۹۸ به‌عنوان نماینده رسمی Aramith و Cyclop در ایران فعالیت دارد. تمامی محصولات دارای سریال اصالت از کارخانه اصلی هستند و با گارانتی یک‌ساله ارسال می‌شوند.',
    phone:'09011110003', whatsapp:'989011110003', instagram:'ball_asl',
    cover:'/images/shop/Ball-1.jpg', g1:'#7C3AED', g2:'#3B0764',
    products:[
      {id:3,name:'توپ Aramith Pro Cup WPBSA',category:'توپ',price:1200000,old:1500000,disc:20,image:'/images/shop/Ball-1.jpg'},
      {id:8,name:'توپ Cyclop Omega Pool Set',category:'توپ',price:950000,old:1120000,disc:15,image:'/images/shop/Ball.jpg'},
    ],
    gallery:['/images/shop/Ball-1.jpg','/images/shop/Ball.jpg','/images/shop/cue_billiard.jpg','/images/shop/pool_chalk_1.jpg','/images/shop/accessori.png','/images/shop/snooker-table.jpg'],
  },
  '4': {
    id:'4', name:'لوازم جانبی بیلیارد', tagline:'هر اکسسوری که برای بازی حرفه‌ای نیاز دارید',
    city:'تهران', founded:1400, rating:4.5, reviews:128, verified:false,
    specialties:['گچ','تیپ','رست','کیف','ابزار تعمیر'],
    bio:'بزرگ‌ترین انتخاب اکسسوری بیلیارد — ۵۰۰+ قلم کالا',
    fullBio:'لوازم جانبی بیلیارد با هدف فراهم کردن هر آنچه یک بازیکن نیاز دارد، از گچ تا کیف و رست، در یک مکان تأسیس شد. ما بیش از ۵۰۰ قلم کالا داریم و به سراسر کشور ارسال می‌کنیم.',
    phone:'09121110004', whatsapp:'989121110004',
    cover:'/images/shop/pool_chalk_1.jpg', g1:'#C2410C', g2:'#7C2D12',
    products:[
      {id:4,name:'گچ Master Blue Square ۱۴۴ عددی',category:'گچ',price:180000,old:260000,disc:31,image:'/images/shop/pool_chalk_1.jpg'},
      {id:10,name:'گچ Predator 1080 Pure ۵ عددی',category:'گچ',price:220000,old:245000,disc:10,image:'/images/shop/pool_chalk_2.jpg'},
    ],
    gallery:['/images/shop/pool_chalk_1.jpg','/images/shop/pool_chalk_2.jpg','/images/shop/accessori.png','/images/shop/cue_billiard.jpg','/images/shop/Ball-1.jpg','/images/shop/rest-pool.webp'],
  },
  '5': {
    id:'5', name:'اکسسوری پلاس', tagline:'رست، اکستنشن و کیف حرفه‌ای — متخصص تجهیزات کمکی',
    city:'اصفهان', founded:1399, rating:4.3, reviews:89, verified:true,
    specialties:['رست','اکستنشن','کیف چرم','ابزار تعمیر'],
    bio:'متخصص رست و تجهیزات کمکی بیلیارد در ایران',
    fullBio:'اکسسوری پلاس با تخصص در رست‌ها، اکستنشن‌ها و کیف‌های حرفه‌ای، یکی از معدود فروشگاه‌های متخصص این حوزه در ایران است. محصولات ما برای بازیکنانی طراحی شده که به جزئیات اهمیت می‌دهند.',
    phone:'09361110005', whatsapp:'989361110005',
    cover:'/images/shop/rest-pool.webp', g1:'#16A34A', g2:'#14532D',
    products:[
      {id:5,name:'رست اسنوکر حرفه‌ای پیچ استنلس',category:'رست',price:450000,old:480000,disc:6,image:'/images/shop/rest-pool.webp'},
      {id:6,name:'کیف چوب بیلیارد دو قسمتی چرم',category:'کیف',price:850000,old:970000,disc:12,image:'/images/shop/accessori.png'},
    ],
    gallery:['/images/shop/rest-pool.webp','/images/shop/accessori.png','/images/shop/pool_chalk_1.jpg','/images/shop/cue_billiard.jpg','/images/shop/Ball.jpg','/images/shop/snooker-table.jpg'],
  },
  '6': {
    id:'6', name:'میز ایران', tagline:'میزهای بیلیارد برای خانه و باشگاه — نصب رایگان در تهران',
    city:'تهران', founded:1393, rating:4.5, reviews:274, verified:true,
    specialties:['میز خانگی','میز باشگاهی','تعویض پارچه','نصب','تعمیر'],
    bio:'سازنده و واردکننده میزهای بیلیارد با بیش از یک دهه سابقه',
    fullBio:'میز ایران با سابقه‌ای بیش از یک دهه در تولید و واردات میزهای بیلیارد، یکی از معتبرترین فروشندگان میز در کشور است. هم میزهای خانگی با طراحی اسکاندیناوی و هم میزهای حرفه‌ای مسابقاتی را ارائه می‌دهیم.',
    phone:'09351110009', whatsapp:'989351110009', instagram:'miz_iran',
    cover:'/images/shop/Pro_table.jpg', g1:'#B45309', g2:'#78350F',
    products:[
      {id:9,name:'میز بیلیارد خانگی — پایه چوب ماسیو',category:'میز',price:18000000,old:19000000,disc:5,image:'/images/shop/Home_table.jpg'},
      {id:12,name:'میز بیلیارد حرفه‌ای پارچه ایتالیایی',category:'میز',price:32000000,old:36000000,disc:11,image:'/images/shop/Pro_table.jpg'},
    ],
    gallery:['/images/shop/Pro_table.jpg','/images/shop/Home_table.jpg','/images/shop/snooker-table.jpg','/images/shop/snooker-table-2.jpg','/images/shop/cue_billiard_2.jpg','/images/shop/Ball-1.jpg'],
  },
}

/* ─── Product Card ─── */
function ProductCard({ p }: { p: ShopProduct }) {
  const [hov, setHov] = useState(false)
  return (
    <Link href={`/shop/product/${p.id}`} style={{ textDecoration:'none', display:'block' }}>
      <div
        onMouseEnter={() => setHov(true)}
        onMouseLeave={() => setHov(false)}
        style={{
          background: hov ? 'rgba(255,255,255,0.065)' : CARD,
          border: `1px solid ${hov ? CBORHV : CBOR}`,
          borderRadius: 20, overflow:'hidden',
          boxShadow: hov
            ? `0 24px 60px rgba(0,0,0,0.50), 0 0 0 1px ${CBORHV}, 0 0 40px rgba(199,166,106,0.10)`
            : '0 4px 24px rgba(0,0,0,0.30)',
          transform: hov ? 'translateY(-8px) scale(1.015)' : 'none',
          transition: 'all 0.35s cubic-bezier(0.22,1,0.36,1)',
          cursor: 'pointer',
        }}>
        <div style={{ position:'relative', paddingTop:'80%', overflow:'hidden', background:'rgba(255,255,255,0.03)' }}>
          <img src={p.image} alt={p.name}
            style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover',
              transform: hov ? 'scale(1.08)' : 'scale(1)',
              transition: 'transform 0.55s cubic-bezier(0.22,1,0.36,1)',
              filter: hov ? 'brightness(1.05)' : 'brightness(0.92)',
            }} />
          {p.disc > 0 && (
            <div style={{ position:'absolute', top:12, right:12,
              background:'linear-gradient(135deg,#dc2626,#ea580c)',
              color:'#fff', fontSize:12, fontWeight:900,
              borderRadius:8, padding:'3px 9px',
              boxShadow:'0 4px 12px rgba(220,38,38,0.45)' }}>
              {toFa(p.disc)}٪
            </div>
          )}
          <div style={{ position:'absolute', inset:0,
            background:'linear-gradient(to top, rgba(7,7,10,0.65) 0%, transparent 55%)',
            opacity: hov ? 1 : 0.6, transition:'opacity 0.3s' }} />
        </div>
        <div style={{ padding:'16px 18px 20px' }}>
          <span style={{ fontSize:11, fontWeight:700, color:GOLD,
            background:'rgba(199,166,106,0.12)', border:`1px solid rgba(199,166,106,0.22)`,
            borderRadius:20, padding:'2px 10px', display:'inline-block', marginBottom:8 }}>
            {p.category}
          </span>
          <h3 style={{ fontSize:14, fontWeight:700, color:TEXT, lineHeight:1.5, margin:'0 0 14px',
            display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
            {p.name}
          </h3>
          <div style={{ display:'flex', alignItems:'baseline', gap:6 }}>
            {p.disc > 0 && (
              <span style={{ fontSize:12, color:TEXTM, textDecoration:'line-through' }}>
                {fmtN(p.old)}
              </span>
            )}
            <span style={{ fontSize:18, fontWeight:900, color:GOLD }}>{fmtN(p.price)}</span>
            <span style={{ fontSize:12, color:TEXTD }}>تومان</span>
          </div>
        </div>
      </div>
    </Link>
  )
}

/* ─── Stars ─── */
function Stars({ rating }: { rating: number }) {
  return (
    <div style={{ display:'flex', gap:3 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="13" height="13" viewBox="0 0 24 24"
          fill={i <= Math.round(rating) ? '#f59e0b' : 'none'} stroke="#f59e0b"
          strokeWidth={i <= Math.round(rating) ? 0 : 1.5}>
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </div>
  )
}

/* ─── Main Page ─── */
export default function ShopStorePage() {
  const params  = useParams()
  const rawId   = Array.isArray(params.id) ? params.id[0] : params.id
  const shop    = rawId ? SHOPS[rawId] : null

  const [lightImg,  setLightImg]  = useState<string|null>(null)
  const [lightIdx,  setLightIdx]  = useState(0)
  const [scrolled, setScrolled]   = useState(false)
  const [activeTab, setActiveTab] = useState<'products'|'about'|'gallery'>('products')
  const heroRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const openLight = (url: string, idx: number) => { setLightImg(url); setLightIdx(idx) }
  const lightNav  = (dir: 1|-1) => {
    if (!shop) return
    const next = (lightIdx + dir + shop.gallery.length) % shop.gallery.length
    setLightIdx(next); setLightImg(shop.gallery[next] ?? null)
  }

  if (!shop) return (
    <div style={{ minHeight:'100vh', background:BG, direction:'rtl',
      fontFamily:"'Vazirmatn',Tahoma,sans-serif", display:'flex',
      alignItems:'center', justifyContent:'center', color:TEXT }}>
      <div style={{ textAlign:'center' }}>
        <div style={{ fontSize:60, marginBottom:16, opacity:0.3 }}>🎱</div>
        <p style={{ fontSize:18, fontWeight:700, marginBottom:16 }}>فروشگاه پیدا نشد</p>
        <Link href="/shop" style={{ color:GOLD, fontWeight:700, fontSize:14 }}>← بازگشت به فروشگاه</Link>
      </div>
    </div>
  )

  const waLink = `https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(`سلام، از صفحه فروشگاه ${shop.name} در بیلیارد هاب با شما تماس می‌گیرم`)}`
  const yearsActive = 1403 - shop.founded

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes heroUp{from{opacity:0;transform:translateY(50px)}to{opacity:1;transform:translateY(0)}}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.88)}to{opacity:1;transform:scale(1)}}
        @keyframes floatBall{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-22px) rotate(8deg)}}
        @keyframes floatBall2{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-14px) rotate(-6deg)}}
        @keyframes shimmerGold{0%{background-position:-300% center}100%{background-position:300% center}}
        @keyframes pulseGlow{0%,100%{box-shadow:0 0 0 0 rgba(199,166,106,0.0),0 0 30px rgba(199,166,106,0.20)}50%{box-shadow:0 0 0 8px rgba(199,166,106,0.0),0 0 60px rgba(199,166,106,0.45)}}
        @keyframes borderPulse{0%,100%{border-color:rgba(199,166,106,0.30)}50%{border-color:rgba(199,166,106,0.70)}}
        @keyframes dotGrid{from{opacity:0}to{opacity:1}}
        @keyframes scanIn{from{transform:scaleX(0)}to{transform:scaleX(1)}}
        .gimg{transition:transform .45s cubic-bezier(.22,1,.36,1),filter .3s;}
        .gimg:hover{transform:scale(1.06);filter:brightness(1.08);}
        .tab-btn{transition:all .2s;cursor:pointer;}
        .social-btn{transition:all .18s;cursor:pointer;}
        .social-btn:hover{transform:translateY(-2px);filter:brightness(1.12);}
        @media(max-width:860px){.pgrid{grid-template-columns:1fr 1fr!important;}}
        @media(max-width:560px){.pgrid{grid-template-columns:1fr!important;}}
        @media(max-width:720px){.ggrid{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:460px){.ggrid{grid-template-columns:1fr!important;}}
        @media(max-width:700px){.infocols{flex-direction:column!important;}}
      `}</style>

      <div style={{ direction:'rtl', fontFamily:"'Vazirmatn',Tahoma,sans-serif",
        background:BG, minHeight:'100vh', color:TEXT, position:'relative' }}>

        {/* ══ Sticky Nav ══ */}
        <div style={{
          position:'fixed', top:0, left:0, right:0, zIndex:100,
          background: scrolled ? 'rgba(7,7,10,0.88)' : 'transparent',
          backdropFilter: scrolled ? 'blur(28px) saturate(180%)' : 'none',
          borderBottom: scrolled ? `1px solid ${CBOR}` : '1px solid transparent',
          transition:'all 0.35s ease',
          padding:'0 clamp(20px,5vw,64px)',
          display:'flex', alignItems:'center', justifyContent:'space-between', height:60,
        }}>
          <Link href="/shop" style={{
            display:'flex', alignItems:'center', gap:6,
            fontSize:13, fontWeight:700, color:TEXTD, textDecoration:'none',
            transition:'color .2s',
          }}
            onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={e => (e.currentTarget.style.color = TEXTD)}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="15 18 9 12 15 6"/>
            </svg>
            بیلیارد بازار
          </Link>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            {scrolled && (
              <span style={{ fontSize:15, fontWeight:800, color:TEXT, animation:'fadeIn .3s ease' }}>
                {shop.name}
              </span>
            )}
            {shop.verified && scrolled && (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="#2563EB" stroke="none">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
              </svg>
            )}
          </div>
          <a href={`tel:${shop.phone}`} style={{
            fontSize:12.5, fontWeight:700, color:GOLD,
            background:'rgba(199,166,106,0.10)', border:`1px solid rgba(199,166,106,0.28)`,
            borderRadius:100, padding:'7px 16px', textDecoration:'none',
            transition:'all .2s',
          }}
            onMouseEnter={e => { e.currentTarget.style.background='rgba(199,166,106,0.20)' }}
            onMouseLeave={e => { e.currentTarget.style.background='rgba(199,166,106,0.10)' }}>
            تماس با فروشگاه
          </a>
        </div>

        {/* ══ HERO ══ */}
        <div ref={heroRef} style={{ position:'relative', height:'100vh', minHeight:580, overflow:'hidden' }}>

          {/* Cover image */}
          <img src={shop.cover} alt="" style={{
            position:'absolute', inset:0, width:'100%', height:'100%',
            objectFit:'cover', filter:'blur(2px) saturate(0.55)', transform:'scale(1.06)',
          }} />

          {/* Dark overlay */}
          <div style={{ position:'absolute', inset:0, background:'rgba(7,7,10,0.82)' }} />

          {/* Dot grid texture */}
          <div style={{
            position:'absolute', inset:0,
            backgroundImage:'radial-gradient(circle, rgba(199,166,106,0.06) 1px, transparent 1px)',
            backgroundSize:'32px 32px', opacity:0.6,
          }} />

          {/* Gradient accent — top right */}
          <div style={{
            position:'absolute', top:-120, right:-80, width:600, height:600,
            background:`radial-gradient(circle at center, ${shop.g1}20 0%, transparent 65%)`,
            filter:'blur(60px)', pointerEvents:'none',
          }} />
          <div style={{
            position:'absolute', bottom:-80, left:-60, width:400, height:400,
            background:`radial-gradient(circle at center, ${shop.g2}18 0%, transparent 65%)`,
            filter:'blur(50px)', pointerEvents:'none',
          }} />

          {/* Decorative floating balls */}
          <div style={{
            position:'absolute', top:'22%', left:'8%', width:44, height:44, borderRadius:'50%',
            background:`linear-gradient(135deg,${shop.g1},${shop.g2})`,
            opacity:0.22, animation:'floatBall 6s ease-in-out infinite',
            boxShadow:`0 0 24px ${shop.g1}44`,
          }} />
          <div style={{
            position:'absolute', top:'60%', right:'6%', width:28, height:28, borderRadius:'50%',
            background:`linear-gradient(135deg,${GOLD},${GOLDD})`,
            opacity:0.18, animation:'floatBall2 8s ease-in-out infinite 1s',
          }} />
          <div style={{
            position:'absolute', top:'35%', left:'18%', width:18, height:18, borderRadius:'50%',
            background:'rgba(255,255,255,0.08)', animation:'floatBall 10s ease-in-out infinite 2s',
          }} />

          {/* Hero content */}
          <div style={{
            position:'absolute', inset:0, display:'flex', flexDirection:'column',
            alignItems:'center', justifyContent:'center',
            padding:'80px clamp(24px,5vw,80px) 60px',
          }}>
            {/* Shop avatar */}
            <div style={{
              width:96, height:96, borderRadius:'50%',
              background:`linear-gradient(135deg,${shop.g1},${shop.g2})`,
              display:'flex', alignItems:'center', justifyContent:'center',
              fontSize:38, fontWeight:900, color:'rgba(255,255,255,0.92)',
              animation:'heroUp .5s ease both, pulseGlow 3s ease-in-out 1s infinite',
              border:`2px solid ${shop.g1}55`,
              marginBottom:28,
            }}>
              {shop.name[0]}
            </div>

            {/* Verified badge */}
            {shop.verified && (
              <div style={{
                display:'flex', alignItems:'center', gap:5, marginBottom:12,
                background:'rgba(37,99,235,0.15)', border:'1px solid rgba(37,99,235,0.30)',
                borderRadius:100, padding:'4px 12px',
                animation:'heroUp .5s .05s ease both',
              }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="#60A5FA" stroke="none">
                  <path d="M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0z"/>
                </svg>
                <span style={{ fontSize:11, fontWeight:700, color:'#93C5FD', letterSpacing:'0.06em' }}>
                  فروشگاه تأیید شده
                </span>
              </div>
            )}

            {/* Shop name — shimmer gold */}
            <h1 style={{
              fontSize:'clamp(40px,7vw,80px)', fontWeight:900, color:TEXT,
              letterSpacing:'-0.04em', lineHeight:1.1, textAlign:'center',
              margin:'0 0 14px',
              animation:'heroUp .6s .1s ease both',
              textShadow:'0 2px 40px rgba(0,0,0,0.60)',
            }}>
              {shop.name}
            </h1>

            {/* Tagline */}
            <p style={{
              fontSize:'clamp(13px,1.6vw,17px)', color:TEXTD, fontWeight:500,
              textAlign:'center', maxWidth:520, lineHeight:1.7,
              animation:'heroUp .6s .18s ease both',
              marginBottom:28,
            }}>
              {shop.tagline}
            </p>

            {/* Divider line */}
            <div style={{
              width:60, height:2,
              background:`linear-gradient(90deg,transparent,${GOLD},transparent)`,
              marginBottom:24, borderRadius:2,
              animation:'scanIn .8s .3s ease both',
            }} />

            {/* Quick stats row */}
            <div style={{
              display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center',
              animation:'heroUp .6s .28s ease both',
            }}>
              {[
                { icon:'⭐', val:`${shop.rating}`, label:`از ${toFa(shop.reviews)} نظر` },
                { icon:'📍', val:shop.city, label:'موقعیت' },
                { icon:'🏪', val:`از ${toFa(shop.founded)}`, label:'سال تأسیس' },
                { icon:'📦', val:toFa(shop.products.length * 47), label:'محصول فعال' },
              ].map((s, i) => (
                <div key={i} style={{
                  display:'flex', alignItems:'center', gap:8,
                  background:'rgba(255,255,255,0.06)',
                  border:`1px solid ${CBOR}`,
                  borderRadius:100, padding:'8px 16px',
                  backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                }}>
                  <span style={{ fontSize:14 }}>{s.icon}</span>
                  <div>
                    <div style={{ fontSize:13.5, fontWeight:800, color:TEXT, lineHeight:1 }}>{s.val}</div>
                    <div style={{ fontSize:10.5, color:TEXTM, marginTop:1 }}>{s.label}</div>
                  </div>
                </div>
              ))}
            </div>

            {/* CTA buttons */}
            <div style={{
              display:'flex', gap:10, marginTop:32, flexWrap:'wrap', justifyContent:'center',
              animation:'heroUp .6s .36s ease both',
            }}>
              <a href={`tel:${shop.phone}`} style={{
                display:'inline-flex', alignItems:'center', gap:8,
                background:`linear-gradient(135deg,${GOLD},${GOLDD})`,
                color:'#0D0C09', fontSize:14, fontWeight:800, borderRadius:14,
                padding:'13px 26px', textDecoration:'none',
                boxShadow:`0 8px 32px rgba(199,166,106,0.38), inset 0 1px 0 rgba(255,255,255,0.28)`,
                transition:'all .22s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-2px)'; e.currentTarget.style.boxShadow=`0 14px 40px rgba(199,166,106,0.50), inset 0 1px 0 rgba(255,255,255,0.28)` }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=`0 8px 32px rgba(199,166,106,0.38), inset 0 1px 0 rgba(255,255,255,0.28)` }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                تماس با فروشگاه
              </a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                display:'inline-flex', alignItems:'center', gap:8,
                background:'rgba(37,211,102,0.14)', border:'1px solid rgba(37,211,102,0.35)',
                color:GREEN, fontSize:14, fontWeight:800, borderRadius:14,
                padding:'13px 26px', textDecoration:'none',
                backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                boxShadow:'0 4px 20px rgba(37,211,102,0.15)',
                transition:'all .22s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(37,211,102,0.22)'; e.currentTarget.style.transform='translateY(-2px)' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(37,211,102,0.14)'; e.currentTarget.style.transform='none' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                واتساپ
              </a>
            </div>
          </div>

          {/* Scroll hint */}
          <div style={{
            position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)',
            display:'flex', flexDirection:'column', alignItems:'center', gap:6,
            animation:'heroUp .6s .55s ease both',
            opacity:0.45,
          }}>
            <span style={{ fontSize:11, color:TEXTD, fontWeight:600, letterSpacing:'0.1em' }}>اسکرول کنید</span>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={TEXTD} strokeWidth="2" strokeLinecap="round">
              <polyline points="6 9 12 15 18 9"/>
            </svg>
          </div>
        </div>

        {/* ══ IDENTITY STATS BAR ══ */}
        <div style={{
          background:'rgba(255,255,255,0.025)',
          borderTop:`1px solid ${CBOR}`,
          borderBottom:`1px solid ${CBOR}`,
          padding:'0 clamp(24px,5vw,80px)',
        }}>
          <div className="infocols" style={{
            display:'flex', alignItems:'stretch',
            maxWidth:1200, margin:'0 auto',
          }}>
            {[
              { n: toFa(yearsActive), label:'سال سابقه', sub:'در بیلیارد ایران' },
              { n: `${shop.rating}`, label:'امتیاز میانگین', sub:`از ${toFa(shop.reviews)} خریدار` },
              { n: toFa(shop.products.length * 47), label:'محصول فعال', sub:'آماده ارسال' },
              { n: shop.city, label:'شهر فروشگاه', sub:`تحویل سراسری` },
            ].map((item, i) => (
              <div key={i} style={{
                flex:1, padding:'28px 20px',
                borderLeft: i < 3 ? `1px solid ${CBOR}` : 'none',
                display:'flex', flexDirection:'column', alignItems:'center', gap:4,
              }}>
                <span style={{
                  fontSize:'clamp(26px,3vw,40px)', fontWeight:900,
                  background:`linear-gradient(135deg,${GOLDB},${GOLD})`,
                  WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                  backgroundClip:'text', lineHeight:1.1,
                }}>
                  {item.n}
                </span>
                <span style={{ fontSize:13, fontWeight:700, color:TEXT }}>{item.label}</span>
                <span style={{ fontSize:11, color:TEXTM }}>{item.sub}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ TAB NAVIGATION ══ */}
        <div style={{
          position:'sticky', top:60, zIndex:90,
          background:'rgba(7,7,10,0.92)', backdropFilter:'blur(28px)', WebkitBackdropFilter:'blur(28px)',
          borderBottom:`1px solid ${CBOR}`,
          padding:'0 clamp(24px,5vw,80px)',
        }}>
          <div style={{ maxWidth:1200, margin:'0 auto', display:'flex', gap:0 }}>
            {([
              { k:'products', label:'محصولات' },
              { k:'about',    label:'درباره فروشگاه' },
              { k:'gallery',  label:'گالری' },
            ] as {k:'products'|'about'|'gallery';label:string}[]).map(tab => (
              <button key={tab.k} className="tab-btn" onClick={() => setActiveTab(tab.k)} style={{
                background:'none', border:'none', padding:'18px 24px',
                fontSize:14, fontWeight:700, color: activeTab===tab.k ? GOLD : TEXTD,
                borderBottom: `2px solid ${activeTab===tab.k ? GOLD : 'transparent'}`,
                transition:'color .2s, border-color .2s',
                fontFamily:"'Vazirmatn',Tahoma,sans-serif",
                cursor:'pointer',
              }}>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ══ TAB CONTENT ══ */}
        <div style={{ maxWidth:1200, margin:'0 auto', padding:'52px clamp(24px,5vw,80px) 80px' }}>

          {/* ── Products ── */}
          {activeTab === 'products' && (
            <div style={{ animation:'fadeIn .35s ease both' }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:32 }}>
                <h2 style={{ fontSize:'clamp(22px,2.5vw,30px)', fontWeight:900, color:TEXT, letterSpacing:'-0.03em' }}>
                  محصولات فروشگاه
                </h2>
                <span style={{ fontSize:13, color:TEXTM }}>
                  {toFa(shop.products.length * 47)} کالای فعال
                </span>
              </div>
              <div className="pgrid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:20, marginBottom:40 }}>
                {shop.products.map(p => <ProductCard key={p.id} p={p} />)}
              </div>

              {/* Specialties */}
              <div style={{
                background:CARD, border:`1px solid ${CBOR}`,
                borderRadius:20, padding:'28px 32px',
              }}>
                <h3 style={{ fontSize:15, fontWeight:800, color:TEXT, marginBottom:16 }}>تخصص‌های فروشگاه</h3>
                <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                  {shop.specialties.map(s => (
                    <span key={s} style={{
                      fontSize:13, fontWeight:700, color:GOLD,
                      background:'rgba(199,166,106,0.10)',
                      border:`1px solid rgba(199,166,106,0.24)`,
                      borderRadius:100, padding:'7px 18px',
                    }}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── About ── */}
          {activeTab === 'about' && (
            <div style={{ animation:'fadeIn .35s ease both', display:'grid', gridTemplateColumns:'1fr 380px', gap:24, alignItems:'start' }}>

              {/* Story card */}
              <div>
                <div style={{
                  background:CARD, border:`1px solid ${CBOR}`,
                  borderRadius:20, padding:'32px 36px', marginBottom:20,
                }}>
                  <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:20 }}>
                    <div style={{
                      width:4, height:28, borderRadius:2,
                      background:`linear-gradient(180deg,${GOLD},${GOLDD})`,
                    }} />
                    <h2 style={{ fontSize:'clamp(19px,2.2vw,24px)', fontWeight:900, color:TEXT, letterSpacing:'-0.03em' }}>
                      داستان {shop.name}
                    </h2>
                  </div>
                  <p style={{ fontSize:15, color:TEXTD, lineHeight:1.9, marginBottom:20 }}>
                    {shop.fullBio}
                  </p>
                  <p style={{ fontSize:13.5, color:TEXTM, fontStyle:'italic', borderRight:`2px solid ${GOLD}40`, paddingRight:14 }}>
                    {shop.bio}
                  </p>
                </div>

                {/* Specialties grid */}
                <div style={{ background:CARD, border:`1px solid ${CBOR}`, borderRadius:20, padding:'28px 32px' }}>
                  <h3 style={{ fontSize:15, fontWeight:800, color:TEXT, marginBottom:18 }}>حوزه‌های تخصصی</h3>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
                    {shop.specialties.map((s, i) => (
                      <div key={i} style={{
                        display:'flex', alignItems:'center', gap:10,
                        background:'rgba(255,255,255,0.03)', border:`1px solid ${CBOR}`,
                        borderRadius:12, padding:'12px 16px',
                      }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:GOLD, flexShrink:0,
                          boxShadow:`0 0 8px ${GOLD}80` }} />
                        <span style={{ fontSize:13.5, color:TEXT, fontWeight:600 }}>{s}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar */}
              <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

                {/* Quick info */}
                <div style={{ background:CARD, border:`1px solid ${CBOR}`, borderRadius:20, padding:'24px' }}>
                  <h3 style={{ fontSize:14, fontWeight:800, color:TEXT, marginBottom:16 }}>اطلاعات فروشگاه</h3>
                  {[
                    { label:'شهر', val:shop.city },
                    { label:'سال تأسیس', val:toFa(shop.founded) },
                    { label:'امتیاز', val:`${shop.rating} از ۵` },
                    { label:'نظرات', val:`${toFa(shop.reviews)} خریدار` },
                    { label:'وضعیت', val: shop.verified ? 'تأیید شده ✓' : 'در حال بررسی' },
                  ].map((row, i) => (
                    <div key={i} style={{
                      display:'flex', justifyContent:'space-between', alignItems:'center',
                      padding:'10px 0',
                      borderBottom: i < 4 ? `1px solid ${CBOR}` : 'none',
                    }}>
                      <span style={{ fontSize:13, color:TEXTM }}>{row.label}</span>
                      <span style={{ fontSize:13, fontWeight:700, color: row.label==='وضعیت' && shop.verified ? '#60A5FA' : TEXT }}>
                        {row.val}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Rating visual */}
                <div style={{ background:CARD, border:`1px solid ${CBOR}`, borderRadius:20, padding:'24px' }}>
                  <h3 style={{ fontSize:14, fontWeight:800, color:TEXT, marginBottom:16 }}>رتبه‌بندی</h3>
                  <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:14 }}>
                    <span style={{
                      fontSize:48, fontWeight:900,
                      background:`linear-gradient(135deg,${GOLDB},${GOLD})`,
                      WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent',
                      backgroundClip:'text', lineHeight:1,
                    }}>{shop.rating}</span>
                    <div>
                      <Stars rating={shop.rating} />
                      <p style={{ fontSize:12, color:TEXTM, marginTop:6 }}>{toFa(shop.reviews)} نظر ثبت‌شده</p>
                    </div>
                  </div>
                  {[5,4,3,2,1].map(star => {
                    const pct = star === 5 ? 64 : star === 4 ? 24 : star === 3 ? 8 : star === 2 ? 3 : 1
                    return (
                      <div key={star} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                        <span style={{ fontSize:11, color:TEXTM, width:8 }}>{star}</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="#f59e0b" stroke="none">
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <div style={{ flex:1, height:5, borderRadius:3, background:'rgba(255,255,255,0.07)', overflow:'hidden' }}>
                          <div style={{ width:`${pct}%`, height:'100%', background:`linear-gradient(90deg,${GOLD},${GOLDB})`, borderRadius:3 }} />
                        </div>
                        <span style={{ fontSize:11, color:TEXTM, width:24, textAlign:'left' }}>{toFa(pct)}٪</span>
                      </div>
                    )
                  })}
                </div>

                {/* Social links */}
                {(shop.instagram || shop.telegram) && (
                  <div style={{ background:CARD, border:`1px solid ${CBOR}`, borderRadius:20, padding:'24px' }}>
                    <h3 style={{ fontSize:14, fontWeight:800, color:TEXT, marginBottom:14 }}>شبکه‌های اجتماعی</h3>
                    <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                      {shop.instagram && (
                        <a href={`https://instagram.com/${shop.instagram}`} target="_blank" rel="noopener noreferrer"
                          className="social-btn" style={{
                            display:'flex', alignItems:'center', gap:10,
                            background:'rgba(124,58,237,0.10)', border:'1px solid rgba(124,58,237,0.24)',
                            borderRadius:12, padding:'11px 16px', textDecoration:'none',
                            color:'#C4B5FD', fontWeight:700, fontSize:13,
                          }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="2" y="2" width="20" height="20" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                            <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                          </svg>
                          @{shop.instagram}
                        </a>
                      )}
                      {shop.telegram && (
                        <a href={`https://t.me/${shop.telegram}`} target="_blank" rel="noopener noreferrer"
                          className="social-btn" style={{
                            display:'flex', alignItems:'center', gap:10,
                            background:'rgba(8,145,178,0.10)', border:'1px solid rgba(8,145,178,0.24)',
                            borderRadius:12, padding:'11px 16px', textDecoration:'none',
                            color:'#67E8F9', fontWeight:700, fontSize:13,
                          }}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                          </svg>
                          @{shop.telegram}
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Gallery ── */}
          {activeTab === 'gallery' && (
            <div style={{ animation:'fadeIn .35s ease both' }}>
              <div style={{ display:'flex', alignItems:'baseline', gap:12, marginBottom:32 }}>
                <h2 style={{ fontSize:'clamp(22px,2.5vw,30px)', fontWeight:900, color:TEXT, letterSpacing:'-0.03em' }}>
                  آلبوم فروشگاه
                </h2>
                <span style={{ fontSize:13, color:TEXTM }}>{toFa(shop.gallery.length)} تصویر</span>
              </div>
              <div className="ggrid" style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
                {shop.gallery.map((url, i) => (
                  <div key={i} onClick={() => openLight(url, i)}
                    style={{
                      borderRadius:16, overflow:'hidden', cursor:'zoom-in',
                      border:`1px solid ${CBOR}`,
                      aspectRatio: i === 0 ? '16/9' : i === 3 ? '16/9' : '4/3',
                      gridColumn: (i === 0 || i === 3) ? 'span 2' : undefined,
                      position:'relative',
                      boxShadow:'0 4px 20px rgba(0,0,0,0.40)',
                    }}>
                    <img src={url} alt="" className="gimg"
                      style={{ width:'100%', height:'100%', objectFit:'cover', display:'block', filter:'brightness(0.88)' }} />
                    <div style={{
                      position:'absolute', inset:0,
                      background:'linear-gradient(to top, rgba(7,7,10,0.45) 0%, transparent 50%)',
                      pointerEvents:'none',
                    }} />
                    <div style={{
                      position:'absolute', bottom:12, right:12,
                      width:32, height:32, borderRadius:'50%',
                      background:'rgba(7,7,10,0.60)', backdropFilter:'blur(8px)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                    }}>
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2.2">
                        <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                        <line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/>
                      </svg>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ══ CONTACT CTA SECTION ══ */}
        <div style={{
          background:`linear-gradient(135deg, rgba(199,166,106,0.08) 0%, rgba(7,7,10,0) 60%)`,
          borderTop:`1px solid rgba(199,166,106,0.14)`,
          padding:'64px clamp(24px,5vw,80px)',
        }}>
          <div style={{ maxWidth:900, margin:'0 auto', textAlign:'center' }}>
            <div style={{ display:'inline-flex', alignItems:'center', gap:8, marginBottom:16,
              background:'rgba(199,166,106,0.10)', border:`1px solid rgba(199,166,106,0.22)`,
              borderRadius:100, padding:'5px 16px' }}>
              <span style={{ fontSize:11.5, fontWeight:700, color:GOLD, letterSpacing:'0.12em' }}>
                ارتباط مستقیم با فروشگاه
              </span>
            </div>
            <h2 style={{ fontSize:'clamp(26px,3.5vw,44px)', fontWeight:900, color:TEXT,
              letterSpacing:'-0.04em', marginBottom:12 }}>
              آماده خریدید؟
            </h2>
            <p style={{ fontSize:15, color:TEXTD, marginBottom:36, maxWidth:480, margin:'0 auto 36px', lineHeight:1.7 }}>
              تیم {shop.name} آماده مشاوره و پاسخگویی به سوالات شماست
            </p>

            <div style={{ display:'flex', gap:14, justifyContent:'center', flexWrap:'wrap' }}>
              <a href={`tel:${shop.phone}`} style={{
                display:'inline-flex', alignItems:'center', gap:9,
                background:`linear-gradient(135deg,${GOLD},${GOLDD})`,
                color:'#0A0909', fontSize:15, fontWeight:800, borderRadius:16,
                padding:'16px 32px', textDecoration:'none',
                boxShadow:`0 10px 40px rgba(199,166,106,0.35), inset 0 1px 0 rgba(255,255,255,0.25)`,
                transition:'all .25s',
              }}
                onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 18px 50px rgba(199,166,106,0.50), inset 0 1px 0 rgba(255,255,255,0.25)` }}
                onMouseLeave={e => { e.currentTarget.style.transform='none'; e.currentTarget.style.boxShadow=`0 10px 40px rgba(199,166,106,0.35), inset 0 1px 0 rgba(255,255,255,0.25)` }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.47-1.47a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
                </svg>
                {shop.phone}
              </a>
              <a href={waLink} target="_blank" rel="noopener noreferrer" style={{
                display:'inline-flex', alignItems:'center', gap:9,
                background:'rgba(37,211,102,0.12)', border:'1px solid rgba(37,211,102,0.32)',
                color:GREEN, fontSize:15, fontWeight:800, borderRadius:16,
                padding:'16px 32px', textDecoration:'none',
                backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)',
                transition:'all .25s',
              }}
                onMouseEnter={e => { e.currentTarget.style.background='rgba(37,211,102,0.22)'; e.currentTarget.style.transform='translateY(-3px)' }}
                onMouseLeave={e => { e.currentTarget.style.background='rgba(37,211,102,0.12)'; e.currentTarget.style.transform='none' }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                </svg>
                واتساپ
              </a>
              {shop.instagram && (
                <a href={`https://instagram.com/${shop.instagram}`} target="_blank" rel="noopener noreferrer" style={{
                  display:'inline-flex', alignItems:'center', gap:9,
                  background:'rgba(124,58,237,0.10)', border:'1px solid rgba(124,58,237,0.28)',
                  color:'#C4B5FD', fontSize:15, fontWeight:800, borderRadius:16,
                  padding:'16px 28px', textDecoration:'none',
                  transition:'all .25s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(124,58,237,0.20)'; e.currentTarget.style.transform='translateY(-3px)' }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(124,58,237,0.10)'; e.currentTarget.style.transform='none' }}>
                  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="2" width="20" height="20" rx="5"/>
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                  </svg>
                  اینستاگرام
                </a>
              )}
            </div>
          </div>
        </div>

        {/* ══ Footer nav ══ */}
        <div style={{
          borderTop:`1px solid ${CBOR}`,
          padding:'20px clamp(24px,5vw,80px)',
          display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:12,
        }}>
          <Link href="/shop" style={{ fontSize:13, color:TEXTM, textDecoration:'none', display:'flex', alignItems:'center', gap:5, transition:'color .2s' }}
            onMouseEnter={e => (e.currentTarget.style.color = GOLD)}
            onMouseLeave={e => (e.currentTarget.style.color = TEXTM)}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="15 18 9 12 15 6"/></svg>
            بازگشت به بیلیارد بازار
          </Link>
          <span style={{ fontSize:12, color:TEXTM }}>بیلیارد هاب · {shop.name}</span>
        </div>
      </div>

      {/* ══ Lightbox ══ */}
      {lightImg && (
        <div onClick={() => setLightImg(null)} style={{
          position:'fixed', inset:0, zIndex:9999,
          background:'rgba(0,0,0,0.96)', backdropFilter:'blur(24px)',
          display:'flex', alignItems:'center', justifyContent:'center',
          cursor:'zoom-out', animation:'fadeIn .2s ease',
        }}>
          <img src={lightImg} alt="" onClick={e => e.stopPropagation()}
            style={{ maxWidth:'90vw', maxHeight:'88vh', objectFit:'contain',
              borderRadius:16, boxShadow:'0 40px 100px rgba(0,0,0,0.8)',
              animation:'scaleIn .28s cubic-bezier(.22,1,.36,1)', cursor:'default' }} />

          {/* Close */}
          <button onClick={() => setLightImg(null)} style={{
            position:'absolute', top:20, left:20, width:44, height:44, borderRadius:'50%',
            background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)',
            backdropFilter:'blur(20px)', cursor:'pointer', color:'#fff', fontSize:20,
            display:'flex', alignItems:'center', justifyContent:'center',
          }}>×</button>

          {/* Nav */}
          {shop.gallery.length > 1 && (
            <>
              <button onClick={e => { e.stopPropagation(); lightNav(1) }} style={{
                position:'absolute', right:20, top:'50%', transform:'translateY(-50%)',
                width:48, height:48, borderRadius:'50%',
                background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)',
                backdropFilter:'blur(20px)', cursor:'pointer', color:'#fff', fontSize:24,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>‹</button>
              <button onClick={e => { e.stopPropagation(); lightNav(-1) }} style={{
                position:'absolute', left:20, top:'50%', transform:'translateY(-50%)',
                width:48, height:48, borderRadius:'50%',
                background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.14)',
                backdropFilter:'blur(20px)', cursor:'pointer', color:'#fff', fontSize:24,
                display:'flex', alignItems:'center', justifyContent:'center',
              }}>›</button>
            </>
          )}

          {/* Counter */}
          <div style={{
            position:'absolute', bottom:24, left:'50%', transform:'translateX(-50%)',
            background:'rgba(0,0,0,0.55)', backdropFilter:'blur(12px)',
            borderRadius:100, padding:'5px 16px',
            fontSize:12.5, color:'rgba(255,255,255,0.65)', fontWeight:600,
          }}>
            {toFa(lightIdx + 1)} / {toFa(shop.gallery.length)}
          </div>
        </div>
      )}
    </>
  )
}
