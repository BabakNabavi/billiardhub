'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../store/auth.store';
import AuthGuard from '../../components/AuthGuard';
import {
  Package, TrendingUp, ShoppingBag, Star,
  Bell, Settings, ChevronRight, Eye, Edit,
  Trash2, Plus, Check, X, Clock, Truck,
  CheckCircle, AlertCircle, BarChart2, Users,
  MessageCircle, Zap, Camera, ChevronUp,
  ChevronDown, Shield, Award, RefreshCw,
} from 'lucide-react';

/* ══ types ══ */
type OrderStatus = 'pending'|'processing'|'shipped'|'delivered'|'cancelled';
type Tab = 'overview'|'products'|'orders'|'analytics'|'messages';

interface Order   { id:string; buyer:string; product:string; qty:number; total:number; status:OrderStatus; date:string; city:string; }
interface Product { id:string; title:string; category:string; price:number; stock:number; sold:number; rating:number; views:number; active:boolean; img:string; }
interface Msg     { id:string; buyer:string; product:string; text:string; time:string; unread:boolean; }

/* ══ data ══ */
const ORDERS: Order[] = [
  { id:'o1', buyer:'امیرحسین رضایی', product:'چوب Predator 314-3',       qty:1, total:9600000,  status:'delivered',  date:'۱۴۰۴/۰۳/۱۵', city:'تهران'  },
  { id:'o2', buyer:'سارا محمدی',     product:'ست توپ Aramith',            qty:1, total:3800000,  status:'shipped',    date:'۱۴۰۴/۰۳/۱۸', city:'مشهد'   },
  { id:'o3', buyer:'نیما کریمی',     product:'گچ Master Blue Diamond',    qty:3, total:2040000,  status:'processing', date:'۱۴۰۴/۰۳/۲۰', city:'اصفهان' },
  { id:'o4', buyer:'علی صادقی',      product:'چوب Predator 314-3',       qty:1, total:9600000,  status:'pending',    date:'۱۴۰۴/۰۳/۲۱', city:'شیراز'  },
  { id:'o5', buyer:'مریم احمدی',     product:'پایه چوب چرمی',            qty:2, total:3800000,  status:'cancelled',  date:'۱۴۰۴/۰۳/۱۰', city:'تبریز'  },
];

const PRODUCTS: Product[] = [
  { id:'p1', title:'چوب Predator 314-3',        category:'cue',       price:9600000, stock:3,  sold:47,  rating:4.9, views:1240, active:true,  img:'/images/billiadr-club-1.jpg' },
  { id:'p2', title:'ست توپ Aramith Tournament', category:'ball',      price:3800000, stock:8,  sold:83,  rating:4.8, views:890,  active:true,  img:'/images/billiadr-club-3.jpg' },
  { id:'p3', title:'گچ Master Blue Diamond',    category:'accessory', price:680000,  stock:50, sold:124, rating:4.6, views:2100, active:true,  img:'/images/billiadr-club-1.jpg' },
  { id:'p4', title:'پایه چوب چرمی دستدوز',     category:'accessory', price:1900000, stock:0,  sold:19,  rating:4.3, views:430,  active:false, img:'/images/billiadr-club-3.jpg' },
];

const MSGS: Msg[] = [
  { id:'msg1', buyer:'رضا کریمی',   product:'چوب Predator',       text:'آیا این چوب برای مبتدی‌ها مناسبه؟',   time:'۱۰ دقیقه پیش', unread:true  },
  { id:'msg2', buyer:'نازنین م.',    product:'گچ Master',          text:'امکان تخفیف هست؟',                      time:'۱ ساعت پیش',   unread:true  },
  { id:'msg3', buyer:'امیر ر.',      product:'ست توپ Aramith',     text:'ممنون از ارسال سریع. کیفیت عالیه!',    time:'دیروز',        unread:false },
];

const MONTHLY = [40,65,48,72,58,89,76,92,84,110,98,124];
const MONTHS  = ['فروردین','اردیبهشت','خرداد','تیر','مرداد','شهریور','مهر','آبان','آذر','دی','بهمن','اسفند'];

