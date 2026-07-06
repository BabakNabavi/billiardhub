'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

// ── Tokens ────────────────────────────────────────────────────
const GOLD    = '#C7A66A'
const GOLD_D  = '#A07840'
const TEXT    = '#1C1C1A'
const TEXT_S  = 'rgba(28,28,26,0.52)'
const TEXT_M  = 'rgba(28,28,26,0.32)'
const LQ_BG   = 'rgba(255,255,255,0.82)'
const LQ_BOR  = '1px solid rgba(255,255,255,0.85)'
const LQ_SHAD = 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 8px 32px rgba(0,0,0,0.07)'

const SPECS: Record<string,{label:string;color:string;bg:string;grad:string}> = {
  snooker:  {label:'اسنوکر',       color:'#7C3AED',bg:'rgba(124,58,237,0.10)',  grad:'linear-gradient(135deg,#7C3AED,#5B21B6)'},
  pocket:   {label:'پاکت بیلیارد', color:GOLD,     bg:'rgba(199,166,106,0.12)', grad:`linear-gradient(135deg,${GOLD},${GOLD_D})`},
  highball: {label:'هی‌بال',        color:'#F59E0B', bg:'rgba(245,158,11,0.10)',  grad:'linear-gradient(135deg,#F59E0B,#D97706)'},
  carom:    {label:'کارامبول',      color:'#16A34A', bg:'rgba(22,163,74,0.10)',   grad:'linear-gradient(135deg,#16A34A,#15803D)'},
}

const AVATAR_GRAD: [string,string][] = [
  ['#C7A66A','#A07840'],['#7C3AED','#5B21B6'],['#2563EB','#1D4ED8'],
  ['#B8936B','#8B6B3D'],['#16A34A','#15803D'],['#DC2626','#B91C1C'],
]

// ── Types ─────────────────────────────────────────────────────
interface ScheduleDay { day:string; active:boolean; slots:string[] }
interface GalleryImg  { id:string; url:string; caption:string }
interface Video       { id:string; thumbnail:string; title:string; duration:string; views:string }
interface Post        { id:string; image:string; caption:string; date:string; likes:number; tall?:boolean }

interface CoachFull {
  id:string; name:string; specialty:string; city:string
  experience:number; rating:number; reviewCount:number
  sessionPrice:number; groupPrice:number
  badge:string; badgeColor:string; verified:boolean
  hasStory:boolean; storyImage:string
  bio:string; fullBio:string
  certifications:string[]; achievements:string[]; specialties:string[]
  students:number; phone:string; whatsapp:string
  schedule:ScheduleDay[]; gallery:GalleryImg[]; videos:Video[]; posts:Post[]
}

// ── Helpers ───────────────────────────────────────────────────
const getGrad = (id:string):[string,string] => AVATAR_GRAD[parseInt(id,10)%AVATAR_GRAD.length]??[GOLD,GOLD_D]
const fmt = (n:number) => n.toLocaleString('fa-IR')

const IMGS: string[] = [
  '/images/shop/snooker-table.jpg',
  '/images/shop/cue_billiard_2.jpg',
  '/images/shop/Ball-1.jpg',
  '/images/shop/pool_chalk_1.jpg',
]
const img = (i:number): string => IMGS[i % IMGS.length] ?? IMGS[0]!

