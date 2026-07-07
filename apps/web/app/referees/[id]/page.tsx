'use client'
import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import ClubStoryModal from '@/components/ClubStoryModal'

/* ─── Tokens ─── */
const GOLD   = '#C7A66A'
const GOLD_D = '#9A6E38'
const BG     = '#F6F4F0'
const TEXT   = '#111110'
const TEXT_S = 'rgba(17,17,16,0.46)'
const TEXT_M = 'rgba(17,17,16,0.28)'
const CARD   = 'rgba(255,255,255,0.90)'
const CBOR   = '1px solid rgba(17,17,16,0.07)'

/* LQ1 button — pill with rgba bg, NO backdropFilter */
const lq1 = (color: string, bg: string): React.CSSProperties => ({
  background: bg, border: `1px solid ${color}`, borderRadius: 100,
  padding: '9px 20px', color, fontWeight:700, fontSize:13,
  cursor:'pointer', fontFamily:"'Vazirmatn',Tahoma,sans-serif",
  display:'inline-flex', alignItems:'center', gap:7,
  textDecoration:'none', whiteSpace:'nowrap',
})

/* Grade dot levels */
const GRADE_DOTS: Record<string,{dots:number;color:string}> = {
  'داور بین‌المللی': {dots:5, color:'#7C3AED'},
  'داور ملی':        {dots:4, color:GOLD_D},
  'داور درجه A':     {dots:3, color:'#C2410C'},
  'داور درجه B':     {dots:2, color:'#16A34A'},
  'داور درجه C':     {dots:1, color:TEXT_S},
}

const SPECS: Record<string,{label:string;color:string}> = {
  snooker:  {label:'اسنوکر',       color:'#7C3AED'},
  pocket:   {label:'پاکت بیلیارد', color:GOLD_D},
  highball: {label:'هی‌بال',       color:'#C2410C'},
}

const IMGS = [
  '/images/shop/snooker-table.jpg',
  '/images/shop/cue_billiard_2.jpg',
  '/images/shop/Ball-1.jpg',
  '/images/shop/pool_chalk_1.jpg',
]
const img = (i: number) => IMGS[i % IMGS.length] ?? IMGS[0]!

interface GImg { id:string; url:string; caption?:string }

interface RefereeFull {
  id:string; name:string; specialty:string; city:string
  experience:number; grade:string; gradeColor:string
  verified:boolean; hasStory:boolean; storyImage:string
  bio:string; fullBio:string
  certifications:string[]; achievements:string[]; specialties:string[]
  phone:string; whatsapp:string; instagram?:string; telegram?:string
  gallery:GImg[]
}

const GRADS: [string,string][] = [
  ['#C7A66A','#7A4F1E'],['#0891B2','#164E63'],['#7C3AED','#4C1D95'],
  ['#2563EB','#1E3A8A'],['#DC2626','#7F1D1D'],['#16A34A','#14532D'],
  ['#6D28D9','#3B0764'],['#B45309','#78350F'],['#BE185D','#831843'],
]
const getGrad = (id:string):[string,string] =>
  GRADS[parseInt(id,10)%GRADS.length]??['#C7A66A','#7A4F1E']

