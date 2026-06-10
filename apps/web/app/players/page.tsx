'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Search, Users, MapPin, CheckCircle, X, ChevronLeft } from 'lucide-react';
import api from '../../lib/api';

interface Player {
  id: string;
  firstName: string;
  lastName: string;
  verificationStatus: string;
  bio: string;
  city: string;
  avatar: string;
  playerProfile: {
    level: string;
    specialty: string;
    experience: string;
  };
}

const levelLabels: Record<string, string> = {
  league1: 'لیگ یک', premier: 'دسته برتر',
  national: 'تیم ملی', world_pro: 'حرفه‌ای جهانی',
};
const specialtyLabels: Record<string, string> = {
  snooker: 'اسنوکر', pocket: 'پاکت بیلیارد', highball: 'هی‌بال',
};
const specialtyColors: Record<string, string> = {
  snooker: '#10b981', pocket: '#06b6d4', highball: '#a78bfa',
};

const mockPlayers: Player[] = [
  { id: '1', firstName: 'علی', lastName: 'محمدی', verificationStatus: 'verified', bio: 'قهرمان لیگ برتر اسنوکر ایران', city: 'تهران', avatar: '', playerProfile: { level: 'premier', specialty: 'snooker', experience: '۱۲' } },
  { id: '2', firstName: 'رضا', lastName: 'احمدی', verificationStatus: 'verified', bio: 'نماینده ایران در مسابقات آسیایی', city: 'مشهد', avatar: '', playerProfile: { level: 'national', specialty: 'snooker', experience: '۸' } },
  { id: '3', firstName: 'امیر', lastName: 'کریمی', verificationStatus: 'pending', bio: 'بازیکن حرفه‌ای پاکت بیلیارد', city: 'اصفهان', avatar: '', playerProfile: { level: 'league1', specialty: 'pocket', experience: '۵' } },
  { id: '4', firstName: 'سعید', lastName: 'رضایی', verificationStatus: 'verified', bio: 'مربی و بازیکن ارشد هی‌بال', city: 'شیراز', avatar: '', playerProfile: { level: 'premier', specialty: 'highball', experience: '۱۰' } },
  { id: '5', firstName: 'حسین', lastName: 'علوی', verificationStatus: 'verified', bio: 'قهرمان استانی اسنوکر', city: 'تبریز', avatar: '', playerProfile: { level: 'league1', specialty: 'snooker', experience: '۶' } },
  { id: '6', firstName: 'مجید', lastName: 'صادقی', verificationStatus: 'verified', bio: 'بازیکن ملی‌پوش پاکت بیلیارد', city: 'کرج', avatar: '', playerProfile: { level: 'national', specialty: 'pocket', experience: '۹' } },
  { id: '7', firstName: 'فرهاد', lastName: 'موسوی', verificationStatus: 'verified', bio: 'نایب قهرمان مسابقات کشوری هی‌بال', city: 'اهواز', avatar: '', playerProfile: { level: 'premier', specialty: 'highball', experience: '۷' } },
  { id: '8', firstName: 'کاوه', lastName: 'نوری', verificationStatus: 'pending', bio: 'استعداد جوان اسنوکر ایران', city: 'تهران', avatar: '', playerProfile: { level: 'league1', specialty: 'snooker', experience: '۳' } },
];

