'use client'

import Link from 'next/link'

const STATS = [
  { value: '۵۴۸', label: 'باشگاه فعال', sub: 'در ۳۱ استان', color: '#C7A66A' },
  { value: '۱۲K+', label: 'بازیکن ثبت‌شده', sub: 'از سراسر ایران', color: '#06b6d4' },
  { value: '۲۱۸', label: 'مسابقه برگزارشده', sub: 'در سال جاری', color: '#a78bfa' },
  { value: '۵ سال', label: 'سابقه فعالیت', sub: 'از ۱۳۹۹', color: '#f59e0b' },
]

const TEAM = [
  { name: 'محمد رضایی', role: 'مدیرعامل و بنیان‌گذار', img: '/images/billiadr-club-1.jpg', desc: 'قهرمان سابق بیلیارد ایران، دارای مدرک MBA از دانشگاه تهران' },
  { name: 'سارا احمدی', role: 'مدیر فناوری', img: '/images/billiadr-club-3.jpg', desc: 'بیش از ۱۰ سال تجربه در توسعه پلتفرم‌های ورزشی' },
  { name: 'امیر کریمی', role: 'مدیر توسعه کسب‌وکار', img: '/images/billiadr-club-5.jpg', desc: 'متخصص توسعه شبکه باشگاه‌های ورزشی در ایران' },
]

const MILESTONES = [
  { year: '۱۳۹۹', title: 'تأسیس بیلیارد هاب', desc: 'با ثبت اولین ۵۰ باشگاه در تهران' },
  { year: '۱۴۰۰', title: 'گسترش به کل کشور', desc: 'حضور در ۱۵ استان و ۲۰۰ باشگاه' },
  { year: '۱۴۰۱', title: 'راه‌اندازی فروشگاه', desc: 'اولین پلتفرم خرید تجهیزات بیلیارد ایران' },
  { year: '۱۴۰۲', title: 'سیستم مسابقات', desc: 'برگزاری ۱۰۰+ تورنمنت آنلاین و حضوری' },
  { year: '۱۴۰۳', title: 'تأیید فدراسیون', desc: 'شریک رسمی فدراسیون بیلیارد و اسنوکر ایران' },
  { year: '۱۴۰۴', title: 'نسل جدید پلتفرم', desc: 'رونمایی از سیستم رنکینگ و پروفایل تخصصی' },
]

const VALUES = [
  { icon: 'ti-trophy', title: 'تعالی در عملکرد', desc: 'ما هر روز برای ارائه بهترین تجربه به کاربران خود تلاش می‌کنیم', color: '#f59e0b' },
  { icon: 'ti-users', title: 'جامعه‌محور', desc: 'بیلیارد فراتر از ورزش است — یک جامعه از افراد هم‌علاقه', color: '#C7A66A' },
  { icon: 'ti-shield-check', title: 'امانت‌داری', desc: 'شفافیت و اعتماد پایه‌های اصلی کار ما هستند', color: '#06b6d4' },
  { icon: 'ti-bulb', title: 'نوآوری', desc: 'همیشه به دنبال راه‌های جدید برای بهبود اکوسیستم بیلیارد ایران', color: '#a78bfa' },
]

