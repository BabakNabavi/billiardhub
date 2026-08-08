'use client'

/* ─────────────────────────────────────────────────────────────
   درختِ براکت — دوطرفه، با فینال در وسط.

   ── چرا دوطرفه ──
   نیمی از بازی‌ها سمتِ راست و نیمِ دیگر سمتِ چپ، و فینال در مرکز.
   براکتِ ۱۶ نفره یعنی ۸ بازیِ دورِ اول: چهارتا راست، چهارتا چپ. با
   چیدمانِ تک‌جهته (همه‌ی دورها پشتِ سرِ هم از راست به چپ)، براکتِ
   ۳۲ نفره پنج ستونِ پشتِ‌سرِهم می‌شود که روی هیچ نمایشگری یک‌جا
   جا نمی‌شود و باید افقی اسکرول شود — روی مانیتورِ سالن یعنی
   تماشاگر نصفِ جدول را نمی‌بیند.

   دوطرفه همان تعداد بازی را در نصفِ عرض جا می‌دهد و مسیرِ دو نیمه
   به‌سمتِ فینال هم چشمی خوانده می‌شود.

   ── چرا این‌جا و نه داخلِ صفحه ──
   سه صفحه همین درخت را می‌خواهند: نمایشِ عمومی، پنلِ برگزارکننده،
   و صفحه‌ی نمایشِ بزرگ. سه نسخه یعنی سه رفتارِ متفاوت برای یک چیز.

   ── مقیاسِ خودکار ──
   عرضِ درخت با تعدادِ بازیکن رشد می‌کند ولی عرضِ صفحه ثابت است. پس
   به‌جای اسکرول، کلِ درخت با `transform: scale` جمع می‌شود تا در
   قاب بنشیند — همان کاری که فیگما با بوم می‌کند. اسکرول برای
   جدولِ مسابقه بد است: تماشاگر نمی‌داند چیزی بیرونِ کادر مانده.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useRef, useState } from 'react'
import { Radio, Trophy } from 'lucide-react'
import { faDigits, slotLabel, isBye, type Bracket, type Match } from '../../lib/tournaments/bracket-client'

const GOLD = '#C7A66A', GOLD_D = '#9A6E38', INK = '#1C1B17'
const MUT = '#8A8474', LINE = '#EAE5DA', FELT = '#0E7A38', RED = '#B23B2E'

export interface BracketTreeProps {
  bracket: Bracket
  /** حالتِ نمایشِ بزرگ: درشت‌تر، تیره، بدونِ تعامل */
  stage?: boolean
  /** کلیک روی یک بازی — در پنلِ برگزارکننده برای ثبتِ نتیجه */
  onPickMatch?: (m: Match) => void
  /** شناسه‌ی بازیِ برجسته */
  activeId?: string
  /** جدول تا جایی که جا شود بزرگ شود — برای مانیتورِ سالن */
  fill?: boolean
  /** بالاترین برکِ مسابقه — زیرِ کادرِ فینال می‌نشیند */
  highBreak?: { value: number; name: string } | null
}

