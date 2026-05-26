'use client';

import { useState, useRef } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Star, ChevronRight, Heart, Share2, ShoppingCart,
  Check, Shield, Truck, RefreshCw, Award, ChevronLeft,
  ChevronDown, ChevronUp, MapPin, Package, Zap,
  MessageCircle, ThumbsUp, Play, Plus, Minus,
} from 'lucide-react';

/* ══ types ══ */
interface Product {
  id: string; title: string; brand: string; model: string;
  category: string; price: number; discountPrice?: number; discountPercent?: number;
  stock: number; condition: string; city: string;
  rating: number; reviewCount: number;
  description: string; specs: { label: string; value: string }[];
  images: string[]; tags: string[];
  seller: { name: string; role: string; rating: number; sales: number; verified: boolean; city: string; };
  isOfficialStore: boolean; isFeatured: boolean;
}

/* ══ sample products ══ */
const PRODUCTS: Record<string, Product> = {
  '1': {
    id:'1', title:'چوب بیلیارد Predator 314-3', brand:'PREDATOR', model:'314-3',
    category:'cue', price:12000000, discountPrice:9600000, discountPercent:20,
    stock:3, condition:'new', city:'تهران',
    rating:4.9, reviewCount:47,
    description:'چوب Predator 314-3 یکی از محبوب‌ترین و پرفروش‌ترین چوب‌های بیلیارد حرفه‌ای در جهان است. این چوب با فناوری Low Deflection ساخته شده و دقت ضربه را به شکل چشمگیری افزایش می‌دهد. مناسب برای بازیکنان نیمه‌حرفه‌ای و حرفه‌ای.',
    specs:[
      { label:'طول', value:'۱۴۸ سانتی‌متر' },
      { label:'وزن', value:'۱۸-۲۱ اونس' },
      { label:'قطر نوک', value:'۱۲.۴ میلی‌متر' },
      { label:'جنس شفت', value:'Low Deflection Carbon' },
      { label:'جنس باد', value:'Canadian Maple' },
      { label:'نوع اتصال', value:'Uni-Loc Quick Release' },
      { label:'ساخت', value:'آمریکا' },
      { label:'گارانتی', value:'۱۸ ماه' },
    ],
    images:['/images/billiadr-club-1.jpg','/images/billiadr-club-3.jpg','/images/billiadr-club-1.jpg'],
    tags:['Predator','Low Deflection','حرفه‌ای','اسنوکر'],
    seller:{ name:'فروشگاه بیلیارد پلاس', role:'فروشگاه رسمی', rating:4.9, sales:1240, verified:true, city:'تهران' },
    isOfficialStore:true, isFeatured:true,
  },
  '2': {
    id:'2', title:'ست توپ Aramith Tournament Pro', brand:'ARAMITH', model:'Tournament Pro',
    category:'ball', price:4500000, discountPrice:3800000, discountPercent:16,
    stock:8, condition:'new', city:'تهران',
    rating:4.8, reviewCount:83,
    description:'ست توپ Aramith Tournament Pro استاندارد رسمی مسابقات بین‌المللی اسنوکر است. ساخته شده از فنوول (Phenolic Resin) با دوام بسیار بالا و پرتاب دقیق.',
    specs:[
      { label:'تعداد توپ', value:'۲۲ عدد (کامل)' },
      { label:'قطر', value:'۵۲.۵ میلی‌متر' },
      { label:'وزن هر توپ', value:'۱۴۲ گرم' },
      { label:'جنس', value:'Phenolic Resin' },
      { label:'استاندارد', value:'WPA/WPBSA' },
      { label:'کیف', value:'دارد' },
      { label:'ساخت', value:'بلژیک' },
    ],
    images:['/images/billiadr-club-3.jpg','/images/billiadr-club-1.jpg'],
    tags:['Aramith','توپ اسنوکر','مسابقاتی','استاندارد بین‌المللی'],
    seller:{ name:'بیلیارد پلاس', role:'فروشگاه رسمی', rating:4.9, sales:1240, verified:true, city:'تهران' },
    isOfficialStore:true, isFeatured:false,
  },
};