export default function AboutPage() {
  return (
    <>
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/tabler-icons.min.css" />
      <style>{`
        @keyframes fadeUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:none} }
        @keyframes shimmerLine { 0%{opacity:0.3} 50%{opacity:1} 100%{opacity:0.3} }
        .val-card { transition: all 0.3s cubic-bezier(0.4,0,0.2,1); }
        .val-card:hover { transform: translateY(-6px); border-color: rgba(199,166,106,0.25) !important; }
        .team-card { transition: all 0.4s cubic-bezier(0.4,0,0.2,1); overflow: hidden; }
        .team-card:hover { transform: translateY(-8px); border-color: rgba(199,166,106,0.30) !important; }
        .team-card:hover img { transform: scale(1.07); }
        .team-img { transition: transform 0.6s cubic-bezier(0.4,0,0.2,1); }
        @media(max-width:900px){ .team-grid{grid-template-columns:1fr 1fr!important;} .stat-grid{grid-template-columns:1fr 1fr!important;} }
        @media(max-width:600px){ .team-grid{grid-template-columns:1fr!important;} .stat-grid{grid-template-columns:1fr 1fr!important;} .val-grid{grid-template-columns:1fr!important;} }
      `}</style>

      <div style={{ minHeight: '100vh', background: '#F7F7F5', fontFamily: 'Vazirmatn,Tahoma,sans-serif', direction: 'rtl', color: '#111111', overflowX: 'hidden' }}>

        {/* ── HERO ── */}
        <div style={{ position: 'relative', height: '70vh', minHeight: 500, overflow: 'hidden', background: '#F7F7F5' }}>
          <img
            src="/images/billiadr-club-1.jpg"
            alt="بیلیارد هاب"
            style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.18) saturate(0.5)', transform: 'scale(1.05)' }}
          />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(1,6,4,0.5) 0%, rgba(1,6,4,0.05) 30%, rgba(1,6,4,0.95) 100%)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 60% 60% at 50% 60%, rgba(199,166,106,0.06) 0%, transparent 100%)' }} />

          {/* Vertical line */}
          <div style={{ position: 'absolute', right: 60, top: '25%', bottom: '25%', width: 1, background: 'linear-gradient(to bottom,transparent,rgba(199,166,106,0.40),transparent)', animation: 'shimmerLine 4s ease infinite' }} />

          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', padding: '0 20px', textAlign: 'center' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(199,166,106,0.08)', border: '1px solid rgba(199,166,106,0.20)', borderRadius: 100, padding: '7px 20px', marginBottom: 24, animation: 'fadeUp 0.8s ease 0.2s both' }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#C7A66A', boxShadow: '0 0 12px #C7A66A', display: 'inline-block' }} />
              <span style={{ fontSize: 11, color: '#C7A66A', fontWeight: 700, letterSpacing: '0.22em' }}>ABOUT US — درباره ما</span>
            </div>
            <h1 style={{ fontSize: 'clamp(40px, 6.6vw, 79px)', fontWeight: 900, color: '#fff', lineHeight: 1.05, letterSpacing: '-0.04em', margin: '0 0 20px', animation: 'fadeUp 0.8s ease 0.35s both' }}>
              اکوسیستم جامع<br />
              <span style={{ background: 'linear-gradient(135deg,#C7A66A,#A07840)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>بیلیارد ایران</span>
            </h1>
            <p style={{ fontSize: 'clamp(15px, 2vw, 20px)', color: 'rgba(255,255,255,0.4)', maxWidth: 500, lineHeight: 1.8, margin: 0, animation: 'fadeUp 0.8s ease 0.5s both' }}>
              از سال ۱۳۹۹ با هدف ایجاد بزرگ‌ترین پلتفرم تخصصی بیلیارد ایران فعالیت می‌کنیم
            </p>
          </div>
        </div>

        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px' }}>

          {/* ── Stats ── */}
          <div className="stat-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 100 }}>
            {STATS.map((s, i) => (
              <div key={i} style={{ padding: '28px 20px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, textAlign: 'center', position: 'relative', overflow: 'hidden', animation: `fadeUp 0.5s ease ${i * 0.1}s both` }}>
                <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: 80, height: 1, background: `linear-gradient(90deg,transparent,${s.color}70,transparent)` }} />
                <div style={{ fontSize: 'clamp(35px, 4.4vw, 48px)', fontWeight: 900, color: '#111111', letterSpacing: '-0.03em', lineHeight: 1, textShadow: `0 0 40px ${s.color}35`, marginBottom: 8 }}>{s.value}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: s.color, marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.38)' }}>{s.sub}</div>
              </div>
            ))}
          </div>

          {/* ── Mission ── */}
          <section style={{ marginBottom: 100 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: 11, color: '#A07840', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 14, textTransform: 'uppercase' }}>OUR MISSION</p>
                <h2 style={{ fontSize: 'clamp(29px, 3.3vw, 42px)', fontWeight: 900, color: '#111111', lineHeight: 1.2, letterSpacing: '-0.03em', margin: '0 0 20px' }}>
                  ما بیلیارد را از یک بازی به یک فرهنگ تبدیل می‌کنیم
                </h2>
                <div style={{ height: 1, width: 50, background: 'linear-gradient(90deg,#C7A66A,transparent)', marginBottom: 24, boxShadow: '0 0 10px rgba(199,166,106,0.50)' }} />
                <p style={{ fontSize: 17, color: 'rgba(0,0,0,0.50)', lineHeight: 1.9, margin: '0 0 16px' }}>
                  بیلیارد هاب با اعتقاد به اینکه بیلیارد فراتر از یک بازی است، پلتفرمی ساخته که همه اجزای این اکوسیستم را به هم متصل می‌کند: از باشگاه‌ها و بازیکنان تا مربیان، مسابقات و تجهیزات.
                </p>
                <p style={{ fontSize: 17, color: 'rgba(0,0,0,0.50)', lineHeight: 1.9, margin: 0 }}>
                  هدف ما ارتقاء سطح بیلیارد ایران به استانداردهای بین‌المللی و فراهم کردن بستری برای رشد نسل جدید بازیکنان حرفه‌ای است.
                </p>
              </div>
              <div style={{ position: 'relative' }}>
                <div style={{ borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)', position: 'relative' }}>
                  <img src="/images/snooker-table.jpg" alt="" style={{ width: '100%', aspectRatio: '4/3', objectFit: 'cover', display: 'block', filter: 'brightness(0.55) saturate(0.7)' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(199,166,106,0.12) 0%, transparent 50%)' }} />
                </div>
                {/* Floating badge */}
                <div style={{ position: 'absolute', bottom: -20, right: -20, background: '#FFFFFF', border: '1px solid rgba(199,166,106,0.25)', borderRadius: 16, padding: '16px 20px', backdropFilter: 'blur(20px)', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}>
                  <div style={{ fontSize: 31, fontWeight: 900, color: '#C7A66A', lineHeight: 1 }}>۴.۸</div>
                  <div style={{ display: 'flex', gap: 2, margin: '4px 0' }}>
                    {[1,2,3,4,5].map(i => <i key={i} className="ti ti-star-filled" style={{ fontSize: 13, color: '#f59e0b' }} />)}
                  </div>
                  <div style={{ fontSize: 12, color: 'rgba(0,0,0,0.40)' }}>۸٬۴۰۰+ نظر</div>
                </div>
              </div>
            </div>
          </section>

          {/* ── Values ── */}
          <section style={{ marginBottom: 100 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 11, color: '#A07840', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>OUR VALUES</p>
              <h2 style={{ fontSize: 'clamp(26px, 3.3vw, 37px)', fontWeight: 900, color: '#111111', margin: 0, letterSpacing: '-0.025em' }}>ارزش‌های ما</h2>
            </div>
            <div className="val-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
              {VALUES.map((v, i) => (
                <div key={i} className="val-card" style={{ padding: '28px 22px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, animation: `fadeUp 0.5s ease ${i * 0.1}s both` }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `${v.color}12`, border: `1px solid ${v.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                    <i className={`ti ${v.icon}`} style={{ fontSize: 24, color: v.color }} />
                  </div>
                  <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111111', margin: '0 0 10px' }}>{v.title}</h3>
                  <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', lineHeight: 1.7, margin: 0 }}>{v.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Timeline ── */}
          <section style={{ marginBottom: 100 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 11, color: '#A07840', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>OUR JOURNEY</p>
              <h2 style={{ fontSize: 'clamp(26px, 3.3vw, 37px)', fontWeight: 900, color: '#111111', margin: 0, letterSpacing: '-0.025em' }}>مسیر رشد ما</h2>
            </div>
            <div style={{ position: 'relative' }}>
              {/* Center line */}
              <div style={{ position: 'absolute', right: '50%', top: 20, bottom: 20, width: 1, background: 'linear-gradient(to bottom,rgba(199,166,106,0.30),rgba(199,166,106,0.05))', transform: 'translateX(0.5px)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
                {MILESTONES.map((m, i) => (
                  <div key={i} style={{ display: 'flex', gap: 24, alignItems: 'center', flexDirection: i % 2 === 0 ? 'row-reverse' : 'row' }}>
                    {/* Content */}
                    <div style={{ flex: 1, padding: '20px 24px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 18, textAlign: i % 2 === 0 ? 'left' : 'right', animation: `fadeUp 0.5s ease ${i * 0.1}s both` }}>
                      <p style={{ fontSize: 12, color: '#C7A66A', fontWeight: 700, margin: '0 0 6px' }}>{m.year}</p>
                      <h3 style={{ fontSize: 17, fontWeight: 800, color: '#111111', margin: '0 0 6px' }}>{m.title}</h3>
                      <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', margin: 0 }}>{m.desc}</p>
                    </div>

                    {/* Center dot */}
                    <div style={{ flexShrink: 0, width: 40, height: 40, borderRadius: '50%', background: 'rgba(199,166,106,0.10)', border: '2px solid rgba(199,166,106,0.40)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1, boxShadow: '0 0 20px rgba(199,166,106,0.20)' }}>
                      <i className="ti ti-check" style={{ fontSize: 18, color: '#C7A66A' }} />
                    </div>

                    {/* Empty space */}
                    <div style={{ flex: 1 }} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── Team ── */}
          <section style={{ marginBottom: 100 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <p style={{ fontSize: 11, color: '#A07840', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>OUR TEAM</p>
              <h2 style={{ fontSize: 'clamp(26px, 3.3vw, 37px)', fontWeight: 900, color: '#111111', margin: '0 0 12px', letterSpacing: '-0.025em' }}>تیم ما</h2>
              <p style={{ fontSize: 15, color: 'rgba(0,0,0,0.45)', maxWidth: 400, margin: '0 auto', lineHeight: 1.7 }}>افرادی متعهد به رشد بیلیارد ایران</p>
            </div>
            <div className="team-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 20 }}>
              {TEAM.map((member, i) => (
                <div key={i} className="team-card" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 20, overflow: 'hidden', animation: `fadeUp 0.5s ease ${i * 0.15}s both` }}>
                  <div style={{ height: 200, overflow: 'hidden', position: 'relative' }}>
                    <img className="team-img" src={member.img} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover', filter: 'brightness(0.5) saturate(0.65)' }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 40%, rgba(2,8,6,0.9) 100%)' }} />
                    <div style={{ position: 'absolute', bottom: 16, right: 16 }}>
                      <p style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{member.name}</p>
                      <p style={{ fontSize: 12, color: '#C7A66A', margin: 0, background: 'rgba(199,166,106,0.15)', border: '1px solid rgba(199,166,106,0.25)', borderRadius: 20, padding: '2px 10px', display: 'inline-block' }}>{member.role}</p>
                    </div>
                  </div>
                  <div style={{ padding: '16px 18px' }}>
                    <p style={{ fontSize: 14, color: 'rgba(0,0,0,0.45)', lineHeight: 1.7, margin: 0 }}>{member.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* ── Partners ── */}
          <section style={{ marginBottom: 100 }}>
            <div style={{ textAlign: 'center', marginBottom: 40 }}>
              <p style={{ fontSize: 11, color: '#A07840', letterSpacing: '0.22em', fontWeight: 700, marginBottom: 12, textTransform: 'uppercase' }}>PARTNERS</p>
              <h2 style={{ fontSize: 'clamp(24px, 2.8vw, 33px)', fontWeight: 900, color: '#111111', margin: 0 }}>شرکای ما</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
              {[
                { name: 'فدراسیون بیلیارد و اسنوکر ایران', badge: 'شریک رسمی', icon: 'ti-trophy', color: '#f59e0b' },
                { name: 'ویراکا — تجهیزات بیلیارد', badge: 'تأمین‌کننده', icon: 'ti-settings', color: '#C7A66A' },
                { name: 'زرین‌پال — درگاه پرداخت', badge: 'پرداخت', icon: 'ti-credit-card', color: '#06b6d4' },
                { name: 'لیگ برتر اسنوکر ایران', badge: 'حامی', icon: 'ti-medal', color: '#a78bfa' },
              ].map((p, i) => (
                <div key={i} style={{ padding: '20px 16px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: 16, textAlign: 'center' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: `${p.color}12`, border: `1px solid ${p.color}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                    <i className={`ti ${p.icon}`} style={{ fontSize: 22, color: p.color }} />
                  </div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: '#111111', margin: '0 0 6px', lineHeight: 1.3 }}>{p.name}</p>
                  <span style={{ fontSize: 11, color: p.color, background: `${p.color}10`, border: `1px solid ${p.color}20`, borderRadius: 20, padding: '2px 10px', fontWeight: 700 }}>{p.badge}</span>
                </div>
              ))}
            </div>
          </section>

          {/* ── CTA ── */}
          <section>
            <div style={{ position: 'relative', borderRadius: 28, overflow: 'hidden', padding: '60px 48px', textAlign: 'center', background: '#111111', border: 'none' }}>
              <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 600, height: 400, background: 'radial-gradient(ellipse, rgba(199,166,106,0.07), transparent 70%)', pointerEvents: 'none', filter: 'blur(20px)' }} />
              <div style={{ position: 'absolute', top: -1, left: '50%', transform: 'translateX(-50%)', width: 200, height: 1, background: 'linear-gradient(90deg,transparent,rgba(199,166,106,0.60),transparent)' }} />
              <div style={{ position: 'relative' }}>
                <h2 style={{ fontSize: 'clamp(26px, 3.9vw, 42px)', fontWeight: 900, color: '#FFFFFF', margin: '0 0 14px', letterSpacing: '-0.03em' }}>به جامعه ما بپیوندید</h2>
                <p style={{ fontSize: 17, color: 'rgba(255,255,255,0.45)', margin: '0 auto 36px', maxWidth: 400, lineHeight: 1.7 }}>ثبت‌نام رایگان — دسترسی کامل به تمام امکانات پلتفرم</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <Link href="/register" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg,#C7A66A,#A07840)', color: '#fff', padding: '14px 30px', borderRadius: 14, textDecoration: 'none', fontWeight: 800, fontSize: 17, boxShadow: '0 8px 28px rgba(199,166,106,0.35)' }}>
                    <i className="ti ti-user-plus" style={{ fontSize: 19 }} /> ثبت‌نام رایگان
                  </Link>
                  <Link href="/contact" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.10)', color: '#FFFFFF', padding: '14px 30px', borderRadius: 14, textDecoration: 'none', fontSize: 17 }}>
                    <i className="ti ti-phone" style={{ fontSize: 19 }} /> تماس با ما
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </>
  )
}