export default function BracketTree({
  bracket, stage = false, onPickMatch, activeId, fill = false, highBreak = null,
}: BracketTreeProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const treeRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  /* اندازه‌ی طبیعیِ درخت — پیش از مقیاس. برای حاشیه‌ی منفی لازم است. */
  const [natural, setNatural] = useState({ w: 0, h: 0 })

  /* ── جاگیریِ خودکار ──
     `ResizeObserver` هم به تغییرِ اندازه‌ی پنجره واکنش می‌دهد هم به
     تغییرِ خودِ درخت (مثلاً وقتی نتیجه‌ای ثبت و نامی بلندتر شد). */
  useEffect(() => {
    const wrap = wrapRef.current, tree = treeRef.current
    if (!wrap || !tree) return
    const fit = () => {
      const w = wrap.clientWidth
      /* ⚠️ اندازه باید **بدونِ** مقیاس خوانده شود، وگرنه هر اندازه‌گیری
         روی نتیجه‌ی قبلی سوار می‌شود و مقیاس در هر دور کوچک‌تر
         می‌شود تا درخت ناپدید شود. */
      const prev = tree.style.transform
      tree.style.transform = 'none'
      const nw = tree.scrollWidth, nh = tree.scrollHeight
      tree.style.transform = prev

      const h = wrap.clientHeight
      if (!w || !nw) return
      /* مقدارِ یکسان دوباره ست نشود: این افکت هر بار که براکت تازه
         می‌شود اجرا می‌شد و دو `setState` می‌داد، که یعنی یک رندرِ
         اضافه‌ی کاملِ درخت در هر بازخوانی. */
      setNatural(p => (p.w === nw && p.h === nh ? p : { w: nw, h: nh }))
      /* ── چرا در حالتِ نمایش بزرگ‌نمایی هم می‌کنیم ──
         در صفحه‌ی معمولی سقفِ ۱ درست است: براکتِ ۴ نفره کشیده‌شده تا
         عرضِ صفحه مسخره به‌نظر می‌رسد.

         ولی روی مانیتورِ سالن همان سقف یعنی جدولِ کوچکی وسطِ یک
         صفحه‌ی بزرگ با حاشیه‌ی خالی از چهار طرف — دقیقاً چیزی که
         نباید. آن‌جا هر دو بُعد سنجیده می‌شود و بزرگ‌ترین مقیاسی
         گرفته می‌شود که هنوز جا شود. */
      const byW = w / nw
      const byH = h && nh ? h / nh : byW
      const next = fill ? Math.min(byW, byH) : Math.min(1, byW)
      setScale(p => (Math.abs(p - next) < 0.001 ? p : next))
    }
    fit()
    /* هم قاب و هم خودِ درخت زیرِ نظرند. `transform` اندازه‌ی جعبه را
       عوض نمی‌کند، پس خواندن و بازگرداندنش در `fit` این ناظر را
       دوباره صدا نمی‌زند. */
    const ro = new ResizeObserver(fit)
    ro.observe(wrap)
    ro.observe(tree)
    return () => ro.disconnect()
    /* ── چرا وابسته به شکلِ براکت، نه خودِ شیء ──
       صفحه‌ی مانیتور هر چند ثانیه براکت را دوباره می‌خواند و هر بار
       یک شیء تازه می‌سازد. با وابستگی به خودِ شیء، این افکت هر بار
       از نو اجرا می‌شد: `transform` صفر می‌شد، `scrollWidth` خوانده
       می‌شد (یک reflow اجباری)، و ناظر برچیده و دوباره ساخته می‌شد.
       همان تپشِ محسوسی که روی مانیتور دیده می‌شد. */
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bracket.matches.length, bracket.totalRounds, fill])

  const { totalRounds } = bracket
  const finalMatch = bracket.matches.find(m => m.round === totalRounds)
  /* دورهای پیش از فینال — این‌ها دو نیمه می‌شوند */
  const innerRounds = Array.from({ length: Math.max(0, totalRounds - 1) }, (_, i) => i + 1)

  const half = (round: number, side: 'right' | 'left') => {
    const all = bracket.matches.filter(m => m.round === round)
    const mid = all.length / 2
    /* نیمه‌ی اولِ شماره‌ها سمتِ راست می‌نشیند — در چیدمانِ
       راست‌به‌چپ یعنی بازیِ شماره‌ی ۱ اولین چیزی است که چشم
       می‌بیند. */
    return side === 'right' ? all.filter(m => m.match_index < mid)
                            : all.filter(m => m.match_index >= mid)
  }

  const roundLabel = (r: number) =>
    bracket.rounds.find(x => x.round === r)?.label ?? `دور ${faDigits(r)}`

  const col = (round: number, side: 'right' | 'left', depth: number) => {
    const ms = half(round, side)
    if (!ms.length) return null
    /* فاصله‌ی عمودی با هر دور دو برابر می‌شود تا هر بازی دقیقاً
       وسطِ دو بازیِ قبلی‌اش بیفتد — همان شکلِ درختی. */
    const gap = Math.pow(2, depth) * (stage ? 16 : 12)
    return (
      <div key={`${side}${round}`} style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <div style={{
          fontSize: stage ? 12 : 10, fontWeight: 800, letterSpacing: '0.06em',
          color: '#A9A294',
          textAlign: 'center', padding: '0 6px', marginBottom: 8, whiteSpace: 'nowrap',
        }}>{roundLabel(round)}</div>
        <div style={{
          display: 'flex', flexDirection: 'column', justifyContent: 'space-around',
          flex: 1, gap, padding: '0 6px',
        }}>
          {ms.map(m => (
            <MatchBox key={m.id} m={m} stage={stage} mirror={side === 'left'}
              active={activeId === m.id} onPick={onPickMatch} />
          ))}
        </div>
      </div>
    )
  }

  /* ── چرا حاشیه‌ی منفی ──
     `transform: scale()` فقط ظاهر را کوچک می‌کند؛ **جعبه‌ی چیدمان**
     همان اندازه‌ی اصلی می‌ماند. پس عنصری که ۱۲۰۰ پیکسل عرض دارد و
     با ۰٫۶ کوچک شده، هنوز ۱۲۰۰ پیکسل جا می‌گیرد — و در ظرفی که
     ۷۰۰ پیکسل است، `margin: 0 auto` بی‌اثر می‌شود و عنصر از لبه‌ی
     شروع بیرون می‌زند.

     نتیجه‌اش دقیقاً همان چیزی بود که دیده می‌شد: سمتِ راستِ کادر
     خالی و جدول از سمتِ چپ بیرونِ صفحه.

     با کم‌کردنِ سرریزِ هر طرف — `natural × (1 - scale) ÷ 2` — جعبه‌ی
     چیدمان دقیقاً به اندازه‌ی چیزی می‌شود که واقعاً دیده می‌شود، و
     وسط‌چینی درست کار می‌کند. برای ارتفاع هم همین، ولی یک‌طرفه چون
     مبدأ بالاست. */
  const overflowX = natural.w ? (natural.w * (1 - scale)) / 2 : 0
  const overflowY = natural.h ? natural.h * (1 - scale) : 0

  return (
    <div ref={wrapRef} style={{
      width: '100%', overflow: 'hidden',
      display: 'flex', justifyContent: 'center',
      /* در حالتِ پرکردن، قاب باید ارتفاعِ واقعیِ در دسترس را داشته
         باشد — وگرنه `clientHeight` همان ارتفاعِ محتوا می‌شود و
         سنجشِ عمودی هیچ‌وقت بزرگ‌نمایی نمی‌دهد. */
      ...(fill ? { height: '100%', alignItems: 'center' } : null),
    }}>
      {/* در حالتِ پرکردن مبدأ وسط است و حاشیه‌ی جبرانی لازم نیست:
          جعبه‌ی چیدمان وسطِ قاب می‌نشیند و تصویرِ بزرگ‌شده هم حولِ
          همان مرکز می‌ماند. */}
      <div style={fill ? undefined : { marginBottom: -overflowY }}>
        <div ref={treeRef} style={{
          display: 'flex', alignItems: 'stretch', width: 'max-content',
          direction: 'rtl',
          transform: `scale(${scale})`,
          transformOrigin: fill ? 'center center' : 'top center',
          marginInline: fill ? 0 : -overflowX,
          transition: 'transform .2s ease',
        }}>
          {/* نیمه‌ی راست: دورِ اول → … → نیمه‌نهایی */}
          {innerRounds.map((r, i) => col(r, 'right', i))}

          {/* فینال — مرکز */}
          {finalMatch && (
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <div style={{
                fontSize: stage ? 13 : 11, fontWeight: 900, color: GOLD,
                textAlign: 'center', marginBottom: 8, whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 4, justifyContent: 'center',
              }}><Trophy size={stage ? 14 : 12} /> فینال</div>
              <div style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'center',
                flex: 1, padding: '0 10px',
              }}>
                <MatchBox m={finalMatch} stage={stage} isFinal
                  active={activeId === finalMatch.id} onPick={onPickMatch} />
              </div>

              {/* ── بالاترین برک ──
                  `marginTop: auto` آن را تا کفِ ستونِ فینال پایین
                  می‌برد، یعنی هم‌ترازِ پایین‌ترین کادرِ دو نیمه —
                  جایی که در جدولِ کاغذی هم می‌نویسندش. */}
              {highBreak && (
                <div style={{
                  marginTop: 'auto', alignSelf: 'center',
                  display: 'flex', alignItems: 'center', gap: 7,
                  padding: stage ? '7px 13px' : '5px 10px', borderRadius: 10,
                  background: 'rgba(139,92,246,0.09)',
                  border: '1px solid rgba(139,92,246,0.3)',
                  whiteSpace: 'nowrap',
                }}>
                  <span style={{ fontSize: stage ? 11 : 9.5, fontWeight: 800, color: '#6D28D9' }}>
                    بالاترین برک
                  </span>
                  <span style={{
                    fontSize: stage ? 16 : 13, fontWeight: 900, color: INK,
                    fontVariantNumeric: 'tabular-nums',
                  }}>{faDigits(highBreak.value)}</span>
                  <span style={{
                    fontSize: stage ? 12 : 10.5, color: MUT,
                    maxWidth: stage ? 150 : 110, overflow: 'hidden', textOverflow: 'ellipsis',
                  }}>{highBreak.name}</span>
                </div>
              )}
            </div>
          )}

          {/* نیمه‌ی چپ: نیمه‌نهایی → … → دورِ اول (آینه‌ی نیمه‌ی راست) */}
          {[...innerRounds].reverse().map((r, i) =>
            col(r, 'left', innerRounds.length - 1 - i))}
        </div>
      </div>
    </div>
  )
}

