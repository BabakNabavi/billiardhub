'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Trophy, MapPin, CheckCircle, X, ChevronLeft } from 'lucide-react';
import api from '../../lib/api';

interface Referee {
  id: string; firstName: string; lastName: string;
  verificationStatus: string; bio: string; city: string; avatar: string;
  refereeProfile: { level: string; specialty: string; experience: string; certifications: string; };
}

const levelLabels: Record<string,string> = {national:'ملی',international:'بین‌المللی',provincial:'استانی',club:'باشگاهی'};
const levelColors: Record<string,string> = {national:'#10b981',international:'#06b6d4',provincial:'#a78bfa',club:'rgba(240,250,245,0.4)'};

const mockReferees: Referee[] = [
  {id:'1',firstName:'محمود',lastName:'قاسمی',verificationStatus:'verified',bio:'داور بین‌المللی با سابقه داوری در مسابقات جهانی',city:'تهران',avatar:'',refereeProfile:{level:'international',specialty:'snooker',experience:'۱۸',certifications:'داور درجه A WPBSA'}},
  {id:'2',firstName:'علیرضا',lastName:'نصیری',verificationStatus:'verified',bio:'داور ملی‌پوش و دارنده مدرک داوری فدراسیون',city:'مشهد',avatar:'',refereeProfile:{level:'national',specialty:'snooker',experience:'۱۰',certifications:'مدرک ملی داوری'}},
  {id:'3',firstName:'فاطمه',lastName:'موسوی',verificationStatus:'verified',bio:'داور ملی بانوان و مربی داوری',city:'اصفهان',avatar:'',refereeProfile:{level:'national',specialty:'pocket',experience:'۷',certifications:'مدرک ملی'}},
  {id:'4',firstName:'کامران',lastName:'شریفی',verificationStatus:'pending',bio:'داور استانی در حال ارتقاء مدرک',city:'شیراز',avatar:'',refereeProfile:{level:'provincial',specialty:'snooker',experience:'۴',certifications:''}},
];

