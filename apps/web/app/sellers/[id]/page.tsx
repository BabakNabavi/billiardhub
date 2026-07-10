'use client'
import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

const SHAMSI_YEAR = 1405
const BG     = '#F6F4F0'
const WHITE  = '#FFFFFF'
const TEXT   = '#111110'
const TEXT_S = 'rgba(17,17,16,0.52)'
const TEXT_M = 'rgba(17,17,16,0.25)'
const BORDER = 'rgba(17,17,16,0.09)'

const toFa = (v: string | number) =>
  String(v).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[+d] ?? d)

interface SP { id:string; img:string; name:string; category:string; price:number; old:number; disc:number }
interface Seller {
  id:string; name:string; verified:boolean; elite:boolean
  bannerImg:string; tagline:string; about:string
  since:string; sinceYear:number; city:string
  rating:number; reviewCount:number; productCount:number; totalSales:number
  responseTime:string; brands:string[]; specialties:string[]
  phone:string; whatsapp:string; instagram:string
  address:string; workHours:string
  g1:string; g2:string; products:SP[]
}

const SELLERS: Record<string, Seller> = {
  '1': {
    id:'1', name:'آریا بیلیارد', verified:true, elite:true,
    bannerImg:'/images/shop/snooker-table.jpg',
    tagline:'نماینده رسمی Predator، Riley و Aramith در ایران',
    about:'آریا بیلیارد از سال ۱۳۸۵ به عنوان یکی از معتبرترین مراکز تخصصی تجهیزات بیلیارد در تهران فعالیت می‌کند. با ارائه محصولات اصل و دارای ضمانت، همراه بازیکنان آماتور تا حرفه‌ای هستیم.',
    since:'از ۱۳۸۵', sinceYear:1385, city:'تهران',
    rating:4.8, reviewCount:312, productCount:247, totalSales:1850,
    responseTime:'کمتر از ۲ ساعت',
    brands:['Predator','Riley','Aramith','Longoni','Mezz','Peradon'],
    specialties:['کیو حرفه‌ای','میز اسنوکر','توپ','چراغ'],
    phone:'021-44123456', whatsapp:'09121234567', instagram:'aria.billiard',
    address:'تهران، پونک، خیابان اشرفی اصفهانی، پلاک ۸۴',
    workHours:'شنبه تا پنجشنبه ۱۰–۲۱، جمعه ۱۴–۲۰',
    g1:'#C9A96E', g2:'#7A4F1E',
    products:[
      { id:'p1', img:'/images/shop/snooker-table.jpg', name:'کیو حرفه‌ای Predator REVO',   category:'کیو',    price:8500000,  old:9200000, disc:8  },
      { id:'p2', img:'/images/shop/Pro_table.jpg',     name:'میز اسنوکر Riley Tournament', category:'میز',   price:42000000, old:0,       disc:0  },
      { id:'p3', img:'/images/shop/snooker-table.jpg', name:'ست توپ Aramith Premier',      category:'توپ',   price:3200000,  old:3600000, disc:11 },
      { id:'p4', img:'/images/shop/Pro_table.jpg',     name:'چراغ تخصصی Longoni LED',      category:'لوازم', price:1800000,  old:0,       disc:0  },
      { id:'p5', img:'/images/shop/snooker-table.jpg', name:'کیو Mezz EC7-SW',             category:'کیو',    price:5600000,  old:6000000, disc:7  },
      { id:'p6', img:'/images/shop/Pro_table.jpg',     name:'گچ Master – ۱۴۴ عدد',         category:'لوازم', price:420000,   old:0,       disc:0  },
      { id:'p7', img:'/images/shop/snooker-table.jpg', name:'کیف کیو Predator Urbain',     category:'لوازم', price:1250000,  old:1400000, disc:11 },
      { id:'p8', img:'/images/shop/Pro_table.jpg',     name:'روکش میز کاشمیر Hainsworth',  category:'لوازم', price:2800000,  old:0,       disc:0  },
    ],
  },
  '2': {
    id:'2', name:'بیلیارد سنتر', verified:true, elite:false,
    bannerImg:'/images/shop/Pro_table.jpg',
    tagline:'بزرگترین نمایندگی تجهیزات بیلیارد در غرب تهران',
    about:'بیلیارد سنتر با بیش از یک دهه تجربه، مرجع تخصصی خرید، تعمیر و نگهداری تجهیزات بیلیارد در منطقه غرب تهران است. تیم متخصص ما آماده ارائه مشاوره رایگان است.',
    since:'از ۱۳۹۰', sinceYear:1390, city:'تهران، اکباتان',
    rating:4.6, reviewCount:189, productCount:183, totalSales:1120,
    responseTime:'کمتر از ۳ ساعت',
    brands:['Riley','Aramith','BCE','Peradon','Tiger'],
    specialties:['میز پول','اسنوکر','تعمیرات','نصب'],
    phone:'021-88997766', whatsapp:'09361234567', instagram:'billiard.center',
    address:'تهران، اکباتان، فاز ۳، بلوار پیام‌نور، پلاک ۱۲',
    workHours:'شنبه تا چهارشنبه ۱۰–۲۰، پنجشنبه ۱۰–۱۸',
    g1:'#2563EB', g2:'#1E3A8A',
    products:[
      { id:'p1', img:'/images/shop/Pro_table.jpg',     name:'میز پول BCE Heritage ۷ft', category:'میز',   price:28000000, old:0,      disc:0  },
      { id:'p2', img:'/images/shop/snooker-table.jpg', name:'ست توپ Aramith Club',       category:'توپ',   price:1850000,  old:2100000,disc:12 },
      { id:'p3', img:'/images/shop/Pro_table.jpg',     name:'کیو Riley Aristocrat ۳',    category:'کیو',    price:3400000,  old:0,      disc:0  },
      { id:'p4', img:'/images/shop/snooker-table.jpg', name:'تراز لیزری میز بیلیارد',    category:'لوازم', price:850000,   old:980000, disc:13 },
    ],
  },
}