const REFEREES: Record<string,RefereeFull> = {
  '1': {
    id:'1', name:'کاوه طالبی', specialty:'snooker', city:'تهران', experience:20,
    grade:'داور بین‌المللی', gradeColor:'#7C3AED', verified:true,
    hasStory:true, storyImage:img(0),
    bio:'داور بین‌المللی WPBSA با ۲۰ سال سابقه در رویدادهای جهانی اسنوکر.',
    fullBio:'کاوه طالبی با بیش از ۲۰ سال سابقه در داوری اسنوکر، یکی از معدود داوران بین‌المللی ایرانی است که مدرک رسمی WPBSA دارد. وی تاکنون در ۴۵ مسابقه بین‌المللی داوری کرده و به عنوان داور ارشد در قهرمانی آسیا و چندین رویداد جهانی حضور داشته است. کاوه به‌عنوان مرجع قوانین اسنوکر در فدراسیون بیلیارد ایران شناخته می‌شود.',
    certifications:['مدرک بین‌المللی WPBSA','گواهی داور ارشد ACBS','عضو کمیته داوران فدراسیون'],
    achievements:['داور انتخابی قهرمانی آسیا ۱۴۰۲','داور رویداد جهانی اسنوکر ۲۰۲۳','داور ارشد ۵ دوره لیگ برتر ایران'],
    specialties:['اسنوکر','پاکت بیلیارد'],
    phone:'+989121234567', whatsapp:'+989121234567', instagram:'kaveh_referee',
    gallery:[
      {id:'g1',url:img(0),caption:'مسابقات قهرمانی آسیا'},
      {id:'g2',url:img(1),caption:'داوری لیگ برتر'},
      {id:'g3',url:img(2),caption:'تمرین داوران'},
      {id:'g4',url:img(3),caption:'مراسم اهدای جوایز'},
      {id:'g5',url:img(0),caption:'فینال قهرمانی'},
      {id:'g6',url:img(1),caption:'جلسه داوران'},
    ],
  },
  '2': {
    id:'2', name:'نیلوفر حسینی', specialty:'pocket', city:'مشهد', experience:12,
    grade:'داور ملی', gradeColor:GOLD_D, verified:true,
    hasStory:true, storyImage:img(1),
    bio:'داور ملی پاکت بیلیارد — پیشگام داوری بانوان در ایران.',
    fullBio:'نیلوفر حسینی با ۱۲ سال سابقه، از پیشگامان داوری بانوان در پاکت بیلیارد ایران است. وی تاکنون در ۹۵ مسابقه ملی داوری کرده و عضو فعال کمیته بانوان فدراسیون است. نیلوفر در توسعه استانداردهای داوری برای مسابقات بانوان نقش مهمی ایفا کرده است.',
    certifications:['مدرک داور ملی فدراسیون','گواهی داوری پاکت بیلیارد درجه A','عضو کمیته بانوان فدراسیون'],
    achievements:['داور انتخابی مسابقات ملی بانوان ۱۴۰۲','داور ارشد لیگ برتر بانوان ۳ دوره'],
    specialties:['پاکت بیلیارد','اسنوکر'],
    phone:'+989131234567', whatsapp:'+989131234567', instagram:'nilufar.ref',
    gallery:[
      {id:'g1',url:img(1),caption:'مسابقات ملی بانوان'},
      {id:'g2',url:img(2),caption:'لیگ برتر'},
      {id:'g3',url:img(0),caption:'کلاس داوری'},
      {id:'g4',url:img(3),caption:'اهدای مدال بانوان'},
      {id:'g5',url:img(1),caption:'رویداد ملی مشهد'},
      {id:'g6',url:img(2),caption:'داوری فینال'},
    ],
  },
  '3': {
    id:'3', name:'رامین فرهادی', specialty:'highball', city:'اصفهان', experience:8,
    grade:'داور ملی', gradeColor:GOLD_D, verified:true,
    hasStory:false, storyImage:'',
    bio:'متخصص هی‌بال — عضو کمیته داوران فدراسیون.',
    fullBio:'رامین فرهادی با تخصص در هی‌بال، عضو فعال کمیته داوران فدراسیون بیلیارد و اسنوکر ایران است. وی در ۶۰+ مسابقه استانی و ملی داوری کرده و به‌عنوان مربی دوره‌های داوری نیز فعالیت دارد.',
    certifications:['مدرک داور ملی هی‌بال','گواهی مربیگری داوری'],
    achievements:['داور ارشد مسابقات ملی هی‌بال ۱۴۰۱','مدرس دوره آموزش داوری استان اصفهان'],
    specialties:['هی‌بال','پاکت بیلیارد'],
    phone:'+989141234567', whatsapp:'+989141234567',
    gallery:[
      {id:'g1',url:img(2),caption:'مسابقات ملی هی‌بال'},
      {id:'g2',url:img(3),caption:'دوره آموزشی داوری'},
      {id:'g3',url:img(0),caption:'جلسه استانی اصفهان'},
      {id:'g4',url:img(1),caption:'قضاوت فینال'},
    ],
  },
  '4': {
    id:'4', name:'سحر محمدی', specialty:'pocket', city:'تهران', experience:5,
    grade:'داور درجه A', gradeColor:'#C2410C', verified:true,
    hasStory:true, storyImage:img(3),
    bio:'داور جوان پاکت بیلیارد — قضاوت ۳۰+ مسابقه استانی و کشوری.',
    fullBio:'سحر محمدی یکی از داوران جوان و باانرژی پاکت بیلیارد است که در ۵ سال اخیر با سرعت زیادی پیشرفت کرده. وی در ۳۰ مسابقه استانی و ۱۲ مسابقه ملی داوری کرده و هدفش رسیدن به مدرک بین‌المللی تا ۳ سال آینده است.',
    certifications:['گواهی داور درجه A فدراسیون','دوره تخصصی قوانین BCA'],
    achievements:['داور برگزیده استان تهران ۱۴۰۱','داور مسابقات دانشجویی کشور'],
    specialties:['پاکت بیلیارد'],
    phone:'+989151234567', whatsapp:'+989151234567', instagram:'sahar_ref',
    gallery:[
      {id:'g1',url:img(3),caption:'مسابقات دانشجویی'},
      {id:'g2',url:img(1),caption:'داوری استانی'},
      {id:'g3',url:img(0),caption:'رویداد کشوری'},
      {id:'g4',url:img(2),caption:'آموزش داوری'},
      {id:'g5',url:img(3),caption:'مسابقات بانوان'},
    ],
  },
  '5': {
    id:'5', name:'حامد موسوی', specialty:'snooker', city:'تبریز', experience:15,
    grade:'داور بین‌المللی', gradeColor:'#7C3AED', verified:true,
    hasStory:true, storyImage:img(0),
    bio:'داور ارشد IBSF — نماینده ایران در قهرمانی آسیا ۱۴۰۲.',
    fullBio:'حامد موسوی از داوران برجسته اسنوکر ایران است که با مدرک بین‌المللی IBSF، در رویدادهای آسیایی و بین‌المللی متعددی شرکت داشته. وی با ۱۵ سال تجربه، داور ارشد لیگ برتر ایران و عضو پانل داوران کنفدراسیون ACBS است.',
    certifications:['مدرک بین‌المللی IBSF','مدرک داور ارشد ACBS','عضو پانل داوران آسیا'],
    achievements:['داور قهرمانی آسیا ۱۴۰۲','داور جام ACBS ۲۰۲۲','داور ارشد ۶ دوره لیگ برتر'],
    specialties:['اسنوکر'],
    phone:'+989161234567', whatsapp:'+989161234567', telegram:'hamed_referee',
    gallery:[
      {id:'g1',url:img(0),caption:'قهرمانی آسیا ۱۴۰۲'},
      {id:'g2',url:img(1),caption:'لیگ برتر اسنوکر'},
      {id:'g3',url:img(2),caption:'جام ACBS'},
      {id:'g4',url:img(3),caption:'تمرین و آماده‌سازی'},
      {id:'g5',url:img(0),caption:'پانل داوران بین‌الملل'},
      {id:'g6',url:img(1),caption:'فینال جام آسیا'},
    ],
  },
  '6': {
    id:'6', name:'علی رضایی', specialty:'highball', city:'شیراز', experience:7,
    grade:'داور ملی', gradeColor:GOLD_D, verified:false,
    hasStory:false, storyImage:'',
    bio:'داور هی‌بال — قضاوت لیگ برتر هی‌بال و مسابقات جوانان.',
    fullBio:'علی رضایی در ۷ سال فعالیت در داوری هی‌بال، تجربه قضاوت در مسابقات مختلف استانی و ملی را کسب کرده. وی به‌ویژه در داوری مسابقات نوجوانان و جوانان تجربه خوبی دارد.',
    certifications:['مدرک داور ملی هی‌بال','گواهی داوری فدراسیون'],
    achievements:['داور لیگ برتر هی‌بال ۱۴۰۱','داور مسابقات جوانان کشوری'],
    specialties:['هی‌بال'],
    phone:'+989171234567', whatsapp:'+989171234567',
    gallery:[
      {id:'g1',url:img(1),caption:'مسابقات جوانان'},
      {id:'g2',url:img(2),caption:'لیگ برتر هی‌بال'},
      {id:'g3',url:img(3),caption:'داوری فینال'},
      {id:'g4',url:img(0),caption:'جلسه داوران شیراز'},
    ],
  },
  '7': {
    id:'7', name:'مینا صالحی', specialty:'pocket', city:'کرج', experience:3,
    grade:'داور درجه B', gradeColor:'#16A34A', verified:false,
    hasStory:false, storyImage:'',
    bio:'داور درجه B پاکت بیلیارد — فعال در مسابقات استانی.',
    fullBio:'مینا صالحی داور درجه B پاکت بیلیارد است که در ۳ سال گذشته تجربه خوبی در مسابقات استانی البرز و تهران کسب کرده. وی برای ارتقاء به درجه A در حال تکمیل دوره‌های آموزشی است.',
    certifications:['گواهی داور درجه B فدراسیون'],
    achievements:['داور برگزیده مسابقات استانی البرز ۱۴۰۱'],
    specialties:['پاکت بیلیارد'],
    phone:'+989181234567', whatsapp:'+989181234567',
    gallery:[
      {id:'g1',url:img(2),caption:'مسابقات استانی البرز'},
      {id:'g2',url:img(3),caption:'آموزش داوری درجه B'},
      {id:'g3',url:img(1),caption:'رویداد پاکت بیلیارد'},
    ],
  },
  '8': {
    id:'8', name:'کیان نوری', specialty:'snooker', city:'تهران', experience:10,
    grade:'داور ملی', gradeColor:GOLD_D, verified:true,
    hasStory:true, storyImage:img(3),
    bio:'داور ملی اسنوکر — عضو هیئت داوران کنفدراسیون ACBS.',
    fullBio:'کیان نوری با ۱۰ سال سابقه داوری اسنوکر، عضو هیئت داوران کنفدراسیون ACBS است. وی در مسابقات ملی و منطقه‌ای متعددی داوری کرده و به‌عنوان مشاور قوانین برای باشگاه‌های تهران فعال است.',
    certifications:['مدرک داور ملی اسنوکر','عضو هیئت داوران ACBS','گواهی مربیگری داوری'],
    achievements:['داور ارشد مسابقات ملی اسنوکر ۱۴۰۲','داور منطقه‌ای ACBS ۲۰۲۲'],
    specialties:['اسنوکر','پاکت بیلیارد'],
    phone:'+989191234567', whatsapp:'+989191234567', instagram:'kian_referee',
    gallery:[
      {id:'g1',url:img(3),caption:'مسابقات ملی اسنوکر'},
      {id:'g2',url:img(0),caption:'رویداد ACBS'},
      {id:'g3',url:img(1),caption:'لیگ برتر'},
      {id:'g4',url:img(2),caption:'داوری فینال ملی'},
      {id:'g5',url:img(3),caption:'پانل مشاوران قوانین'},
      {id:'g6',url:img(0),caption:'کنفرانس داوران آسیا'},
    ],
  },
}

