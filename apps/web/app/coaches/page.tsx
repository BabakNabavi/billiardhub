'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Star, MapPin, CheckCircle, X, ChevronLeft } from 'lucide-react';
import api from '../../lib/api';

interface Coach {
  id: string;
  firstName: string;
  lastName: string;
  verificationStatus: string;
  bio: string;
  city: string;
  avatar: string;
  coachProfile: {
    specialty: string;
    experience: string;
    certifications: string;
    sessionPrice: number;
  };
}

const specialtyLabels: Record<string,string> = {snooker:'اسنوکر',pocket:'پاکت بیلیارد',highball:'هی‌بال',all:'همه رشته‌ها'};

const mockCoaches: Coach[] = [
  {id:'1',firstName:'استاد احمد',lastName:'رضایی',verificationStatus:'verified',bio:'مربی ملی‌پوش با ۱۵ سال سابقه تدریس در فدراسیون',city:'تهران',avatar:'',coachProfile:{specialty:'snooker',experience:'۱۵',certifications:'مدرک A فدراسیون جهانی',sessionPrice:500000}},
  {id:'2',firstName:'حسین',lastName:'نوری',verificationStatus:'verified',bio:'قهرمان آسیا و مربی دسته برتر',city:'مشهد',avatar:'',coachProfile:{specialty:'snooker',experience:'۱۲',certifications:'مدرک B فدراسیون',sessionPrice:350000}},
  {id:'3',firstName:'مریم',lastName:'کاظمی',verificationStatus:'verified',bio:'مربی بانوان و متخصص پاکت بیلیارد',city:'اصفهان',avatar:'',coachProfile:{specialty:'pocket',experience:'۸',certifications:'مدرک ملی',sessionPrice:280000}},
  {id:'4',firstName:'سینا',lastName:'محمدی',verificationStatus:'pending',bio:'مربی جوان و قهرمان لیگ برتر',city:'شیراز',avatar:'',coachProfile:{specialty:'pocket',experience:'۵',certifications:'',sessionPrice:200000}},
];

