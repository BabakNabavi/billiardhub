'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, ShoppingBag, MapPin, CheckCircle, X } from 'lucide-react';
import api from '../../lib/api';

interface Seller {
  id: string; firstName: string; lastName: string;
  verificationStatus: string; bio: string; city: string; avatar: string;
  sellerProfile: { shopName: string; productTypes: string; website: string; };
}

const mockSellers: Seller[] = [
  {id:'1',firstName:'علی',lastName:'محمدی',verificationStatus:'verified',bio:'فروشنده تخصصی تجهیزات بیلیارد با بیش از ۱۰ سال تجربه',city:'تهران',avatar:'',sellerProfile:{shopName:'فروشگاه بیلیارد آریا',productTypes:'میز، چوب، توپ',website:''}},
  {id:'2',firstName:'رضا',lastName:'کریمی',verificationStatus:'verified',bio:'واردکننده برندهای معتبر اروپایی',city:'مشهد',avatar:'',sellerProfile:{shopName:'تجهیزات پرو بیلیارد',productTypes:'چوب حرفه‌ای، آقبند',website:''}},
  {id:'3',firstName:'سارا',lastName:'احمدی',verificationStatus:'pending',bio:'فروش لوازم جانبی و مراقبت از میز',city:'اصفهان',avatar:'',sellerProfile:{shopName:'آنلاین شاپ بیلیارد',productTypes:'لوازم جانبی',website:''}},
];

export default function SellersPage() {
  const [sellers, setSellers] = useState<Seller[]>(mockSellers);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);

  useEffect(()=>{
    setLoading(true);
    api.get('/user/by-role/seller')
      .then(res=>{
        if(Array.isArray(res.data) && res.data.length > 1) setSellers(res.data);
        setLoading(false);
      })
      .catch(()=>setLoading(false));
  },[]);

  const filtered=sellers.filter(s=>
    `${s.firstName} ${s.lastName} ${s.city} ${s.sellerProfile?.shopName??''}`.toLowerCase().includes(search.toLowerCase())
  );

  return(
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .seller-card{transition:all 0.3s ease}
        .seller-card:hover{transform:translateY(-4px);border-color:rgba(16,185,129,0.3)!important;box-shadow:0 20px 60px rgba(0,0,0,0.4)!important}
      `}</style>
      <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#010604 0%,#050c08 100%)',padding:'clamp(24px,4vw,48px) clamp(16px,3vw,32px)',direction:'rtl'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto'}}>
          <div style={{marginBottom:'36px',animation:'fadeUp 0.6s ease both'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(16,185,129,0.3)'}}>
                <ShoppingBag size={20} color="#fff"/>
              </div>
              <div>
                <h1 style={{fontSize:'clamp(22px,3vw,30px)',fontWeight:900,color:'#f0faf5',margin:0,letterSpacing:'-0.025em'}}>فروشندگان</h1>
                <p style={{color:'rgba(240,250,245,0.35)',fontSize:'13px',margin:'2px 0 0'}}>فروشگاه‌های معتبر تجهیزات بیلیارد</p>
              </div>
            </div>
          </div>
          <div style={{marginBottom:'28px',animation:'fadeUp 0.6s 0.1s ease both'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,0.04)',border:`1px solid ${searchFocus?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.07)'}`,borderRadius:'14px',padding:'12px 16px',transition:'all 0.3s'}}>
              <Search size={15} color="rgba(240,250,245,0.25)"/>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>setSearchFocus(true)} onBlur={()=>setSearchFocus(false)}
                placeholder="جستجو بر اساس نام، شهر یا نوع محصول..."
                style={{flex:1,background:'none',border:'none',outline:'none',color:'#f0faf5',fontSize:'14px',fontFamily:'inherit'}}/>
              {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(240,250,245,0.3)',padding:0,display:'flex'}}><X size={14}/></button>}
            </div>
          </div>
          <div style={{marginBottom:'20px',color:'rgba(240,250,245,0.3)',fontSize:'13px'}}>{filtered.length} فروشنده یافت شد</div>
          {loading?(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px'}}>
              {[1,2,3].map(i=><div key={i} style={{height:'180px',background:'rgba(255,255,255,0.03)',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.05)'}}/>)}
            </div>
          ):filtered.length===0?(
            <div style={{textAlign:'center',padding:'80px 20px'}}>
              <ShoppingBag size={40} style={{opacity:0.2,display:'block',margin:'0 auto 12px',color:'rgba(240,250,245,0.2)'}}/>
              <p style={{fontSize:'14px',color:'rgba(240,250,245,0.2)'}}>فروشنده‌ای پیدا نشد</p>
            </div>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px'}}>
              {filtered.map((seller,i)=>(
                <Link key={seller.id} href={`/sellers/${seller.id}`} style={{textDecoration:'none',color:'inherit'}}>
                  <div className="seller-card" style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'20px',padding:'20px',cursor:'pointer',animation:`fadeUp 0.5s ${i*0.05}s ease both`}}>
                    <div style={{display:'flex',alignItems:'flex-start',gap:'14px',marginBottom:'14px'}}>
                      <div style={{width:'48px',height:'48px',borderRadius:'14px',background:'linear-gradient(135deg,rgba(16,185,129,0.3),rgba(6,182,212,0.3))',border:'1px solid rgba(16,185,129,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'#10b981',fontWeight:900,fontSize:'18px',flexShrink:0,overflow:'hidden'}}>
                        {seller.avatar?<img src={seller.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:seller.firstName?.[0]}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'2px'}}>
                          <span style={{color:'#f0faf5',fontWeight:700,fontSize:'15px'}}>{seller.firstName} {seller.lastName}</span>
                          {seller.verificationStatus==='verified'&&<CheckCircle size={14} color="#10b981"/>}
                        </div>
                        {seller.city&&<div style={{display:'flex',alignItems:'center',gap:'4px',color:'rgba(240,250,245,0.35)',fontSize:'12px'}}><MapPin size={11}/><span>{seller.city}</span></div>}
                      </div>
                    </div>
                    {seller.sellerProfile?.shopName&&(
                      <div style={{background:'rgba(16,185,129,0.06)',border:'1px solid rgba(16,185,129,0.12)',borderRadius:'10px',padding:'8px 12px',marginBottom:'10px'}}>
                        <div style={{color:'#10b981',fontSize:'13px',fontWeight:600}}>🏪 {seller.sellerProfile.shopName}</div>
                        {seller.sellerProfile.productTypes&&<div style={{color:'rgba(240,250,245,0.3)',fontSize:'11px',marginTop:'2px'}}>{seller.sellerProfile.productTypes}</div>}
                      </div>
                    )}
                    {seller.bio&&<div style={{color:'rgba(240,250,245,0.4)',fontSize:'12px',lineHeight:1.6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{seller.bio}</div>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}