const RACK: [number,number][] = [
  [490,50],[442,133],[538,133],[394,216],[490,216],[586,216],
  [346,299],[442,299],[538,299],[634,299],
  [298,382],[394,382],[490,382],[586,382],[682,382],
]
const RACK_C = [
  '#C7A66A','#DC2626','#7C3AED','#DC2626','#C7A66A','#DC2626',
  '#C7A66A','#DC2626','#C7A66A','#DC2626',
  '#7C3AED','#DC2626','#C7A66A','#DC2626','#C7A66A',
]

function Stars({ r, A }: { r:number; A:string }) {
  return (
    <span style={{ display:'inline-flex', gap:1.5 }}>
      {[1,2,3,4,5].map(i => (
        <svg key={i} width="9" height="9" viewBox="0 0 24 24"
          fill={i <= Math.round(r) ? A : 'none'}
          stroke={i <= Math.round(r) ? 'none' : `${A}44`} strokeWidth="1.5">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>
      ))}
    </span>
  )
}

export default function SellerPage() {
  const { id } = useParams<{ id:string }>()
  const seller  = SELLERS[id ?? '']
  const A  = seller?.g1 ?? '#C9A96E'
  const A2 = seller?.g2 ?? '#7A4F1E'
  const AG = `linear-gradient(135deg,${A2} 0%,${A} 60%,${A2}99 100%)`

  const [activeCategory, setActiveCategory] = useState('همه')
  const counterRefs = useRef<(HTMLSpanElement | null)[]>([])

  useEffect(() => {
    const io = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target) } }),
      { threshold:0.10, rootMargin:'0px 0px -48px 0px' }
    )
    document.querySelectorAll('[data-rv]').forEach(el => io.observe(el))
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!seller) return
    const yearsActive = SHAMSI_YEAR - seller.sinceYear
    const targets = [seller.productCount, yearsActive, seller.totalSales, seller.reviewCount]
    const io = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return
        io.unobserve(entry.target)
        const idx = Number(entry.target.getAttribute('data-ci'))
        const target = targets[idx] ?? 0
        const start = performance.now(); const dur = 1600
        const ease  = (t:number) => 1 - Math.pow(1 - t, 3)
        const tick  = (now:number) => {
          const p = Math.min((now - start) / dur, 1)
          entry.target.textContent = toFa(Math.round(ease(p) * target).toLocaleString('en-US'))
          if (p < 1) requestAnimationFrame(tick)
        }
        requestAnimationFrame(tick)
      })
    }, { threshold:0.5 })
    counterRefs.current.forEach((el, i) => { if (el) { el.setAttribute('data-ci', String(i)); io.observe(el) } })
    return () => io.disconnect()
  }, [seller])

  if (!seller) return (
    <div style={{ minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:BG, direction:'rtl', fontFamily:'Vazirmatn,sans-serif' }}>
      <div style={{ textAlign:'center' }}>
        <p style={{ color:TEXT_S, marginBottom:16 }}>فروشگاه یافت نشد</p>
        <Link href="/sellers" style={{ color:A, textDecoration:'none', fontWeight:700 }}>بازگشت</Link>
      </div>
    </div>
  )

  const yearsActive      = SHAMSI_YEAR - seller.sinceYear
  const categories       = ['همه', ...Array.from(new Set(seller.products.map(p => p.category)))]
  const filteredProducts = activeCategory === 'همه' ? seller.products : seller.products.filter(p => p.category === activeCategory)

  return (
    <>
      <style>{`
        *{box-sizing:border-box;}
        .sp-root{font-family:Vazirmatn,Tahoma,sans-serif;direction:rtl;background:${BG};color:${TEXT};}

        @keyframes blob1{0%,100%{transform:translate(0,0) scale(1);}25%{transform:translate(-28px,-20px) scale(1.05);}55%{transform:translate(-10px,26px) scale(0.96);}80%{transform:translate(20px,-12px) scale(1.02);}}
        @keyframes blob2{0%,100%{transform:translate(0,0) scale(1);}20%{transform:translate(32px,20px) scale(1.04);}55%{transform:translate(44px,-26px) scale(0.92);}75%{transform:translate(10px,30px) scale(1.06);}}
        @keyframes blob3{0%,100%{transform:translate(0,0);}50%{transform:translate(-26px,-36px) scale(1.10);}}
        @keyframes rackCycle{0%{opacity:0;}6%{opacity:.38;}32%{opacity:.38;}40%{opacity:0;}100%{opacity:0;}}
        @keyframes streakA{0%{opacity:0;transform:translateX(-130%) skewX(-18deg);}15%{opacity:1;}85%{opacity:1;}100%{opacity:0;transform:translateX(230%) skewX(-18deg);}}
        @keyframes streakB{0%{opacity:0;transform:translateX(-120%) skewX(-14deg);}15%{opacity:.4;}85%{opacity:.4;}100%{opacity:0;transform:translateX(250%) skewX(-14deg);}}
        @keyframes lineReveal{from{clip-path:inset(0 0 105% 0);transform:translateY(14px);opacity:0;}to{clip-path:inset(0 0 -25% 0);transform:none;opacity:1;}}
        @keyframes scaleInX{from{opacity:0;transform:scaleX(0);}to{opacity:1;transform:scaleX(1);}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px);}to{opacity:1;transform:none;}}
        @keyframes shimmerSweep{0%{background-position:-200% 0;}100%{background-position:400% 0;}}

        [data-rv]{opacity:0;transform:translateY(20px);transition:opacity .65s cubic-bezier(.22,1,.36,1),transform .65s cubic-bezier(.22,1,.36,1);}
        [data-rv].in{opacity:1;transform:none;}
        [data-rv][data-d="1"]{transition-delay:.07s;}
        [data-rv][data-d="2"]{transition-delay:.14s;}
        [data-rv][data-d="3"]{transition-delay:.21s;}
        [data-rv][data-d="4"]{transition-delay:.28s;}
        @media(prefers-reduced-motion:reduce){[data-rv]{transition:none!important;opacity:1!important;transform:none!important;}}

        .fpill{transition:all .18s cubic-bezier(.4,0,.2,1);}
        .fpill:hover{background:rgba(17,17,16,0.06)!important;}

        .sp-brand{filter:grayscale(1) opacity(.50);transition:filter .22s,transform .22s;}
        .sp-brand:hover{filter:none;transform:translateY(-2px);}

        .pcard{cursor:pointer;transition:transform .30s cubic-bezier(.4,0,.2,1),box-shadow .30s;position:relative;}
        .pcard:hover{transform:translateY(-5px);box-shadow:0 0 0 1.5px ${A}66,0 0 20px ${A}14,0 16px 40px rgba(0,0,0,0.10)!important;}
        .pimg{transition:transform .55s cubic-bezier(.4,0,.2,1);display:block;width:100%;}
        .pcard:hover .pimg{transform:scale(1.08);}
        .pdrawer{max-height:0;overflow:hidden;transition:max-height .32s cubic-bezier(.4,0,.2,1);}
        .pcard:hover .pdrawer{max-height:80px;}
        .pcard::before{content:'';position:absolute;inset:0;z-index:4;border-radius:inherit;pointer-events:none;background:linear-gradient(105deg,transparent 38%,rgba(255,255,255,0.10) 50%,transparent 62%);opacity:0;transition:opacity .25s;}
        .pcard:hover::before{opacity:1;animation:shimmerSweep .60s ease;}
        @media(hover:none),(max-width:700px){.pdrawer{max-height:80px!important;}}

        .btnA{transition:filter .18s,transform .14s,box-shadow .18s;}
        .btnA:hover{filter:brightness(1.08);transform:translateY(-1px);}
        .btnO{transition:background .18s,color .18s,border-color .18s;}
        .btnO:hover{background:${TEXT}!important;color:#fff!important;border-color:${TEXT}!important;}
        .btnBanner{transition:filter .18s,transform .14s;}
        .btnBanner:hover{filter:brightness(1.08);transform:translateY(-1px);}

        .crow{display:flex;align-items:center;gap:12px;padding:12px 0;border-bottom:1px solid ${BORDER};font-size:13.5px;color:${TEXT_S};text-decoration:none;transition:color .18s;}
        .crow:hover{color:${A};}
        .crow:last-child{border-bottom:none;}

        .pgrid{display:grid;grid-template-columns:repeat(6,1fr);gap:10px;}
        .about-grid{display:grid;grid-template-columns:1fr 1fr;gap:4vw;align-items:start;}
        .contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:4vw;}

        @media(max-width:1100px){.pgrid{grid-template-columns:repeat(4,1fr)!important;}}
        @media(max-width:800px){.pgrid{grid-template-columns:repeat(3,1fr)!important;}.about-grid{grid-template-columns:1fr!important;}.contact-grid{grid-template-columns:1fr!important;}}
        @media(max-width:480px){.pgrid{grid-template-columns:repeat(2,1fr)!important;}}
      `}</style>

      <div className="sp-root">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section style={{ position:'relative', height:'clamp(260px,38vh,400px)', overflow:'hidden', display:'flex', alignItems:'center' }}>

          {/* aurora blobs */}
          <div style={{ position:'absolute', inset:0, overflow:'hidden', pointerEvents:'none' }}>
            <div style={{ position:'absolute', right:'-6%', top:'10%', width:280, height:280, borderRadius:'50%', background:`radial-gradient(circle,${A}44 0%,${A}18 45%,transparent 70%)`, filter:'blur(55px)', animation:'blob1 15s ease-in-out infinite' }}/>
            <div style={{ position:'absolute', left:'-4%', top:'20%', width:240, height:240, borderRadius:'50%', background:`radial-gradient(circle,${A2}30 0%,${A2}10 50%,transparent 72%)`, filter:'blur(52px)', animation:'blob2 19s ease-in-out infinite' }}/>
            <div style={{ position:'absolute', left:'38%', top:'55%', width:120, height:120, borderRadius:'50%', background:`radial-gradient(circle,${A}28 0%,transparent 68%)`, filter:'blur(40px)', animation:'blob3 12s ease-in-out infinite' }}/>
          </div>

          {/* rack SVGs */}
          {([
            { left:'4%',  size:210, rot:0,   delay:'0s'  },
            { left:'26%', size:188, rot:140, delay:'6s'  },
            { left:'50%', size:158, rot:55,  delay:'12s' },
          ] as { left:string; size:number; rot:number; delay:string }[]).map((r,i) => (
            <svg key={i} style={{ position:'absolute', left:r.left, top:'50%', width:r.size, height:r.size*0.96, transform:`translateY(-50%) rotate(${r.rot}deg)`, pointerEvents:'none', animation:`rackCycle 18s ${r.delay} ease-in-out infinite` }} viewBox="0 0 760 560">
              {RACK.map(([cx,cy],j) => <circle key={j} cx={cx} cy={cy} r={44} fill="none" stroke={RACK_C[j]} strokeWidth="1.5"/>)}
              <line x1="0" y1="480" x2="700" y2="10" stroke={A} strokeWidth="1" strokeDasharray="14 7" opacity="0.5"/>
            </svg>
          ))}

          {/* streaks */}
          <div style={{ position:'absolute', top:'33%', left:0, width:'50%', height:'1.5px', background:`linear-gradient(to right,transparent,${A}50,transparent)`, transform:'rotate(-5deg)', animation:'streakA 12s 1s ease-in-out infinite', pointerEvents:'none' }}/>
          <div style={{ position:'absolute', top:'57%', left:0, width:'38%', height:'1px', background:`linear-gradient(to right,transparent,${A}30,transparent)`, transform:'rotate(-3deg)', animation:'streakB 16s 5s ease-in-out infinite', pointerEvents:'none' }}/>

          {/* bottom fade */}
          <div style={{ position:'absolute', bottom:0, left:0, right:0, height:50, background:`linear-gradient(to top,${BG},transparent)`, pointerEvents:'none' }}/>

          {/* content */}
          <div style={{ position:'relative', zIndex:5, maxWidth:1280, width:'100%', margin:'0 auto', padding:'0 clamp(24px,6vw,80px)' }}>

            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, animation:'fadeUp .4s .05s ease both' }}>
              <div style={{ width:46, height:46, borderRadius:'50%', background:`linear-gradient(135deg,${A2},${A})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:19, fontWeight:900, color:'#fff', flexShrink:0, boxShadow:`0 4px 16px ${A}44` }}>
                {seller.name[0]}
              </div>
              {seller.verified && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 11px', borderRadius:999, background:`${A}16`, border:`1.5px solid ${A}44`, color:A, fontSize:11, fontWeight:700 }}>
                  ✓ تأیید شده
                </span>
              )}
              {seller.elite && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:5, padding:'4px 10px', borderRadius:999, background:'rgba(17,17,16,0.06)', border:`1px solid ${BORDER}`, color:TEXT_S, fontSize:11, fontWeight:600 }}>
                  ★ Elite
                </span>
              )}
            </div>

            <div style={{ overflow:'hidden', paddingBottom:'0.12em' }}>
              <h1 style={{ fontSize:'clamp(32px,4.8vw,58px)', fontWeight:900, lineHeight:1.0, letterSpacing:'-0.05em', background:AG, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', animation:'lineReveal .72s .10s cubic-bezier(.4,0,.2,1) both' }}>
                {seller.name}
              </h1>
            </div>

            <div style={{ transformOrigin:'right', animation:'scaleInX .5s .34s ease both' }}>
              <div style={{ width:56, height:2.5, marginTop:8, background:`linear-gradient(135deg,${A2},${A})`, borderRadius:2, boxShadow:`0 0 10px ${A}44` }}/>
            </div>

            <p style={{ fontSize:'clamp(11px,1.2vw,13px)', color:TEXT_S, marginTop:8, maxWidth:380, animation:'lineReveal .5s .44s ease both' }}>
              {seller.tagline}
            </p>

            <div style={{ display:'flex', alignItems:'center', gap:8, marginTop:6, animation:'fadeUp .4s .50s ease both' }}>
              <span style={{ fontSize:12.5, color:TEXT_S, fontWeight:600 }}>◉ {seller.city}</span>
              <span style={{ color:TEXT_M }}>·</span>
              <span style={{ fontSize:12.5, color:TEXT_S, fontWeight:600 }}>{seller.since}</span>
              <span style={{ color:TEXT_M }}>·</span>
              <Stars r={seller.rating} A={A}/>
              <span style={{ fontSize:12, fontWeight:700, color:TEXT }}>{seller.rating}</span>
            </div>

            <div style={{ marginTop:16, display:'flex', gap:10, animation:'fadeUp .5s .62s ease both' }}>
              <a href={`tel:${seller.phone}`} className="btnA" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6, padding:'9px 20px', background:A, color:'#fff', borderRadius:7, fontSize:13, fontWeight:800, boxShadow:`0 4px 14px ${A}44` }}>
                تماس مستقیم
              </a>
              <a href={`https://wa.me/${seller.whatsapp}`} target="_blank" rel="noopener noreferrer" className="btnO" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:6, padding:'9px 18px', border:`1px solid ${BORDER}`, color:TEXT_S, borderRadius:7, fontSize:13, fontWeight:600, background:'transparent' }}>
                واتساپ
              </a>
            </div>
          </div>
        </section>

        {/* ── INFO BAR ─────────────────────────────────────────────────── */}
        <div style={{ background:WHITE, borderBottom:`1px solid ${BORDER}`, borderTop:`1px solid ${BORDER}` }}>
          <div style={{ maxWidth:1280, margin:'0 auto', padding:'0 clamp(24px,6vw,80px)', display:'flex', overflowX:'auto' }}>
            {([
              { icon:'★', label:'امتیاز',  value:`${toFa(seller.rating)}/۵`        },
              { icon:'◎', label:'نظر',     value:`${toFa(seller.reviewCount)} نظر` },
              { icon:'◈', label:'محصول',   value:`${toFa(seller.productCount)}+`    },
              { icon:'◷', label:'فعالیت',  value:`${toFa(yearsActive)} سال`         },
              { icon:'◉', label:'پاسخ',    value:seller.responseTime                },
            ] as { icon:string; label:string; value:string }[]).map((item,i) => (
              <div key={i} style={{ display:'flex', alignItems:'center', gap:8, padding:'13px 20px', borderLeft:i < 4 ? `1px solid ${BORDER}` : 'none', flexShrink:0 }}>
                <span style={{ fontSize:13, color:A }}>{item.icon}</span>
                <span style={{ fontSize:11.5, color:TEXT_M }}>{item.label}</span>
                <span style={{ fontSize:12.5, fontWeight:700, color:TEXT }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── ABOUT ────────────────────────────────────────────────────── */}
        <section id="about" style={{ padding:'60px clamp(24px,6vw,80px)', maxWidth:1280, margin:'0 auto' }}>
          <div className="about-grid">
            <div>
              <div data-rv style={{ marginBottom:6 }}>
                <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.17em', color:A, textTransform:'uppercase' }}>درباره فروشگاه</span>
              </div>
              <h2 data-rv data-d="1" style={{ fontSize:'clamp(20px,2.6vw,30px)', fontWeight:900, letterSpacing:'-0.04em', lineHeight:1.2, margin:'0 0 14px', color:TEXT, textWrap:'balance' }}>
                داستان {seller.name}
              </h2>
              <p data-rv data-d="2" style={{ fontSize:13.5, lineHeight:1.80, color:TEXT_S, maxWidth:460 }}>
                {seller.about}
              </p>
              <div data-rv data-d="3" style={{ marginTop:24 }}>
                {[
                  { label:'تأسیس',     value:seller.since        },
                  { label:'شهر',       value:seller.city         },
                  { label:'ساعت کاری', value:seller.workHours    },
                  { label:'پاسخگویی',  value:seller.responseTime },
                ].map((row,i) => (
                  <div key={i} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'11px 0', borderBottom:i < 3 ? `1px solid ${BORDER}` : 'none' }}>
                    <span style={{ fontSize:11.5, fontWeight:600, color:TEXT_M }}>{row.label}</span>
                    <span style={{ fontSize:13, fontWeight:600, color:TEXT }}>{row.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, alignContent:'start' }}>
              {([
                { idx:0, num:seller.productCount, suffix:'+', label:'محصول موجود', icon:'◈' },
                { idx:1, num:yearsActive,          suffix:'+', label:'سال فعالیت',  icon:'◷' },
                { idx:2, num:seller.totalSales,    suffix:'+', label:'فروش موفق',   icon:'✓' },
                { idx:3, num:seller.reviewCount,   suffix:'',  label:'نظر مشتری',   icon:'★' },
              ] as { idx:number; num:number; suffix:string; label:string; icon:string }[]).map(s => (
                <div key={s.idx} data-rv data-d={String(s.idx + 1)} style={{ background:WHITE, borderRadius:12, padding:'18px 16px', border:`1.5px solid ${BORDER}`, display:'flex', flexDirection:'column', gap:5 }}>
                  <span style={{ fontSize:15, color:A }}>{s.icon}</span>
                  <div style={{ display:'flex', alignItems:'baseline', gap:1 }}>
                    <span ref={el => { counterRefs.current[s.idx] = el }} style={{ fontSize:30, fontWeight:900, letterSpacing:'-0.05em', color:TEXT, fontVariantNumeric:'tabular-nums' }}>
                      {toFa(s.num)}
                    </span>
                    <span style={{ fontSize:14, fontWeight:700, color:A }}>{s.suffix}</span>
                  </div>
                  <span style={{ fontSize:11, fontWeight:600, color:TEXT_M, letterSpacing:'.04em' }}>{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── BRANDS ───────────────────────────────────────────────────── */}
        <div style={{ borderTop:`1px solid ${BORDER}`, borderBottom:`1px solid ${BORDER}`, padding:'24px clamp(24px,6vw,80px)', background:WHITE }}>
          <div style={{ maxWidth:1280, margin:'0 auto', display:'flex', alignItems:'center', gap:16, flexWrap:'wrap' }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.17em', color:TEXT_M, textTransform:'uppercase', flexShrink:0 }}>برندها</span>
            {seller.brands.map(b => (
              <span key={b} className="sp-brand" style={{ display:'inline-flex', alignItems:'center', padding:'7px 16px', border:`1.5px solid ${BORDER}`, borderRadius:6, fontSize:13, fontWeight:700, letterSpacing:'.04em', color:TEXT_S, background:BG }}>
                {b}
              </span>
            ))}
          </div>
        </div>

        {/* ── PRODUCTS ─────────────────────────────────────────────────── */}
        <section id="products">
          <div style={{ position:'sticky', top:0, zIndex:50, background:'rgba(246,244,240,0.92)', backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', borderBottom:`1px solid ${BORDER}`, boxShadow:'0 1px 8px rgba(17,17,16,0.04)' }}>
            <div style={{ maxWidth:1280, margin:'0 auto', padding:'9px clamp(24px,6vw,80px)', display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
              {categories.map(c => {
                const active = activeCategory === c
                return (
                  <button key={c} className="fpill" onClick={() => setActiveCategory(c)} style={{ padding:'7px 15px', borderRadius:100, border:`1px solid ${active ? 'transparent' : BORDER}`, background:active ? TEXT : 'transparent', color:active ? '#fff' : TEXT_S, fontSize:12.5, fontWeight:active ? 700 : 400, cursor:'pointer', fontFamily:'Vazirmatn,Tahoma,sans-serif' }}>
                    {c}
                  </button>
                )
              })}
              <span style={{ marginRight:'auto', fontSize:11.5, color:TEXT_M }}>{toFa(filteredProducts.length)} محصول</span>
            </div>
          </div>

          <div style={{ maxWidth:1280, margin:'0 auto', padding:'24px clamp(24px,6vw,80px) 64px' }}>
            <div className="pgrid">
              {filteredProducts.map((p, idx) => (
                <article key={p.id} className="pcard" style={{ borderRadius:12, overflow:'hidden', background:WHITE, border:`1.5px solid ${BORDER}`, boxShadow:'0 2px 8px rgba(0,0,0,0.04)', display:'flex', flexDirection:'column', animation:`fadeUp .36s ${(idx * 0.04).toFixed(2)}s ease both` }}>
                  <div style={{ position:'relative', overflow:'hidden', flexShrink:0 }}>
                    <img src={p.img} alt={p.name} className="pimg" style={{ aspectRatio:'4/3', objectFit:'cover' }}/>
                    {p.disc > 0 && (
                      <span style={{ position:'absolute', top:7, right:7, background:A, color:'#fff', fontSize:10, fontWeight:800, padding:'2px 8px', borderRadius:999, zIndex:2 }}>
                        {toFa(p.disc)}٪
                      </span>
                    )}
                  </div>
                  <div style={{ padding:'9px 11px 11px', flex:1, display:'flex', flexDirection:'column' }}>
                    <span style={{ fontSize:9.5, fontWeight:700, color:A, letterSpacing:'.10em', marginBottom:4 }}>{p.category}</span>
                    <p style={{ fontSize:12.5, fontWeight:700, color:TEXT, lineHeight:1.35, marginBottom:6, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>
                      {p.name}
                    </p>
                    <span style={{ fontSize:13, fontWeight:900, color:TEXT, fontVariantNumeric:'tabular-nums', marginTop:'auto' }}>
                      {toFa(p.price.toLocaleString('en-US'))} ت
                    </span>
                    <div className="pdrawer">
                      <div style={{ height:1, background:BORDER, margin:'7px 0' }}/>
                      {p.old > 0 && (
                        <div style={{ fontSize:11, color:TEXT_M, textDecoration:'line-through', marginBottom:5, fontVariantNumeric:'tabular-nums' }}>
                          {toFa(p.old.toLocaleString('en-US'))}
                        </div>
                      )}
                      <button style={{ width:'100%', padding:'6px', border:`1px solid ${A}44`, borderRadius:6, fontSize:11.5, fontWeight:700, color:A, background:`${A}08`, cursor:'pointer', fontFamily:'Vazirmatn,Tahoma,sans-serif' }}>
                        مشاهده محصول
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* ── CONTACT ──────────────────────────────────────────────────── */}
        <section id="contact" style={{ padding:'60px clamp(24px,6vw,80px)', maxWidth:1280, margin:'0 auto', borderTop:`1px solid ${BORDER}` }}>
          <div style={{ marginBottom:32 }}>
            <div data-rv style={{ marginBottom:6 }}>
              <span style={{ fontSize:10, fontWeight:700, letterSpacing:'.17em', color:A, textTransform:'uppercase' }}>تماس با ما</span>
            </div>
            <h2 data-rv data-d="1" style={{ fontSize:'clamp(20px,2.6vw,30px)', fontWeight:900, letterSpacing:'-0.04em', margin:0, color:TEXT }}>
              در کنار شما هستیم
            </h2>
          </div>

          <div className="contact-grid">
            <div data-rv>
              {([
                { icon:'◉', label:'آدرس',      value:seller.address,           href:undefined                                      },
                { icon:'◎', label:'تلفن',       value:seller.phone,             href:`tel:${seller.phone}`                          },
                { icon:'◍', label:'واتساپ',     value:seller.whatsapp,          href:`https://wa.me/${seller.whatsapp}`             },
                { icon:'◌', label:'اینستاگرام', value:`@${seller.instagram}`,   href:`https://instagram.com/${seller.instagram}`    },
                { icon:'◷', label:'ساعت کاری',  value:seller.workHours,         href:undefined                                      },
              ] as { icon:string; label:string; value:string; href:string|undefined }[]).map((row,i) => {
                const inner = (
                  <>
                    <span style={{ fontSize:16, color:A, width:20, textAlign:'center', flexShrink:0 }}>{row.icon}</span>
                    <span style={{ fontSize:11, color:TEXT_M, width:64, flexShrink:0 }}>{row.label}</span>
                    <span style={{ fontSize:13 }}>{row.value}</span>
                  </>
                )
                return row.href ? (
                  <a key={i} href={row.href} className="crow" target={row.href.startsWith('http') ? '_blank' : undefined} rel="noopener noreferrer">{inner}</a>
                ) : (
                  <div key={i} className="crow">{inner}</div>
                )
              })}
            </div>

            <div data-rv data-d="1" style={{ background:WHITE, borderRadius:14, border:`1.5px solid ${BORDER}`, overflow:'hidden' }}>
              <div style={{ position:'relative', height:170, background:`${A}0C`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}>
                <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%', opacity:.10 }}>
                  {[0,1,2,3,4,5,6,7,8].map(i => <line key={`h${i}`} x1="0" y1={`${i*12.5}%`} x2="100%" y2={`${i*12.5}%`} stroke={TEXT} strokeWidth="0.5"/>)}
                  {[0,1,2,3,4,5,6,7,8,9,10].map(i => <line key={`v${i}`} x1={`${i*10}%`} y1="0" x2={`${i*10}%`} y2="100%" stroke={TEXT} strokeWidth="0.5"/>)}
                  <line x1="0" y1="45%" x2="100%" y2="45%" stroke={TEXT} strokeWidth="2.5"/>
                  <line x1="35%" y1="0" x2="35%" y2="100%" stroke={TEXT} strokeWidth="2.5"/>
                  {[[10,15,20,26],[45,14,13,26],[68,56,25,20],[8,56,22,34]].map(([x,y,w,h],i) => (
                    <rect key={i} x={`${x}%`} y={`${y}%`} width={`${w}%`} height={`${h}%`} fill={TEXT} rx="2" opacity="0.5"/>
                  ))}
                </svg>
                <div style={{ position:'relative', zIndex:2, textAlign:'center' }}>
                  <div style={{ width:40, height:40, borderRadius:'50%', background:`linear-gradient(135deg,${A2},${A})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:17, fontWeight:900, color:'#fff', boxShadow:`0 6px 18px ${A}44`, margin:'0 auto 8px' }}>
                    {seller.name[0]}
                  </div>
                  <div style={{ fontSize:12, fontWeight:700, color:TEXT, background:'rgba(246,244,240,0.90)', backdropFilter:'blur(8px)', borderRadius:7, padding:'5px 12px', border:`1px solid ${BORDER}` }}>
                    {seller.city}
                  </div>
                </div>
              </div>
              <div style={{ padding:'14px 16px' }}>
                <p style={{ fontSize:13, color:TEXT_S, lineHeight:1.65 }}>{seller.address}</p>
                <p style={{ fontSize:12, color:TEXT_M, marginTop:4 }}>{seller.workHours}</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA BANNER ───────────────────────────────────────────────── */}
        <div style={{ position:'relative', overflow:'hidden', borderTop:`1px solid rgba(17,17,16,0.06)` }}>
          <div style={{ position:'absolute', inset:0, background:'linear-gradient(135deg,#111110 0%,#0A0908 100%)' }}/>
          <div style={{ position:'absolute', left:'10%', top:'50%', transform:'translateY(-50%)', width:440, height:220, borderRadius:'50%', background:`radial-gradient(ellipse,${A}10 0%,transparent 70%)`, filter:'blur(40px)', pointerEvents:'none' }}/>
          <div style={{ position:'relative', zIndex:5, maxWidth:1280, margin:'0 auto', padding:'44px clamp(24px,6vw,80px)', display:'flex', alignItems:'center', justifyContent:'space-between', gap:24 }}>
            <div>
              <p style={{ fontSize:10, fontWeight:700, color:A, letterSpacing:'0.24em', marginBottom:10, textTransform:'uppercase' }}>راهنمای خرید</p>
              <h3 style={{ fontSize:'clamp(17px,2.4vw,26px)', fontWeight:800, color:'#F2EDE4', letterSpacing:'-0.03em', lineHeight:1.2 }}>
                برای انتخاب بهتر نیاز به مشاوره داری؟
              </h3>
              <p style={{ fontSize:13, color:'rgba(242,237,228,0.46)', marginTop:8, maxWidth:320 }}>
                متخصصان {seller.name} آماده پاسخگویی به سوالات تو هستند
              </p>
            </div>
            <a href={`tel:${seller.phone}`} className="btnBanner" style={{ textDecoration:'none', display:'inline-flex', alignItems:'center', gap:10, padding:'13px 26px', background:A, color:'#fff', borderRadius:9, fontSize:13.5, fontWeight:800, whiteSpace:'nowrap', flexShrink:0, boxShadow:`0 4px 18px ${A}30` }}>
              تماس مستقیم
            </a>
          </div>
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────── */}
        <footer style={{ background:BG, padding:'36px clamp(24px,6vw,80px) 24px', borderTop:`1px solid ${BORDER}` }}>
          <div style={{ maxWidth:1280, margin:'0 auto' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:24, marginBottom:28 }}>
              <div>
                <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
                  <div style={{ width:34, height:34, borderRadius:'50%', background:`linear-gradient(135deg,${A2},${A})`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:900, color:'#fff' }}>
                    {seller.name[0]}
                  </div>
                  <span style={{ fontSize:15, fontWeight:800, color:TEXT }}>{seller.name}</span>
                </div>
                <p style={{ fontSize:12.5, color:TEXT_S, maxWidth:200, lineHeight:1.65 }}>{seller.tagline}</p>
              </div>

              <div style={{ display:'flex', gap:'3vw', flexWrap:'wrap' }}>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.14em', color:TEXT_M, marginBottom:12 }}>فروشگاه</div>
                  {['محصولات','برندها','تخفیف‌ها'].map(l => <div key={l} style={{ marginBottom:9, fontSize:13, color:TEXT_S, cursor:'pointer' }}>{l}</div>)}
                </div>
                <div>
                  <div style={{ fontSize:10, fontWeight:700, letterSpacing:'.14em', color:TEXT_M, marginBottom:12 }}>اطلاعات</div>
                  {['درباره ما','تماس','ضمانت'].map(l => <div key={l} style={{ marginBottom:9, fontSize:13, color:TEXT_S, cursor:'pointer' }}>{l}</div>)}
                </div>
              </div>

              <Link href="/sellers" style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 16px', borderRadius:10, border:`1.5px solid ${BORDER}`, textDecoration:'none', background:WHITE }}>
                <div style={{ width:28, height:28, borderRadius:'50%', background:A, display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:900, color:'#fff' }}>ب</div>
                <div>
                  <div style={{ fontSize:10.5, fontWeight:700, color:A, letterSpacing:'.06em' }}>بیلیارد هاب</div>
                  <div style={{ fontSize:10.5, color:TEXT_M, marginTop:2 }}>عضو شبکه فروشندگان</div>
                </div>
              </Link>
            </div>

            <div style={{ borderTop:`1px solid ${BORDER}`, paddingTop:20, display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
              <span style={{ fontSize:11.5, color:TEXT_M }}>{seller.name} · {seller.city} · {seller.since}</span>
              <span style={{ fontSize:11.5, color:TEXT_M }}>عضو رسمی شبکه بیلیارد هاب</span>
            </div>
          </div>
        </footer>

      </div>
    </>
  )
}
