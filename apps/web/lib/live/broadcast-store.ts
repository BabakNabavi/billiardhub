'use client';

import { startBroadcast, type Broadcaster } from './webrtc';
import { startLive, beatLive, stopLive, addAngle, type LiveSession } from './client';
import { MAIN_ANGLE, MAX_ANGLES } from './angles';
import { presetOf, retuneTrack, DEFAULT_QUALITY, type QualityId } from './quality';
import { stopStream } from './devices';

/* ─────────────────────────────────────────────────────────────
   حالتِ پخشِ زنده — بیرون از ری‌اکت.

   ── باگی که این فایل برای آن نوشته شد ──
   پخش داخلِ stateِ کامپوننت GoLive زندگی می‌کرد و پاک‌سازیِ آن
   کامپوننت `stopLive` صدا می‌زد. ولی GoLive این‌طور رندر می‌شود:

       {activeTab === 'live' && <GoLive … />}

   یعنی عوض‌کردنِ تبِ پنل، یا هر ناوبری‌ای که صفحه را عوض کند،
   کامپوننت را unmount می‌کرد و **پخشِ در جریان را می‌کشت**. گزارشِ
   واقعی دقیقا همین بود: «دوربین اضافه کردم، رفتم رویش زدم، یهو از
   پخش خارج شدم و خودم شدم تماشاکننده». زدنِ لینکِ «مشاهده» روی موبایل
   در همان تب باز می‌شود ⟵ ناوبری ⟵ unmount ⟵ پایانِ پخش ⟵ و کاربر
   روی صفحه‌ی تماشای یک پخشِ مرده می‌افتد.

   پس مالکِ استریم‌ها و اتصال‌ها این ماژول است، نه کامپوننت. پخش فقط
   با «پایان پخش»ِ صریح یا با بسته‌شدنِ خودِ صفحه تمام می‌شود.
   کامپوننت فقط یک پنجره به این حالت است.
   ───────────────────────────────────────────────────────────── */

export interface BroadcastFeed {
  angleId: string;
  label: string;
  kind: 'camera' | 'screen';
  deviceId: string;
  stream: MediaStream;
  viewers: number;
  micOn: boolean;
}

export interface BroadcastState {
  session: LiveSession | null;
  /** این دستگاه پخش را شروع کرده — در برابرِ دستگاهی که فقط دوربین داده. */
  owned: boolean;
  feeds: BroadcastFeed[];
  quality: QualityId;
  error: string;
}

const EMPTY: BroadcastState = {
  session: null, owned: false, feeds: [], quality: DEFAULT_QUALITY, error: '',
};

let state: BroadcastState = EMPTY;
const bcs = new Map<string, Broadcaster>();
const subs = new Set<() => void>();
let ownerKey = '';
let beatTimer: number | null = null;

/* ── اشتراک برای ری‌اکت ──
   getSnapshot باید تا وقتی چیزی عوض نشده همان شیء را بدهد، وگرنه
   useSyncExternalStore بی‌نهایت رندر می‌کند. */
export function subscribe(cb: () => void): () => void {
  subs.add(cb);
  return () => { subs.delete(cb) };
}
export function getSnapshot(): BroadcastState { return state }
export function getServerSnapshot(): BroadcastState { return EMPTY }

function set(patch: Partial<BroadcastState>): void {
  state = { ...state, ...patch };
  subs.forEach(cb => cb());
}

export function setError(error: string): void { set({ error }) }

/* ── تپش ──
   داخلِ همین ماژول است تا با رفتنِ کاربر به تبِ دیگر قطع نشود؛ قبلا
   افکتِ کامپوننت بود و همان‌جا می‌مرد. */
function syncHeartbeat(): void {
  if (typeof window === 'undefined') return;
  const want = Boolean(state.session) && state.feeds.length > 0;
  if (want && beatTimer === null) {
    const tick = () => {
      const s = state.session;
      if (!s) return;
      for (const f of state.feeds) {
        void beatLive(s.id, ownerKey, f.angleId === MAIN_ANGLE ? f.viewers : 0, f.angleId, f.label);
      }
    };
    tick();
    beatTimer = window.setInterval(tick, 15_000);
  } else if (!want && beatTimer !== null) {
    window.clearInterval(beatTimer);
    beatTimer = null;
  }
}