/* ════════════════ PAGE ════════════════ */
export default function RefereeProfilePage() {
  const params = useParams()
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const referee = id ? REFEREES[id] : null

  const [storyOpen, setStoryOpen] = useState(false)
  const [lightImg,  setLightImg]  = useState<string|null>(null)

  if (!referee) {
    return (
      <div style={{ direction:'rtl', fontFamily:"'Vazirmatn',Tahoma,sans-serif",
        background:BG, minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', color:TEXT }}>
        <div style={{ textAlign:'center' }}>
          <p style={{ fontSize:18, fontWeight:700, marginBottom:12 }}>داور یافت نشد</p>
          <Link href="/referees" style={{ color:GOLD, fontWeight:600, fontSize:14 }}>← بازگشت به داوران</Link>
        </div>
      </div>
    )
  }

  const [g1, g2] = getGrad(referee.id)
  const gradeDots = GRADE_DOTS[referee.grade]
  const sp = SPECS[referee.specialty]

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0;}
        @keyframes fadeIn{from{opacity:0}to{opacity:1}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:none}}
        @keyframes scaleIn{from{opacity:0;transform:scale(0.94)}to{opacity:1;transform:scale(1)}}
        .lq1btn:hover{opacity:.84;transform:translateY(-1px);}
        .lq1btn{transition:opacity .18s,transform .14s;}
        .gphoto{transition:transform .4s ease,opacity .3s;}
        .gphoto:hover{transform:scale(1.04);opacity:.9;}
        @media(max-width:740px){.pcols{grid-template-columns:1fr!important;}}
        @media(max-width:740px){.pgal{grid-template-columns:repeat(2,1fr)!important;}}
        @media(max-width:480px){.pgal{grid-template-columns:repeat(2,1fr)!important;}}
        .gphoto .gcap{opacity:0;transition:opacity .25s;}
        .gphoto:hover .gcap{opacity:1;}
      `}</style>

      <div style={{ direction:'rtl', fontFamily:"'Vazirmatn',Tahoma,sans-serif", background:BG, minHeight:'100vh', color:TEXT }}>

        {/* ══════ HERO ══════ */}
        <div style={{ position:'relative', height:248, overflow:'hidden' }}>
          {/* Blurred bg */}
          {referee.storyImage ? (
            <img src={referee.storyImage} alt="" style={{ position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover',filter:'blur(28px) saturate(0.6)',transform:'scale(1.08)' }}/>
          ) : (
            <div style={{ position:'absolute',inset:0,background:`linear-gradient(135deg,${g1}30,${g2}10)` }}/>
          )}
          <div style={{ position:'absolute',inset:0,background:'linear-gradient(to bottom,rgba(246,244,240,0.15) 0%,rgba(246,244,240,0.70) 65%,rgba(246,244,240,1) 100%)' }}/>

          {/* Content */}
          <div style={{ position:'relative',zIndex:5,height:'100%',display:'flex',alignItems:'flex-end',
            maxWidth:1280,margin:'0 auto',padding:'0 clamp(24px,6vw,80px) 32px' }}>

            {/* Back */}
            <Link href="/referees" style={{ position:'absolute',top:20,right:'clamp(24px,6vw,80px)',
              display:'flex',alignItems:'center',gap:5,
              fontSize:13,fontWeight:600,color:TEXT_S,textDecoration:'none' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="15 18 9 12 15 6"/>
              </svg>
              داوران
            </Link>

            <div style={{ display:'flex',alignItems:'flex-end',gap:20,animation:'fadeIn .6s ease both' }}>
              {/* Avatar with story ring */}
              <div style={{ flexShrink:0,position:'relative' }}>
                {referee.hasStory ? (
                  <button onClick={() => setStoryOpen(true)} style={{ background:'none',border:'none',cursor:'pointer',padding:0 }}>
                    <div style={{ width:92,height:92,borderRadius:'50%',
                      background:'linear-gradient(135deg,#feda75,#fa7e1e,#d62976,#962fbf,#4f5bd5)',
                      padding:3,boxShadow:'0 0 20px rgba(214,41,118,0.50)' }}>
                      <div style={{ width:'100%',height:'100%',borderRadius:'50%',
                        background:`linear-gradient(135deg,${g1},${g2})`,
                        display:'flex',alignItems:'center',justifyContent:'center',
                        color:'#fff',fontWeight:900,fontSize:34,
                        border:'2.5px solid rgba(246,244,240,0.80)' }}>
                        {referee.name[0]}
                      </div>
                    </div>
                  </button>
                ) : (
                  <div style={{ width:92,height:92,borderRadius:'50%',
                    background:`linear-gradient(135deg,${g1}40,${g2}20)`,
                    border:`3px solid ${g1}60`,
                    display:'flex',alignItems:'center',justifyContent:'center',
                    color:g1,fontWeight:900,fontSize:34 }}>
                    {referee.name[0]}
                  </div>
                )}
              </div>

              {/* Name + meta */}
              <div style={{ paddingBottom:4 }}>
                <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:4 }}>
                  <h1 style={{ fontSize:'clamp(22px,3vw,32px)',fontWeight:900,letterSpacing:'-0.03em',color:TEXT }}>
                    {referee.name}
                  </h1>
                  {referee.verified && (
                    <span title="تأیید شده" style={{ color:'#2563EB',fontSize:18,lineHeight:1 }}>✓</span>
                  )}
                </div>
                <div style={{ display:'flex',alignItems:'center',gap:10,flexWrap:'wrap' }}>
                  <span style={{ fontSize:12,fontWeight:700,color:referee.gradeColor,
                    background:`${referee.gradeColor}18`,border:`1px solid ${referee.gradeColor}40`,
                    borderRadius:100,padding:'3px 10px' }}>
                    {referee.grade}
                  </span>
                  {sp && (
                    <span style={{ fontSize:12,fontWeight:600,color:sp.color,
                      background:`${sp.color}12`,border:`1px solid ${sp.color}30`,
                      borderRadius:100,padding:'3px 10px' }}>
                      {sp.label}
                    </span>
                  )}
                  <span style={{ fontSize:12,color:TEXT_S,display:'flex',alignItems:'center',gap:4 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                    </svg>
                    {referee.city}
                  </span>
                  <span style={{ fontSize:12,color:TEXT_S,display:'flex',alignItems:'center',gap:4 }}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                    {referee.experience} سال سابقه
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ══════ CONTENT ══════ */}
        <div style={{ maxWidth:1280,margin:'0 auto',padding:'32px clamp(24px,6vw,80px) 64px' }}>

          <div className="pcols" style={{ display:'grid',gridTemplateColumns:'1fr 340px',gap:20,alignItems:'start' }}>

            {/* Left — About */}
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

              {/* Bio card */}
              <div style={{ background:CARD,borderRadius:16,padding:'24px 28px',
                border:CBOR,boxShadow:'0 2px 16px rgba(17,17,16,0.06)',
                animation:'fadeUp .4s .1s ease both' }}>
                <h2 style={{ fontSize:14,fontWeight:800,color:TEXT,marginBottom:14,letterSpacing:'-0.02em' }}>
                  معرفی
                </h2>
                <p style={{ fontSize:14,color:TEXT_S,lineHeight:1.85 }}>{referee.fullBio}</p>
                {referee.specialties.length > 0 && (
                  <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginTop:16 }}>
                    {referee.specialties.map(s => (
                      <span key={s} style={{ fontSize:12,fontWeight:600,color:TEXT_S,
                        background:'rgba(17,17,16,0.05)',borderRadius:100,padding:'4px 12px',
                        border:'1px solid rgba(17,17,16,0.08)' }}>
                        {s}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Gallery */}
              {referee.gallery.length > 0 && (
                <div style={{ background:CARD,borderRadius:16,padding:'24px 28px',
                  border:CBOR,boxShadow:'0 2px 16px rgba(17,17,16,0.06)',
                  animation:'fadeUp .4s .2s ease both' }}>
                  <h2 style={{ fontSize:14,fontWeight:800,color:TEXT,marginBottom:16,letterSpacing:'-0.02em' }}>
                    گالری تصاویر
                  </h2>
                  <div className="pgal" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10 }}>
                    {referee.gallery.map((g,idx) => (
                      <div key={g.id} className="gphoto" onClick={() => setLightImg(g.url)}
                        style={{ borderRadius:12,overflow:'hidden',
                          aspectRatio: idx === 0 ? '16/9' : '4/3',
                          gridColumn: idx === 0 ? 'span 2' : undefined,
                          cursor:'pointer', position:'relative',
                          boxShadow:'0 2px 12px rgba(17,17,16,0.12)' }}>
                        <img src={g.url} alt={g.caption||''} style={{ width:'100%',height:'100%',objectFit:'cover' }}/>
                        {g.caption && (
                          <div className="gcap" style={{ position:'absolute',bottom:0,left:0,right:0,
                            background:'linear-gradient(to top,rgba(17,17,16,0.72),transparent)',
                            padding:'18px 12px 10px',color:'#fff',fontSize:11.5,fontWeight:600 }}>
                            {g.caption}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Right — Grade + Experience + Contact */}
            <div style={{ display:'flex',flexDirection:'column',gap:16 }}>

              {/* Grade card */}
              <div style={{ background:CARD,borderRadius:16,padding:'22px 24px',
                border:CBOR,boxShadow:'0 2px 16px rgba(17,17,16,0.06)',
                animation:'fadeUp .4s .15s ease both' }}>
                <h2 style={{ fontSize:14,fontWeight:800,color:TEXT,marginBottom:16,letterSpacing:'-0.02em' }}>
                  درجه داوری
                </h2>

                {/* Grade dots */}
                {gradeDots && (
                  <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:18,
                    padding:'12px 14px',background:`${gradeDots.color}08`,
                    borderRadius:10,border:`1px solid ${gradeDots.color}20` }}>
                    <div style={{ display:'flex',gap:4 }}>
                      {[1,2,3,4,5].map(n => (
                        <div key={n} style={{ width:10,height:10,borderRadius:'50%',
                          background:n<=gradeDots.dots ? gradeDots.color : 'rgba(17,17,16,0.08)',
                          boxShadow:n<=gradeDots.dots ? `0 0 6px ${gradeDots.color}60` : 'none' }}/>
                      ))}
                    </div>
                    <span style={{ fontSize:13,fontWeight:700,color:gradeDots.color }}>
                      {referee.grade}
                    </span>
                  </div>
                )}

                {/* Experience stat */}
                <div style={{ display:'flex',alignItems:'center',gap:12,
                  padding:'12px 14px',background:'rgba(199,166,106,0.06)',
                  borderRadius:10,border:'1px solid rgba(199,166,106,0.18)',marginBottom:16 }}>
                  <div style={{ width:36,height:36,borderRadius:10,
                    background:`linear-gradient(135deg,${GOLD}25,${GOLD}10)`,
                    display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={GOLD} strokeWidth="2">
                      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
                    </svg>
                  </div>
                  <div>
                    <div style={{ fontSize:22,fontWeight:900,color:TEXT,lineHeight:1 }}>
                      {referee.experience}
                    </div>
                    <div style={{ fontSize:11,color:TEXT_S,marginTop:2 }}>سال سابقه داوری</div>
                  </div>
                </div>

                {/* Certifications */}
                {referee.certifications.length > 0 && (
                  <div>
                    <p style={{ fontSize:11,fontWeight:700,color:TEXT_M,letterSpacing:'0.08em',marginBottom:8 }}>
                      مدارک و گواهینامه‌ها
                    </p>
                    {referee.certifications.map((c,i) => (
                      <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:8,marginBottom:6 }}>
                        <span style={{ marginTop:4,width:5,height:5,borderRadius:'50%',
                          background:GOLD,flexShrink:0 }}/>
                        <span style={{ fontSize:12,color:TEXT_S,lineHeight:1.5 }}>{c}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Achievements */}
                {referee.achievements.length > 0 && (
                  <div style={{ marginTop:14 }}>
                    <p style={{ fontSize:11,fontWeight:700,color:TEXT_M,letterSpacing:'0.08em',marginBottom:8 }}>
                      دستاوردها
                    </p>
                    {referee.achievements.map((a,i) => (
                      <div key={i} style={{ display:'flex',alignItems:'flex-start',gap:8,marginBottom:6 }}>
                        <span style={{ marginTop:4,fontSize:11,color:'#F59E0B',flexShrink:0 }}>★</span>
                        <span style={{ fontSize:12,color:TEXT_S,lineHeight:1.5 }}>{a}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Contact card */}
              <div style={{ background:CARD,borderRadius:16,padding:'22px 24px',
                border:CBOR,boxShadow:'0 2px 16px rgba(17,17,16,0.06)',
                animation:'fadeUp .4s .22s ease both' }}>
                <h2 style={{ fontSize:14,fontWeight:800,color:TEXT,marginBottom:16,letterSpacing:'-0.02em' }}>
                  تماس
                </h2>
                <div style={{ display:'flex',flexDirection:'column',gap:10 }}>
                  {referee.instagram && (
                    <a href={`https://instagram.com/${referee.instagram}`}
                      target="_blank" rel="noopener noreferrer" className="lq1btn"
                      style={lq1('#7C3AED','rgba(124,58,237,0.08)')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                      </svg>
                      اینستاگرام
                    </a>
                  )}
                  {referee.telegram && (
                    <a href={`https://t.me/${referee.telegram}`}
                      target="_blank" rel="noopener noreferrer" className="lq1btn"
                      style={lq1('#0891b2','rgba(8,145,178,0.08)')}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
                      </svg>
                      تلگرام
                    </a>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>

      </div>

      {/* Story modal */}
      {storyOpen && referee.storyImage && (
        <ClubStoryModal
          club={{ name:referee.name, logo:'', storyMediaUrl:referee.storyImage, storyText:referee.bio, badge:'داور' }}
          onClose={() => setStoryOpen(false)}
        />
      )}

      {/* Lightbox */}
      {lightImg && (
        <div onClick={() => setLightImg(null)}
          style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.88)',
            backdropFilter:'blur(12px)',display:'flex',alignItems:'center',justifyContent:'center',
            cursor:'zoom-out',animation:'fadeIn .2s ease' }}>
          <img src={lightImg} alt="" style={{ maxWidth:'90vw',maxHeight:'88vh',objectFit:'contain',
            borderRadius:12,boxShadow:'0 40px 80px rgba(0,0,0,0.6)',animation:'scaleIn .25s ease' }}/>
          <button onClick={() => setLightImg(null)}
            style={{ position:'absolute',top:20,left:20,width:40,height:40,borderRadius:'50%',
              background:'rgba(255,255,255,0.10)',border:'1px solid rgba(255,255,255,0.15)',
              cursor:'pointer',color:'#fff',display:'flex',alignItems:'center',justifyContent:'center' }}>
            ✕
          </button>
        </div>
      )}
    </>
  )
}