const RELATED = [
  { id:'r1', title:'گچ Master Blue Diamond',  price:850000,  img:'/images/billiadr-club-1.jpg', brand:'MASTER',   discount:20 },
  { id:'r2', title:'پایه چوب چرمی',           price:2200000, img:'/images/billiadr-club-3.jpg', brand:'RILEY',    discount:0  },
  { id:'r3', title:'نوک چوب Tiger Sniper',    price:450000,  img:'/images/billiadr-club-1.jpg', brand:'TIGER',    discount:15 },
  { id:'r4', title:'دستکش بیلیارد Pro',       price:320000,  img:'/images/billiadr-club-3.jpg', brand:'PREDATOR', discount:0  },
];

const REVIEWS = [
  { name:'امیر ر.',    rating:5, text:'کیفیت فوق‌العاده. دقیقاً همون چیزی بود که انتظار داشتم. ارسال سریع و بسته‌بندی عالی.', date:'۱۴۰۴/۰۲/۱۵', verified:true,  helpful:12 },
  { name:'سارا م.',    rating:5, text:'بهترین خریدی که تا حالا کردم. تفاوت چشمگیری در دقت ضربه‌هام داشتم.',                  date:'۱۴۰۴/۰۱/۲۸', verified:true,  helpful:8  },
  { name:'نیما ک.',    rating:4, text:'محصول خوبیه ولی قیمتش کمی بالاست. در کل راضیم.',                                        date:'۱۴۰۴/۰۱/۱۰', verified:false, helpful:3  },
];

function toFa(v: string | number) {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}