export default function PlayersPage() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchFocus, setSearchFocus] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.get('/user/by-role/player')
      // شرط: بیش از ۱ نفر — اگه فقط خود کاربر برگشت، mock بریز
      .then(res => { setPlayers(res.data?.length > 1 ? res.data : mockPlayers); setLoading(false); })
      .catch(() => { setPlayers(mockPlayers); setLoading(false); });
  }, []);

  const filtered = players.filter(p => {
    const matchSearch = `${p.firstName} ${p.lastName} ${p.city}`.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || p.playerProfile?.specialty === filter;
    return matchSearch && matchFilter;
  });

  return (
    <>
      <style>{`
        @keyframes fadeUp{from{opacity:0;transform:translateY(16px)}to{opacity:1;transform:translateY(0)}}
        .player-card{transition:all 0.3s ease}
        .player-card:hover{transform:translateY(-4px);border-color:rgba(16,185,129,0.3)!important;box-shadow:0 20px 60px rgba(0,0,0,0.4)!important}
        .filter-btn{transition:all 0.2s ease}
        .filter-btn:hover{background:rgba(16,185,129,0.08)!important}

        .players-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 900px) {
          .players-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 540px) {
          .players-grid { grid-template-columns: 1fr; gap: 12px; }
        }
      `}</style>
      <div style={{minHeight:'100vh',background:'linear-gradient(180deg,#010604 0%,#050c08 100%)',padding:'clamp(24px,4vw,48px) clamp(16px,3vw,32px)',direction:'rtl'}}>
        <div style={{maxWidth:'1100px',margin:'0 auto'}}>

          {/* Header */}
          <div style={{marginBottom:'32px',animation:'fadeUp 0.6s ease both'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'8px'}}>
              <div style={{width:'40px',height:'40px',borderRadius:'12px',background:'linear-gradient(135deg,#10b981,#059669)',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 8px 24px rgba(16,185,129,0.3)',flexShrink:0}}>
                <Users size={20} color="#fff"/>
              </div>
              <div>
                <h1 style={{fontSize:'clamp(22px,3vw,30px)',fontWeight:900,color:'#f0faf5',margin:0,letterSpacing:'-0.025em'}}>بازیکنان</h1>
                <div style={{color:'rgba(240,250,245,0.35)',fontSize:'13px',margin:'2px 0 0'}}>بازیکنان حرفه‌ای بیلیارد ایران</div>
              </div>
            </div>
          </div>

          {/* Search + Filter */}
          <div style={{display:'flex',flexDirection:'column',gap:'12px',marginBottom:'28px',animation:'fadeUp 0.6s 0.1s ease both'}}>
            <div style={{display:'flex',alignItems:'center',gap:'10px',background:'rgba(255,255,255,0.04)',border:`1px solid ${searchFocus?'rgba(16,185,129,0.4)':'rgba(255,255,255,0.07)'}`,borderRadius:'14px',padding:'12px 16px',transition:'all 0.3s',boxShadow:searchFocus?'0 0 0 3px rgba(16,185,129,0.08)':'none'}}>
              <Search size={15} color="rgba(240,250,245,0.25)"/>
              <input type="text" value={search} onChange={e=>setSearch(e.target.value)} onFocus={()=>setSearchFocus(true)} onBlur={()=>setSearchFocus(false)}
                placeholder="جستجو بر اساس نام یا شهر..."
                style={{flex:1,background:'none',border:'none',outline:'none',color:'#f0faf5',fontSize:'14px',fontFamily:'inherit'}}/>
              {search&&<button onClick={()=>setSearch('')} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(240,250,245,0.3)',padding:0,display:'flex'}}><X size={14}/></button>}
            </div>
            <div style={{display:'flex',gap:'8px',flexWrap:'wrap',alignItems:'center'}}>
              {[{v:'all',l:'همه'},{v:'snooker',l:'اسنوکر'},{v:'pocket',l:'پاکت'},{v:'highball',l:'هی‌بال'}].map(f=>(
                <button key={f.v} className="filter-btn" onClick={()=>setFilter(f.v)} style={{padding:'7px 16px',borderRadius:'20px',border:`1px solid ${filter===f.v?'rgba(16,185,129,0.5)':'rgba(255,255,255,0.07)'}`,background:filter===f.v?'rgba(16,185,129,0.12)':'rgba(255,255,255,0.03)',color:filter===f.v?'#10b981':'rgba(240,250,245,0.45)',fontSize:'12px',fontWeight:600,cursor:'pointer',fontFamily:'inherit'}}>
                  {f.l}
                </button>
              ))}
              <span style={{marginRight:'auto',color:'rgba(240,250,245,0.25)',fontSize:'12px'}}>{filtered.length} نفر</span>
            </div>
          </div>

          {/* Grid */}
          {loading ? (
            <div className="players-grid">
              {[1,2,3,4,5,6].map(i=><div key={i} style={{height:'170px',background:'rgba(255,255,255,0.03)',borderRadius:'20px',border:'1px solid rgba(255,255,255,0.05)'}}/>)}
            </div>
          ) : filtered.length === 0 ? (
            <div style={{textAlign:'center',padding:'80px 20px',color:'rgba(240,250,245,0.2)'}}>
              <Users size={40} style={{opacity:0.2,marginBottom:'12px',display:'block',margin:'0 auto 12px'}}/>
              <div style={{fontSize:'14px'}}>بازیکنی پیدا نشد</div>
            </div>
          ) : (
            <div className="players-grid">
              {filtered.map((player, i) => {
                const specColor = specialtyColors[player.playerProfile?.specialty] ?? '#10b981';
                return (
                  <Link key={player.id} href={`/players/${player.id}`} style={{textDecoration:'none'}}>
                    <div className="player-card" style={{background:'rgba(255,255,255,0.025)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'20px',padding:'20px',cursor:'pointer',animation:`fadeUp 0.5s ${i*0.04}s ease both`,position:'relative',overflow:'hidden',height:'100%',boxSizing:'border-box'}}>
                      <div style={{position:'absolute',top:0,left:0,right:0,height:'2px',background:`linear-gradient(90deg,transparent,${specColor}44,transparent)`}}/>

                      {/* Avatar + name */}
                      <div style={{display:'flex',alignItems:'flex-start',gap:'14px',marginBottom:'14px'}}>
                        <div style={{width:'48px',height:'48px',borderRadius:'14px',background:`linear-gradient(135deg,${specColor}33,${specColor}11)`,border:`1px solid ${specColor}33`,display:'flex',alignItems:'center',justifyContent:'center',color:specColor,fontWeight:900,fontSize:'18px',flexShrink:0,overflow:'hidden'}}>
                          {player.avatar
                            ? <img src={player.avatar} alt="" style={{width:'100%',height:'100%',objectFit:'cover'}}/>
                            : player.firstName?.[0]
                          }
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:'6px',marginBottom:'2px',flexWrap:'wrap'}}>
                            <span style={{color:'#f0faf5',fontWeight:700,fontSize:'clamp(13px,2.5vw,15px)',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{player.firstName} {player.lastName}</span>
                            {player.verificationStatus==='verified' && <CheckCircle size={13} color={specColor} style={{flexShrink:0}}/>}
                          </div>
                          {player.city && (
                            <div style={{display:'flex',alignItems:'center',gap:'4px',color:'rgba(240,250,245,0.35)',fontSize:'12px'}}>
                              <MapPin size={11}/><span>{player.city}</span>
                            </div>
                          )}
                        </div>
                        <ChevronLeft size={16} color="rgba(240,250,245,0.15)" style={{flexShrink:0}}/>
                      </div>

                      {/* Tags */}
                      {player.playerProfile && (
                        <div style={{display:'flex',flexWrap:'wrap',gap:'6px',marginBottom:'10px'}}>
                          {player.playerProfile.specialty && (
                            <span style={{fontSize:'11px',fontWeight:600,color:specColor,background:`${specColor}14`,border:`1px solid ${specColor}22`,borderRadius:'20px',padding:'3px 10px'}}>
                              {specialtyLabels[player.playerProfile.specialty] ?? player.playerProfile.specialty}
                            </span>
                          )}
                          {player.playerProfile.level && (
                            <span style={{fontSize:'11px',color:'rgba(240,250,245,0.4)',background:'rgba(255,255,255,0.05)',border:'1px solid rgba(255,255,255,0.07)',borderRadius:'20px',padding:'3px 10px'}}>
                              {levelLabels[player.playerProfile.level] ?? player.playerProfile.level}
                            </span>
                          )}
                          {player.playerProfile.experience && (
                            <span style={{fontSize:'11px',color:'rgba(240,250,245,0.3)',background:'rgba(255,255,255,0.03)',border:'1px solid rgba(255,255,255,0.06)',borderRadius:'20px',padding:'3px 10px'}}>
                              {player.playerProfile.experience} سال
                            </span>
                          )}
                        </div>
                      )}

                      {/* Bio */}
                      {player.bio && (
                        <div style={{color:'rgba(240,250,245,0.4)',fontSize:'12px',lineHeight:1.6,overflow:'hidden',display:'-webkit-box',WebkitLineClamp:2,WebkitBoxOrient:'vertical'}}>
                          {player.bio}
                        </div>
                      )}
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
