/* ─────────────────────────────────────────────────────────────
   جدولِ کاملِ رنکینگ به‌صورتِ یک تصویر (SVG) — برای موبایل.

   در موبایل جای پنج ستونِ مرحله نیست، ولی بیننده باید بتواند کلِ
   جدول را مثلِ عکسِ جدولِ فدراسیون ببیند. SVGِ درون‌خطی است، نه
   `<img>`: فونتِ خودِ سایت را می‌گیرد و با زوم تار نمی‌شود.

   مختصات چپ‌به‌راست‌اند؛ ستون‌ها از لبه‌ی راست چیده می‌شوند. متن‌ها
   وسط‌چین‌اند، ولی ترتیبِ تکه‌های متنِ آمیخته (مثلِ «… — دسته برتر»)
   را جهتِ پایه تعیین می‌کند، پس `direction="rtl"` روی خودِ svg است —
   به `dir`ِ صفحه تکیه نمی‌کند.
   ───────────────────────────────────────────────────────────── */

import type { RankingPlayer, RankingStage } from '@/lib/rankings-store'
import { toFaDigits } from '@/lib/jalali'
import { breakAllahLigature } from '@/lib/fa-ligature'

export const FULL_TABLE_W = 980
const W = FULL_TABLE_W
const TITLE_H = 64
const HEAD_H = 70
const ROW_H = 34
const FOOT_H = 40
/* راست به چپ: رتبه، نام، شهر، مرحله‌ها، جمع */
const RANK_W = 56, NAME_W = 230, CITY_W = 110, TOTAL_W = 104
/* حدودِ ۸ پیکسل برای هر حرف در ۱۴٫۵px: بیش از ۲۶ حرف از ۲۱۰ پیکسلِ ستون
   بیرون می‌زند و فشرده می‌شود. کمترش نه — textLength متنِ کوتاه را می‌کشد. */
const NAME_FIT = 26

/* همان رنگ‌های چیپِ رتبه در صفحه */
export const rankColor = (r: number): string =>
  r === 1 ? '#111111' : r <= 8 ? '#F06EAE' : r <= 16 ? '#3D63E6' : r <= 32 ? '#A9613F' : r <= 64 ? '#229A47' : '#6F6A5C'

interface Props { title: string; stages: RankingStage[]; players: RankingPlayer[]; updatedLabel?: string }