// ── Mock Data ─────────────────────────────────────────────────
const COACHES_DATA: CoachFull[] = [
  {
    id:'1', name:'احمد رضایی', specialty:'snooker', city:'تهران',
    experience:15, rating:4.9, reviewCount:312, sessionPrice:500000, groupPrice:200000,
    badge:'مربی بین‌المللی', badgeColor:'#7C3AED', verified:true,
    hasStory:true, storyImage:'/images/shop/snooker-table.jpg',
    bio:'مربی ملی‌پوش با ۱۵ سال سابقه تدریس در فدراسیون جهانی بیلیارد',
    fullBio:'با ۱۵ سال سابقه تدریس در بالاترین سطح بیلیارد ایران، تخصص اصلی من اسنوکر حرفه‌ای و آماده‌سازی بازیکنان برای مسابقات ملی و بین‌المللی است. شاگردانم شامل ۳ قهرمان ملی و بیش از ۱۵ نفر از اعضای تیم ملی ایران هستند. روش تدریس من ترکیبی از تحلیل تکنیکی دقیق، روانشناسی ورزشی پیشرفته و برنامه‌های تمرینی شخصی‌سازی‌شده است.',
    certifications:['مدرک A فدراسیون جهانی WPBSA','مربی درجه یک فدراسیون ایران','گواهینامه داوری بین‌المللی'],
    achievements:['قهرمانی آسیا ۱۳۹۶','تیم ملی ۱۰ دوره','مربی برتر سال ۱۳۹۹','پرورش ۳ قهرمان ملی'],
    specialties:['اسنوکر پیشرفته','پوزیشن‌بازی','بریک‌بیلدینگ','روانشناسی ورزشی'],
    students:240, phone:'09121234567', whatsapp:'989121234567',
    schedule:[
      {day:'شنبه',    active:true,  slots:['۹:۰۰','۱۱:۰۰','۱۵:۰۰','۱۷:۰۰']},
      {day:'یک‌شنبه', active:true,  slots:['۱۰:۰۰','۱۶:۰۰','۱۸:۰۰']},
      {day:'دوشنبه',  active:false, slots:[]},
      {day:'سه‌شنبه', active:true,  slots:['۹:۰۰','۱۱:۰۰','۱۷:۰۰']},
      {day:'چهارشنبه',active:true,  slots:['۱۵:۰۰','۱۷:۰۰','۱۹:۰۰']},
      {day:'پنج‌شنبه',active:true,  slots:['۹:۰۰','۱۱:۰۰','۱۳:۰۰']},
      {day:'جمعه',    active:false, slots:[]},
    ],
    gallery:[
      {id:'g1',url:img(0),caption:'کلاس خصوصی اسنوکر پیشرفته'},
      {id:'g2',url:img(1),caption:'تمرین تکنیک ضربه با شاگردان'},
      {id:'g3',url:img(2),caption:'آموزش بریک‌بیلدینگ'},
      {id:'g4',url:img(3),caption:'جلسه گروهی مبتدیان'},
      {id:'g5',url:img(0),caption:'تدریس پوزیشن‌بازی'},
      {id:'g6',url:img(1),caption:'کلاس آمادگی مسابقات'},
    ],
    videos:[
      {id:'v1',thumbnail:img(0),title:'تکنیک نشانه‌گیری حرفه‌ای اسنوکر',duration:'۱۲:۳۴',views:'۱۲ هزار'},
      {id:'v2',thumbnail:img(1),title:'آموزش کنترل کیوبال',duration:'۸:۱۵',views:'۸.۵ هزار'},
      {id:'v3',thumbnail:img(2),title:'ضربات دفاعی پیشرفته',duration:'۱۵:۰۰',views:'۶ هزار'},
      {id:'v4',thumbnail:img(3),title:'فریم‌بازی حرفه‌ای',duration:'۲۰:۴۵',views:'۱۵ هزار'},
    ],
    posts:[
      {id:'p1',image:img(0),caption:'یه جلسه عالی با شاگردان حرفه‌ای داشتم امروز 🎱',date:'۱۴۰۴/۰۴/۱۰',likes:342,tall:false},
      {id:'p2',image:img(1),caption:'تمرین صبحگاهی با تمرکز روی تکنیک ضربه برگشتی 💪',date:'۱۴۰۴/۰۴/۰۵',likes:289,tall:true},
      {id:'p3',image:img(2),caption:'مسابقات داخلی باشگاه — قهرمان این دوره هم از شاگردان خودمه 🏆',date:'۱۴۰۴/۰۳/۲۸',likes:511,tall:false},
      {id:'p4',image:img(3),caption:'لوازم تدریس باید همیشه آماده باشه',date:'۱۴۰۴/۰۳/۲۰',likes:178,tall:true},
      {id:'p5',image:img(0),caption:'کلاس گروهی پایان هفته 🎯',date:'۱۴۰۴/۰۳/۱۴',likes:245,tall:false},
      {id:'p6',image:img(1),caption:'وقتی شاگردت اولین برک صد رو می‌زنه 🌟',date:'۱۴۰۴/۰۳/۰۸',likes:687,tall:true},
    ],
  },
  {
    id:'2', name:'حسین نوری', specialty:'snooker', city:'مشهد',
    experience:12, rating:4.7, reviewCount:187, sessionPrice:350000, groupPrice:150000,
    badge:'مربی ملی', badgeColor:GOLD, verified:true,
    hasStory:true, storyImage:'/images/shop/cue_billiard_2.jpg',
    bio:'قهرمان آسیا و مربی دسته برتر با سابقه درخشان در مسابقات بین‌المللی',
    fullBio:'۱۲ سال تجربه مربیگری با رویکرد علمی و آنالیز دقیق تکنیک. قهرمان آسیا در سال ۱۳۹۸ و مربی چندین قهرمان کشوری. تخصص اصلی من شناسایی و تصحیح اشتباهات تکنیکی و ساخت برنامه تمرینی هدف‌محور است.',
    certifications:['مدرک B فدراسیون WPBSA','مربی درجه دو فدراسیون ایران','مدرک مربیگری جوانان'],
    achievements:['قهرمانی آسیا ۱۳۹۸','نایب‌قهرمانی ایران ۱۳۹۷','مربی تیم استان ۵ سال'],
    specialties:['اسنوکر متوسط تا پیشرفته','آنالیز تکنیک','برنامه تمرینی'],
    students:180, phone:'09351234567', whatsapp:'989351234567',
    schedule:[
      {day:'شنبه',    active:true,  slots:['۱۰:۰۰','۱۴:۰۰','۱۸:۰۰']},
      {day:'یک‌شنبه', active:false, slots:[]},
      {day:'دوشنبه',  active:true,  slots:['۹:۰۰','۱۱:۰۰','۱۵:۰۰']},
      {day:'سه‌شنبه', active:true,  slots:['۱۴:۰۰','۱۶:۰۰']},
      {day:'چهارشنبه',active:false, slots:[]},
      {day:'پنج‌شنبه',active:true,  slots:['۱۰:۰۰','۱۲:۰۰','۱۴:۰۰']},
      {day:'جمعه',    active:true,  slots:['۱۰:۰۰','۱۲:۰۰']},
    ],
    gallery:[
      {id:'g1',url:img(1),caption:'تمرین اسنوکر حرفه‌ای'},{id:'g2',url:img(0),caption:'کلاس گروهی'},
      {id:'g3',url:img(3),caption:'آموزش ضربات خاص'},{id:'g4',url:img(2),caption:'جلسه خصوصی'},
      {id:'g5',url:img(1),caption:'تمرین با شاگردان'},{id:'g6',url:img(0),caption:'رقابت دوستانه'},
    ],
    videos:[
      {id:'v1',thumbnail:img(1),title:'آموزش ضربه برگشتی',duration:'۹:۲۰',views:'۷ هزار'},
      {id:'v2',thumbnail:img(0),title:'تکنیک اسنوکر مبتدی تا پیشرفته',duration:'۱۴:۰۰',views:'۱۱ هزار'},
      {id:'v3',thumbnail:img(2),title:'استراتژی فریم',duration:'۶:۴۵',views:'۴.۵ هزار'},
      {id:'v4',thumbnail:img(3),title:'کنترل توپ سفید',duration:'۱۱:۳۰',views:'۹ هزار'},
    ],
    posts:[
      {id:'p1',image:img(1),caption:'تمرین امروز عالی بود 🎱',date:'۱۴۰۴/۰۴/۰۸',likes:198,tall:true},
      {id:'p2',image:img(0),caption:'آموزش تکنیک برگشت',date:'۱۴۰۴/۰۴/۰۱',likes:156,tall:false},
      {id:'p3',image:img(2),caption:'مسابقه دوستانه با شاگردان 🏆',date:'۱۴۰۴/۰۳/۲۵',likes:312,tall:true},
      {id:'p4',image:img(3),caption:'لوازم کلاس آماده شد',date:'۱۴۰۴/۰۳/۱۸',likes:89,tall:false},
      {id:'p5',image:img(1),caption:'تیم جوانان ما 💪',date:'۱۴۰۴/۰۳/۱۰',likes:267,tall:true},
      {id:'p6',image:img(0),caption:'صبح زود و تمرین جدی',date:'۱۴۰۴/۰۳/۰۵',likes:143,tall:false},
    ],
  },
  {
    id:'3', name:'مریم کاظمی', specialty:'pocket', city:'اصفهان',
    experience:8, rating:4.8, reviewCount:143, sessionPrice:280000, groupPrice:120000,
    badge:'مربی ملی', badgeColor:GOLD, verified:true,
    hasStory:false, storyImage:'',
    bio:'مربی بانوان و متخصص پاکت بیلیارد با سبک تدریس حرفه‌ای و صبور',
    fullBio:'با ۸ سال تجربه در تدریس پاکت بیلیارد به ویژه به بانوان، رویکردم تلفیق روش‌های مدرن آموزشی با شناخت نقاط ضعف هر شاگرد است. قهرمان کشوری بانوان در ۱۴۰۱ و مدرس تأیید‌شده فدراسیون.',
    certifications:['مدرک ملی B فدراسیون','مربی ویژه بانوان','گواهینامه داوری داخلی'],
    achievements:['قهرمانی کشوری بانوان ۱۴۰۱','سوم آسیا ۱۴۰۰','بهترین مربی بانوان ۱۴۰۲'],
    specialties:['پاکت بیلیارد','آموزش بانوان','مهارت‌های پایه','نشانه‌گیری دقیق'],
    students:95, phone:'09131234567', whatsapp:'989131234567',
    schedule:[
      {day:'شنبه',    active:false, slots:[]},
      {day:'یک‌شنبه', active:true,  slots:['۱۰:۰۰','۱۲:۰۰','۱۶:۰۰']},
      {day:'دوشنبه',  active:true,  slots:['۱۰:۰۰','۱۴:۰۰','۱۶:۰۰']},
      {day:'سه‌شنبه', active:false, slots:[]},
      {day:'چهارشنبه',active:true,  slots:['۱۰:۰۰','۱۴:۰۰']},
      {day:'پنج‌شنبه',active:true,  slots:['۱۰:۰۰','۱۲:۰۰']},
      {day:'جمعه',    active:false, slots:[]},
    ],
    gallery:[
      {id:'g1',url:img(2),caption:'کلاس پاکت بیلیارد بانوان'},{id:'g2',url:img(1),caption:'آموزش نشانه‌گیری'},
      {id:'g3',url:img(0),caption:'جلسه خصوصی'},{id:'g4',url:img(3),caption:'تمرین گروهی'},
      {id:'g5',url:img(2),caption:'مسابقات داخلی'},{id:'g6',url:img(1),caption:'کلاس مبتدیان'},
    ],
    videos:[
      {id:'v1',thumbnail:img(2),title:'آموزش پایه‌های پاکت بیلیارد',duration:'۱۰:۰۰',views:'۵ هزار'},
      {id:'v2',thumbnail:img(1),title:'تکنیک‌های نشانه‌گیری',duration:'۷:۳۰',views:'۳.۵ هزار'},
      {id:'v3',thumbnail:img(0),title:'کنترل کیوبال در پاکت',duration:'۱۲:۱۵',views:'۶ هزار'},
      {id:'v4',thumbnail:img(3),title:'ضربات چالشی پاکت',duration:'۱۸:۰۰',views:'۴ هزار'},
    ],
    posts:[
      {id:'p1',image:img(2),caption:'کلاس پر انرژی امروز 🎱',date:'۱۴۰۴/۰۴/۰۶',likes:221,tall:false},
      {id:'p2',image:img(1),caption:'شاگردان پیشرفت خوبی داشتن 💪',date:'۱۴۰۴/۰۳/۳۰',likes:178,tall:true},
      {id:'p3',image:img(0),caption:'قهرمانی باشگاه 🏆',date:'۱۴۰۴/۰۳/۲۲',likes:445,tall:false},
      {id:'p4',image:img(3),caption:'لوازم جدید کلاس آماده',date:'۱۴۰۴/۰۳/۱۵',likes:132,tall:true},
      {id:'p5',image:img(2),caption:'تمرین روزانه 🎯',date:'۱۴۰۴/۰۳/۱۰',likes:198,tall:false},
      {id:'p6',image:img(1),caption:'موفقیت شاگردانم 🌟',date:'۱۴۰۴/۰۳/۰۲',likes:567,tall:true},
    ],
  },
  {
    id:'4', name:'سینا محمدی', specialty:'pocket', city:'شیراز',
    experience:5, rating:4.5, reviewCount:76, sessionPrice:200000, groupPrice:90000,
    badge:'مربی جوان', badgeColor:'#16A34A', verified:true,
    hasStory:true, storyImage:'/images/shop/Ball-1.jpg',
    bio:'مربی جوان و قهرمان لیگ برتر با انرژی بالا و روش‌های نوین تدریس',
    fullBio:'مربی جوان و پرانرژی با ۵ سال تجربه در آموزش پاکت بیلیارد. روش تدریسم بر پایه فناوری‌های نوین (آنالیز ویدیویی و نرم‌افزارهای مدرن) استوار است. قهرمان لیگ برتر جوانان ۱۴۰۲.',
    certifications:['مدرک C فدراسیون ایران','گواهینامه مربیگری جوانان'],
    achievements:['قهرمانی لیگ برتر جوانان ۱۴۰۲','دوم استانی ۱۴۰۱'],
    specialties:['پاکت بیلیارد','آموزش با ویدیو آنالیز','تکنیک مدرن'],
    students:52, phone:'09171234567', whatsapp:'989171234567',
    schedule:[
      {day:'شنبه',    active:true,  slots:['۱۵:۰۰','۱۷:۰۰','۱۹:۰۰']},
      {day:'یک‌شنبه', active:true,  slots:['۱۵:۰۰','۱۷:۰۰']},
      {day:'دوشنبه',  active:false, slots:[]},
      {day:'سه‌شنبه', active:true,  slots:['۱۵:۰۰','۱۷:۰۰','۱۹:۰۰']},
      {day:'چهارشنبه',active:true,  slots:['۱۵:۰۰','۱۷:۰۰']},
      {day:'پنج‌شنبه',active:false, slots:[]},
      {day:'جمعه',    active:true,  slots:['۱۰:۰۰','۱۲:۰۰']},
    ],
    gallery:[
      {id:'g1',url:img(2),caption:'کلاس جوانان'},{id:'g2',url:img(3),caption:'آموزش مدرن'},
      {id:'g3',url:img(1),caption:'ویدیو آنالیز'},{id:'g4',url:img(0),caption:'تمرین گروهی'},
      {id:'g5',url:img(2),caption:'مسابقات'},{id:'g6',url:img(3),caption:'کلاس خصوصی'},
    ],
    videos:[
      {id:'v1',thumbnail:img(2),title:'پاکت بیلیارد برای مبتدیان',duration:'۸:۰۰',views:'۳ هزار'},
      {id:'v2',thumbnail:img(1),title:'آنالیز تکنیک با ویدیو',duration:'۱۱:۲۰',views:'۵ هزار'},
      {id:'v3',thumbnail:img(0),title:'ضربات پیشرفته پاکت',duration:'۱۶:۳۰',views:'۲.۵ هزار'},
      {id:'v4',thumbnail:img(3),title:'آموزش استراتژی',duration:'۱۳:۴۵',views:'۴ هزار'},
    ],
    posts:[
      {id:'p1',image:img(2),caption:'کلاس آخر هفته 💪',date:'۱۴۰۴/۰۴/۰۷',likes:167,tall:true},
      {id:'p2',image:img(1),caption:'آموزش با تکنولوژی جدید 🎱',date:'۱۴۰۴/۰۳/۲۸',likes:234,tall:false},
      {id:'p3',image:img(0),caption:'مسابقات جوانان 🏆',date:'۱۴۰۴/۰۳/۲۰',likes:389,tall:true},
      {id:'p4',image:img(3),caption:'تمرین روزانه',date:'۱۴۰۴/۰۳/۱۲',likes:98,tall:false},
      {id:'p5',image:img(2),caption:'شاگردان جوان 🌟',date:'۱۴۰۴/۰۳/۰۶',likes:276,tall:true},
      {id:'p6',image:img(1),caption:'تکنیک جدید یاد گرفتیم',date:'۱۴۰۴/۰۲/۲۸',likes:145,tall:false},
    ],
  },
  {
    id:'5', name:'علی حسینی', specialty:'highball', city:'تهران',
    experience:10, rating:4.6, reviewCount:98, sessionPrice:320000, groupPrice:140000,
    badge:'مربی ملی', badgeColor:GOLD, verified:true,
    hasStory:false, storyImage:'',
    bio:'متخصص هی‌بال و مربی تیم ملی جوانان با روش‌های تخصصی آموزش',
    fullBio:'۱۰ سال تخصص در هی‌بال و آموزش به صدها شاگرد از سطح مبتدی تا ملی‌پوش. مربی تیم ملی جوانان در دوره ۱۴۰۰ تا ۱۴۰۲ و صاحب مدرک A از فدراسیون ایران.',
    certifications:['مدرک A فدراسیون ایران','مربی تیم ملی جوانان','گواهینامه ارزیاب فنی'],
    achievements:['مربی سال ۱۴۰۰','تیم ملی جوانان ۳ دوره','پرورش ۵ قهرمان استانی'],
    specialties:['هی‌بال تخصصی','آموزش مقدماتی تا پیشرفته','تمرین قدرتی'],
    students:120, phone:'09111234567', whatsapp:'989111234567',
    schedule:[
      {day:'شنبه',    active:true,  slots:['۸:۰۰','۱۰:۰۰','۱۶:۰۰']},
      {day:'یک‌شنبه', active:true,  slots:['۸:۰۰','۱۶:۰۰','۱۸:۰۰']},
      {day:'دوشنبه',  active:true,  slots:['۱۰:۰۰','۱۴:۰۰','۱۶:۰۰']},
      {day:'سه‌شنبه', active:false, slots:[]},
      {day:'چهارشنبه',active:true,  slots:['۱۰:۰۰','۱۴:۰۰']},
      {day:'پنج‌شنبه',active:false, slots:[]},
      {day:'جمعه',    active:true,  slots:['۸:۰۰','۱۰:۰۰']},
    ],
    gallery:[
      {id:'g1',url:img(0),caption:'کلاس هی‌بال'},{id:'g2',url:img(2),caption:'تمرین گروهی'},
      {id:'g3',url:img(3),caption:'مسابقات'},{id:'g4',url:img(1),caption:'جلسه خصوصی'},
      {id:'g5',url:img(0),caption:'تیم جوانان'},{id:'g6',url:img(2),caption:'آموزش پایه'},
    ],
    videos:[
      {id:'v1',thumbnail:img(0),title:'مقدمات هی‌بال',duration:'۱۰:۳۰',views:'۶ هزار'},
      {id:'v2',thumbnail:img(2),title:'تکنیک‌های پیشرفته هی‌بال',duration:'۱۴:۰۰',views:'۸ هزار'},
      {id:'v3',thumbnail:img(1),title:'بازی تاکتیکی',duration:'۹:۴۵',views:'۳.۵ هزار'},
      {id:'v4',thumbnail:img(3),title:'آمادگی مسابقات',duration:'۱۷:۲۰',views:'۱۰ هزار'},
    ],
    posts:[
      {id:'p1',image:img(0),caption:'تمرین صبح با تیم 🎱',date:'۱۴۰۴/۰۴/۰۵',likes:189,tall:false},
      {id:'p2',image:img(2),caption:'فینال مسابقات جوانان 🏆',date:'۱۴۰۴/۰۳/۲۷',likes:423,tall:true},
      {id:'p3',image:img(3),caption:'تمرین سخت امروز 💪',date:'۱۴۰۴/۰۳/۱۸',likes:156,tall:false},
      {id:'p4',image:img(1),caption:'شاگردانم افتخارمن 🌟',date:'۱۴۰۴/۰۳/۱۰',likes:534,tall:true},
      {id:'p5',image:img(0),caption:'کلاس گروهی هفته',date:'۱۴۰۴/۰۳/۰۳',likes:212,tall:false},
      {id:'p6',image:img(2),caption:'راهی برای قهرمانی 🎯',date:'۱۴۰۴/۰۲/۲۵',likes:345,tall:true},
    ],
  },
  {
    id:'6', name:'رضا ابراهیمی', specialty:'carom', city:'تبریز',
    experience:18, rating:4.9, reviewCount:256, sessionPrice:450000, groupPrice:180000,
    badge:'مربی بین‌المللی', badgeColor:'#7C3AED', verified:true,
    hasStory:true, storyImage:'/images/shop/pool_chalk_1.jpg',
    bio:'پیشکسوت کارامبول با ۱۸ سال تجربه تدریس در کشورهای خاورمیانه',
    fullBio:'با ۱۸ سال سابقه در کارامبول در ایران و کشورهای همسایه، یکی از معدود مربیانی هستم که مدرک A فدراسیون جهانی UMB را دارم. رویکرد من ترکیب تکنیک‌های کلاسیک اروپایی با شیوه‌های مدرن آسیایی است.',
    certifications:['مدرک A فدراسیون جهانی UMB','مربی درجه یک فدراسیون ایران','داور بین‌المللی درجه B'],
    achievements:['قهرمانی آسیا ۱۳۹۲','مدرب برتر آسیا ۱۳۹۸','پرورش ۲ قهرمان جهانی'],
    specialties:['کارامبول سه کوشن','بندبازی','استراتژی پیشرفته','بیلیارد هنری'],
    students:310, phone:'09141234567', whatsapp:'989141234567',
    schedule:[
      {day:'شنبه',    active:true,  slots:['۱۰:۰۰','۱۴:۰۰','۱۸:۰۰']},
      {day:'یک‌شنبه', active:true,  slots:['۱۰:۰۰','۱۶:۰۰']},
      {day:'دوشنبه',  active:true,  slots:['۱۰:۰۰','۱۲:۰۰','۱۸:۰۰']},
      {day:'سه‌شنبه', active:false, slots:[]},
      {day:'چهارشنبه',active:true,  slots:['۱۰:۰۰','۱۴:۰۰','۱۶:۰۰']},
      {day:'پنج‌شنبه',active:true,  slots:['۱۰:۰۰','۱۲:۰۰']},
      {day:'جمعه',    active:false, slots:[]},
    ],
    gallery:[
      {id:'g1',url:img(3),caption:'کلاس کارامبول'},{id:'g2',url:img(0),caption:'تمرین سه‌کوشن'},
      {id:'g3',url:img(1),caption:'مسابقات آسیا'},{id:'g4',url:img(2),caption:'جلسه خصوصی'},
      {id:'g5',url:img(3),caption:'کلاس پیشرفته'},{id:'g6',url:img(0),caption:'آموزش گروهی'},
    ],
    videos:[
      {id:'v1',thumbnail:img(3),title:'کارامبول سه‌کوشن برای مبتدیان',duration:'۱۶:۰۰',views:'۲۰ هزار'},
      {id:'v2',thumbnail:img(0),title:'بندبازی حرفه‌ای',duration:'۱۱:۴۵',views:'۱۸ هزار'},
      {id:'v3',thumbnail:img(1),title:'استراتژی پیشرفته کارامبول',duration:'۲۲:۳۰',views:'۱۵ هزار'},
      {id:'v4',thumbnail:img(2),title:'تکنیک‌های اروپایی',duration:'۱۹:۱۵',views:'۱۲ هزار'},
    ],
    posts:[
      {id:'p1',image:img(3),caption:'کارامبول، هنر خالص بیلیارد 🎱',date:'۱۴۰۴/۰۴/۰۹',likes:456,tall:true},
      {id:'p2',image:img(0),caption:'تمرین سه‌کوشن امروز 💪',date:'۱۴۰۴/۰۴/۰۱',likes:312,tall:false},
      {id:'p3',image:img(1),caption:'چند سال پیش در مسابقات آسیا 🏆',date:'۱۴۰۴/۰۳/۲۵',likes:678,tall:true},
      {id:'p4',image:img(2),caption:'لوازم تخصصی کارامبول',date:'۱۴۰۴/۰۳/۱۸',likes:234,tall:false},
      {id:'p5',image:img(3),caption:'شاگرد جدید مشتاق 🌟',date:'۱۴۰۴/۰۳/۱۲',likes:389,tall:true},
      {id:'p6',image:img(0),caption:'جلسه گروهی آخر هفته',date:'۱۴۰۴/۰۳/۰۶',likes:267,tall:false},
    ],
  },
]

