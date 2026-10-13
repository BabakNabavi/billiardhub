'use client';

/* ─────────────────────────────────────────────────────────────
   فهرستِ باشگاه‌ها — صفحه‌ی نمونه‌ی بازطراحیِ مهرِ ۱۴۰۵.

   ── چه رفت ──
   · هیروی اسلایدیِ تیره با پوسترهای گرافیکی، برچسبِ «DISCOVER CLUBS»
     و h1ای که هر ۴٫۵ ثانیه عوض می‌شد (گاهی «مربیان»). جایش سربرگِ
     روشن با یک تیترِ ثابت و شمارِ واقعی.
   · نوارِ تیره‌ی «باشگاه خود را ثبت کنید» پایینِ صفحه — حالا آخرین
     خانه‌ی همان شبکه است (`RegisterClubTile`).
   · ۸۶۷ خط استایلِ درون‌خطی؛ کارت، ابزار و حالت‌ها در
     `components/clubs/` و منطقِ فیلتر در `lib/clubs/filters`.

   ── چه ماند ──
   فیلترها همچنان به سرور می‌روند (نه دانلودِ کلِ جدول)، جست‌وجو با
   تأخیرِ کوتاه، و مسابقات یک‌بار برای کلِ فهرست.

   ⚠️ فچ هنوز در `useEffect` است، برخلافِ قاعده‌ی «فچِ اولیه در Server
   Component». فیلترها و مکان‌یابی حالتِ کلاینت‌اند و جابه‌جاییِ فچ کارِ
   جداگانه‌ای است، نه بخشی از بازطراحیِ ظاهر.
   ───────────────────────────────────────────────────────────── */

import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import type { Club } from '../../lib/clubs-data';
import { fetchTournaments } from '../../lib/tournaments/client';
import type { Tournament } from '../../lib/mock-tournaments';
import { distanceKm, hasCoords } from '../../lib/clubs/distance';
import { faNum } from '../../lib/jalali';
import {
  NO_FILTERS, availableSorts, countFilters, filterClubs, sortClubs,
  type ClubFilters, type SortKey,
} from '../../lib/clubs/filters';
import { PageHeader } from '../../components/ui/PageHeader';
import { ClubCard } from '../../components/clubs/ClubCard';
import { ClubRow } from '../../components/clubs/ClubRow';
import { ClubsToolbar } from '../../components/clubs/ClubsToolbar';
import { CLUBS_GRID, ClubsEmpty, ClubsError, ClubsSkeleton, RegisterClubTile } from '../../components/clubs/ClubsStates';

type Phase = 'loading' | 'ready' | 'error';