/* ── یک بازی ─────────────────────────────────────────────────── */
function MatchBox({ m, stage, isFinal, active, mirror = false, onPick }: {
  m: Match; stage: boolean; isFinal?: boolean; active?: boolean
  /** نیمه‌ی چپ آینه است: نام سمتِ چپ، امتیاز سمتِ راست (به‌سمتِ فینال) */
  mirror?: boolean
  onPick?: (m: Match) => void
}) {
  const live = m.status === 'in_progress'
  const done = m.winner !== null
  /* ── چرا امتیاز فقط با «برنده دارد» نبود ──
     تا امروز عدد فقط وقتی رندر می‌شد که بازی برنده داشته باشد. یعنی
     امتیازِ جاری — همان چیزی که مانیتورِ سالن برای آن هست — هیچ‌وقت
     دیده نمی‌شد؛ ۱–۰ روی صفحه نمی‌آمد و تماشاگر تا لحظه‌ی پایانِ
     بازی هیچ عددی نداشت. حالا هر بازی‌ای که شروع شده یا عددی
     خورده، امتیازش را نشان می‌دهد. */
  const showScore = done || live || m.score1 > 0 || m.score2 > 0
  const bye = isBye(m)
  const clickable = !!onPick

  const bg = '#fff'
  const border = active ? GOLD
    : live ? 'rgba(178,59,46,0.5)'
    : done ? 'rgba(14,122,56,0.22)'
    : LINE

  return (
    <div
      onClick={clickable ? () => onPick!(m) : undefined}
      role={clickable ? 'button' : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={clickable ? e => { if (e.key === 'Enter') onPick!(m) } : undefined}
      style={{
        width: stage ? 208 : isFinal ? 186 : 170,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 11,
        padding: stage ? '9px 11px' : '7px 9px',
        cursor: clickable ? 'pointer' : 'default',
        boxShadow: active ? `0 0 0 2px ${GOLD}44` : undefined,
        transition: 'border-color .18s, box-shadow .18s',
      }}>
      {/* ── سرِ کادر ──
          شماره‌ی بازی (#۱، #۲ …) برداشته شد: هیچ‌کس با آن کاری
          ندارد و در جدولِ ۳۲ نفره سی‌ودو عددِ بی‌مصرف می‌شد.
          شماره‌ی میز جایش را گرفت و درشت شد — تماشاگر از آن‌طرفِ
          سالن باید بتواند بخواند روی میزِ ۱ چه کسانی بازی می‌کنند. */}
      {(live || m.table_number != null) && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 5 }}>
          {live && (
            <span style={{
              display: 'inline-flex', alignItems: 'center', gap: 3,
              fontSize: 9, fontWeight: 800, color: RED,
              background: 'rgba(178,59,46,0.12)', borderRadius: 999, padding: '1px 6px',
            }}><Radio size={8} /> زنده</span>
          )}
          {m.table_number != null && (
            <span style={{
              marginInlineStart: 'auto', display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: stage ? 13 : 10.5, fontWeight: 900, color: GOLD_D,
              background: 'rgba(199,166,106,0.14)', border: '1px solid rgba(199,166,106,0.32)',
              borderRadius: 8, padding: stage ? '2px 9px' : '1px 7px', whiteSpace: 'nowrap',
            }}>میز {faDigits(m.table_number)}</span>
          )}
        </div>
      )}

      <PlayerRow name={slotLabel(m, 1)} score={m.score1} win={m.winner === 1}
        known={!!m.p1_name} show={showScore} stage={stage} mirror={mirror} />
      <div style={{ height: 1, background: LINE, margin: '4px 0' }} />
      <PlayerRow name={slotLabel(m, 2)} score={m.score2} win={m.winner === 2}
        known={!!m.p2_name} show={showScore} stage={stage} mirror={mirror} />
    </div>
  )
}