/* ── هشدارِ بستنِ صفحه ──
   ناوبریِ کاملِ مرورگر را نمی‌شود متوقف کرد، ولی می‌شود پرسید. این
   دقیقا همان لحظه‌ای است که کاربر ناخواسته پخشش را از دست می‌داد. */
function onBeforeUnload(e: BeforeUnloadEvent): void {
  if (state.feeds.length === 0) return;
  e.preventDefault();
  e.returnValue = '';
}
function syncUnloadGuard(): void {
  if (typeof window === 'undefined') return;
  window.removeEventListener('beforeunload', onBeforeUnload);
  if (state.feeds.length > 0) window.addEventListener('beforeunload', onBeforeUnload);
}

function afterChange(): void { syncHeartbeat(); syncUnloadGuard() }

/** آیا این دستگاه همین حالا در حال پخش است؟ */
export function isBroadcasting(): boolean { return state.feeds.length > 0 }

export async function setQuality(q: QualityId): Promise<void> {
  set({ quality: q });
  const p = presetOf(q);
  /* هر دو لازم است: سقفِ نرخ بیت روی فرستنده، و قیدِ تازه روی خودِ
     دوربین. فقط اولی یعنی پهنای باندِ بیشتر برای همان تصویرِ کوچک. */
  await Promise.all(state.feeds.flatMap(f => [
    bcs.get(f.angleId)?.setQuality(q),
    retuneTrack(f.stream, p),
  ]));
}

function attach(
  sessionId: string, angleId: string, label: string,
  stream: MediaStream, kind: 'camera' | 'screen', deviceId: string,
): boolean {
  const bc = startBroadcast(sessionId, stream, n => {
    set({ feeds: state.feeds.map(f => f.angleId === angleId ? { ...f, viewers: n } : f) });
  }, { angleId, quality: state.quality });

  if (!bc) { stopStream(stream); set({ error: 'اتصال بی‌درنگ در دسترس نیست' }); return false }
  bcs.set(angleId, bc);
  set({ feeds: [...state.feeds, { angleId, label, kind, deviceId, stream, viewers: 0, micOn: true }] });
  afterChange();
  return true;
}

export async function startSession(opts: {
  clubId: string; clubName: string; ownerKey: string;
  title: string;
  stream: MediaStream; deviceId: string; mainLabel: string;
}): Promise<boolean> {
  ownerKey = opts.ownerKey;
  const r = await startLive({
    clubId: opts.clubId, clubName: opts.clubName, ownerKey: opts.ownerKey,
    title: opts.title, angleLabel: opts.mainLabel,
  });
  if (!r?.ok || !r.session) {
    stopStream(opts.stream);
    set({ error: r?.message || 'شروع پخش ممکن نشد' });
    return false;
  }
  set({ session: r.session, owned: true, error: '' });
  if (!attach(r.session.id, MAIN_ANGLE, opts.mainLabel, opts.stream, 'camera', opts.deviceId)) {
    /* جلسه روی سرور ساخته شده ولی هیچ تصویری ندارد؛ اگر رها شود تا
       پایانِ پنجره‌ی کهنگی در فهرستِ عمومی به‌عنوان پخشِ زنده می‌ماند. */
    await stopLive(r.session.id, opts.ownerKey);
    set({ session: null, owned: false });
    return false;
  }
  return true;
}

/** دستگاهِ مهمان: پخش را دیگری شروع کرده و این‌جا فقط دوربین می‌دهد. */
export function adoptSession(session: LiveSession, key: string): void {
  if (state.session?.id === session.id) return;
  ownerKey = key;
  set({ session, owned: false });
}