export default function ProductPage() {
  const params  = useParams();
  const id      = String(params.id ?? '1');
  const product = PRODUCTS[id] ?? PRODUCTS['1']!;

  const [activeImg,  setActiveImg]  = useState(0);
  const [qty,        setQty]        = useState(1);
  const [wished,     setWished]     = useState(false);
  const [inCart,     setInCart]     = useState(false);
  const [specOpen,   setSpecOpen]   = useState(true);
  const [reviewTab,  setReviewTab]  = useState<'reviews'|'qa'>('reviews');
  const [lightbox,   setLightbox]   = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);

  const discount   = product.discountPercent ?? 0;
  const finalPrice = product.discountPrice ?? product.price;
  const saved      = product.price - finalPrice;

  const handleAddCart = () => {
    setInCart(true);
    setTimeout(() => setInCart(false), 2500);
  };

  return (
    <>
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:translateY(0);} }
        @keyframes checkPop { 0%{transform:scale(0);}70%{transform:scale(1.2);}100%{transform:scale(1);} }
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.4;} }

        .img-thumb { width:70px; height:54px; border-radius:10px; overflow:hidden; cursor:pointer; border:2px solid transparent; transition:all 0.25s; flex-shrink:0; }
        .img-thumb.active { border-color:#10b981; box-shadow:0 0 10px rgba(16,185,129,0.4); }
        .img-thumb:hover:not(.active) { border-color:rgba(255,255,255,0.2); }

        .spec-row { display:flex; justify-content:space-between; align-items:center; padding:11px 14px; border-radius:10px; transition:background 0.2s; font-size:13px; }
        .spec-row:hover { background:rgba(255,255,255,0.03); }

        .add-btn {
          flex:2; padding:16px; border-radius:14px; border:none;
          font-size:15px; font-weight:800; cursor:pointer; font-family:inherit;
          display:flex; align-items:center; justify-content:center; gap:9px;
          transition:all 0.3s cubic-bezier(0.4,0,0.2,1);
          position:relative; overflow:hidden;
        }
        .add-btn::before {
          content:''; position:absolute; inset:0;
          background:linear-gradient(135deg,rgba(255,255,255,0.15),transparent 50%);
          opacity:0; transition:opacity 0.3s;
        }
        .add-btn:hover::before { opacity:1; }
        .add-btn:active { transform:scale(0.97); }

        .related-card { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:16px; overflow:hidden; transition:all 0.35s; cursor:pointer; }
        .related-card:hover { background:rgba(255,255,255,0.055); border-color:rgba(16,185,129,0.25); transform:translateY(-5px); box-shadow:0 16px 40px rgba(0,0,0,0.4); }

        .review-helpful { display:flex; align-items:center; gap:5px; padding:5px 12px; border-radius:20px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); font-size:11px; color:rgba(240,250,245,0.45); cursor:pointer; font-family:inherit; transition:all 0.2s; }
        .review-helpful:hover { background:rgba(16,185,129,0.08); border-color:rgba(16,185,129,0.2); color:#10b981; }

        @media(max-width:900px) { .pdp-grid{grid-template-columns:1fr !important;} }
        @media(max-width:640px) { .related-grid{grid-template-columns:repeat(2,1fr)!important;} }
      `}</style>

      <div style={{ minHeight:'100vh', background:'linear-gradient(180deg,#020806,#060d0a)', paddingBottom:'80px' }}>

        {/* Breadcrumb */}
        <div style={{ background:'rgba(2,8,6,0.98)', borderBottom:'1px solid rgba(255,255,255,0.05)', padding:'14px clamp(16px,4vw,40px)' }}>
          <div style={{ maxWidth:'1280px', margin:'0 auto', display:'flex', alignItems:'center', gap:'8px', fontSize:'12px', color:'rgba(240,250,245,0.35)' }}>
            <Link href="/" style={{ color:'rgba(240,250,245,0.35)', textDecoration:'none' }}>خانه</Link>
            <ChevronLeft size={12} />
            <Link href="/shop" style={{ color:'rgba(240,250,245,0.35)', textDecoration:'none' }}>فروشگاه</Link>
            <ChevronLeft size={12} />
            <span style={{ color:'#f0faf5' }}>{product.title}</span>
          </div>
        </div>

        <div style={{ maxWidth:'1280px', margin:'0 auto', padding:'clamp(24px,4vw,40px) clamp(16px,3vw,32px)' }}>

          {/* ════ MAIN PRODUCT SECTION ════ */}
          <div className="pdp-grid" style={{ display:'grid', gridTemplateColumns:'1fr 420px', gap:'40px', marginBottom:'48px', alignItems:'start' }}>

            {/* ── LEFT: Images ── */}
            <div>
              {/* Main image */}
              <div style={{ position:'relative', borderRadius:'22px', overflow:'hidden', background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', marginBottom:'12px', cursor:'zoom-in', aspectRatio:'4/3' }} onClick={() => setLightbox(true)}>
                <img src={product.images[activeImg] ?? product.images[0]} alt={product.title}
                  style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.75) saturate(0.8)', transition:'all 0.5s ease' }}
                  onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-1.jpg'; }} />

                {/* Overlay gradients */}
                <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 50%,rgba(6,13,10,0.7) 100%)', pointerEvents:'none' }} />

                {/* Badges */}
                <div style={{ position:'absolute', top:'16px', right:'16px', display:'flex', flexDirection:'column', gap:'6px' }}>
                  {discount > 0 && (
                    <div style={{ background:'linear-gradient(135deg,#ef4444,#dc2626)', color:'#fff', fontSize:'12px', fontWeight:800, padding:'5px 12px', borderRadius:'20px', boxShadow:'0 4px 12px rgba(239,68,68,0.4)' }}>
                      {toFa(discount)}٪ تخفیف
                    </div>
                  )}
                  {product.isFeatured && (
                    <div style={{ background:'rgba(245,158,11,0.15)', border:'1px solid rgba(245,158,11,0.3)', color:'#f59e0b', fontSize:'10px', fontWeight:700, padding:'4px 10px', borderRadius:'20px', backdropFilter:'blur(8px)' }}>
                      ⭐ محصول برتر
                    </div>
                  )}
                </div>

                {/* Zoom hint */}
                <div style={{ position:'absolute', bottom:'12px', left:'12px', background:'rgba(0,0,0,0.5)', backdropFilter:'blur(8px)', borderRadius:'20px', padding:'5px 12px', fontSize:'10px', color:'rgba(255,255,255,0.5)', display:'flex', alignItems:'center', gap:'5px' }}>
                  🔍 برای بزرگنمایی کلیک کنید
                </div>

                {/* Arrows */}
                {product.images.length > 1 && (
                  <>
                    <button onClick={e => { e.stopPropagation(); setActiveImg(p => (p-1+product.images.length)%product.images.length); }}
                      style={{ position:'absolute', right:'12px', top:'50%', transform:'translateY(-50%)', width:'38px', height:'38px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
                      <ChevronRight size={16} />
                    </button>
                    <button onClick={e => { e.stopPropagation(); setActiveImg(p => (p+1)%product.images.length); }}
                      style={{ position:'absolute', left:'12px', top:'50%', transform:'translateY(-50%)', width:'38px', height:'38px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', backdropFilter:'blur(10px)', border:'1px solid rgba(255,255,255,0.15)', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
                      <ChevronLeft size={16} />
                    </button>
                  </>
                )}
              </div>

              {/* Thumbnails */}
              <div ref={thumbRef} style={{ display:'flex', gap:'8px', overflowX:'auto' }}>
                {product.images.map((img, i) => (
                  <div key={i} className={`img-thumb ${i === activeImg ? 'active' : ''}`} onClick={() => setActiveImg(i)}>
                    <img src={img} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.6)' }} onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-1.jpg'; }} />
                  </div>
                ))}
              </div>

              {/* Trust badges */}
              <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:'10px', marginTop:'20px' }}>
                {[
                  { icon:<Shield size={16} />,    label:'پرداخت امن',    sub:'درگاه بانکی',      color:'#10b981' },
                  { icon:<Truck size={16} />,     label:'ارسال سریع',   sub:'۱-۳ روز کاری',    color:'#06b6d4' },
                  { icon:<RefreshCw size={16} />, label:'ضمانت بازگشت', sub:'۷ روز ضمانت',      color:'#a78bfa' },
                ].map((b, i) => (
                  <div key={i} style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:'6px', padding:'14px 10px', background:'rgba(255,255,255,0.025)', border:`1px solid ${b.color}15`, borderRadius:'14px', textAlign:'center' }}>
                    <span style={{ color:b.color }}>{b.icon}</span>
                    <div style={{ fontSize:'11px', fontWeight:700, color:'#f0faf5' }}>{b.label}</div>
                    <div style={{ fontSize:'9px', color:'rgba(240,250,245,0.35)' }}>{b.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── RIGHT: Product Info ── */}
            <div style={{ position:'sticky', top:'80px' }}>

              {/* Brand + Title */}
              <div style={{ marginBottom:'16px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'10px' }}>
                  <span style={{ fontSize:'10px', color:'rgba(16,185,129,0.7)', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'20px', padding:'3px 12px', fontWeight:700, letterSpacing:'0.1em' }}>
                    {product.brand}
                  </span>
                  {product.isOfficialStore && (
                    <span style={{ fontSize:'9px', color:'#a78bfa', background:'rgba(167,139,250,0.1)', border:'1px solid rgba(167,139,250,0.2)', borderRadius:'20px', padding:'3px 10px', fontWeight:700 }}>
                      فروشگاه رسمی
                    </span>
                  )}
                </div>
                <h1 style={{ fontSize:'clamp(20px,3vw,26px)', fontWeight:900, color:'#f0faf5', margin:'0 0 10px', letterSpacing:'-0.025em', lineHeight:1.2 }}>{product.title}</h1>

                {/* Rating */}
                <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                  <div style={{ display:'flex', gap:'2px' }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} style={{ color:'#f59e0b', fill: s <= Math.floor(product.rating) ? '#f59e0b' : 'transparent' }} />)}
                  </div>
                  <span style={{ fontSize:'14px', fontWeight:800, color:'#f59e0b' }}>{product.rating}</span>
                  <span style={{ fontSize:'12px', color:'rgba(240,250,245,0.3)' }}>({toFa(product.reviewCount)} نظر)</span>
                </div>
              </div>

              {/* Price */}
              <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'18px', padding:'20px', marginBottom:'20px', position:'relative', overflow:'hidden' }}>
                {discount > 0 && (
                  <div style={{ position:'absolute', top:0, left:0, right:0, height:'2px', background:`linear-gradient(90deg,transparent,rgba(239,68,68,0.6),transparent)` }} />
                )}

                {discount > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:'10px', marginBottom:'8px' }}>
                    <span style={{ fontSize:'14px', color:'rgba(240,250,245,0.3)', textDecoration:'line-through' }}>{toFa(product.price.toLocaleString())} تومان</span>
                    <span style={{ fontSize:'11px', color:'#ef4444', background:'rgba(239,68,68,0.1)', border:'1px solid rgba(239,68,68,0.2)', borderRadius:'20px', padding:'2px 9px', fontWeight:700 }}>
                      {toFa(discount)}٪ تخفیف
                    </span>
                  </div>
                )}

                <div style={{ display:'flex', alignItems:'baseline', gap:'8px', marginBottom: saved > 0 ? '8px' : '0' }}>
                  <span style={{ fontSize:'clamp(26px,4vw,34px)', fontWeight:900, color:'#10b981', letterSpacing:'-0.03em', textShadow:'0 0 30px rgba(16,185,129,0.35)' }}>
                    {toFa(finalPrice.toLocaleString())}
                  </span>
                  <span style={{ fontSize:'16px', color:'rgba(240,250,245,0.5)', fontWeight:600 }}>تومان</span>
                </div>

                {saved > 0 && (
                  <div style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#10b981', fontWeight:600 }}>
                    <Zap size={12} />
                    {toFa(saved.toLocaleString())} تومان صرفه‌جویی کردید
                  </div>
                )}
              </div>

              {/* Stock & Condition */}
              <div style={{ display:'flex', gap:'10px', marginBottom:'20px' }}>
                <div style={{ display:'flex', alignItems:'center', gap:'6px', padding:'8px 14px', background: product.stock > 0 ? 'rgba(16,185,129,0.08)' : 'rgba(239,68,68,0.08)', border:`1px solid ${product.stock > 0 ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`, borderRadius:'20px', fontSize:'12px', color: product.stock > 0 ? '#10b981' : '#ef4444', fontWeight:600 }}>
                  <span style={{ width:'6px', height:'6px', borderRadius:'50%', background: product.stock > 0 ? '#10b981' : '#ef4444', display:'inline-block', animation:'pulse 2s infinite' }} />
                  {product.stock > 0 ? `${toFa(product.stock)} عدد موجود` : 'ناموجود'}
                </div>
                <div style={{ padding:'8px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', fontSize:'12px', color:'rgba(240,250,245,0.6)', fontWeight:600 }}>
                  {product.condition === 'new' ? '✨ نو' : product.condition === 'like_new' ? '👌 در حد نو' : '🔧 کارکرده'}
                </div>
                <div style={{ display:'flex', alignItems:'center', gap:'5px', padding:'8px 14px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'20px', fontSize:'12px', color:'rgba(240,250,245,0.6)' }}>
                  <MapPin size={11} style={{ color:'#10b981' }} />{product.city}
                </div>
              </div>

              {/* Qty + Add to cart */}
              <div style={{ display:'flex', gap:'10px', marginBottom:'16px', alignItems:'center' }}>
                {/* Qty */}
                <div style={{ display:'flex', alignItems:'center', gap:'0', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'12px', overflow:'hidden', flexShrink:0 }}>
                  <button onClick={() => setQty(q => Math.max(1, q-1))} style={{ width:'40px', height:'52px', background:'none', border:'none', cursor:'pointer', color:'rgba(240,250,245,0.6)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s', fontSize:'18px' }}
                    onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; }}>
                    <Minus size={14} />
                  </button>
                  <div style={{ width:'44px', textAlign:'center', fontSize:'16px', fontWeight:800, color:'#f0faf5', borderLeft:'1px solid rgba(255,255,255,0.06)', borderRight:'1px solid rgba(255,255,255,0.06)' }}>
                    {toFa(qty)}
                  </div>
                  <button onClick={() => setQty(q => Math.min(product.stock, q+1))} style={{ width:'40px', height:'52px', background:'none', border:'none', cursor:'pointer', color:'rgba(240,250,245,0.6)', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}
                    onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { (e.currentTarget).style.background = 'transparent'; }}>
                    <Plus size={14} />
                  </button>
                </div>

                {/* Add to cart */}
                <button className="add-btn" onClick={handleAddCart} disabled={product.stock === 0}
                  style={{ background: inCart ? 'linear-gradient(135deg,#059669,#047857)' : 'linear-gradient(135deg,#10b981,#059669)', color:'#fff', boxShadow: inCart ? 'none' : '0 8px 28px rgba(16,185,129,0.3)' }}>
                  {inCart
                    ? <><div style={{ animation:'checkPop 0.4s ease both' }}><Check size={18} /></div>اضافه شد!</>
                    : <><ShoppingCart size={17} />افزودن به سبد</>
                  }
                </button>
              </div>

              {/* Wish + Share */}
              <div style={{ display:'flex', gap:'10px', marginBottom:'20px' }}>
                <button onClick={() => setWished(w => !w)} style={{ flex:1, padding:'12px', borderRadius:'12px', background: wished ? 'rgba(239,68,68,0.1)' : 'rgba(255,255,255,0.04)', border:`1px solid ${wished ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.08)'}`, color: wished ? '#ef4444' : 'rgba(240,250,245,0.5)', cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'7px', fontSize:'13px', fontWeight:600, transition:'all 0.3s' }}>
                  <Heart size={15} style={{ fill: wished ? '#ef4444' : 'transparent' }} />
                  {wished ? 'در علاقه‌مندی‌ها' : 'افزودن به علاقه‌مندی'}
                </button>
                <button style={{ width:'46px', height:'46px', borderRadius:'12px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', color:'rgba(240,250,245,0.5)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', transition:'all 0.2s' }}>
                  <Share2 size={15} />
                </button>
              </div>

              {/* Seller card */}
              <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'16px', padding:'16px', marginBottom:'16px' }}>
                <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)', fontWeight:700, letterSpacing:'0.15em', marginBottom:'12px', textTransform:'uppercase' }}>فروشنده</div>
                <div style={{ display:'flex', alignItems:'center', gap:'12px' }}>
                  <div style={{ width:'44px', height:'44px', borderRadius:'12px', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'18px', fontWeight:900, color:'#fff', flexShrink:0 }}>
                    {product.seller.name[0]}
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'3px' }}>
                      <span style={{ fontSize:'14px', fontWeight:700, color:'#f0faf5' }}>{product.seller.name}</span>
                      {product.seller.verified && <Check size={12} style={{ color:'#10b981' }} />}
                    </div>
                    <div style={{ fontSize:'11px', color:'rgba(240,250,245,0.4)' }}>{product.seller.role} · {product.seller.city}</div>
                  </div>
                  <div style={{ textAlign:'center', flexShrink:0 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:'3px', marginBottom:'2px' }}>
                      <Star size={11} style={{ color:'#f59e0b', fill:'#f59e0b' }} />
                      <span style={{ fontSize:'13px', fontWeight:800, color:'#f59e0b' }}>{product.seller.rating}</span>
                    </div>
                    <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)' }}>{toFa(product.seller.sales)} فروش</div>
                  </div>
                </div>
                <button style={{ width:'100%', marginTop:'12px', padding:'9px', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:'10px', color:'rgba(240,250,245,0.6)', fontSize:'12px', fontWeight:600, cursor:'pointer', fontFamily:'inherit', display:'flex', alignItems:'center', justifyContent:'center', gap:'6px', transition:'all 0.2s' }}>
                  <MessageCircle size={13} /> تماس با فروشنده
                </button>
              </div>

              {/* Tags */}
              <div style={{ display:'flex', gap:'6px', flexWrap:'wrap' }}>
                {product.tags.map(tag => (
                  <span key={tag} style={{ fontSize:'10px', color:'rgba(240,250,245,0.4)', background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'3px 10px' }}>
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ════ DESCRIPTION + SPECS ════ */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'20px', marginBottom:'36px' }} className="pdp-grid">

            {/* Description */}
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'26px' }}>
              <h2 style={{ fontSize:'16px', fontWeight:800, color:'#f0faf5', margin:'0 0 14px', display:'flex', alignItems:'center', gap:'10px', letterSpacing:'-0.01em' }}>
                <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#10b981,#06b6d4)', borderRadius:'2px', display:'inline-block' }} />
                توضیحات محصول
              </h2>
              <p style={{ fontSize:'14px', color:'rgba(240,250,245,0.55)', lineHeight:1.9, margin:0 }}>{product.description}</p>
            </div>

            {/* Specs */}
            <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', overflow:'hidden' }}>
              <button onClick={() => setSpecOpen(p=>!p)} style={{ width:'100%', padding:'20px 22px', background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'space-between', fontFamily:'inherit' }}>
                <h2 style={{ fontSize:'16px', fontWeight:800, color:'#f0faf5', margin:0, display:'flex', alignItems:'center', gap:'10px' }}>
                  <span style={{ width:'3px', height:'16px', background:'linear-gradient(180deg,#a78bfa,#06b6d4)', borderRadius:'2px', display:'inline-block' }} />
                  مشخصات فنی
                </h2>
                {specOpen ? <ChevronUp size={16} style={{ color:'rgba(240,250,245,0.4)' }} /> : <ChevronDown size={16} style={{ color:'rgba(240,250,245,0.4)' }} />}
              </button>

              {specOpen && (
                <div style={{ padding:'0 12px 16px', animation:'fadeUp 0.3s ease both' }}>
                  {product.specs.map((s, i) => (
                    <div key={i} className="spec-row" style={{ borderBottom: i < product.specs.length-1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
                      <span style={{ color:'rgba(240,250,245,0.4)', fontSize:'13px' }}>{s.label}</span>
                      <span style={{ color:'#f0faf5', fontWeight:600, fontSize:'13px', textAlign:'left' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ════ REVIEWS ════ */}
          <div style={{ background:'rgba(255,255,255,0.025)', border:'1px solid rgba(255,255,255,0.07)', borderRadius:'20px', padding:'26px', marginBottom:'36px' }}>

            {/* Tab header */}
            <div style={{ display:'flex', gap:'8px', marginBottom:'24px' }}>
              {[{key:'reviews',label:`نظرات (${product.reviewCount})`},{key:'qa',label:'سوال و جواب'}].map(t => (
                <button key={t.key} onClick={() => setReviewTab(t.key as any)}
                  style={{ padding:'9px 18px', borderRadius:'10px', fontSize:'13px', fontWeight:600, border:'1px solid', cursor:'pointer', fontFamily:'inherit', transition:'all 0.2s', background: reviewTab === t.key ? 'rgba(16,185,129,0.1)' : 'transparent', borderColor: reviewTab === t.key ? 'rgba(16,185,129,0.3)' : 'rgba(255,255,255,0.07)', color: reviewTab === t.key ? '#10b981' : 'rgba(240,250,245,0.45)' }}>
                  {t.label}
                </button>
              ))}
            </div>

            {reviewTab === 'reviews' && (
              <div style={{ display:'grid', gridTemplateColumns:'200px 1fr', gap:'28px', alignItems:'start' }} className="pdp-grid">

                {/* Rating summary */}
                <div style={{ textAlign:'center', padding:'20px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'16px' }}>
                  <div style={{ fontSize:'52px', fontWeight:900, color:'#f0faf5', lineHeight:1, letterSpacing:'-0.04em', marginBottom:'6px' }}>{product.rating}</div>
                  <div style={{ display:'flex', gap:'3px', justifyContent:'center', marginBottom:'6px' }}>
                    {[1,2,3,4,5].map(s => <Star key={s} size={14} style={{ color:'#f59e0b', fill: s <= Math.floor(product.rating) ? '#f59e0b' : 'transparent' }} />)}
                  </div>
                  <div style={{ fontSize:'12px', color:'rgba(240,250,245,0.35)' }}>{toFa(product.reviewCount)} نظر</div>
                  <div style={{ marginTop:'16px', display:'flex', flexDirection:'column', gap:'5px' }}>
                    {[{s:5,p:76},{s:4,p:16},{s:3,p:5},{s:2,p:2},{s:1,p:1}].map(r => (
                      <div key={r.s} style={{ display:'flex', alignItems:'center', gap:'5px', fontSize:'10px' }}>
                        <span style={{ color:'rgba(240,250,245,0.35)', width:'10px' }}>{toFa(r.s)}</span>
                        <Star size={9} style={{ color:'#f59e0b', fill:'#f59e0b', flexShrink:0 }} />
                        <div style={{ flex:1, height:'4px', background:'rgba(255,255,255,0.06)', borderRadius:'2px', overflow:'hidden' }}>
                          <div style={{ height:'100%', width:`${r.p}%`, background:'linear-gradient(90deg,#f59e0b,#f59e0b80)', borderRadius:'2px' }} />
                        </div>
                        <span style={{ color:'rgba(240,250,245,0.25)', width:'22px', textAlign:'left' }}>{toFa(r.p)}٪</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reviews list */}
                <div style={{ display:'flex', flexDirection:'column', gap:'14px' }}>
                  {REVIEWS.map((r, i) => (
                    <div key={i} style={{ padding:'18px', background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)', borderRadius:'16px' }}>
                      <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:'10px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:'10px' }}>
                          <div style={{ width:'36px', height:'36px', borderRadius:'10px', background:'linear-gradient(135deg,#10b981,#059669)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'14px', fontWeight:900, color:'#fff', flexShrink:0 }}>
                            {r.name[0]}
                          </div>
                          <div>
                            <div style={{ display:'flex', alignItems:'center', gap:'7px', marginBottom:'2px' }}>
                              <span style={{ fontSize:'13px', fontWeight:700, color:'#f0faf5' }}>{r.name}</span>
                              {r.verified && <span style={{ fontSize:'9px', color:'#10b981', background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.2)', borderRadius:'20px', padding:'1px 7px', fontWeight:700, display:'flex', alignItems:'center', gap:'2px' }}><Check size={8} /> خرید تأیید شده</span>}
                            </div>
                            <div style={{ fontSize:'10px', color:'rgba(240,250,245,0.3)' }}>{r.date}</div>
                          </div>
                        </div>
                        <div style={{ display:'flex', gap:'2px', flexShrink:0 }}>
                          {[1,2,3,4,5].map(s => <Star key={s} size={12} style={{ color: s <= r.rating ? '#f59e0b' : 'rgba(255,255,255,0.1)', fill: s <= r.rating ? '#f59e0b' : 'transparent' }} />)}
                        </div>
                      </div>
                      <p style={{ fontSize:'13px', color:'rgba(240,250,245,0.55)', margin:'0 0 12px', lineHeight:1.7 }}>{r.text}</p>
                      <button className="review-helpful">
                        <ThumbsUp size={11} /> مفید بود ({toFa(r.helpful)})
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {reviewTab === 'qa' && (
              <div style={{ textAlign:'center', padding:'40px', color:'rgba(240,250,245,0.3)', fontSize:'14px' }}>
                <MessageCircle size={32} style={{ margin:'0 auto 12px', opacity:0.2 }} />
                سوالی ثبت نشده — اولین نفر باشید!
              </div>
            )}
          </div>

          {/* ════ RELATED PRODUCTS ════ */}
          <div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:'20px' }}>
              <div>
                <div style={{ fontSize:'9px', color:'rgba(167,139,250,0.6)', letterSpacing:'0.25em', fontWeight:700, marginBottom:'8px' }}>RELATED PRODUCTS</div>
                <h2 style={{ fontSize:'22px', fontWeight:900, color:'#f0faf5', margin:0, letterSpacing:'-0.02em' }}>محصولات مرتبط</h2>
              </div>
              <Link href="/shop" style={{ display:'flex', alignItems:'center', gap:'6px', fontSize:'12px', color:'#10b981', textDecoration:'none', opacity:0.7 }}>
                همه محصولات <ChevronLeft size={12} />
              </Link>
            </div>

            <div className="related-grid" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:'14px' }}>
              {RELATED.map((p, i) => (
                <Link key={i} href={`/shop/${p.id}`} style={{ textDecoration:'none' }}>
                  <div className="related-card">
                    <div style={{ height:'120px', position:'relative', overflow:'hidden' }}>
                      <img src={p.img} alt={p.title} style={{ width:'100%', height:'100%', objectFit:'cover', filter:'brightness(0.4) saturate(0.6)', transition:'transform 0.5s ease' }} onError={e => { (e.target as HTMLImageElement).src = '/images/billiadr-club-1.jpg'; }} />
                      <div style={{ position:'absolute', inset:0, background:'linear-gradient(to bottom,transparent 30%,rgba(6,13,10,0.85) 100%)' }} />
                      <div style={{ position:'absolute', top:'8px', right:'8px', fontSize:'8px', color:'rgba(240,250,245,0.5)', background:'rgba(0,0,0,0.5)', borderRadius:'20px', padding:'2px 8px', fontWeight:700, letterSpacing:'0.06em' }}>{p.brand}</div>
                      {p.discount > 0 && <div style={{ position:'absolute', top:'8px', left:'8px', background:'rgba(239,68,68,0.85)', color:'#fff', fontSize:'9px', fontWeight:700, padding:'2px 7px', borderRadius:'20px' }}>{toFa(p.discount)}٪</div>}
                    </div>
                    <div style={{ padding:'12px' }}>
                      <div style={{ fontSize:'12px', fontWeight:700, color:'#f0faf5', marginBottom:'6px', lineHeight:1.4, display:'-webkit-box', WebkitLineClamp:2, WebkitBoxOrient:'vertical', overflow:'hidden' }}>{p.title}</div>
                      <div style={{ fontSize:'14px', fontWeight:900, color:'#10b981', letterSpacing:'-0.01em' }}>{toFa(p.price.toLocaleString())} <span style={{ fontSize:'10px', opacity:0.6 }}>ت</span></div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Lightbox */}
        {lightbox && (
          <div style={{ position:'fixed', inset:0, zIndex:9999, background:'rgba(0,0,0,0.95)', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setLightbox(false)}>
            <button style={{ position:'absolute', top:'20px', right:'20px', width:'42px', height:'42px', borderRadius:'50%', background:'rgba(255,255,255,0.1)', border:'none', cursor:'pointer', color:'#fff', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <X size={20} />
            </button>
            <img src={product.images[activeImg] ?? product.images[0]} alt="" style={{ maxWidth:'90vw', maxHeight:'85vh', objectFit:'contain', borderRadius:'12px' }} onClick={e => e.stopPropagation()} />
          </div>
        )}
      </div>
    </>
  );
}