// ── Avatar ────────────────────────────────────────────────────
function Avatar({ id, name, size, ring, onClick }: {
  id:string; name:string; size:number; ring?:boolean; onClick?:()=>void
}) {
  const [c1,c2] = getGrad(id)
  const el = (
    <div style={{ width:size, height:size, borderRadius:'50%', background:`linear-gradient(135deg,${c1},${c2})`,
      display:'flex', alignItems:'center', justifyContent:'center',
      fontSize:size*0.38, fontWeight:900, color:'#fff', flexShrink:0, userSelect:'none' }}>
      {name.charAt(0)}
    </div>
  )
  if (!ring) return <div onClick={onClick} style={{ cursor: onClick?'pointer':'default' }}>{el}</div>
  return (
    <div onClick={onClick} style={{ cursor:onClick?'pointer':'default',
      width:size+8, height:size+8, borderRadius:'50%',
      background:`linear-gradient(135deg,${GOLD},#FFE88A,${GOLD_D})`,
      padding:4, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
      <div style={{ width:size, height:size, borderRadius:'50%', background:'rgba(5,5,4,0.40)', padding:2,
        display:'flex', alignItems:'center', justifyContent:'center' }}>
        {el}
      </div>
    </div>
  )
}

// ── Stars ─────────────────────────────────────────────────────
function Stars({ rating, size=13 }:{ rating:number; size?:number }) {
  return (
    <div style={{ display:'flex', gap:2 }}>
      {[1,2,3,4,5].map(i=>{
        const full=i<=Math.floor(rating), half=!full&&i-0.5<=rating
        return (
          <svg key={i} width={size} height={size} viewBox="0 0 24 24"
            fill={full?'#F59E0B':half?'url(#h)':'none'} stroke="#F59E0B" strokeWidth={full||half?0:1.5}>
            {half&&<defs><linearGradient id="h" x1="0" x2="1"><stop offset="50%" stopColor="#F59E0B"/><stop offset="50%" stopColor="transparent"/></linearGradient></defs>}
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        )
      })}
    </div>
  )
}

// ── Story Modal ────────────────────────────────────────────────
function StoryModal({ coach, onClose }: { coach:CoachFull; onClose:()=>void }) {
  const [progress, setProgress] = useState(0)
  const [c1,c2] = getGrad(coach.id)
  const sp = SPECS[coach.specialty]
  useEffect(() => {
    let p=0; const id=setInterval(()=>{ p+=2; setProgress(p); if(p>=100){clearInterval(id);setTimeout(onClose,200)} },100)
    return ()=>clearInterval(id)
  },[coach.id,onClose])
  useEffect(() => {
    const fn=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }
    window.addEventListener('keydown',fn); return ()=>window.removeEventListener('keydown',fn)
  },[onClose])
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.92)',backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn 0.2s ease both' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'min(420px,92vw)',height:'min(745px,90vh)',borderRadius:24,overflow:'hidden',position:'relative',background:coach.storyImage?'transparent':`linear-gradient(160deg,${c1},${c2})`,boxShadow:'0 24px 80px rgba(0,0,0,0.6)' }}>
        {coach.storyImage&&<div style={{ position:'absolute',inset:0,backgroundImage:`url(${coach.storyImage})`,backgroundSize:'cover',backgroundPosition:'center' }}><div style={{ position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,0.5) 0%,rgba(0,0,0,0.1) 40%,rgba(0,0,0,0.6) 100%)' }}/></div>}
        <div style={{ position:'absolute',top:16,left:16,right:16,height:3,background:'rgba(255,255,255,0.25)',borderRadius:4,overflow:'hidden',zIndex:10 }}>
          <div style={{ height:'100%',width:`${progress}%`,background:'#fff',borderRadius:4,transition:'width 0.08s linear' }}/>
        </div>
        <div style={{ position:'absolute',top:30,right:0,left:0,padding:'0 16px',display:'flex',alignItems:'center',gap:10,zIndex:10 }}>
          <Avatar id={coach.id} name={coach.name} size={40} ring />
          <div>
            <div style={{ fontSize:14,fontWeight:800,color:'#fff',textShadow:'0 1px 4px rgba(0,0,0,0.5)' }}>{coach.name}</div>
            {sp&&<div style={{ fontSize:11,color:'rgba(255,255,255,0.75)',fontWeight:600 }}>{sp.label}</div>}
          </div>
          <button onClick={onClose} style={{ marginRight:'auto',width:32,height:32,borderRadius:'50%',background:'rgba(0,0,0,0.35)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.20)',color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',lineHeight:1 }}>×</button>
        </div>
        <div style={{ position:'absolute',bottom:0,left:0,right:0,padding:'40px 20px 28px',background:'linear-gradient(to top,rgba(0,0,0,0.65),transparent)',zIndex:10 }}>
          <p style={{ fontSize:15,color:'#fff',margin:0,lineHeight:1.7,fontWeight:500 }}>{coach.bio}</p>
        </div>
      </div>
    </div>
  )
}

// ── Lightbox ──────────────────────────────────────────────────
function Lightbox({ imgs, idx: initialIdx, onClose }: { imgs:GalleryImg[]; idx:number; onClose:()=>void }) {
  const [idx, setIdx] = useState(initialIdx)
  const cur = imgs[idx]
  const prev = useCallback(()=>setIdx(i=>(i-1+imgs.length)%imgs.length),[imgs.length])
  const next = useCallback(()=>setIdx(i=>(i+1)%imgs.length),[imgs.length])
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{if(e.key==='Escape')onClose();if(e.key==='ArrowLeft')next();if(e.key==='ArrowRight')prev()}
    window.addEventListener('keydown',fn); return ()=>window.removeEventListener('keydown',fn)
  },[onClose,prev,next])
  if(!cur) return null
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.94)',backdropFilter:'blur(24px)',display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn 0.2s ease both' }}>
      <div onClick={e=>e.stopPropagation()} style={{ position:'relative',maxWidth:'min(860px,92vw)',width:'100%' }}>
        <img src={cur.url} alt={cur.caption} style={{ width:'100%',maxHeight:'78vh',objectFit:'contain',borderRadius:16,display:'block',boxShadow:'0 24px 80px rgba(0,0,0,0.5)' }}/>
        <div style={{ textAlign:'center',marginTop:14,fontSize:14,color:'rgba(255,255,255,0.65)',fontWeight:500 }}>{cur.caption}</div>
        <div style={{ position:'absolute',bottom:'50%',left:-52,right:-52,display:'flex',justifyContent:'space-between',pointerEvents:'none' }}>
          {[{fn:prev,dir:'R'},{fn:next,dir:'L'}].map(({fn:handler,dir})=>(
            <button key={dir} onClick={e=>{e.stopPropagation();handler()}} style={{ width:44,height:44,borderRadius:'50%',background:'rgba(255,255,255,0.12)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.18)',color:'#fff',fontSize:20,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'all' }}>
              {dir==='R'?'›':'‹'}
            </button>
          ))}
        </div>
        <button onClick={onClose} style={{ position:'absolute',top:-14,right:-14,width:36,height:36,borderRadius:'50%',background:'rgba(255,255,255,0.12)',backdropFilter:'blur(16px)',border:'1px solid rgba(255,255,255,0.18)',color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
        <div style={{ position:'absolute',bottom:-32,left:'50%',transform:'translateX(-50%)',fontSize:12,color:'rgba(255,255,255,0.40)' }}>{idx+1} / {imgs.length}</div>
      </div>
    </div>
  )
}

