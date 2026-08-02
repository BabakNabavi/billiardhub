/* ─────────────────────────────────────────────────────────────
   تبِ «ساعات کاری» — از `app/dashboard/club/page.tsx` جدا شد.

   تنها چهار چیز از صفحه‌ی مادر لازم دارد، پس برخلافِ بیشترِ تب‌ها
   می‌شود بی‌خطر بیرونش کشید: هیچ‌کدام از آن ۸۶ `useState` دیگر را
   نمی‌بیند و رفتارش دقیقاً همان است.
   ───────────────────────────────────────────────────────────── */

import FaTimeSelect from '../../ui/FaTimeSelect';
import { Card, SectionTitle, SaveBtn } from './fields';
/* همان شکلی که صفحه‌ی مادر دارد. TypeScript ساختاری است، پس لازم نیست
   تعریفِ آن‌جا جابه‌جا شود — و جابه‌جا کردنش یعنی دست‌زدن به ده‌ها
   ارجاعِ دیگر بدونِ هیچ سودی. */
export interface WorkingDay { isOpen: boolean; open: string; close: string }
export type WorkingHours = Record<string, WorkingDay>;

const GOLD = '#C7A66A';
const DARK = '#1A1A18';

const DAYS = [
  { key: 'saturday',  label: 'شنبه' },
  { key: 'sunday',    label: 'یکشنبه' },
  { key: 'monday',    label: 'دوشنبه' },
  { key: 'tuesday',   label: 'سه‌شنبه' },
  { key: 'wednesday', label: 'چهارشنبه' },
  { key: 'thursday',  label: 'پنجشنبه' },
  { key: 'friday',    label: 'جمعه' },
] as const;

export default function HoursTab({ hoursForm, setHoursForm, saveHours, hoursSaving }: {
  hoursForm: WorkingHours;
  setHoursForm: React.Dispatch<React.SetStateAction<WorkingHours>>;
  saveHours: () => void;
  hoursSaving: boolean;
}) {
  return (
      <Card>
        <SectionTitle>ساعات کاری باشگاه</SectionTitle>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
          {DAYS.map(day => {
            const dh: WorkingDay = hoursForm[day.key] ?? { isOpen: true, open: '09:00', close: '23:00' };
            const setDay = (patch: Partial<WorkingDay>) =>
              setHoursForm(p => ({ ...p, [day.key]: { ...dh, ...patch } as WorkingDay }));
            return (
              /* ── ردیفِ هر روز ──
                 پیش‌تر یک flex با `gap: 12` و انتخابگرهای غیرفشرده
                 بود: نامِ روز ۹۰px، دو انتخابگرِ ۷۲پیکسلی با دو‌نقطه و
                 برچسبِ «از»/«تا». مجموعش از عرضِ موبایل بیشتر می‌شد و
                 ساعت‌ها از صفحه بیرون می‌زدند. حالا شبکه است: نامِ روز
                 ستونِ اول، دو ساعت ستون‌های هم‌عرضِ بعدی — و در موبایل
                 برچسب‌های «از/تا» حذف و انتخابگرها فشرده می‌شوند. */
              <div key={day.key} className="wh-day-row" style={{
                padding: '12px 16px',
                background: dh.isOpen ? '#FFFBF0' : '#F9FAFB',
                border: `1px solid ${dh.isOpen ? '#FEF3C7' : '#E5E7EB'}`,
                borderRadius: 12,
              }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', minWidth: 0 }}>
                  <input type="checkbox" checked={dh.isOpen}
                    onChange={e => setDay({ isOpen: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: GOLD, flexShrink: 0 }} />
                  <span className="wh-day-name" style={{ fontWeight: 700, fontSize: 14, color: DARK }}>{day.label}</span>
                </label>
                {dh.isOpen ? (
                  <>
                    <div className="wh-cell">
                      <span className="wh-lb" style={{ fontSize: 12, color: '#6B7280' }}>از</span>
                      <FaTimeSelect value={dh.open} onChange={v => setDay({ open: v })} ariaLabel="شروع" compact />
                    </div>
                    <div className="wh-cell">
                      <span className="wh-lb" style={{ fontSize: 12, color: '#6B7280' }}>تا</span>
                      <FaTimeSelect value={dh.close} onChange={v => setDay({ close: v })} ariaLabel="پایان" compact />
                    </div>
                  </>
                ) : (
                  <span style={{ fontSize: 13, color: '#9CA3AF', gridColumn: '2 / -1' }}>تعطیل</span>
                )}
              </div>
            );
          })}
        </div>
        <SaveBtn onClick={saveHours} loading={hoursSaving} />
      </Card>
  );
}