export function FullTableSvg({ title, stages, players, updatedLabel }: Props) {
  const stageW = (W - RANK_W - NAME_W - CITY_W - TOTAL_W) / Math.max(1, stages.length)
  /* مرکزِ هر ستون، از راست */
  const xRank = W - RANK_W / 2
  const xName = W - RANK_W - NAME_W / 2
  const xCity = W - RANK_W - NAME_W - CITY_W / 2
  const xStage = (i: number) => W - RANK_W - NAME_W - CITY_W - stageW * i - stageW / 2
  const xTotal = TOTAL_W / 2
  /* خطوطِ عمودیِ بینِ ستون‌ها */
  const cuts = [W - RANK_W, W - RANK_W - NAME_W, W - RANK_W - NAME_W - CITY_W,
    ...stages.map((_, i) => W - RANK_W - NAME_W - CITY_W - stageW * (i + 1))]
  const bodyTop = TITLE_H + HEAD_H
  const H = bodyTop + players.length * ROW_H + FOOT_H

  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" direction="rtl" role="img" aria-label={`جدول کامل: ${title}`}
      style={{ display: 'block', height: 'auto', fontFamily: 'inherit' }}>
      <rect width={W} height={H} rx={18} fill="#FBFAF7" />
      {/* نوارِ عنوان */}
      <text x={W / 2} y={TITLE_H / 2 + 8} textAnchor="middle" fontSize={22} fontWeight={900} fill="#1C1B17">{title}</text>

      {/* سرستون — تیره، مثلِ سربرگِ صفحه */}
      <rect x={0} y={TITLE_H} width={W} height={HEAD_H} fill="#141310" />
      <text x={xRank} y={TITLE_H + 41} textAnchor="middle" fontSize={13} fontWeight={800} fill="rgba(255,255,255,0.8)">رتبه</text>
      <text x={xName} y={TITLE_H + 41} textAnchor="middle" fontSize={13} fontWeight={800} fill="rgba(255,255,255,0.8)">نام و نام خانوادگی</text>
      <text x={xCity} y={TITLE_H + 41} textAnchor="middle" fontSize={13} fontWeight={800} fill="rgba(255,255,255,0.8)">شهر</text>
      {stages.map((s, i) => (
        <g key={i}>
          <text x={xStage(i)} y={TITLE_H + 22} textAnchor="middle" fontSize={13} fontWeight={800} fill="#fff">{s.title}</text>
          <text x={xStage(i)} y={TITLE_H + 41} textAnchor="middle" fontSize={12} fontWeight={700} fill="#C7A66A">{s.city}</text>
          <text x={xStage(i)} y={TITLE_H + 59} textAnchor="middle" fontSize={11.5} fill="rgba(255,255,255,0.55)">{toFaDigits(s.date)}</text>
        </g>
      ))}
      <rect x={0} y={TITLE_H} width={TOTAL_W} height={HEAD_H} fill="rgba(199,166,106,0.22)" />
      <text x={xTotal} y={TITLE_H + 41} textAnchor="middle" fontSize={13} fontWeight={900} fill="#E8CE96">جمع امتیازات</text>

      {/* ردیف‌ها */}
      {players.map((p, r) => {
        const y = bodyTop + r * ROW_H
        const mid = y + ROW_H / 2 + 5
        return (
          <g key={p.rank}>
            {r % 2 === 1 && <rect x={0} y={y} width={W} height={ROW_H} fill="rgba(199,166,106,0.06)" />}
            <rect x={W - RANK_W + 10} y={y + 5} width={RANK_W - 20} height={ROW_H - 10} rx={6} fill={rankColor(p.rank)} />
            <text x={xRank} y={mid} textAnchor="middle" fontSize={14} fontWeight={900} fill="#fff">{toFaDigits(p.rank)}</text>
            <text x={xName} y={mid} textAnchor="middle" fontSize={14.5} fontWeight={800} fill="#1C1B17"
              {...(p.name.trim().length > NAME_FIT ? { textLength: NAME_W - 20, lengthAdjust: 'spacingAndGlyphs' } : {})}>{breakAllahLigature(p.name.trim())}</text>
            <text x={xCity} y={mid} textAnchor="middle" fontSize={12.5} fill="#6F6A5C">{p.city || '—'}</text>
            {stages.map((_, i) => {
              const raw = p.stages?.[i]
              const v = typeof raw === 'number' && Number.isFinite(raw) ? raw : null
              return (
                <text key={i} x={xStage(i)} y={mid} textAnchor="middle" fontSize={14} fontWeight={v ? 700 : 500}
                  fill={v ? '#3A372F' : 'rgba(28,27,23,0.32)'}>{v === null ? '—' : toFaDigits(v)}</text>
              )
            })}
            <rect x={0} y={y} width={TOTAL_W} height={ROW_H} fill="rgba(199,166,106,0.10)" />
            <text x={xTotal} y={mid} textAnchor="middle" fontSize={15} fontWeight={900} fill="#8F6531">{p.points.toLocaleString('fa-IR')}</text>
            <line x1={0} x2={W} y1={y + ROW_H} y2={y + ROW_H} stroke="#E7E2D6" strokeWidth={1} />
          </g>
        )
      })}
      {cuts.map((x, i) => (
        <line key={i} x1={x} x2={x} y1={bodyTop} y2={bodyTop + players.length * ROW_H} stroke="#E7E2D6" strokeWidth={1} />
      ))}

      {updatedLabel && (
        <text x={W / 2} y={H - 15} textAnchor="middle" fontSize={12} fill="#6F6A5C">{updatedLabel}</text>
      )}
    </svg>
  )
}