export default function ClubsPage() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [phase, setPhase] = useState<Phase>('loading');
  const [reload, setReload] = useState(0);
  const [view, setView] = useState<'grid' | 'list'>('grid');
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<ClubFilters>(NO_FILTERS);
  const [sort, setSort] = useState<SortKey>('members');
  const [userLoc, setUserLoc] = useState<{ lat: number; lon: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState(false);
  const [tournByClub, setTournByClub] = useState<Map<string, Tournament[]>>(new Map());

  /* فیلترها به سرور می‌روند. جست‌وجو با تأخیرِ کوتاه تا هر حرف یک
     درخواست نسازد. درخواستِ یک فیلترِ قدیمی لغو می‌شود، نه فقط پاسخش
     نادیده گرفته شود: روی شبکه‌ی کند، دانلودِ بی‌مصرف جای پاسخِ تازه را
     می‌گیرد. */
  useEffect(() => {
    const p = new URLSearchParams();
    const q = search.trim();
    if (q) p.set('q', q);
    for (const t of filters.types) p.set(t, '1');
    for (const a of filters.amens) p.set(a, '1');
    const qs = p.toString();

    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      void (async () => {
        try {
          const r = await api.get(`/clubs${qs ? `?${qs}` : ''}`, { signal: ctrl.signal });
          if (ctrl.signal.aborted) return;
          setClubs(Array.isArray(r.data) ? r.data : []);
          setPhase('ready');
        } catch (e) {
          if (ctrl.signal.aborted) return;
          console.warn('[clubs] list fetch failed', e);
          setPhase('error');
        }
      })();
    }, q ? 300 : 0);
    return () => { ctrl.abort(); clearTimeout(timer); };
  }, [search, filters.types, filters.amens, reload]);

  /* مسابقات عمومی، یک‌بار برای کلِ فهرست. کلید `club_id` است، نه نام. */
  useEffect(() => {
    let alive = true;
    void (async () => {
      try {
        const all = await fetchTournaments();
        if (!alive) return;
        const m = new Map<string, Tournament[]>();
        for (const t of all) m.set(t.clubId, [...(m.get(t.clubId) ?? []), t]);
        setTournByClub(m);
      } catch (e) {
        /* نشانِ مسابقه تزئینیِ کارت است؛ نبودنش فهرست را نمی‌شکند */
        console.warn('[clubs] tournaments fetch failed', e);
      }
    })();
    return () => { alive = false; };
  }, []);

  const locate = () => {
    if (!navigator.geolocation) { setLocError(true); return; }
    setLocating(true);
    setLocError(false);
    navigator.geolocation.getCurrentPosition(
      pos => { setUserLoc({ lat: pos.coords.latitude, lon: pos.coords.longitude }); setSort('distance'); setLocating(false); },
      () => { setLocating(false); setLocError(true); },
      { timeout: 8000, enableHighAccuracy: false },
    );
  };

  const withDistance = useMemo(() => {
    if (!userLoc) return clubs;
    return clubs.map(c => hasCoords(c.latitude, c.longitude)
      ? { ...c, distance: distanceKm(userLoc.lat, userLoc.lon, Number(c.latitude), Number(c.longitude)) }
      : c);
  }, [clubs, userLoc]);

  const shown = useMemo(() => {
    const open = (id: string) => (tournByClub.get(id) ?? []).some(t => t.status === 'registration_open');
    return sortClubs(filterClubs(withDistance, filters, search, open), sort);
  }, [withDistance, filters, search, sort, tournByClub]);

  const filtering = search.trim() !== '' || countFilters(filters) > 0;
  const clearAll = () => { setFilters(NO_FILTERS); setSearch(''); };
  const retry = () => { setPhase('loading'); setReload(n => n + 1); };

  return (
    /* زمینه‌ی صاف، بدونِ لکه‌های رنگیِ `lq-stage`: در صفحه‌های اپل رنگ از
       عکس‌ها می‌آید، نه از پس‌زمینه. */
    <div className="min-h-screen bg-paper pb-24">
      <PageHeader title="باشگاه‌های بیلیارد." tagline="میزِ بعدی‌تان را پیدا کنید و آنلاین رزرو کنید." />

      <ClubsToolbar
        search={search} onSearch={setSearch}
        filters={filters} onFilters={setFilters}
        canFilterOpen={clubs.some(c => typeof c.isOpen === 'boolean')}
        sort={sort} sorts={availableSorts(clubs, !!userLoc)} onSort={setSort}
        nearActive={sort === 'distance' && !!userLoc} locating={locating} locError={locError} onNear={locate}
        view={view} onView={setView}
      />

      <section aria-labelledby="clubs-list-title" className="mx-auto max-w-screen-xl px-4 pt-8 sm:px-6 sm:pt-12 lg:px-8">
        {/* ترتیبِ تیترها: h1 سربرگ → این h2 → h3ِ کارت‌ها. همان تیترِ دورنگ،
            یک پله کوچک‌تر؛ شمارِ واقعی بخشِ خاکستریِ همین جمله است. */}
        <h2 id="clubs-list-title" className="m-0 mb-6 text-balance text-tile">
          <span className="text-ink">{!filtering ? 'همه‌ی باشگاه‌ها.' : search.trim() ? 'نتیجه‌ی جست‌وجو.' : 'باشگاه‌های فیلترشده.'}</span>
          {phase === 'ready' && (
            <span aria-live="polite" className="text-ink-2"> {faNum(shown.length)} باشگاه{filtering ? ' با این شرایط.' : ' ثبت‌شده.'}</span>
          )}
        </h2>
        {phase === 'loading' ? (
          <ClubsSkeleton view={view} />
        ) : phase === 'error' ? (
          <ClubsError onRetry={retry} />
        ) : shown.length === 0 ? (
          <ClubsEmpty filtering={filtering} onClear={clearAll} />
        ) : (
          <ul className={[view === 'grid' ? CLUBS_GRID : 'flex flex-col gap-4', 'm-0 list-none p-0'].join(' ')}>
            {shown.map((club, i) => (
              <li key={club.id}>
                {view === 'grid'
                  ? <ClubCard club={club} index={i} tournaments={tournByClub.get(club.id) ?? []} />
                  : <ClubRow club={club} index={i} tournaments={tournByClub.get(club.id) ?? []} />}
              </li>
            ))}
            <li><RegisterClubTile view={view} /></li>
          </ul>
        )}
      </section>
    </div>
  );
}