// ── Video Modal ────────────────────────────────────────────────
function VideoModal({ video, onClose }: { video:Video; onClose:()=>void }) {
  useEffect(()=>{
    const fn=(e:KeyboardEvent)=>{ if(e.key==='Escape') onClose() }
    window.addEventListener('keydown',fn); return ()=>window.removeEventListener('keydown',fn)
  },[onClose])
  return (
    <div onClick={onClose} style={{ position:'fixed',inset:0,zIndex:9998,background:'rgba(0,0,0,0.94)',backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'center',animation:'fadeIn 0.2s ease both' }}>
      <div onClick={e=>e.stopPropagation()} style={{ width:'min(720px,90vw)',borderRadius:20,overflow:'hidden',background:'#111',boxShadow:'0 24px 80px rgba(0,0,0,0.6)',position:'relative' }}>
        <div style={{ aspectRatio:'16/9',background:`url(${video.thumbnail}) center/cover`,position:'relative' }}>
          <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.55)' }}/>
          <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
            <div style={{ width:72,height:72,borderRadius:'50%',background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 40px ${GOLD}55` }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
            </div>
          </div>
          <div style={{ position:'absolute',bottom:14,left:14,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(8px)',borderRadius:8,padding:'3px 10px',fontSize:12,fontWeight:700,color:'#fff' }}>{video.duration}</div>
          <button onClick={onClose} style={{ position:'absolute',top:14,left:14,width:34,height:34,borderRadius:'50%',background:'rgba(0,0,0,0.55)',border:'1px solid rgba(255,255,255,0.18)',color:'#fff',fontSize:18,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center' }}>×</button>
        </div>
        <div style={{ padding:'16px 20px 20px' }}>
          <h3 style={{ fontSize:16,fontWeight:800,color:'#fff',margin:'0 0 6px' }}>{video.title}</h3>
          <p style={{ fontSize:13,color:'rgba(255,255,255,0.45)',margin:0 }}>{video.views} بازدید</p>
        </div>
      </div>
    </div>
  )
}

// ══════════════════════════════════════════════════════════════
//  Main Page
// ══════════════════════════════════════════════════════════════
export default function CoachProfilePage() {
  const params = useParams()
  const id     = Array.isArray(params.id) ? params.id[0] : (params.id ?? '1')
  const coach  = COACHES_DATA.find(c => c.id === id) ?? COACHES_DATA[0]!

  const [activeTab,   setActiveTab]   = useState<'gallery'|'videos'|'posts'>('gallery')
  const [storyOpen,   setStoryOpen]   = useState(false)
  const [lightbox,    setLightbox]    = useState<{idx:number}|null>(null)
  const [activeVideo, setActiveVideo] = useState<Video|null>(null)

  const sp       = SPECS[coach.specialty]
  const [c1, c2] = getGrad(coach.id)
  const heroGrad = sp?.grad ?? `linear-gradient(135deg,${c1},${c2})`

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes fadeIn { from{opacity:0} to{opacity:1} }
        * { box-sizing:border-box; }
        .tab-btn { transition:all 0.2s; cursor:pointer; }
        .tab-btn:hover { opacity:0.85; }
        .gal-img  { transition:transform 0.3s; cursor:pointer; }
        .gal-img:hover { transform:scale(1.04); }
        .vid-card { transition:all 0.28s cubic-bezier(0.22,1,0.36,1); cursor:pointer; }
        .vid-card:hover { transform:translateY(-4px); box-shadow:0 16px 44px rgba(0,0,0,0.12)!important; }
        .post-item { break-inside:avoid; margin-bottom:12px; }
        @media(max-width:900px) { .prof-cols{grid-template-columns:1fr!important;} .stats-row{grid-template-columns:repeat(2,1fr)!important;} }
        @media(max-width:580px) { .stats-row{grid-template-columns:repeat(2,1fr)!important;} .gal-grid{grid-template-columns:repeat(2,1fr)!important;} .vid-grid{grid-template-columns:1fr!important;} }
      `}</style>

      {/* ═══ HERO ════════════════════════════════════════════════ */}
      <section style={{ minHeight:420, position:'relative', overflow:'hidden', direction:'rtl', fontFamily:'Vazirmatn,Tahoma,sans-serif' }}>
        {/* background */}
        <div style={{ position:'absolute', inset:'-10% 0', background: coach.storyImage ? `url(${coach.storyImage}) center/cover` : heroGrad }}>
          <div style={{ position:'absolute',inset:0, background:'linear-gradient(180deg,rgba(4,4,3,0.70) 0%,rgba(4,4,3,0.32) 45%,rgba(4,4,3,0.88) 100%)' }}/>
          <div style={{ position:'absolute',inset:0, background:`radial-gradient(ellipse 60% 70% at 80% 50%,${sp?.color??GOLD}09 0%,transparent 70%)` }}/>
        </div>
        {/* ambient circle */}
        <div style={{ position:'absolute',top:'15%',left:'10%',width:280,height:280,borderRadius:'50%',border:`1px solid ${sp?.color??GOLD}10`,pointerEvents:'none',zIndex:1 }}/>

        {/* top nav */}
        <div style={{ position:'absolute',top:20,right:'clamp(16px,4vw,48px)',left:'clamp(16px,4vw,48px)',zIndex:10,display:'flex',justifyContent:'space-between' }}>
          <Link href="/coaches" style={{ textDecoration:'none',display:'inline-flex',alignItems:'center',gap:7,background:'rgba(255,255,255,0.10)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.16)',borderRadius:12,color:'rgba(255,255,255,0.80)',fontSize:13,fontWeight:600,padding:'9px 16px' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round"><polyline points="15 18 9 12 15 6"/></svg>
            بازگشت به مربیان
          </Link>
        </div>

        {/* hero content */}
        <div style={{ position:'relative',zIndex:5,maxWidth:1100,margin:'0 auto',padding:'clamp(80px,12vw,120px) clamp(16px,4vw,48px) 40px',display:'flex',alignItems:'flex-end',gap:24,flexWrap:'wrap' }}>
          {/* avatar + story */}
          <div style={{ position:'relative',flexShrink:0 }}>
            <Avatar
              id={coach.id} name={coach.name} size={90}
              ring={coach.hasStory}
              onClick={() => coach.hasStory && setStoryOpen(true)}
            />
            {coach.hasStory && (
              <div style={{ position:'absolute',bottom:-4,left:'50%',transform:'translateX(-50%)',background:'rgba(0,0,0,0.55)',backdropFilter:'blur(6px)',borderRadius:12,padding:'2px 8px',fontSize:10,fontWeight:700,color:'rgba(255,255,255,0.9)',whiteSpace:'nowrap' }}>
                استوری
              </div>
            )}
          </div>

          {/* info */}
          <div style={{ flex:1, minWidth:220 }}>
            {/* badges row */}
            <div style={{ display:'flex',gap:7,flexWrap:'wrap',marginBottom:10 }}>
              <span style={{ fontSize:11,fontWeight:700,color:coach.badgeColor,background:`${coach.badgeColor}15`,border:`1px solid ${coach.badgeColor}30`,borderRadius:20,padding:'3px 11px',backdropFilter:'blur(8px)' }}>{coach.badge}</span>
              {sp && <span style={{ fontSize:11,fontWeight:700,color:sp.color,background:`${sp.color}15`,border:`1px solid ${sp.color}30`,borderRadius:20,padding:'3px 11px',backdropFilter:'blur(8px)' }}>{sp.label}</span>}
              {coach.verified && (
                <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:11,fontWeight:700,color:GOLD,background:'rgba(199,166,106,0.12)',border:'1px solid rgba(199,166,106,0.25)',borderRadius:20,padding:'3px 11px',backdropFilter:'blur(8px)' }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill={GOLD}/><polyline points="7 12 10.5 15.5 17 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  تأیید شده
                </span>
              )}
            </div>
            {/* name */}
            <h1 style={{ fontSize:'clamp(24px,4.5vw,42px)',fontWeight:900,color:'#fff',margin:'0 0 8px',lineHeight:1.15,letterSpacing:'-0.025em',textShadow:'0 2px 12px rgba(0,0,0,0.4)' }}>{coach.name}</h1>
            {/* meta */}
            <div style={{ display:'flex',alignItems:'center',gap:14,flexWrap:'wrap' }}>
              <div style={{ display:'flex',alignItems:'center',gap:5,fontSize:13,color:'rgba(255,255,255,0.65)' }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                {coach.city}
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:6 }}>
                <Stars rating={coach.rating} size={12}/>
                <span style={{ fontSize:14,fontWeight:800,color:'#fff' }}>{coach.rating}</span>
                <span style={{ fontSize:12,color:'rgba(255,255,255,0.45)' }}>({fmt(coach.reviewCount)} نظر)</span>
              </div>
              <span style={{ fontSize:12,color:'rgba(255,255,255,0.50)',display:'flex',alignItems:'center',gap:4 }}>
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>
                {fmt(coach.students)} شاگرد
              </span>
            </div>
          </div>

          {/* CTA buttons */}
          <div style={{ display:'flex',gap:10,flexShrink:0,flexWrap:'wrap' }}>
            <a href={`https://wa.me/${coach.whatsapp}?text=سلام، می‌خوام کلاس بیلیارد رزرو کنم`}
              target="_blank" rel="noopener noreferrer"
              style={{ textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,color:'#3a2800',fontSize:14,fontWeight:800,padding:'12px 22px',borderRadius:14,boxShadow:`inset 0 1.5px 0 rgba(255,255,255,0.30), 0 6px 20px rgba(199,166,106,0.42)`,whiteSpace:'nowrap' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
              رزرو کلاس
            </a>
            <a href={`tel:${coach.phone}`}
              style={{ textDecoration:'none',display:'inline-flex',alignItems:'center',gap:8,background:'rgba(255,255,255,0.10)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:'1px solid rgba(255,255,255,0.22)',color:'rgba(255,255,255,0.90)',fontSize:14,fontWeight:700,padding:'12px 20px',borderRadius:14,boxShadow:'inset 0 1.5px 0 rgba(255,255,255,0.15)',whiteSpace:'nowrap' }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 9.82 19.79 19.79 0 01.46 1.22 2 2 0 012.44.04h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l.75-.75a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.73 2.02z"/></svg>
              تماس مستقیم
            </a>
          </div>
        </div>
      </section>

      {/* ═══ STATS BAR ══════════════════════════════════════════ */}
      <div style={{ background:'#F0EDE7', direction:'rtl', fontFamily:'Vazirmatn,Tahoma,sans-serif' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'20px clamp(16px,4vw,48px)' }}>
          <div className="stats-row" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12 }}>
            {[
              {val:`${coach.experience}+`, label:'سال سابقه', color:sp?.color??GOLD},
              {val:fmt(coach.students),    label:'شاگرد',      color:'#7C3AED'},
              {val:String(coach.rating),   label:'امتیاز',     color:'#F59E0B'},
              {val:fmt(coach.reviewCount), label:'نظر ثبت‌شده', color:'#16A34A'},
            ].map((s,i)=>(
              <div key={i} style={{ background:LQ_BG,backdropFilter:'blur(40px) saturate(200%)',WebkitBackdropFilter:'blur(40px) saturate(200%)',border:LQ_BOR,borderRadius:16,boxShadow:LQ_SHAD,padding:'16px',textAlign:'center',animation:`fadeUp 0.4s ${i*0.07}s ease both` }}>
                <div style={{ fontSize:'clamp(22px,3vw,28px)',fontWeight:900,color:s.color,letterSpacing:'-0.02em',lineHeight:1 }}>{s.val}</div>
                <div style={{ fontSize:12,color:TEXT_M,fontWeight:600,marginTop:5 }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ════════════════════════════════════════ */}
      <div style={{ background:'#F7F7F5', direction:'rtl', fontFamily:'Vazirmatn,Tahoma,sans-serif', color:TEXT, minHeight:'60vh' }}>
        <div style={{ maxWidth:1100, margin:'0 auto', padding:'28px clamp(16px,4vw,48px) 80px' }}>
          <div className="prof-cols" style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' }}>

            {/* ── LEFT: About + Tabs ── */}
            <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

              {/* About card */}
              <div style={{ background:LQ_BG,backdropFilter:'blur(40px) saturate(200%)',WebkitBackdropFilter:'blur(40px) saturate(200%)',border:LQ_BOR,borderRadius:20,boxShadow:LQ_SHAD,padding:'24px',position:'relative',overflow:'hidden',animation:'fadeUp 0.4s ease both' }}>
                <div style={{ position:'absolute',top:0,left:0,right:0,height:'46%',background:'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)',pointerEvents:'none' }}/>
                <div style={{ position:'relative',zIndex:1 }}>
                  {/* section header */}
                  <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:16 }}>
                    <div style={{ width:30,height:30,borderRadius:9,background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 4px 12px rgba(199,166,106,0.32)`,flexShrink:0 }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.3" strokeLinecap="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                    </div>
                    <div>
                      <p style={{ fontSize:10,color:GOLD,letterSpacing:'0.18em',fontWeight:700,margin:'0 0 1px' }}>BIOGRAPHY</p>
                      <h2 style={{ fontSize:15,fontWeight:800,color:TEXT,margin:0 }}>درباره مربی</h2>
                    </div>
                  </div>
                  <p style={{ fontSize:14.5,color:TEXT_S,lineHeight:1.85,margin:'0 0 20px' }}>{coach.fullBio}</p>

                  {/* specialties */}
                  <div style={{ marginBottom:18 }}>
                    <div style={{ fontSize:11,color:TEXT_M,fontWeight:700,letterSpacing:'0.1em',marginBottom:8 }}>تخصص‌ها</div>
                    <div style={{ display:'flex',flexWrap:'wrap',gap:7 }}>
                      {coach.specialties.map(s=>(
                        <span key={s} style={{ fontSize:12.5,fontWeight:600,color:sp?.color??GOLD,background:sp?.bg??'rgba(199,166,106,0.1)',border:`1px solid ${sp?.color??GOLD}2e`,borderRadius:20,padding:'4px 12px' }}>{s}</span>
                      ))}
                    </div>
                  </div>

                  {/* certifications */}
                  <div style={{ marginBottom:18 }}>
                    <div style={{ fontSize:11,color:TEXT_M,fontWeight:700,letterSpacing:'0.1em',marginBottom:10 }}>مدارک و گواهینامه‌ها</div>
                    <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
                      {coach.certifications.map((c,i)=>(
                        <div key={i} style={{ display:'flex',alignItems:'center',gap:10,padding:'10px 14px',background:'rgba(245,158,11,0.05)',border:'1px solid rgba(245,158,11,0.14)',borderRadius:12 }}>
                          <span style={{ fontSize:16 }}>🏅</span>
                          <span style={{ fontSize:13,color:TEXT_S,fontWeight:600,flex:1 }}>{c}</span>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="11" fill={GOLD}/><polyline points="7 12 10.5 15.5 17 9" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* achievements */}
                  <div>
                    <div style={{ fontSize:11,color:TEXT_M,fontWeight:700,letterSpacing:'0.1em',marginBottom:10 }}>افتخارات</div>
                    <div style={{ display:'flex',flexDirection:'column',gap:7 }}>
                      {coach.achievements.map((a,i)=>(
                        <div key={i} style={{ display:'flex',alignItems:'center',gap:9,padding:'9px 13px',background:'rgba(199,166,106,0.05)',border:'1px solid rgba(199,166,106,0.12)',borderRadius:11 }}>
                          <svg width="13" height="13" viewBox="0 0 24 24" fill={GOLD}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                          <span style={{ fontSize:13,color:TEXT_S }}>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Tabs card */}
              <div style={{ background:LQ_BG,backdropFilter:'blur(40px) saturate(200%)',WebkitBackdropFilter:'blur(40px) saturate(200%)',border:LQ_BOR,borderRadius:20,boxShadow:LQ_SHAD,padding:'20px 24px 24px',position:'relative',overflow:'hidden',animation:'fadeUp 0.48s ease both' }}>
                <div style={{ position:'absolute',top:0,left:0,right:0,height:'46%',background:'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)',pointerEvents:'none' }}/>
                <div style={{ position:'relative',zIndex:1 }}>
                  {/* tab bar */}
                  <div style={{ display:'flex',gap:6,marginBottom:20 }}>
                    {([['gallery','گالری عکس'],['videos','ویدیوها'],['posts','پست‌ها']] as [typeof activeTab,string][]).map(([t,l])=>(
                      <button key={t} className="tab-btn" onClick={()=>setActiveTab(t)}
                        style={{ padding:'8px 18px',borderRadius:20,border:'none',fontFamily:'Vazirmatn,Tahoma,sans-serif',fontSize:13,fontWeight:700,cursor:'pointer',
                          background: activeTab===t ? `linear-gradient(135deg,${GOLD},${GOLD_D})` : 'rgba(255,255,255,0.78)',
                          color:      activeTab===t ? '#3a2800' : TEXT_S,
                          boxShadow:  activeTab===t ? `inset 0 1.5px 0 rgba(255,255,255,0.30), 0 4px 14px rgba(199,166,106,0.32)` : 'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 2px 6px rgba(0,0,0,0.05)',
                        }}>
                        {l}
                      </button>
                    ))}
                  </div>

                  {/* ── Gallery tab ── */}
                  {activeTab==='gallery' && (
                    <div className="gal-grid" style={{ display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:8,animation:'fadeIn 0.3s ease both' }}>
                      {coach.gallery.map((g,i)=>(
                        <div key={g.id} className="gal-img" onClick={()=>setLightbox({idx:i})}
                          style={{ aspectRatio:'1',borderRadius:12,overflow:'hidden',position:'relative' }}>
                          <img src={g.url} alt={g.caption} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>
                          <div style={{ position:'absolute',inset:0,background:'linear-gradient(to top,rgba(0,0,0,0.50) 0%,transparent 50%)',opacity:0,transition:'opacity 0.25s' }}
                            onMouseEnter={e=>(e.currentTarget.style.opacity='1')}
                            onMouseLeave={e=>(e.currentTarget.style.opacity='0')}>
                            <div style={{ position:'absolute',bottom:8,right:8,left:8,fontSize:11,color:'rgba(255,255,255,0.85)',fontWeight:600,lineHeight:1.4 }}>{g.caption}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Videos tab ── */}
                  {activeTab==='videos' && (
                    <div className="vid-grid" style={{ display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:12,animation:'fadeIn 0.3s ease both' }}>
                      {coach.videos.map(v=>(
                        <div key={v.id} className="vid-card" onClick={()=>setActiveVideo(v)}
                          style={{ borderRadius:14,overflow:'hidden',background:'#fff',border:'1px solid rgba(28,28,26,0.08)',boxShadow:'0 2px 10px rgba(0,0,0,0.05)' }}>
                          <div style={{ aspectRatio:'16/9',position:'relative',overflow:'hidden' }}>
                            <img src={v.thumbnail} alt={v.title} style={{ width:'100%',height:'100%',objectFit:'cover',display:'block',transition:'transform 0.4s' }}/>
                            <div style={{ position:'absolute',inset:0,background:'rgba(0,0,0,0.38)' }}/>
                            <div style={{ position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center' }}>
                              <div style={{ width:46,height:46,borderRadius:'50%',background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,display:'flex',alignItems:'center',justifyContent:'center',boxShadow:`0 0 24px ${GOLD}55` }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="#fff"><polygon points="5 3 19 12 5 21 5 3"/></svg>
                              </div>
                            </div>
                            <div style={{ position:'absolute',bottom:8,left:8,background:'rgba(0,0,0,0.65)',backdropFilter:'blur(6px)',borderRadius:7,padding:'2px 8px',fontSize:11,fontWeight:700,color:'#fff' }}>{v.duration}</div>
                          </div>
                          <div style={{ padding:'10px 12px 12px' }}>
                            <h4 style={{ fontSize:13,fontWeight:700,color:TEXT,margin:'0 0 4px',lineHeight:1.4,display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical',overflow:'hidden' }}>{v.title}</h4>
                            <p style={{ fontSize:11.5,color:TEXT_M,margin:0 }}>{v.views} بازدید</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ── Posts tab (masonry) ── */}
                  {activeTab==='posts' && (
                    <div style={{ columns:2,columnGap:12,animation:'fadeIn 0.3s ease both' }}>
                      {coach.posts.map(p=>(
                        <div key={p.id} className="post-item"
                          style={{ breakInside:'avoid',marginBottom:12,borderRadius:14,overflow:'hidden',background:'#fff',border:'1px solid rgba(28,28,26,0.07)',boxShadow:'0 2px 8px rgba(0,0,0,0.04)' }}>
                          <div style={{ aspectRatio:p.tall?'3/4':'4/3',overflow:'hidden' }}>
                            <img src={p.image} alt="" style={{ width:'100%',height:'100%',objectFit:'cover',display:'block' }}/>
                          </div>
                          <div style={{ padding:'10px 12px 12px' }}>
                            <p style={{ fontSize:12.5,color:TEXT_S,margin:'0 0 8px',lineHeight:1.65 }}>{p.caption}</p>
                            <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between' }}>
                              <span style={{ fontSize:11,color:TEXT_M }}>{p.date}</span>
                              <span style={{ display:'flex',alignItems:'center',gap:4,fontSize:11.5,color:TEXT_M }}>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                                {fmt(p.likes)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── RIGHT: Sidebar ── */}
            <div style={{ position:'sticky', top:20, display:'flex', flexDirection:'column', gap:16 }}>

              {/* Pricing card */}
              <div style={{ background:LQ_BG,backdropFilter:'blur(40px) saturate(200%)',WebkitBackdropFilter:'blur(40px) saturate(200%)',border:LQ_BOR,borderRadius:20,boxShadow:LQ_SHAD,padding:'22px',position:'relative',overflow:'hidden',animation:'fadeUp 0.5s ease both' }}>
                <div style={{ position:'absolute',top:0,left:0,right:0,height:'46%',background:'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)',pointerEvents:'none' }}/>
                <div style={{ position:'relative',zIndex:1 }}>
                  <div style={{ fontSize:10.5,color:GOLD,fontWeight:700,letterSpacing:'0.18em',marginBottom:14 }}>PRICING</div>
                  <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:18 }}>
                    {[{label:'کلاس خصوصی',price:coach.sessionPrice,sub:'هر جلسه'},{label:'کلاس گروهی',price:coach.groupPrice,sub:'هر نفر'}].map((p,i)=>(
                      <div key={i} style={{ padding:'14px 12px',borderRadius:14,background: i===0 ? `linear-gradient(135deg,${GOLD}18,${GOLD_D}0a)` : 'rgba(255,255,255,0.70)',border: i===0 ? `1.5px solid rgba(199,166,106,0.28)` : '1px solid rgba(255,255,255,0.80)',textAlign:'center' }}>
                        <div style={{ fontSize:11,color:i===0?GOLD_D:TEXT_M,fontWeight:700,marginBottom:6 }}>{p.label}</div>
                        <div style={{ fontSize:18,fontWeight:900,color:i===0?GOLD_D:TEXT,lineHeight:1 }}>{fmt(p.price)}</div>
                        <div style={{ fontSize:10.5,color:TEXT_M,marginTop:4 }}>تومان / {p.sub}</div>
                      </div>
                    ))}
                  </div>
                  {/* CTA */}
                  <a href={`https://wa.me/${coach.whatsapp}?text=سلام استاد ${coach.name}، می‌خوام کلاس رزرو کنم`}
                    target="_blank" rel="noopener noreferrer"
                    style={{ textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:`linear-gradient(135deg,${GOLD},${GOLD_D})`,color:'#3a2800',fontSize:14,fontWeight:800,padding:'13px',borderRadius:13,boxShadow:`inset 0 1.5px 0 rgba(255,255,255,0.30), 0 6px 20px rgba(199,166,106,0.36)`,marginBottom:8 }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                    رزرو از طریق واتساپ
                  </a>
                  <a href={`tel:${coach.phone}`}
                    style={{ textDecoration:'none',display:'flex',alignItems:'center',justifyContent:'center',gap:8,background:LQ_BG,backdropFilter:'blur(16px)',WebkitBackdropFilter:'blur(16px)',border:`1px solid rgba(199,166,106,0.35)`,color:GOLD_D,fontSize:13,fontWeight:700,padding:'11px',borderRadius:13,boxShadow:'inset 0 1.5px 0 rgba(255,255,255,0.95), 0 2px 8px rgba(199,166,106,0.10)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.5 9.82 19.79 19.79 0 01.46 1.22 2 2 0 012.44.04h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.91a16 16 0 006.29 6.29l.75-.75a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7a2 2 0 011.73 2.02z"/></svg>
                    {coach.phone}
                  </a>
                </div>
              </div>

              {/* Schedule card */}
              <div style={{ background:LQ_BG,backdropFilter:'blur(40px) saturate(200%)',WebkitBackdropFilter:'blur(40px) saturate(200%)',border:LQ_BOR,borderRadius:20,boxShadow:LQ_SHAD,padding:'22px',position:'relative',overflow:'hidden',animation:'fadeUp 0.55s ease both' }}>
                <div style={{ position:'absolute',top:0,left:0,right:0,height:'46%',background:'linear-gradient(180deg,rgba(255,255,255,0.55) 0%,transparent 100%)',pointerEvents:'none' }}/>
                <div style={{ position:'relative',zIndex:1 }}>
                  <div style={{ fontSize:10.5,color:GOLD,fontWeight:700,letterSpacing:'0.18em',marginBottom:14 }}>SCHEDULE</div>
                  <div style={{ display:'flex',flexDirection:'column',gap:9 }}>
                    {coach.schedule.map(day=>(
                      <div key={day.day} style={{ display:'flex',alignItems:'flex-start',gap:10 }}>
                        <div style={{ width:60,flexShrink:0,paddingTop:2 }}>
                          <span style={{ fontSize:11.5,fontWeight:700,color: day.active ? TEXT : TEXT_M }}>{day.day}</span>
                          {!day.active && <span style={{ display:'block',fontSize:10,color:TEXT_M,marginTop:1 }}>تعطیل</span>}
                        </div>
                        {day.active ? (
                          <div style={{ display:'flex',flexWrap:'wrap',gap:5 }}>
                            {day.slots.map(s=>(
                              <span key={s} style={{ fontSize:11,fontWeight:700,color:sp?.color??GOLD,background:sp?.bg??'rgba(199,166,106,0.10)',border:`1px solid ${sp?.color??GOLD}28`,borderRadius:8,padding:'3px 8px' }}>{s}</span>
                            ))}
                          </div>
                        ) : (
                          <div style={{ width:36,height:2,background:'rgba(28,28,26,0.09)',borderRadius:2,marginTop:8 }}/>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ Modals ══════════════════════════════════════════════ */}
      {storyOpen && coach.hasStory && <StoryModal coach={coach} onClose={()=>setStoryOpen(false)} />}
      {lightbox && <Lightbox imgs={coach.gallery} idx={lightbox.idx} onClose={()=>setLightbox(null)} />}
      {activeVideo && <VideoModal video={activeVideo} onClose={()=>setActiveVideo(null)} />}
    </>
  )
}