export default function RefereesPage() {
  const [referees, setReferees] = useState<Referee[]>(mockReferees);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(()=>{
    setLoading(true);
    api.get('/user/by-role/referee')
      .then(res=>{
        if(Array.isArray(res.data) && res.data.length > 1) setReferees(res.data);
        setLoading(false);
      })
      .catch(()=>setLoading(false));
  },[]);

  const filtered=referees.filter(r=>{
    const matchSearch=`${r.firstName} ${r.lastName} ${r.city}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter=filter==='all'||r.refereeProfile?.level===filter;
    return matchSearch&&matchFilter;
  });

  return(
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .ref-card{transition:all 0.3s ease}
        .ref-card:hover{transform:translateY(-4px);border-color:rgba(6,182,212,0.3)!important;box-shadow:0 20px 60px rgba(0,0,0,0.4)!important}
      `}</style>
      <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#010604 0%,#050c08 100%)',padding:'clamp(24px,4vw,48px) clamp(16px,3vw,32px)',direction:'rtl'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto'}}>
          <div style={{marginBottom:'32px',animation:'fadeUp 0.6s ease both'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'linear-gradient(135deg,#06b6d4,#0891b2)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(6,182,212,0.3)',flexShrink:0}}>
                <Trophy size={20} color="#fff"/>
              </div>
              <div>
                <h1 style={{fontSize:'clamp(22px,3vw,30px)',fontWeight:900,color:'#f0faf5',margin:0,letterSpacing:'-0.025em'}}>داوران</h1>
                <p style={{color:'rgba(240,250,245,0.35)',fontSize:'13px',margin:'2px 0 0'}}>داوران رسمی و مجاز فدراسیون بیلیارد ایران</p>
              </div>
            </div>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'28px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,0.04)',border:`1px solid ${searchFocus?'rgba(6,182,212,0.4)':'rgba(255,255,255,0.07)'}`,borderRadius:'14px',padding:'12px 16px',transition:'all 0.3s'}}>
              <Search size={15} color="rgba(240,250,245,0.25)"/>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>setSearchFocus(true)} onBlur={()=>setSearchFocus(false)}
                placeholder="جستجو بر اساس نام یا شهر..."
                style={{flex:1,background:'none',border:'none',outline:'none',color:'#f0faf5',fontSize:'14px',fontFamily:'inherit'}}/>
              {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(240,250,245,0.3)',padding:0,display:'flex'}}><X size={14}/></button>}
            </div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap'}}>
              {[{v:'all',l:'همه'},{v:'international',l:'بین‌المللی'},{v:'national',l:'ملی'},{v:'provincial',l:'استانی'},{v:'club',l:'باشگاهی'}].map(f=>(
                <button key={f.v} onClick={()=>setFilter(f.v)} style={{padding:'7px 16px',borderRadius:'20px',border:`1px solid ${filter===f.v?'rgba(6,182,212,0.5)':'rgba(255,255,255,0.07)'}`,background:filter===f.v?'rgba(6,182,212,0.12)':'rgba(255,255,255,0.03)',color:filter===f.v?'#06b6d4':'rgba(240,250,245,0.45)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit',transition:'all 0.2s'}}>
                  {f.l}
                </button>
              ))}
              <span style={{marginRight:'auto',color:'rgba(240,250,245,0.25)',fontSize:'12px',alignSelf:'center'}}>{filtered.length} داور</span>
            </div>
          </div>
          {loading?(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px'}}>
              {[1,2,3,4].map(i=><div key={i} style={{height:'190px',background:'rgba(255,255,255,0.03)',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.05)'}}/>)}
            </div>
          ):filtered.length===0?(
            <div style={{textAlign:'center',padding:'80px 20px',color:'rgba(240,250,245,0.2)'}}>
              <Trophy size={40} style={{opacity:0.2,display:'block',margin:'0 auto 12px'}}/>
              <p style={{fontSize:'14px',color:'rgba(240,250,245,0.2)'}}>داوری پیدا نشد</p>
            </div>
          ):(
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:'16px'}}>
              {filtered.map((ref,i)=>{
                const lvlColor=levelColors[ref.refereeProfile?.level]??'rgba(240,250,245,0.4)';
                return(
                  <Link key={ref.id} href={`/referees/${ref.id}`} style={{textDecoration:'none',color:'inherit'}}>
                    <div className="ref-card" style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'20px',padding:'20px',cursor:'pointer',animation:`fadeUp 0.5s ${i*0.05}s ease both`,position:'relative',overflow:'hidden'}}>
                      <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:'linear-gradient(90deg,transparent,rgba(6,182,212,0.4),transparent)'}}/>
                      <div style={{display:'flex',alignItems:'flex-start',gap:'14px',marginBottom:'14px'}}>
                        <div style={{width:'52px',height:'52px',borderRadius:'14px',background:'linear-gradient(135deg,rgba(6,182,212,0.2),rgba(8,145,178,0.1))',border:'1px solid rgba(6,182,212,0.25)',display:'flex',alignItems:'center',justifyContent:'center',color:'#06b6d4',fontWeight:900,fontSize:'20px',flexShrink:0,overflow:'hidden'}}>
                          {ref.avatar?<img src={ref.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>:ref.firstName?.[0]}
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'2px'}}>
                            <span style={{color:'#f0faf5',fontWeight:700,fontSize:'15px'}}>{ref.firstName} {ref.lastName}</span>
                            {ref.verificationStatus==='verified'&&<CheckCircle size={13} color="#06b6d4" style={{flexShrink:0}}/>}
                          </div>
                          {ref.city&&<div style={{display:'flex',alignItems:'center',gap:'4px',color:'rgba(240,250,245,0.35)',fontSize:'12px'}}><MapPin size={11}/><span>{ref.city}</span></div>}
                        </div>
                        <ChevronLeft size={16} color="rgba(240,250,245,0.15)"/>
                      </div>
                      {ref.refereeProfile&&(
                        <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'10px'}}>
                          {ref.refereeProfile.level&&<span style={{fontSize:'11px',fontWeight:600,color:lvlColor,background:`${lvlColor}14`,border:`1px solid ${lvlColor}22`,borderRadius:'20px',padding:'3px 10px'}}>{levelLabels[ref.refereeProfile.level]??ref.refereeProfile.level}</span>}
                          {ref.refereeProfile.experience&&<span style={{fontSize:'11px',color:'rgba(240,250,245,0.4)',background:'rgba(255,255,255,0.04)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'20px',padding:'3px 10px'}}>{ref.refereeProfile.experience} سال سابقه</span>}
                        </div>
                      )}
                      {ref.refereeProfile?.certifications&&<div style={{fontSize:'11px',color:'rgba(240,250,245,0.3)',marginBottom:'8px'}}>🏅 {ref.refereeProfile.certifications}</div>}
                      {ref.bio&&<div style={{color:'rgba(240,250,245,0.4)',fontSize:'12px',lineHeight:1.6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>{ref.bio}</div>}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}