'use client';

/* ─────────────────────────────────────────────────────────────
   افزودنِ دوربین.

   ── چرا انتخابِ دستی ──
   نسخه‌ی قبلی «اولین دوربینِ استفاده‌نشده» را خودش برمی‌داشت. روی
   گوشی یعنی دوربینِ جلو — که برای پخشِ میزِ دوم هیچ کاربردی ندارد و
   دقیقا همان چیزی بود که گزارش شد. انتخاب و نام‌گذاری کارِ باشگاه‌دار
   است، نه حدسِ ما.
   ───────────────────────────────────────────────────────────── */

import { useState } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import SelectField from '../../ui/SelectField';
import type { CamDevice } from '../../../lib/live/devices';

const INK = '#1C1B17', SEC = '#5B564B', LINE = '#EAE5DA', GOLD_D = '#8F6531', GROUND = '#FAF8F3';

export default function AddCameraPanel({
  cams, usedIds, suggestedLabel, busy, onAdd, onCancel,
}: {
  cams: CamDevice[];
  usedIds: string[];
  suggestedLabel: string;
  busy: boolean;
  onAdd: (deviceId: string, label: string) => void;
  onCancel: () => void;
}) {
  /* دوربین‌های در حالِ استفاده کنار گذاشته می‌شوند: بازکردنِ دوباره‌ی
     همان ورودی روی اغلبِ دستگاه‌ها NotReadableError می‌دهد. */
  /* ترتیبِ مفید: اول ورودیِ بیرونی (کارتِ کپچرِ دوربینِ حرفه‌ای —
     همان چیزی که برای پخشِ میز می‌خواهند)، بعد دوربینِ پشت، و
     دوربینِ جلو آخر چون تقریبا هیچ‌وقت انتخابِ درست نیست. */
  const rank = (c: CamDevice) => (!c.builtIn ? 0 : c.facing === 'back' ? 1 : c.facing === 'unknown' ? 2 : 3);
  const free = cams
    .filter(c => c.deviceId && !usedIds.includes(c.deviceId))
    .slice()
    .sort((a, b) => rank(a) - rank(b));
  const [deviceId, setDeviceId] = useState('');
  const [label, setLabel] = useState(suggestedLabel);

  /* ⚠️ فهرستِ دوربین‌ها ناهمگام تازه می‌شود و با افزودنِ هر دوربین،
     usedIds هم عوض می‌شود. مقدارِ اولیه‌ی state پس از آن کهنه می‌شود و
     شناسه‌ای را نگه می‌دارد که دیگر در گزینه‌ها نیست — آن‌وقت انتخابگر
     چیزی نشان می‌داد و دکمه چیزِ دیگری می‌فرستاد. */
  const selected = free.some(c => c.deviceId === deviceId)
    ? deviceId
    : (free[0]?.deviceId ?? '');

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 12,
      background: GROUND, border: `1px solid ${LINE}`, borderRadius: 14, padding: 16,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 800, color: INK, flex: 1 }}>افزودن دوربین</span>
        <button type="button" onClick={onCancel} aria-label="انصراف" className="acp-x"
          style={{ width: 32, height: 32, borderRadius: 8, border: 'none', background: 'transparent', color: SEC, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <X size={16} />
        </button>
      </div>

      {/* روی گوشی معمولا دوربینِ جلو و عقب هم‌زمان باز نمی‌شوند؛ بهتر
          است پیش از تلاش بداند تا پخشش سیاه نشود. */}
      <p style={{ fontSize: 11.5, color: SEC, margin: 0, lineHeight: 1.9 }}>
        روی بیشتر گوشی‌ها فقط یک دوربین هم‌زمان باز می‌شود. برای میز دوم، پنل را
        روی دستگاه دیگری با همین حساب باز کنید.
      </p>

      {free.length === 0 ? (
        <p style={{ fontSize: 12, color: SEC, margin: 0, lineHeight: 1.9 }}>
          دوربین آزادی روی این دستگاه نمانده است. برای میز بعدی، پنل باشگاه را روی
          گوشی یا لپ‌تاپ دیگری با همین حساب باز کنید و از آن‌جا دوربین اضافه کنید.
        </p>
      ) : (
        <>
          <SelectField label="کدام دوربین" value={selected} onChange={setDeviceId}
            options={free.map(c => ({ value: c.deviceId, label: c.label }))} />

          <label style={{ display: 'block' }}>
            <span style={{ display: 'block', fontSize: 11.5, fontWeight: 800, color: SEC, marginBottom: 6 }}>
              نام این دوربین (برای بیننده دیده می‌شود)
            </span>
            {/* outline حذف نشده: حلقه‌ی فوکوس روی همه‌ی المان‌های
                تعاملی الزامی است و با استایلِ اینلاین نمی‌شود
                focus-visible نوشت. */}
            <input value={label} onChange={e => setLabel(e.target.value.slice(0, 40))}
              placeholder="مثلا: میز ۲" className="acp-input"
              style={{ width: '100%', boxSizing: 'border-box', padding: '11px 13px', borderRadius: 12, border: `1px solid ${LINE}`, background: '#fff', fontSize: 13.5, fontFamily: 'inherit', color: INK }} />
          </label>

          <button type="button" disabled={busy || !selected} className="acp-btn"
            onClick={() => onAdd(selected, label.trim() || suggestedLabel)}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '12px', borderRadius: 12, border: 'none', cursor: 'pointer',
              fontFamily: 'inherit', fontSize: 13.5, fontWeight: 800,
              background: GOLD_D, color: '#fff', opacity: busy || !selected ? 0.7 : 1,
            }}>
            {busy ? <Loader2 size={16} className="gl-spin" aria-hidden /> : <Plus size={16} aria-hidden />}
            افزودن
          </button>
        </>
      )}
      <style>{`
        .acp-input:focus-visible,
        .acp-btn:focus-visible,
        .acp-x:focus-visible { outline: 2px solid #C7A66A; outline-offset: 2px }
        .acp-input:focus { border-color: rgba(199,166,106,0.55) }
        .acp-x:hover { background: rgba(0,0,0,0.05) }
      `}</style>
    </div>
  );
}