export default function CoachesPage() {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(()=>{
    api.get('/user/by-role/coach')
      .then(res=>{setCoaches(res.data?.length?res.data:mockCoaches);setLoading(false);})
      .catch(()=>{setCoaches(mockCoaches);setLoading(false);});
  },[]);

  const filtered=coaches.filter(c=>{
    const matchSearch=`${c.firstName} ${c.lastName} ${c.city}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter=filter==='all'||c.coachProfile?.specialty===filter;
    return matchSearch&&matchFilter;
  });

  return(
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .coach-card{transition:all 0.3s ease}
        .coach-card:hover{transform:translateY(-4px);border-color:rgba(245,158,11,0.3)!important;box-shadow:0 20px 60px rgba(0,0,0,0.4)!important}
      `}</style>
      <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#010604 0%,#050c08 100%)',padding:'clamp(24px,4vw,48px) clamp(16px,3vw,32px)',direction:'rtl'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto'}}>

          <div style={{marginBottom:'32px',animation:'fadeUp 0.6s ease both'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'linear-gradient(135deg,#f59e0b,#d97706)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(245,158,11,0.3)',flexShrink:0}}>
                <Star size={20} color="#fff"/>
              </div>
              <div>
                <h1 style={{fontSize:'clamp(22px,3vw,30px)',fontWeight:900,color:'#f0faf5',margin:0,letterSpacing:'-0.025em'}}>مربیان</h1>
                <p style={{color:'rgba(240,250,245,0.35)',fontSize:'13px',margin:'2px 0 0'}}>مربیان مجاز فدراسیون بیلیارد ایران</p>
              </div>
            </div>
          </div>

          <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'28px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,0.04)',border:`1px solid ${searchFocus?'rgba(245,158,11,0.4)':'rgba(255,255,255,0.07)'}`,borderRadius:'14px',padding:'12px 16px',transition:'all 0.3s'}}>
              <Search size={15} color="rgba(240,250,245,0.25)"/>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>setSearchFocus(true)} onBlur={()=>setSearchFocus(false)}
                placeholder="جستجو بر اساس نام یا شهر..."
                style={{flex:1,background:'none',border:'none',outline:'none',color:'#f0faf5',fontSize:'14px',fontFamily:'inherit'}}/>
              {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(240,250,245,0.3)',padding:0,display:'flex'}}><X size={14}/></button>}
            </div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {[{v:'all',l:'همه'},{v:'snooker',l:'اسنوکر'},{v:'pocket',l:'پاکت'},{v:'highball',l:'هی‌بال'}].map(f=>(
                <button key={f.v} onClick={()=>setFilter(f.v)} style={{padding:'7px 16px',borderRadius:'20px',border:`1px solid ${filter===f.v?'rgba(245,158,11,0.5)':'rgba(255,255,255,0.07)'}`,background:filter===f.v?'rgba(245,158,11,0.12)':'rgba(255,255,255,0.03)',color:filter===f.v?'#f59e0b':'rgba(240,250,245,0.45)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'}}>
                  {f.l}
                </button>
              ))}
              <span style={{marginRight:'auto',color:'rgba(240,250,245,0.25)',fontSize:'12px',alignSelf:'center'}}>{filtered.length} مربی</span>
            </div>
          </div>

          {loading?(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px'}}>
              {[1,2,3,4].map(i=><div key={i} style={{height:'200px',background:'rgba(255,255,255,0.03)',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.05)'}}/>)}
            </div>
          ):filtered.length===0?(
            <div style={{textAlign:'center',padding:'80px 20px',color:'rgba(240,250,245,0.2)'}}>
              <Star size={40} style={{opacity:0.2,display:'block',margin:'0 auto 12px'}}/>
              <p style={{fontSize:'14px'}}>مربی‌ای پیدا نشد</p>
            </div>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px'}}>
              {filtered.map((coach,i)=>(
                <Link key={coach.id} href={`/coaches/${coach.id}`} style={{textDecoration:'none'}}>
                  <div className="coach-card" style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'20px',padding:'20px',cursor:'pointer',animation:`fadeUp 0.5s ${i*0.05}s ease both`,position:'relative',overflow:'hidden'}}>
                    <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,transparent,rgba(245,158,11,0.4),transparent)'}}/>
                    <div style={{display:'flex',alignItems:'flex-start',gap:'14px',marginBottom:'14px'}}>
                      <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'linear-gradient(135deg,rgba(245,158,11,0.2),rgba(217,119,6,0.1))',border:'1px solid rgba(245,158,11,0.25)',display:'flex',alignItems:'center',justifyContent:'center',color:'#f59e0b',fontWeight:900,fontSize:'20px',flexShrink:0,overflow:'hidden'}}>
                        {coach.avatar?<img src={coach.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:coach.firstName?.[0]}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'2px'}}>
                          <span style={{color:'#f0faf5',fontWeight:700,fontSize:'15px'}}>{coach.firstName} {coach.lastName}</span>
                          {coach.verificationStatus==='verified'&&<CheckCircle size={13} color="#f59e0b" style={{flexShrink:0}}/>}
                        </div>
                        {coach.city&&<div style={{display:'flex',alignItems:'center',gap:'4px',color:'rgba(240,250,245,0.35)',fontSize:'12px'}}><MapPin size={11}/><span>{coach.city}</span></div>}
                      </div>
                      <ChevronLeft size={16} color="rgba(240,250,245,0.15)"/>
                    </div>
                    {coach.coachProfile&&(
                      <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'10px'}}>
                        {coach.coachProfile.specialty&&<span style={{fontSize:'11px',fontWeight:600,color:'#f59e0b',background:'rgba(245,158,11,0.1)',border:'1px solid rgba(245,158,11,0.2)',borderRadius:'20px',padding:'3px 10px'}}>{specialtyLabels[coach.coachProfile.specialty]??coach.coachProfile.specialty}</span>}
                        {coach.coachProfile.experience&&<span style={{fontSize:'11px',color:'rgba(240,250,245,0.4)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'20px',padding:'3px 10px'}}>{coach.coachProfile.experience} سال سابقه</span>}
                        {coach.coachProfile.sessionPrice&&<span style={{fontSize:'11px',color:'#10b981',background:'rgba(16,185,129,0.07)',border:'1px solid rgba(16,185,129,0.15)',borderRadius:'20px',padding:'3px 10px'}}>{coach.coachProfile.sessionPrice.toLocaleString('fa-IR')} ت</span>}
                      </div>
                    )}
                    {coach.coachProfile?.certifications&&<div style={{fontSize:'11px',color:'rgba(240,250,245,0.3)',marginBottom:'8px'}}>🏅 {coach.coachProfile.certifications}</div>}
                    {coach.bio&&<p style={{color:'rgba(240,250,245,0.4)',fontSize:'12px',lineHeight:1.6,margin:0,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{coach.bio}</p>}
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