function PlayerRow({ name, score, win, known, show, stage, mirror = false }: {
  name: string; score: number; win: boolean; known: boolean; show: boolean; stage: boolean
  mirror?: boolean
}) {
/* ── چرا حالتِ نمایش هم روشن است ──
     زمینه‌ی تیره را برای نسوختنِ پروژکتور گذاشته بودم، ولی روی
     نمایشگرهای امروزی نتیجه‌اش برعکس بود: جدولِ تیره در سالنِ
     روشن کم‌کنتراست دیده می‌شد و با بقیه‌ی سایت هم یکی نبود.
     حالا فقط اندازه فرق می‌کند، نه رنگ. */
  const dim = MUT
  const normal = INK
  const winner = FELT
  return (
    /* ── چرا نیمه‌ی چپ آینه می‌شود ──
       جدول دو نیمه است که هر دو به‌سمتِ فینالِ وسط می‌روند. اگر هر دو
       نیمه نام را در یک طرف بگذارند، در نیمه‌ی چپ نام به لبه‌ی بیرونی
       می‌چسبد و عدد به لبه‌ی بیرونی‌تر — یعنی ستونِ اعداد دو نیمه
       روبه‌روی هم نمی‌افتد و چشم برای مقایسه باید عقب و جلو برود.
       آینه‌کردن، اعدادِ هر دو نیمه را به‌سمتِ مرکز می‌آورد. */
    <div style={{
      display: 'flex', alignItems: 'center', gap: 6,
      flexDirection: mirror ? 'row-reverse' : 'row',
    }}>
      <span style={{
        flex: 1, minWidth: 0,
        textAlign: mirror ? 'left' : 'right',
        fontSize: stage ? 13 : 11.5,
        fontWeight: win ? 900 : 700,
        /* «Bye» قرمز است تا از نامِ بازیکن جدا دیده شود — همان رنگی
           که تراشه‌اش در چیدمانِ دستی دارد. */
        color: name === 'Bye' ? RED
          : !known ? dim : win ? winner : normal,
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>{name}</span>
      {show && known && (
        <span style={{
          fontSize: stage ? 15 : 12.5, fontWeight: 900,
          fontVariantNumeric: 'tabular-nums',
          color: win ? winner : dim, minWidth: 14, textAlign: 'center',
        }}>{faDigits(score)}</span>
      )}
    </div>
  )
}