function toFa(v:string|number){ return String(v).replace(/[0-9]/g,d=>'۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d))); }

const STATUS_CFG: Record<OrderStatus,{label:string;color:string;bg:string;border:string;icon:React.ReactNode}> = {
  pending:    { label:'در انتظار',  color:'#f59e0b', bg:'rgba(245,158,11,0.1)',  border:'rgba(245,158,11,0.25)',  icon:<Clock size={12}/>       },
  processing: { label:'پردازش',    color:'#06b6d4', bg:'rgba(6,182,212,0.1)',   border:'rgba(6,182,212,0.25)',   icon:<RefreshCw size={12}/>    },
  shipped:    { label:'ارسال شد',  color:'#a78bfa', bg:'rgba(167,139,250,0.1)', border:'rgba(167,139,250,0.25)', icon:<Truck size={12}/>       },
  delivered:  { label:'تحویل شد',  color:'#C7A66A', bg:'rgba(199,166,106,0.1)',  border:'rgba(199,166,106,0.25)',  icon:<CheckCircle size={12}/> },
  cancelled:  { label:'لغو شد',   color:'#ef4444', bg:'rgba(239,68,68,0.08)',  border:'rgba(239,68,68,0.2)',    icon:<X size={12}/>           },
};

/* ══ Mini bar chart ══ */
function RevenueChart() {
  const max = Math.max(...MONTHLY);
  return (
    <div style={{ display:'flex', gap:'4px', alignItems:'flex-end', height:'80px' }}>
      {MONTHLY.map((v,i) => (
        <div key={i} style={{ flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:'4px' }}>
          <div style={{ width:'100%', background:`rgba(199,166,106,${0.25+(v/max)*0.75})`, borderRadius:'3px 3px 0 0', height:`${(v/max)*72}px`, boxShadow:v===max?'0 0 10px rgba(199,166,106,0.5)':'none', transition:'height 0.8s ease' }} />
        </div>
      ))}
    </div>
  );
}

/* ══ content ══ */
function SellerContent() {
  const { user } = useAuthStore();
  const [tab,         setTab]    = useState<Tab>('overview');
  const [prodFilter,  setPF]     = useState<'all'|'active'|'inactive'|'low'>('all');
  const [orderFilter, setOF]     = useState<'all'|OrderStatus>('all');
  const [editProduct, setEdit]   = useState<string|null>(null);
  const [notifOpen,   setNotif]  = useState(false);
  const unreadMsgs = MSGS.filter(m=>m.unread).length;
  const pendingOrders = ORDERS.filter(o=>o.status==='pending').length;

  const filteredProds = PRODUCTS.filter(p => {
    if (prodFilter==='active')   return p.active;
    if (prodFilter==='inactive') return !p.active;
    if (prodFilter==='low')      return p.stock <= 3;
    return true;
  });
  const filteredOrders = ORDERS.filter(o => orderFilter==='all' || o.status===orderFilter);

  const totalRevenue = ORDERS.filter(o=>o.status!=='cancelled').reduce((a,o)=>a+o.total,0);
  const totalSold    = PRODUCTS.reduce((a,p)=>a+p.sold,0);
  const avgRating    = (PRODUCTS.reduce((a,p)=>a+p.rating,0)/PRODUCTS.length).toFixed(1);

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;} }
        @keyframes spin   { to{transform:rotate(360deg);} }

        .s-tab { padding:10px 18px; border-radius:10px; font-size:13px; font-weight:600; border:1px solid transparent; cursor:pointer; font-family:inherit; transition:all 0.25s; white-space:nowrap; display:flex; align-items:center; gap:7px; }
        .s-tab.active { background:rgba(199,166,106,0.1); border-color:rgba(199,166,106,0.3); color:#C7A66A; }
        .s-tab:not(.active) { background:rgba(0,0,0,0.03); color:rgba(0,0,0,0.45); }
        .s-tab:not(.active):hover { background:rgba(0,0,0,0.05); color:rgba(0,0,0,0.50); }

        .s-card { background:#FFFFFF; border:1px solid rgba(0,0,0,0.07); border-radius:20px; padding:22px; position:relative; overflow:hidden; transition:all 0.35s; }
        .s-card:hover { background:rgba(0,0,0,0.04); }

        .prod-row { display:flex; align-items:center; gap:14px; padding:14px 16px; background:rgba(255,255,255,0.02); border:1px solid rgba(0,0,0,0.04); border-radius:14px; transition:all 0.25s; }
        .prod-row:hover { background:rgba(0,0,0,0.04); border-color:rgba(0,0,0,0.07); }

        .order-row { display:flex; align-items:center; gap:12px; padding:13px 16px; background:rgba(255,255,255,0.02); border:1px solid rgba(0,0,0,0.04); border-radius:14px; transition:all 0.25s; flex-wrap:wrap; }
        .order-row:hover { background:rgba(0,0,0,0.04); }

        .filter-pill { padding:6px 14px; border-radius:20px; font-size:11px; font-weight:600; border:1px solid; cursor:pointer; font-family:inherit; transition:all 0.2s; white-space:nowrap; }
        .filter-pill.active { background:rgba(199,166,106,0.1); border-color:rgba(199,166,106,0.3); color:#C7A66A; }
        .filter-pill:not(.active) { background:rgba(0,0,0,0.03); border-color:rgba(0,0,0,0.07); color:rgba(0,0,0,0.45); }
        .filter-pill:not(.active):hover { background:rgba(0,0,0,0.05); }

        .action-btn { width:30px; height:30px; border-radius:8px; border:1px solid rgba(0,0,0,0.07); background:rgba(0,0,0,0.04); cursor:pointer; display:flex; align-items:center; justify-content:center; transition:all 0.2s; color:rgba(0,0,0,0.45); flex-shrink:0; }
        .action-btn:hover { background:rgba(0,0,0,0.06); color:rgba(0,0,0,0.55); }

        @media(max-width:900px) { .seller-grid{grid-template-columns:1fr !important;} .stats-4{grid-template-columns:repeat(2,1fr)!important;} }
      `}</style>

      <div style={{ minHeight:'100vh', background:'#F7F7F5', paddingBottom:'80px' }}>

        {/* ── Header ── */}
        <div style={{ background:'rgba(2,8,6,0.98)', borderBottom:'1px solid rgba(0,0,0,0.04)', padding:'0 clamp(16px,4vw,40px)', position:'sticky', top:'62px', zIndex:90, backdropFilter:'blur(24px)' }}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', height:'56px', display:'flex', alignItems:'center', gap:'16px' }}>
            {/* Store info */}
            <div style={{ display:'flex', alignItems:'center', gap:'12px', flex:1, minWidth:0 }}>
              <div style={{ width:'38px', height:'38px', borderRadius:'11px', background:'linear-gradient(135deg,#C7A66A,#A07840)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: '18px', fontWeight:900, color:'#fff', flexShrink:0, boxShadow:'0 4px 12px rgba(199,166,106,0.3)' }}>
                {user?.firstName?.[0]??'S'}
              </div>
              <div style={{ minWidth:0 }}>
                <div style={{ fontSize: '10px', color:'rgba(199,166,106,0.6)', letterSpacing:'0.2em', fontWeight:700 }}>SELLER DASHBOARD</div>
                <div style={{ fontSize: '17px', fontWeight:800, color: '#111111', letterSpacing:'-0.01em', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  فروشگاه {user?.firstName ?? ''} {user?.lastName ?? ''}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display:'flex', gap:'8px', flexShrink:0, alignItems:'center' }}>
              {/* Alerts */}
              {(pendingOrders > 0 || unreadMsgs > 0) && (
                <div style={{ display:'flex', gap:'6px' }}>
                  {pendingOrders > 0 && <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 10px', background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.2)', borderRadius:'20px', fontSize: '13px', color:'#f59e0b', fontWeight:700 }}><AlertCircle size={11}/>{toFa(pendingOrders)} سفارش جدید</div>}
                  {unreadMsgs > 0 && <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 10px', background:'rgba(199,166,106,0.1)', border:'1px solid rgba(199,166,106,0.2)', borderRadius:'20px', fontSize: '13px', color:'#C7A66A', fontWeight:700 }}><MessageCircle size={11}/>{toFa(unreadMsgs)} پیام جدید</div>}
                </div>
              )}

              <button onClick={() => setTab('products')} style={{ display:'flex', alignItems:'center', gap:'7px', padding:'9px 16px', background:'linear-gradient(135deg,#C7A66A,#A07840)', border:'none', borderRadius:'10px', color:'#fff', fontSize: '14px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 4px 14px rgba(199,166,106,0.3)' }}>
                <Plus size={14} /> محصول جدید
              </button>
            </div>
          </div>
        </div>

        {/* ── Tab navigation ── */}
        <div style={{ background:'rgba(2,8,6,0.97)', borderBottom:'1px solid rgba(0,0,0,0.04)', padding:'0 clamp(16px,4vw,40px)', overflowX:'auto' }}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', display:'flex', gap:'4px', padding:'10px 0' }}>
            {[
              { k:'overview',  l:'خلاصه',       icon:<BarChart2 size={14}/> },
              { k:'products',  l:'محصولات',      icon:<Package size={14}/>,  badge: PRODUCTS.filter(p=>p.stock<=3&&p.stock>0).length },
              { k:'orders',    l:'سفارش‌ها',     icon:<ShoppingBag size={14}/>, badge: pendingOrders },
              { k:'analytics', l:'آمار فروش',    icon:<TrendingUp size={14}/> },
              { k:'messages',  l:'پیام‌ها',      icon:<MessageCircle size={14}/>, badge: unreadMsgs },
            ].map(t => (
              <button key={t.k} className={`s-tab ${tab===t.k?'active':''}`} onClick={()=>setTab(t.k as Tab)}>
                {t.icon}{t.l}
                {(t.badge??0) > 0 && <span style={{ minWidth:'18px', height:'18px', borderRadius:'9px', background: tab===t.k?'#C7A66A':'#ef4444', color:'#fff', fontSize: '10px', fontWeight:900, display:'flex', alignItems:'center', justifyContent:'center', padding:'0 4px' }}>{toFa(t.badge!)}</span>}
              </button>
            ))}
          </div>
        </div>

        {/* ── Content ── */}
        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'clamp(20px,3vw,36px) clamp(16px,3vw,32px)' }}>

          {/* ════ OVERVIEW ════ */}
          {tab==='overview' && (
            <div style={{ animation:'fadeUp 0.4s ease both' }}>

              {/* KPI cards */}
              <div className="stats-4" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px', marginBottom:'24px' }}>
                {[
                  { label:'درآمد کل',       value:toFa((totalRevenue/1000000).toFixed(1))+' میلیون', sub:'+۲۳٪ این ماه',   color:'#C7A66A', icon:<TrendingUp size={16}/>, trend:23  },
                  { label:'سفارش‌ها',       value:toFa(ORDERS.filter(o=>o.status!=='cancelled').length), sub:`${toFa(pendingOrders)} در انتظار`, color:'#f59e0b', icon:<ShoppingBag size={16}/>, trend:0 },
                  { label:'محصولات فروخته', value:toFa(totalSold),  sub:`${toFa(PRODUCTS.length)} محصول فعال`, color:'#06b6d4', icon:<Package size={16}/>,    trend:8   },
                  { label:'میانگین امتیاز', value:avgRating,        sub:`${toFa(PRODUCTS.reduce((a,p)=>a+p.views,0))} بازدید`, color:'#a78bfa', icon:<Star size={16}/>,      trend:0   },
                ].map((s,i) => (
                  <div key={i} className="s-card" style={{ animationDelay:`${i*0.07}s`, animation:'fadeUp 0.5s ease both' }}>
                    <div style={{ position:'absolute', top:0, left:'50%', transform:'translateX(-50%)', width:'60px', height:'1px', background:`linear-gradient(90deg,transparent,${s.color}50,transparent)` }} />
                    <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'12px' }}>
                      <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:`${s.color}12`, border:`1px solid ${s.color}22`, display:'flex', alignItems:'center', justifyContent:'center', color:s.color }}>
                        {s.icon}
                      </div>
                      {s.trend!==0 && <div style={{ display:'flex', alignItems:'center', gap:'2px', fontSize: '13px', color:'#C7A66A', fontWeight:700 }}><ChevronUp size={11}/>{toFa(s.trend)}٪</div>}
                    </div>
                    <div style={{ fontSize: 'clamp(22px, 2.8vw, 29px)', fontWeight:900, color: '#111111', letterSpacing:'-0.03em', marginBottom:'4px', textShadow:`0 0 20px ${s.color}25` }}>{s.value}</div>
                    <div style={{ fontSize: '14px', color:'rgba(0,0,0,0.45)', fontWeight:600, marginBottom:'2px' }}>{s.label}</div>
                    <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.30)' }}>{s.sub}</div>
                  </div>
                ))}
              </div>

              <div className="seller-grid" style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:'20px' }}>
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

                  {/* Revenue chart */}
                  <div className="s-card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'20px' }}>
                      <div>
                        <div style={{ fontSize: '12px', color:'rgba(199,166,106,0.5)', letterSpacing:'0.15em', fontWeight:700, marginBottom:'4px' }}>MONTHLY SALES</div>
                        <div style={{ fontSize: '18px', fontWeight:800, color: '#111111', letterSpacing:'-0.01em' }}>فروش ماهانه</div>
                      </div>
                      <div style={{ fontSize: '15px', color:'#C7A66A', fontWeight:700 }}>+۲۳٪</div>
                    </div>
                    <RevenueChart />
                    <div style={{ display:'flex', gap:'6px', marginTop:'10px', overflowX:'auto', paddingBottom:'2px' }}>
                      {MONTHS.map((m,i) => (
                        <div key={i} style={{ flex:1, textAlign:'center', fontSize: '10px', color:'rgba(0,0,0,0.30)', whiteSpace:'nowrap' }}>{m.slice(0,3)}</div>
                      ))}
                    </div>
                  </div>

                  {/* Recent orders */}
                  <div className="s-card">
                    <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:'16px' }}>
                      <div style={{ fontSize: '17px', fontWeight:800, color: '#111111', letterSpacing:'-0.01em', display:'flex', alignItems:'center', gap:'8px' }}>
                        <span style={{ width:'3px', height:'15px', background:'linear-gradient(180deg,#f59e0b,transparent)', borderRadius:'2px', display:'inline-block' }} />
                        آخرین سفارش‌ها
                      </div>
                      <button onClick={()=>setTab('orders')} style={{ fontSize: '13px', color:'#C7A66A', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap:'3px', fontFamily:'inherit' }}>
                        همه <ChevronRight size={11}/>
                      </button>
                    </div>
                    <div style={{ display:'flex', flexDirection:'column', gap:'8px' }}>
                      {ORDERS.slice(0,4).map(o => {
                        const cfg = STATUS_CFG[o.status];
                        return (
                          <div key={o.id} className="order-row">
                            <div style={{ flex:1, minWidth:'120px' }}>
                              <div style={{ fontSize: '15px', fontWeight:600, color: '#111111', marginBottom:'2px' }}>{o.buyer}</div>
                              <div style={{ fontSize: '13px', color:'rgba(0,0,0,0.40)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.product}</div>
                            </div>
                            <div style={{ fontSize: '15px', fontWeight:700, color:'#C7A66A', flexShrink:0 }}>{toFa((o.total/1000000).toFixed(1))}م</div>
                            <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'4px 10px', background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:'20px', fontSize: '12px', color:cfg.color, fontWeight:700, flexShrink:0 }}>
                              {cfg.icon}{cfg.label}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right column */}
                <div style={{ display:'flex', flexDirection:'column', gap:'16px' }}>

                  {/* Store score */}
                  <div className="s-card" style={{ textAlign:'center', border:'1px solid rgba(199,166,106,0.2)' }}>
                    <div style={{ position:'absolute', top:'-1px', left:'50%', transform:'translateX(-50%)', width:'100px', height:'1px', background:'linear-gradient(90deg,transparent,rgba(199,166,106,0.5),transparent)' }} />
                    <div style={{ fontSize: '10px', color:'rgba(199,166,106,0.5)', letterSpacing:'0.2em', fontWeight:700, marginBottom:'10px' }}>SELLER SCORE</div>
                    <div style={{ fontSize: '53px', fontWeight:900, color:'#C7A66A', letterSpacing:'-0.04em', textShadow:'0 0 30px rgba(199,166,106,0.4)', lineHeight:1, marginBottom:'4px' }}>۹۲</div>
                    <div style={{ fontSize: '15px', color:'rgba(0,0,0,0.42)', marginBottom:'14px' }}>از ۱۰۰</div>
                    {[
                      { l:'کیفیت محصول', v:96, c:'#C7A66A' },
                      { l:'زمان ارسال',  v:88, c:'#06b6d4' },
                      { l:'پاسخ به پیام',v:94, c:'#a78bfa' },
                    ].map((m,i) => (
                      <div key={i} style={{ marginBottom:'10px' }}>
                        <div style={{ display:'flex', justifyContent:'space-between', fontSize: '13px', marginBottom:'4px' }}>
                          <span style={{ color:'rgba(0,0,0,0.45)' }}>{m.l}</span>
                          <span style={{ color:m.c, fontWeight:700 }}>{toFa(m.v)}٪</span>
                        </div>
                        <div style={{ height:'4px', background:'rgba(0,0,0,0.05)', borderRadius:'2px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${m.v}%`, background:m.c, borderRadius:'2px', boxShadow:`0 0 8px ${m.c}50`, transition:'width 1s ease' }} />
                        </div>
                      </div>
                    ))}
                    <div style={{ display:'flex', gap:'6px', marginTop:'14px', justifyContent:'center' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'4px', padding:'4px 10px', background:'rgba(199,166,106,0.08)', border:'1px solid rgba(199,166,106,0.2)', borderRadius:'20px', fontSize: '12px', color:'#C7A66A', fontWeight:700 }}>
                        <Shield size={10}/> فروشنده تأیید شده
                      </div>
                    </div>
                  </div>

                  {/* Top products */}
                  <div className="s-card">
                    <div style={{ fontSize: '15px', fontWeight:700, color: '#111111', marginBottom:'14px', display:'flex', alignItems:'center', gap:'8px' }}>
                      <span style={{ width:'3px', height:'13px', background:'linear-gradient(180deg,#a78bfa,transparent)', borderRadius:'2px', display:'inline-block' }} />
                      پرفروش‌ترین‌ها
                    </div>
                    {PRODUCTS.sort((a,b)=>b.sold-a.sold).slice(0,3).map((p,i) => (
                      <div key={p.id} style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom: i<2?'12px':'0', padding:'10px', background:'rgba(255,255,255,0.02)', borderRadius:'12px' }}>
                        <div style={{ fontSize: '15px', fontWeight:800, color:'rgba(0,0,0,0.30)', width:'16px', flexShrink:0 }}>{toFa(i+1)}</div>
                        <div style={{ width:'36px', height:'36px', borderRadius:'10px', overflow:'hidden', flexShrink:0 }}>
                          <img src={p.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.5)' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <div style={{ fontSize: '14px', fontWeight:600, color: '#111111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</div>
                          <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.40)', marginTop:'1px' }}>{toFa(p.sold)} فروش</div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight:700, color:'#C7A66A', flexShrink:0 }}>{toFa((p.price/1000000).toFixed(1))}م</div>
                      </div>
                    ))}
                  </div>

                  {/* Messages preview */}
                  {MSGS.filter(m=>m.unread).length > 0 && (
                    <div className="s-card" style={{ border:'1px solid rgba(199,166,106,0.15)' }}>
                      <div style={{ fontSize: '15px', fontWeight:700, color: '#111111', marginBottom:'12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'8px' }}>
                          <span style={{ width:'3px', height:'13px', background:'linear-gradient(180deg,#C7A66A,transparent)', borderRadius:'2px', display:'inline-block' }} />
                          پیام‌های جدید
                        </div>
                        <span style={{ fontSize: '12px', color:'#C7A66A', background:'rgba(199,166,106,0.1)', border:'1px solid rgba(199,166,106,0.2)', borderRadius:'20px', padding:'2px 8px', fontWeight:700 }}>{toFa(unreadMsgs)}</span>
                      </div>
                      {MSGS.filter(m=>m.unread).map(m => (
                        <div key={m.id} style={{ marginBottom:'8px', padding:'10px', background:'rgba(199,166,106,0.04)', border:'1px solid rgba(199,166,106,0.1)', borderRadius:'12px', cursor:'pointer' }} onClick={()=>setTab('messages')}>
                          <div style={{ fontSize: '14px', fontWeight:700, color: '#111111', marginBottom:'3px' }}>{m.buyer}</div>
                          <div style={{ fontSize: '13px', color:'rgba(0,0,0,0.45)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{m.text}</div>
                          <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.30)', marginTop:'3px' }}>{m.time}</div>
                        </div>
                      ))}
                      <button onClick={()=>setTab('messages')} style={{ width:'100%', padding:'8px', marginTop:'4px', background:'rgba(199,166,106,0.06)', border:'1px solid rgba(199,166,106,0.15)', borderRadius:'10px', color:'#C7A66A', fontSize: '13px', fontWeight:600, cursor:'pointer', fontFamily:'inherit' }}>
                        مشاهده همه پیام‌ها →
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ════ PRODUCTS ════ */}
          {tab==='products' && (
            <div style={{ animation:'fadeUp 0.4s ease both' }}>
              <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px', flexWrap:'wrap', gap:'12px' }}>
                <div style={{ display:'flex', gap:'7px', flexWrap:'wrap' }}>
                  {[{k:'all',l:`همه (${PRODUCTS.length})`},{k:'active',l:'فعال'},{k:'inactive',l:'غیرفعال'},{k:'low',l:'موجودی کم ⚠️'}].map(f => (
                    <button key={f.k} className={`filter-pill ${prodFilter===f.k?'active':''}`} onClick={()=>setPF(f.k as any)}>{f.l}</button>
                  ))}
                </div>
                <button style={{ display:'flex', alignItems:'center', gap:'7px', padding:'10px 18px', background:'linear-gradient(135deg,#C7A66A,#A07840)', border:'none', borderRadius:'11px', color:'#fff', fontSize: '15px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', boxShadow:'0 6px 18px rgba(199,166,106,0.28)' }}>
                  <Plus size={14}/> افزودن محصول
                </button>
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {filteredProds.map(p => (
                  <div key={p.id} className="prod-row">
                    <div style={{ width:'52px', height:'52px', borderRadius:'12px', overflow:'hidden', flexShrink:0, background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.05)' }}>
                      <img src={p.img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.55)' }} onError={e=>{(e.target as HTMLImageElement).style.display='none';}}/>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
                        <span style={{ fontSize: '16px', fontWeight:700, color: '#111111', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{p.title}</span>
                        <span style={{ fontSize: '10px', padding:'2px 8px', borderRadius:'20px', background: p.active?'rgba(199,166,106,0.1)':'rgba(0,0,0,0.04)', color: p.active?'#C7A66A':'rgba(0,0,0,0.35)', border:`1px solid ${p.active?'rgba(199,166,106,0.25)':'rgba(0,0,0,0.07)'}`, fontWeight:700 }}>
                          {p.active?'فعال':'غیرفعال'}
                        </span>
                        {p.stock<=3&&p.stock>0 && <span style={{ fontSize: '10px', padding:'2px 8px', borderRadius:'20px', background:'rgba(245,158,11,0.1)', color:'#f59e0b', border:'1px solid rgba(245,158,11,0.2)', fontWeight:700 }}>موجودی کم</span>}
                        {p.stock===0 && <span style={{ fontSize: '10px', padding:'2px 8px', borderRadius:'20px', background:'rgba(239,68,68,0.08)', color:'#ef4444', border:'1px solid rgba(239,68,68,0.2)', fontWeight:700 }}>ناموجود</span>}
                      </div>
                      <div style={{ display:'flex', gap:'14px', fontSize: '13px', color:'rgba(0,0,0,0.40)', flexWrap:'wrap' }}>
                        <span>{toFa(p.price.toLocaleString())} ت</span>
                        <span>موجودی: {toFa(p.stock)}</span>
                        <span>فروش: {toFa(p.sold)}</span>
                        <span style={{ display:'flex', alignItems:'center', gap:'3px' }}>
                          <Star size={10} style={{ color:'#f59e0b', fill:'#f59e0b' }}/>{p.rating}
                        </span>
                        <span style={{ display:'flex', alignItems:'center', gap:'3px' }}>
                          <Eye size={10}/>{toFa(p.views)} بازدید
                        </span>
                      </div>
                    </div>
                    <div style={{ display:'flex', gap:'6px', flexShrink:0 }}>
                      <button className="action-btn" title="ویرایش"><Edit size={13}/></button>
                      <button className="action-btn" title="مشاهده"><Eye size={13}/></button>
                      <button className="action-btn" style={{ borderColor:'rgba(239,68,68,0.2)', color:'rgba(239,68,68,0.5)' }} title="حذف"><Trash2 size={13}/></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ════ ORDERS ════ */}
          {tab==='orders' && (
            <div style={{ animation:'fadeUp 0.4s ease both' }}>
              <div style={{ display:'flex', gap:'7px', flexWrap:'wrap', marginBottom:'20px' }}>
                {[{k:'all',l:'همه'},{k:'pending',l:'در انتظار'},{k:'processing',l:'پردازش'},{k:'shipped',l:'ارسال شده'},{k:'delivered',l:'تحویل شده'},{k:'cancelled',l:'لغو شده'}].map(f => (
                  <button key={f.k} className={`filter-pill ${orderFilter===f.k?'active':''}`} onClick={()=>setOF(f.k as any)}>{f.l}</button>
                ))}
              </div>

              <div style={{ display:'flex', flexDirection:'column', gap:'10px' }}>
                {filteredOrders.map(o => {
                  const cfg = STATUS_CFG[o.status];
                  return (
                    <div key={o.id} className="order-row">
                      <div style={{ fontSize: '13px', color:'rgba(0,0,0,0.30)', fontFamily:'monospace', flexShrink:0 }}>#{o.id}</div>
                      <div style={{ flex:1, minWidth:'140px' }}>
                        <div style={{ fontSize: '16px', fontWeight:700, color: '#111111', marginBottom:'3px' }}>{o.buyer}</div>
                        <div style={{ fontSize: '13px', color:'rgba(0,0,0,0.42)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{o.product}</div>
                      </div>
                      <div style={{ fontSize: '13px', color:'rgba(0,0,0,0.40)', flexShrink:0 }}>{o.city} · {o.date}</div>
                      <div style={{ fontSize: '16px', fontWeight:800, color:'#C7A66A', flexShrink:0 }}>{toFa((o.total/1000000).toFixed(1))}م</div>
                      <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'5px 11px', background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:'20px', fontSize: '13px', color:cfg.color, fontWeight:700, flexShrink:0 }}>
                        {cfg.icon}{cfg.label}
                      </div>

                      {/* Status update */}
                      {o.status==='pending' && (
                        <button style={{ padding:'6px 13px', background:'rgba(199,166,106,0.1)', border:'1px solid rgba(199,166,106,0.25)', borderRadius:'10px', color:'#C7A66A', fontSize: '13px', fontWeight:700, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                          تأیید
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ ANALYTICS ════ */}
          {tab==='analytics' && (
            <div style={{ animation:'fadeUp 0.4s ease both' }}>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'14px', marginBottom:'24px' }} className="stats-4">
                {[
                  { l:'نرخ تبدیل',    v:'۳.۸٪',  c:'#C7A66A', trend:'+۰.۵' },
                  { l:'میانگین سبد',  v:'۷.۲م',   c:'#f59e0b', trend:'+۱.۲م' },
                  { l:'برگشت خرید',   v:'۲۳٪',   c:'#a78bfa', trend:'+۵٪' },
                  { l:'رضایت مشتری',  v:'۴.۸',   c:'#06b6d4', trend:'+۰.۱' },
                  { l:'پیام پاسخ‌داده',v:'۹۴٪',  c:'#C7A66A', trend:'+۲٪' },
                  { l:'زمان ارسال',    v:'۱.۸ روز',c:'#f59e0b', trend:'-۰.۳' },
                ].map((s,i) => (
                  <div key={i} className="s-card">
                    <div style={{ fontSize: '10px', color:'rgba(0,0,0,0.35)', letterSpacing:'0.12em', fontWeight:700, marginBottom:'8px', textTransform:'uppercase' }}>{s.l}</div>
                    <div style={{ fontSize: 'clamp(24px, 3.3vw, 33px)', fontWeight:900, color:s.c, letterSpacing:'-0.02em', marginBottom:'4px', textShadow:`0 0 20px ${s.c}30` }}>{s.v}</div>
                    <div style={{ fontSize: '13px', color:'#C7A66A', fontWeight:600 }}>{s.trend}</div>
                  </div>
                ))}
              </div>

              <div className="s-card">
                <div style={{ fontSize: '17px', fontWeight:800, color: '#111111', marginBottom:'20px', display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ width:'3px', height:'15px', background:'linear-gradient(135deg,#C7A66A,#A07840)', borderRadius:'2px', display:'inline-block' }} />
                  درآمد ماهانه ۱۴۰۴
                </div>
                <RevenueChart />
                <div style={{ display:'grid', gridTemplateColumns:'repeat(6,1fr)', gap:'0', marginTop:'14px', paddingTop:'14px', borderTop:'1px solid rgba(0,0,0,0.04)' }}>
                  {MONTHLY.slice(6).map((v,i) => (
                    <div key={i} style={{ textAlign:'center', fontSize: '13px', color:'rgba(0,0,0,0.45)', fontWeight:600 }}>
                      <div>{toFa(v)}م</div>
                      <div style={{ fontSize: '10px', color:'rgba(0,0,0,0.30)', marginTop:'2px' }}>{MONTHS[i+6]?.slice(0,4)}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ════ MESSAGES ════ */}
          {tab==='messages' && (
            <div style={{ animation:'fadeUp 0.4s ease both', display:'flex', flexDirection:'column', gap:'10px' }}>
              {MSGS.map(m => (
                <div key={m.id} style={{ display:'flex', alignItems:'flex-start', gap:'14px', padding:'16px 18px', background: m.unread?'rgba(199,166,106,0.04)':'#FFFFFF', border:`1px solid ${m.unread?'rgba(199,166,106,0.15)':'rgba(0,0,0,0.05)'}`, borderRadius:'16px', cursor:'pointer', transition:'all 0.2s' }}>
                  <div style={{ width:'40px', height:'40px', borderRadius:'12px', background:'linear-gradient(135deg,#C7A66A,#A07840)', display:'flex', alignItems:'center', justifyContent:'center', fontSize: '18px', fontWeight:900, color:'#fff', flexShrink:0 }}>
                    {m.buyer[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'8px', marginBottom:'4px', flexWrap:'wrap' }}>
                      <span style={{ fontSize: '16px', fontWeight: m.unread?800:600, color: '#111111' }}>{m.buyer}</span>
                      <span style={{ fontSize: '13px', color:'rgba(0,0,0,0.40)' }}>درباره: {m.product}</span>
                      {m.unread && <span style={{ width:'6px', height:'6px', borderRadius:'50%', background:'#C7A66A', display:'inline-block', boxShadow:'0 0 6px #C7A66A' }} />}
                    </div>
                    <div style={{ fontSize: '15px', color:'rgba(0,0,0,0.50)', lineHeight:1.5 }}>{m.text}</div>
                    <div style={{ fontSize: '12px', color:'rgba(0,0,0,0.30)', marginTop:'5px' }}>{m.time}</div>
                  </div>
                  <button style={{ padding:'8px 16px', background:'rgba(0,0,0,0.04)', border:'1px solid rgba(0,0,0,0.06)', borderRadius:'10px', color:'rgba(0,0,0,0.45)', fontSize: '14px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', flexShrink:0 }}>
                    پاسخ
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default function SellerPage() {
  return <AuthGuard><SellerContent /></AuthGuard>;
}