export async function addFeed(opts: {
  stream: MediaStream; kind: 'camera' | 'screen'; deviceId: string; label: string;
}): Promise<boolean> {
  const s = state.session;
  if (!s) { stopStream(opts.stream); return false }
  if (state.feeds.length >= MAX_ANGLES) {
    stopStream(opts.stream);
    set({ error: `بیشتر از ${MAX_ANGLES} دوربین هم‌زمان ممکن نیست` });
    return false;
  }
  const a = await addAngle(s.id, opts.label.slice(0, 40));
  if (!a?.ok || !a.angle) {
    stopStream(opts.stream);
    set({ error: a?.message || 'افزودن دوربین ممکن نشد' });
    return false;
  }
  return attach(s.id, a.angle.id, a.angle.label, opts.stream, opts.kind, opts.deviceId);
}

export function removeFeed(angleId: string): void {
  const f = state.feeds.find(x => x.angleId === angleId);
  bcs.get(angleId)?.stop();
  bcs.delete(angleId);
  stopStream(f?.stream);
  set({ feeds: state.feeds.filter(x => x.angleId !== angleId) });
  afterChange();
}

export function toggleMic(angleId: string): void {
  const f = state.feeds.find(x => x.angleId === angleId);
  if (!f) return;
  const next = !f.micOn;
  f.stream.getAudioTracks().forEach(t => { t.enabled = next });
  set({ feeds: state.feeds.map(x => x.angleId === angleId ? { ...x, micOn: next } : x) });
}

/** تعویضِ تصویرِ دوربینِ اصلی بدونِ قطعِ بیننده‌ها. */
export async function replaceMain(stream: MediaStream, deviceId: string): Promise<void> {
  const main = state.feeds.find(f => f.angleId === MAIN_ANGLE);
  if (!main) { stopStream(stream); return }

  /* ⚠️ پیش از هر چیز، وضعیتِ میکروفون روی استریمِ تازه اعمال شود.
     دوربینِ تازه همیشه با صدای روشن باز می‌شود؛ بدونِ این خط، عوض‌کردنِ
     دوربین صدای سالن را پخش می‌کرد در حالی که رابط هنوز آیکونِ
     «بی‌صدا» را نشان می‌داد. */
  stream.getAudioTracks().forEach(t => { t.enabled = main.micOn });

  await bcs.get(MAIN_ANGLE)?.replaceStream(stream);

  /* اگر وسطِ کار دوربینِ دیگری جایگزین شده باشد، این فراخوانی بازنده
     است و باید استریمِ خودش را ببندد، نه استریمِ برنده را. */
  const now = state.feeds.find(f => f.angleId === MAIN_ANGLE);
  if (!now || now.stream !== main.stream) { stopStream(stream); return }

  stopStream(main.stream);
  set({ feeds: state.feeds.map(f => f.angleId === MAIN_ANGLE ? { ...f, stream, deviceId } : f) });
}

/** پایانِ کارِ این دستگاه. مالک کلِ پخش را می‌بندد؛ مهمان فقط دوربینِ خودش را. */
export async function endLocal(): Promise<void> {
  const s = state.session;
  const owned = state.owned;
  state.feeds.forEach(f => { bcs.get(f.angleId)?.stop(); stopStream(f.stream) });
  bcs.clear();
  set({ feeds: [], error: '' });
  afterChange();

  if (!s || !owned) { set({ session: null, owned: false }); return }

  /* ⚠️ شکستِ این درخواست بی‌صدا بلعیده می‌شد و کاربر مطمئن بود پخش
     تمام شده، در حالی که سرور هنوز آن را زنده می‌دانست. جلسه نگه
     داشته می‌شود تا دکمه‌ی «پایان پخش» دوباره قابلِ زدن باشد. */
  const r = await stopLive(s.id, ownerKey) as { ok?: boolean };
  if (r?.ok) set({ session: null, owned: false });
  else set({ error: 'پایان پخش روی سرور ثبت نشد؛ دوباره تلاش کنید.' });
}

/** فقط برای وقتی سرور می‌گوید پخش تمام شده و ما مهمان بودیم. */
export function dropLocalFeeds(message: string): void {
  state.feeds.forEach(f => { bcs.get(f.angleId)?.stop(); stopStream(f.stream) });
  bcs.clear();
  set({ feeds: [], session: null, owned: false, error: message });
  afterChange();
}
