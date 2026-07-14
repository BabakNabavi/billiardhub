'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useAuthStore } from '../../../store/auth.store';
import AuthGuard from '../../../components/AuthGuard';
import {
    Shield, Activity, Clock, CheckCircle, AlertCircle,
    ChevronRight, Check, X, Edit, Eye, Users,
    Trophy, Calendar, Zap, Target, BarChart2,
    MessageCircle, Settings, Play, Pause, Square,
    Flag, RotateCcw, ChevronUp, ChevronDown, Plus, Award, Star, Camera
} from 'lucide-react';
import {
    STORY_ROLES, addStoredStory, getOwnerStories, removeStoredStory, type StoredStory,
} from '../../../lib/story-store';

/* ══ types ══ */
type MatchStatus = 'scheduled' | 'live' | 'break' | 'completed' | 'disputed';
type DisputeStatus = 'open' | 'resolved' | 'escalated';
type Tab = 'overview' | 'live' | 'schedule' | 'reports' | 'disputes' | 'stories';

interface LiveMatch {
    id: string; player1: string; player2: string;
    score1: number; score2: number; frame: number;
    totalFrames: number; status: MatchStatus;
    table: string; tournament: string; round: string;
    startTime: string; elapsed: number;
    currentBreak: number; p1Break: number; p2Break: number;
    foulCount: number; timeouts: { p1: number; p2: number };
}

interface ScheduledMatch {
    id: string; player1: string; player2: string;
    tournament: string; round: string;
    table: string; time: string; date: string; status: MatchStatus;
}

interface Dispute {
    id: string; match: string; player: string;
    issue: string; time: string; status: DisputeStatus;
    description: string;
}

interface Report {
    id: string; match: string; tournament: string;
    date: string; result: string; submitted: boolean;
    duration: string; incidents: number;
}

/* ══ data ══ */
const LIVE_MATCHES: LiveMatch[] = [
    {
        id: 'lm1', player1: 'امیرحسین رضایی', player2: 'سعید موسوی',
        score1: 4, score2: 3, frame: 8, totalFrames: 11, status: 'live',
        table: 'میز ۱', tournament: 'لیگ برتر ۱۴۰۴', round: 'نیمه‌نهایی',
        startTime: '۱۴:۰۰', elapsed: 142, currentBreak: 47,
        p1Break: 143, p2Break: 121, foulCount: 2,
        timeouts: { p1: 1, p2: 0 },
    },
    {
        id: 'lm2', player1: 'محمد حسینی', player2: 'رضا کریمی',
        score1: 2, score2: 2, frame: 5, totalFrames: 11, status: 'break',
        table: 'میز ۲', tournament: 'لیگ برتر ۱۴۰۴', round: 'نیمه‌نهایی',
        startTime: '۱۴:۰۰', elapsed: 98, currentBreak: 0,
        p1Break: 95, p2Break: 112, foulCount: 1,
        timeouts: { p1: 0, p2: 1 },
    },
];

const SCHEDULED: ScheduledMatch[] = [
    { id: 'sm1', player1: 'نیما نوری', player2: 'کاوه رستمی', tournament: 'جام جوانان', round: 'ربع‌نهایی', table: 'میز ۳', time: '۱۸:۰۰', date: 'امروز', status: 'scheduled' },
    { id: 'sm2', player1: 'علی صادقی', player2: 'حسین فتحی', tournament: 'جام جوانان', round: 'ربع‌نهایی', table: 'میز ۴', time: '۲۰:۰۰', date: 'امروز', status: 'scheduled' },
    { id: 'sm3', player1: 'مریم احمدی', player2: 'نازنین رضایی', tournament: 'لیگ بانوان', round: 'فینال', table: 'میز ۱', time: '۱۰:۰۰', date: 'فردا', status: 'scheduled' },
];

const DISPUTES: Dispute[] = [
    { id: 'd1', match: 'رضایی vs موسوی', player: 'سعید موسوی', issue: 'اعتراض به خطای اعلام‌شده', time: '۱۴:۳۲', status: 'open', description: 'بازیکن معتقد است توپ از روی خط خارج نشده بود.' },
    { id: 'd2', match: 'حسینی vs کریمی', player: 'محمد حسینی', issue: 'اعتراض به تایم‌اوت رقیب', time: '۱۳:۱۵', status: 'resolved', description: 'طبق قوانین تایم‌اوت مجاز بود.' },
];

const REPORTS: Report[] = [
    { id: 'rp1', match: 'رضایی vs موسوی ۶-۲', tournament: 'لیگ برتر', date: 'دیروز', result: 'رضایی پیروز', submitted: true, duration: '۱:۴۵', incidents: 1 },
    { id: 'rp2', match: 'نوری vs رستمی ۶-۴', tournament: 'لیگ برتر', date: 'دیروز', result: 'نوری پیروز', submitted: true, duration: '۲:۱۲', incidents: 0 },
    { id: 'rp3', match: 'حسینی vs کریمی (جاری)', tournament: 'لیگ برتر', date: 'امروز', result: 'در حال بازی', submitted: false, duration: '—', incidents: 1 },
];

function toFa(v: string | number) { return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d))); }

function pad(n: number) { return String(n).padStart(2, '0'); }

const rid = () => Math.random().toString(36).slice(2, 9);

/* Downscale + re-encode a story image before storing (localStorage quota). */
function compressStoryImage(file: File, maxDim = 1080, quality = 0.72): Promise<string> {
    return new Promise(resolve => {
        const reader = new FileReader();
        reader.onerror = () => resolve('');
        reader.onload = () => {
            const dataUrl = String(reader.result);
            const im = document.createElement('img');
            im.onerror = () => resolve(dataUrl);
            im.onload = () => {
                let w = im.naturalWidth || im.width;
                let h = im.naturalHeight || im.height;
                if (w >= h && w > maxDim)     { h = Math.round((h * maxDim) / w); w = maxDim; }
                else if (h > w && h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
                const canvas = document.createElement('canvas');
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                if (!ctx) { resolve(dataUrl); return; }
                ctx.drawImage(im, 0, 0, w, h);
                try { resolve(canvas.toDataURL('image/jpeg', quality)); } catch { resolve(dataUrl); }
            };
            im.src = dataUrl;
        };
        reader.readAsDataURL(file);
    });
}

function ElapsedTimer({ seconds }: { seconds: number }) {
    const [t, setT] = useState(seconds);
    useEffect(() => {
        const i = setInterval(() => setT(p => p + 1), 1000);
        return () => clearInterval(i);
    }, []);
    const m = Math.floor(t / 60), s = t % 60;
    return <span style={{ fontVariantNumeric: 'tabular-nums' }}>{toFa(pad(m))}:{toFa(pad(s))}</span>;
}

/* ══ Live Match Control Panel ══ */
function LiveControl({ match }: { match: LiveMatch }) {
    const [score1, setScore1] = useState(match.score1);
    const [score2, setScore2] = useState(match.score2);
    const [curBreak, setCurBreak] = useState(match.currentBreak);
    const [status, setStatus] = useState(match.status);
    const [foul, setFoul] = useState(match.foulCount);
    const [showFoulModal, setFoulModal] = useState(false);
    const accentMap: Record<string, string> = { live: '#ef4444', break: '#f59e0b', completed: '#C7A66A', scheduled: '#06b6d4', disputed: '#a78bfa' };
    const accent = accentMap[status] ?? '#C7A66A';
    const pct1 = match.totalFrames > 0 ? (score1 / (Math.ceil(match.totalFrames / 2))) * 100 : 0;
    const pct2 = match.totalFrames > 0 ? (score2 / (Math.ceil(match.totalFrames / 2))) * 100 : 0;

    return (
        <div style={{ background: '#FFFFFF', border: `1px solid ${accent}20`, borderRadius: '22px', overflow: 'hidden', position: 'relative' }}>
            {/* Glow top */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: `linear-gradient(90deg,transparent,${accent}70,transparent)`, boxShadow: `0 0 14px ${accent}50` }} />

            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                    <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.40)', letterSpacing: '0.12em', marginBottom: '3px' }}>{match.tournament} · {match.round}</div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#111111', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {match.table}
                        <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px', background: `${accent}12`, border: `1px solid ${accent}25`, color: accent }}>
                            {status === 'live' ? 'LIVE' : status === 'break' ? 'BREAK' : status === 'completed' ? 'FINAL' : '—'}
                        </span>
                    </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '16px', fontWeight: 800, color: 'rgba(0,0,0,0.45)', fontVariantNumeric: 'tabular-nums' }}>
                    <Clock size={13} style={{ color: accent }} />
                    {status === 'live' ? <ElapsedTimer seconds={match.elapsed} /> : toFa(pad(Math.floor(match.elapsed / 60))) + ':' + toFa(pad(match.elapsed % 60))}
                </div>
            </div>

            {/* Scoreboard */}
            <div style={{ padding: '20px', display: 'grid', gridTemplateColumns: '1fr auto 1fr', gap: '16px', alignItems: 'center' }}>

                {/* Player 1 */}
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 'clamp(14px, 2.2vw, 17px)', fontWeight: 800, color: '#111111', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {match.player1.split(' ').pop()}
                    </div>
                    {/* Score buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setScore1(s => Math.max(0, s - 1))} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                            <ChevronDown size={13} />
                        </button>
                        <div style={{ fontSize: '46px', fontWeight: 900, color: score1 > score2 ? '#C7A66A' : '#f0faf5', letterSpacing: '-0.04em', lineHeight: 1, textShadow: score1 > score2 ? '0 0 24px rgba(199,166,106,0.5)' : 'none', transition: 'all 0.3s' }}>
                            {toFa(score1)}
                        </div>
                        <button onClick={() => setScore1(s => s + 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.25)', cursor: 'pointer', color: '#C7A66A', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}>
                            <ChevronUp size={13} />
                        </button>
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.40)', marginTop: '6px' }}>بالاترین بریک: {toFa(match.p1Break)}</div>
                </div>

                {/* Center */}
                <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.30)', marginBottom: '4px' }}>فریم {toFa(score1 + score2)} از {toFa(match.totalFrames)}</div>
                    <div style={{ fontSize: '18px', fontWeight: 900, color: 'rgba(0,0,0,0.30)', letterSpacing: '-0.02em' }}>:</div>
                    <div style={{ marginTop: '8px' }}>
                        <div style={{ fontSize: '13px', color: curBreak > 0 ? '#f59e0b' : 'rgba(0,0,0,0.30)', fontWeight: 700 }}>
                            {curBreak > 0 ? `بریک: ${toFa(curBreak)}` : '—'}
                        </div>
                    </div>
                </div>

                {/* Player 2 */}
                <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: 'clamp(14px, 2.2vw, 17px)', fontWeight: 800, color: '#111111', marginBottom: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {match.player2.split(' ').pop()}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <button onClick={() => setScore2(s => Math.max(0, s - 1))} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', cursor: 'pointer', color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronDown size={13} />
                        </button>
                        <div style={{ fontSize: '46px', fontWeight: 900, color: score2 > score1 ? '#C7A66A' : '#f0faf5', letterSpacing: '-0.04em', lineHeight: 1, textShadow: score2 > score1 ? '0 0 24px rgba(199,166,106,0.5)' : 'none', transition: 'all 0.3s' }}>
                            {toFa(score2)}
                        </div>
                        <button onClick={() => setScore2(s => s + 1)} style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.25)', cursor: 'pointer', color: '#C7A66A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ChevronUp size={13} />
                        </button>
                    </div>
                    <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.40)', marginTop: '6px' }}>بالاترین بریک: {toFa(match.p2Break)}</div>
                </div>
            </div>

            {/* Frame progress */}
            <div style={{ padding: '0 20px 16px' }}>
                <div style={{ display: 'flex', gap: '3px' }}>
                    {Array.from({ length: match.totalFrames }).map((_, i) => (
                        <div key={i} style={{ flex: 1, height: '5px', borderRadius: '3px', background: i < score1 ? '#C7A66A' : i >= match.totalFrames - score2 ? '#06b6d4' : 'rgba(0,0,0,0.07)', boxShadow: i < score1 ? '0 0 6px rgba(199,166,106,0.5)' : i >= match.totalFrames - score2 ? '0 0 6px rgba(6,182,212,0.5)' : 'none', transition: 'all 0.3s' }} />
                    ))}
                </div>
            </div>

            {/* Controls */}
            <div style={{ padding: '14px 20px 18px', borderTop: '1px solid rgba(0,0,0,0.04)', display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Match controls */}
                <div style={{ display: 'flex', gap: '6px', flex: 1, flexWrap: 'wrap' }}>
                    {[
                        { icon: <Play size={13} />, label: 'ادامه', color: '#C7A66A', action: () => setStatus('live'), show: status === 'break' || status === 'scheduled' },
                        { icon: <Pause size={13} />, label: 'استراحت', color: '#f59e0b', action: () => setStatus('break'), show: status === 'live' },
                        { icon: <Square size={13} />, label: 'پایان', color: '#ef4444', action: () => setStatus('completed'), show: status === 'live' || status === 'break' },
                        { icon: <RotateCcw size={13} />, label: 'ریست', color: '#06b6d4', action: () => setCurBreak(0), show: true },
                    ].filter(c => c.show).map((c, i) => (
                        <button key={i} onClick={c.action} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: `${c.color}10`, border: `1px solid ${c.color}25`, borderRadius: '10px', color: c.color, fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                            {c.icon}{c.label}
                        </button>
                    ))}
                </div>

                {/* Foul + Timeout */}
                <div style={{ display: 'flex', gap: '6px' }}>
                    <button onClick={() => setFoul(f => f + 1)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', color: '#ef4444', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <Flag size={12} /> فاول ({toFa(foul)})
                    </button>
                    <button onClick={() => setFoulModal(true)} style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '10px', color: '#a78bfa', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                        <AlertCircle size={12} /> اعتراض
                    </button>
                </div>
            </div>

            {/* Break counter row */}
            <div style={{ padding: '0 20px 16px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.40)' }}>بریک جاری:</div>
                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(v => (
                    <button key={v} onClick={() => setCurBreak(p => p + v)} style={{ padding: '4px 10px', background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.15)', borderRadius: '8px', color: '#f59e0b', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.2s' }}>
                        +{toFa(v)}
                    </button>
                ))}
                {curBreak > 0 && (
                    <div style={{ marginRight: 'auto', fontSize: '16px', fontWeight: 900, color: '#f59e0b', letterSpacing: '-0.01em' }}>
                        = {toFa(curBreak)}
                    </div>
                )}
            </div>

            {/* Dispute modal */}
            {showFoulModal && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: 'rgba(6,13,10,0.98)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '22px', padding: '28px', width: 'min(420px,92vw)', boxShadow: '0 40px 100px rgba(0,0,0,0.6)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                            <h3 style={{ fontSize: '18px', fontWeight: 800, color: '#111111', margin: 0 }}>ثبت اعتراض</h3>
                            <button onClick={() => setFoulModal(false)} style={{ background: 'rgba(0,0,0,0.05)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', color: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <X size={14} />
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '18px' }}>
                            {['خطای تکنیکی', 'خروج توپ', 'مشکل تجهیزات', 'رفتار نامناسب', 'سایر'].map(opt => (
                                <button key={opt} onClick={() => setFoulModal(false)} style={{ padding: '12px 16px', background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.15)', borderRadius: '12px', color: 'rgba(0,0,0,0.48)', fontSize: '15px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'right', transition: 'all 0.2s' }}
                                    onMouseEnter={e => { (e.currentTarget).style.background = 'rgba(167,139,250,0.12)'; (e.currentTarget).style.color = '#a78bfa'; }}
                                    onMouseLeave={e => { (e.currentTarget).style.background = 'rgba(167,139,250,0.06)'; (e.currentTarget).style.color = 'rgba(0,0,0,0.48)'; }}>
                                    {opt}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

/* ══ MAIN CONTENT ══ */
function DashboardContent() {
    const { user, _hydrated } = useAuthStore();
    const [tab, setTab] = useState<Tab>('overview');
    const [tick, setTick] = useState(0);

    useEffect(() => {
        const t = setInterval(() => setTick(n => n + 1), 1000);
        return () => clearInterval(t);
    }, []);

    /* ── Stories — published independently; feed the home stories bar for 24h ── */
    const ownerKey = user?.phone || user?.id || user?.firstName || 'referee';
    const refRole = STORY_ROLES.referee!;
    const [storyList, setStoryList]   = useState<StoredStory[]>([]);
    const [storyDraft, setStoryDraft] = useState<{ url: string; caption: string } | null>(null);
    const [storyBusy, setStoryBusy]   = useState(false);
    const storyInput = useRef<HTMLInputElement>(null);

    useEffect(() => { if (_hydrated) setStoryList(getOwnerStories(ownerKey)); }, [_hydrated, ownerKey]);

    const pickStoryImage = async (file?: File) => {
        if (!file) return;
        setStoryBusy(true);
        try {
            const url = await compressStoryImage(file);
            if (url) setStoryDraft(d => ({ url, caption: d?.caption ?? '' }));
        } finally { setStoryBusy(false); }
    };
    const publishStory = () => {
        if (!storyDraft?.url || storyList.length >= 10) return;
        const name = `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'داور';
        addStoredStory({
            id: `st-${Date.now()}-${rid()}`,
            ownerKey,
            userName: name,
            roleKey: 'referee', roleLabel: refRole.label, roleColor: refRole.color,
            avatar: (user?.firstName ?? 'د').charAt(0) || 'د',
            logoUrl: user?.avatar || undefined,
            mediaUrl: storyDraft.url,
            caption: storyDraft.caption.trim(),
            createdAt: Date.now(),
        });
        setStoryDraft(null);
        setStoryList(getOwnerStories(ownerKey));
    };
    const deleteStory = (id: string) => { removeStoredStory(id); setStoryList(getOwnerStories(ownerKey)); };

    const now = new Date();
    const timeStr = toFa(`${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`);

    return (
        <>
            <style>{`
        @keyframes fadeUp  { from{opacity:0;transform:translateY(14px);}to{opacity:1;transform:none;} }
        @keyframes pulse   { 0%,100%{opacity:1;}50%{opacity:0.4;} }
        @keyframes livePulse { 0%,100%{opacity:1;transform:scale(1);}50%{opacity:0.5;transform:scale(0.85);} }

        .r-tab { padding:10px 18px; border-radius:10px; font-size:13px; font-weight:600; border:1px solid transparent; cursor:pointer; font-family:inherit; transition:all 0.25s; white-space:nowrap; display:flex; align-items:center; gap:7px; }
        .r-tab.active { background:rgba(199,166,106,0.1); border-color:rgba(199,166,106,0.3); color:#C7A66A; }
        .r-tab:not(.active) { background:rgba(0,0,0,0.03); color:rgba(0,0,0,0.45); }
        .r-tab:not(.active):hover { background:rgba(0,0,0,0.05); color:rgba(0,0,0,0.50); }

        .r-card { background:#FFFFFF; border:1px solid rgba(0,0,0,0.07); border-radius:20px; padding:22px; transition:all 0.3s; }
        .r-card:hover { background:rgba(0,0,0,0.04); }

        .sch-row { display:flex; align-items:center; gap:14px; padding:14px 16px; background:rgba(255,255,255,0.02); border:1px solid rgba(0,0,0,0.04); border-radius:14px; transition:all 0.25s; }
        .sch-row:hover { background:rgba(0,0,0,0.04); border-color:rgba(0,0,0,0.07); }

        @media(max-width:900px) { .ref-dash-g{grid-template-columns:1fr !important;} .kpi-g{grid-template-columns:repeat(2,1fr)!important;} }
      `}</style>

            <div style={{ minHeight: '100vh', background: '#F7F7F5', paddingBottom: '80px' }}>

                {/* ── Header ── */}
                <div style={{ background: 'rgba(2,8,6,0.98)', borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '0 clamp(16px,4vw,40px)', position: 'sticky', top: '62px', zIndex: 90, backdropFilter: 'blur(24px)' }}>
                    <div style={{ maxWidth: '1280px', margin: '0 auto', height: '58px', display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1, minWidth: 0 }}>
                            <div style={{ width: '38px', height: '38px', borderRadius: '11px', background: 'linear-gradient(135deg,#C7A66A,#A07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 4px 12px rgba(199,166,106,0.3)' }}>
                                <Shield size={18} style={{ color: '#fff' }} />
                            </div>
                            <div>
                                <div style={{ fontSize: '10px', color: 'rgba(199,166,106,0.6)', letterSpacing: '0.2em', fontWeight: 700 }}>REFEREE DASHBOARD</div>
                                <div style={{ fontSize: '17px', fontWeight: 800, color: '#111111', letterSpacing: '-0.01em' }}>پنل داور رسمی</div>
                            </div>
                        </div>

                        {/* Live clock */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '12px', padding: '8px 16px', flexShrink: 0 }}>
                            <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444', animation: 'livePulse 1.5s infinite' }} />
                            <span style={{ fontSize: '16px', fontWeight: 900, color: '#ef4444', fontVariantNumeric: 'tabular-nums' }}>{timeStr}</span>
                        </div>

                        {/* Live matches badge */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '20px', flexShrink: 0 }}>
                            <Activity size={13} style={{ color: '#ef4444' }} />
                            <span style={{ fontSize: '14px', color: '#ef4444', fontWeight: 700 }}>{toFa(LIVE_MATCHES.filter(m => m.status === 'live').length)} مسابقه زنده</span>
                        </div>
                    </div>
                </div>

                {/* ── Tab nav ── */}
                <div style={{ background: 'rgba(2,8,6,0.97)', borderBottom: '1px solid rgba(0,0,0,0.04)', padding: '0 clamp(16px,4vw,40px)', overflowX: 'auto' }}>
                    <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', gap: '4px', padding: '10px 0' }}>
                        {[
                            { k: 'overview', l: 'خلاصه', icon: <BarChart2 size={14} /> },
                            { k: 'live', l: 'مسابقات زنده', icon: <Activity size={14} />, badge: LIVE_MATCHES.length },
                            { k: 'schedule', l: 'برنامه', icon: <Calendar size={14} /> },
                            { k: 'reports', l: 'گزارش‌ها', icon: <Edit size={14} /> },
                            { k: 'disputes', l: 'اعتراضات', icon: <AlertCircle size={14} />, badge: DISPUTES.filter(d => d.status === 'open').length },
                            { k: 'stories', l: 'استوری‌ها', icon: <Camera size={14} /> },
                        ].map(t => (
                            <button key={t.k} className={`r-tab ${tab === t.k ? 'active' : ''}`} onClick={() => setTab(t.k as Tab)}>
                                {t.icon}{t.l}
                                {(t.badge ?? 0) > 0 && <span style={{ minWidth: '18px', height: '18px', borderRadius: '9px', background: tab === t.k ? '#C7A66A' : '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px' }}>{toFa(t.badge!)}</span>}
                            </button>
                        ))}
                    </div>
                </div>

                <div style={{ maxWidth: '1280px', margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,3vw,32px)' }}>

                    {/* ════ OVERVIEW ════ */}
                    {tab === 'overview' && (
                        <div style={{ animation: 'fadeUp 0.4s ease both' }}>

                            {/* KPIs */}
                            <div className="kpi-g" style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '14px', marginBottom: '24px' }}>
                                {[
                                    { l: 'مسابقات امسال', v: toFa(284), sub: 'داوری‌شده', c: '#C7A66A', icon: <Target size={16} /> },
                                    { l: 'تورنومنت', v: toFa(18), sub: 'شرکت کرده', c: '#f59e0b', icon: <Trophy size={16} /> },
                                    { l: 'امتیاز ارزیابی', v: '۴.۹', sub: 'از ۵', c: '#a78bfa', icon: <Star size={16} /> },
                                    { l: 'اعتراض حل‌شده', v: '۹۸٪', sub: 'نرخ موفقیت', c: '#06b6d4', icon: <CheckCircle size={16} /> },
                                ].map((s, i) => (
                                    <div key={i} className="r-card" style={{ animationDelay: `${i * 0.07}s`, animation: 'fadeUp 0.5s ease both' }}>
                                        <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '52px', height: '1px', background: `linear-gradient(90deg,transparent,${s.c}50,transparent)` }} />
                                        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                                            <div style={{ width: '34px', height: '34px', borderRadius: '10px', background: `${s.c}12`, border: `1px solid ${s.c}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.c }}>
                                                {s.icon}
                                            </div>
                                        </div>
                                        <div style={{ fontSize: 'clamp(24px, 3.3vw, 31px)', fontWeight: 900, color: '#111111', letterSpacing: '-0.03em', marginBottom: '4px', textShadow: `0 0 20px ${s.c}25` }}>{s.v}</div>
                                        <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.45)', fontWeight: 600, marginBottom: '2px' }}>{s.l}</div>
                                        <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.30)' }}>{s.sub}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="ref-dash-g" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px' }}>

                                {/* Live now */}
                                <div className="r-card">
                                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#111111', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', boxShadow: '0 0 8px #ef4444', animation: 'livePulse 1.5s infinite' }} />
                                        مسابقات در حال برگزاری
                                        <button onClick={() => setTab('live')} style={{ marginRight: 'auto', fontSize: '13px', color: '#C7A66A', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>مدیریت →</button>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {LIVE_MATCHES.map(m => (
                                            <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 16px', background: m.status === 'live' ? 'rgba(239,68,68,0.04)' : 'rgba(245,158,11,0.04)', border: `1px solid ${m.status === 'live' ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}`, borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s' }}
                                                onClick={() => setTab('live')}>
                                                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: m.status === 'live' ? '#ef4444' : '#f59e0b', flexShrink: 0, animation: 'pulse 2s infinite', boxShadow: `0 0 8px ${m.status === 'live' ? '#ef4444' : '#f59e0b'}` }} />
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111111', marginBottom: '2px' }}>
                                                        {m.player1.split(' ').pop()} {toFa(m.score1)}:{toFa(m.score2)} {m.player2.split(' ').pop()}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.42)' }}>{m.round} · {m.table}</div>
                                                </div>
                                                <div style={{ fontSize: '13px', color: m.status === 'live' ? '#ef4444' : '#f59e0b', fontWeight: 700, flexShrink: 0 }}>
                                                    {m.status === 'live' ? 'LIVE' : 'BREAK'}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Right */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                                    {/* Profile card */}
                                    <div className="r-card" style={{ border: '1px solid rgba(199,166,106,0.2)', textAlign: 'center' }}>
                                        <div style={{ position: 'absolute', top: '-1px', left: '50%', transform: 'translateX(-50%)', width: '100px', height: '1px', background: 'linear-gradient(90deg,transparent,rgba(199,166,106,0.5),transparent)' }} />
                                        <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: 'linear-gradient(135deg,#C7A66A,#A07840)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 900, color: '#fff', margin: '0 auto 12px', boxShadow: '0 8px 24px rgba(199,166,106,0.3)' }}>
                                            {user?.firstName?.[0] ?? 'D'}
                                        </div>
                                        <div style={{ fontSize: '18px', fontWeight: 800, color: '#111111', marginBottom: '4px' }}>{user?.firstName} {user?.lastName}</div>
                                        <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.42)', marginBottom: '12px' }}>داور بین‌المللی اسنوکر</div>
                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap' }}>
                                            <span style={{ fontSize: '10px', color: '#f59e0b', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '20px', padding: '3px 10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <Award size={9} />WPBSA Level 4
                                            </span>
                                            <span style={{ fontSize: '10px', color: '#C7A66A', background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.2)', borderRadius: '20px', padding: '3px 10px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '3px' }}>
                                                <Shield size={9} />فدراسیون
                                            </span>
                                        </div>
                                    </div>

                                    {/* Today schedule */}
                                    <div className="r-card">
                                        <div style={{ fontSize: '15px', fontWeight: 700, color: '#111111', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <span style={{ width: '3px', height: '13px', background: 'linear-gradient(180deg,#06b6d4,transparent)', borderRadius: '2px', display: 'inline-block' }} />
                                            برنامه امروز
                                        </div>
                                        {SCHEDULED.filter(m => m.date === 'امروز').map((m, i) => (
                                            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '9px 0', borderBottom: i < SCHEDULED.filter(m => m.date === 'امروز').length - 1 ? '1px solid rgba(0,0,0,0.04)' : 'none' }}>
                                                <div style={{ fontSize: '14px', fontWeight: 800, color: '#C7A66A', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{m.time}</div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '13px', color: '#111111', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                        {m.player1.split(' ').pop()} vs {m.player2.split(' ').pop()}
                                                    </div>
                                                    <div style={{ fontSize: '10px', color: 'rgba(0,0,0,0.35)' }}>{m.table} · {m.round}</div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Open disputes */}
                                    {DISPUTES.filter(d => d.status === 'open').length > 0 && (
                                        <div className="r-card" style={{ border: '1px solid rgba(239,68,68,0.15)' }}>
                                            <div style={{ fontSize: '15px', fontWeight: 700, color: '#111111', marginBottom: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                    <span style={{ width: '3px', height: '13px', background: 'linear-gradient(180deg,#ef4444,transparent)', borderRadius: '2px', display: 'inline-block' }} />
                                                    اعتراضات باز
                                                </div>
                                                <span style={{ fontSize: '12px', color: '#ef4444', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '20px', padding: '2px 8px', fontWeight: 700 }}>
                                                    {toFa(DISPUTES.filter(d => d.status === 'open').length)}
                                                </span>
                                            </div>
                                            {DISPUTES.filter(d => d.status === 'open').map(d => (
                                                <div key={d.id} style={{ padding: '10px 12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: '12px', cursor: 'pointer', marginBottom: '6px' }}
                                                    onClick={() => setTab('disputes')}>
                                                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#111111', marginBottom: '3px' }}>{d.issue}</div>
                                                    <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.42)' }}>{d.match} · {d.time}</div>
                                                </div>
                                            ))}
                                            <button onClick={() => setTab('disputes')} style={{ width: '100%', marginTop: '6px', padding: '8px', background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                مشاهده همه →
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════ LIVE ════ */}
                    {tab === 'live' && (
                        <div style={{ animation: 'fadeUp 0.4s ease both', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
                                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#ef4444', display: 'inline-block', animation: 'livePulse 1.5s infinite', boxShadow: '0 0 10px #ef4444' }} />
                                <span style={{ fontSize: '16px', fontWeight: 700, color: '#ef4444' }}>مدیریت مسابقات زنده</span>
                            </div>
                            {LIVE_MATCHES.map(m => <LiveControl key={m.id} match={m} />)}
                        </div>
                    )}

                    {/* ════ SCHEDULE ════ */}
                    {tab === 'schedule' && (
                        <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                            <div className="r-card" style={{ marginBottom: '16px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#111111', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ width: '3px', height: '15px', background: 'linear-gradient(180deg,#06b6d4,transparent)', borderRadius: '2px', display: 'inline-block' }} />
                                        برنامه داوری
                                    </div>
                                    <div style={{ display: 'flex', gap: '6px' }}>
                                        {['امروز', 'فردا', 'این هفته'].map((d, i) => (
                                            <button key={i} style={{ padding: '6px 13px', borderRadius: '20px', background: i === 0 ? 'rgba(199,166,106,0.1)' : 'rgba(0,0,0,0.03)', border: `1px solid ${i === 0 ? 'rgba(199,166,106,0.3)' : 'rgba(0,0,0,0.07)'}`, color: i === 0 ? '#C7A66A' : 'rgba(0,0,0,0.45)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                {d}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {SCHEDULED.map(m => {
                                        const statusCfg = m.status === 'scheduled' ? { color: '#06b6d4', label: 'برنامه‌ریزی شده' } : { color: '#C7A66A', label: 'در حال بازی' };
                                        return (
                                            <div key={m.id} className="sch-row">
                                                <div style={{ textAlign: 'center', flexShrink: 0, minWidth: '52px' }}>
                                                    <div style={{ fontSize: '16px', fontWeight: 900, color: '#C7A66A', fontVariantNumeric: 'tabular-nums' }}>{m.time}</div>
                                                    <div style={{ fontSize: '12px', color: 'rgba(0,0,0,0.35)' }}>{m.date}</div>
                                                </div>
                                                <div style={{ flex: 1, minWidth: 0 }}>
                                                    <div style={{ fontSize: '15px', fontWeight: 700, color: '#111111', marginBottom: '3px' }}>
                                                        {m.player1} vs {m.player2}
                                                    </div>
                                                    <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.42)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                        <span>{m.tournament}</span><span>·</span><span>{m.round}</span><span>·</span><span>{m.table}</span>
                                                    </div>
                                                </div>
                                                <div style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: `${statusCfg.color}10`, border: `1px solid ${statusCfg.color}25`, color: statusCfg.color, fontWeight: 700, flexShrink: 0 }}>
                                                    {statusCfg.label}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════ REPORTS ════ */}
                    {tab === 'reports' && (
                        <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                            <div className="r-card">
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '18px' }}>
                                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#111111', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ width: '3px', height: '15px', background: 'linear-gradient(180deg,#a78bfa,transparent)', borderRadius: '2px', display: 'inline-block' }} />
                                        گزارش مسابقات
                                    </div>
                                    <button style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '9px 16px', background: 'linear-gradient(135deg,#C7A66A,#A07840)', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                        <Plus size={13} /> گزارش جدید
                                    </button>
                                </div>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {REPORTS.map((r, i) => (
                                        <div key={i} className="sch-row" style={{ flexWrap: 'wrap', gap: '10px' }}>
                                            <div style={{ flex: 1, minWidth: '160px' }}>
                                                <div style={{ fontSize: '15px', fontWeight: 700, color: '#111111', marginBottom: '3px' }}>{r.match}</div>
                                                <div style={{ fontSize: '13px', color: 'rgba(0,0,0,0.42)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    <span>{r.tournament}</span><span>·</span><span>{r.date}</span><span>·</span><span>{r.duration}</span>
                                                    {r.incidents > 0 && <span style={{ color: '#f59e0b' }}>⚠ {toFa(r.incidents)} حادثه</span>}
                                                </div>
                                            </div>
                                            <div style={{ display: 'flex', gap: '6px', alignItems: 'center', flexShrink: 0 }}>
                                                <span style={{ fontSize: '12px', padding: '3px 10px', borderRadius: '20px', background: r.submitted ? 'rgba(199,166,106,0.1)' : 'rgba(245,158,11,0.1)', border: `1px solid ${r.submitted ? 'rgba(199,166,106,0.25)' : 'rgba(245,158,11,0.25)'}`, color: r.submitted ? '#C7A66A' : '#f59e0b', fontWeight: 700 }}>
                                                    {r.submitted ? 'ارسال شده' : 'در انتظار'}
                                                </span>
                                                <button style={{ padding: '6px 12px', background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.06)', borderRadius: '9px', color: 'rgba(0,0,0,0.45)', fontSize: '13px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '5px' }}>
                                                    <Eye size={11} />{r.submitted ? 'مشاهده' : 'ویرایش'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ════ DISPUTES ════ */}
                    {tab === 'disputes' && (
                        <div style={{ animation: 'fadeUp 0.4s ease both', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {DISPUTES.map(d => (
                                <div key={d.id} style={{ padding: '18px 20px', background: d.status === 'open' ? 'rgba(239,68,68,0.04)' : d.status === 'resolved' ? 'rgba(199,166,106,0.03)' : '#FFFFFF', border: `1px solid ${d.status === 'open' ? 'rgba(239,68,68,0.18)' : d.status === 'resolved' ? 'rgba(199,166,106,0.15)' : 'rgba(0,0,0,0.07)'}`, borderRadius: '18px' }}>
                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', marginBottom: '10px', flexWrap: 'wrap' }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                                <span style={{ fontSize: '17px', fontWeight: 800, color: '#111111' }}>{d.issue}</span>
                                                <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 9px', borderRadius: '20px', background: d.status === 'open' ? 'rgba(239,68,68,0.12)' : d.status === 'resolved' ? 'rgba(199,166,106,0.12)' : 'rgba(167,139,250,0.12)', color: d.status === 'open' ? '#ef4444' : d.status === 'resolved' ? '#C7A66A' : '#a78bfa', border: `1px solid ${d.status === 'open' ? 'rgba(239,68,68,0.25)' : d.status === 'resolved' ? 'rgba(199,166,106,0.25)' : 'rgba(167,139,250,0.25)'}` }}>
                                                    {d.status === 'open' ? 'باز' : d.status === 'resolved' ? 'حل‌شده' : 'ارجاع داده‌شده'}
                                                </span>
                                            </div>
                                            <div style={{ fontSize: '14px', color: 'rgba(0,0,0,0.45)' }}>{d.match} · {d.player} · {d.time}</div>
                                        </div>
                                        {d.status === 'open' && (
                                            <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                                                <button style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'rgba(199,166,106,0.1)', border: '1px solid rgba(199,166,106,0.25)', borderRadius: '10px', color: '#C7A66A', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                    <Check size={12} /> حل کردن
                                                </button>
                                                <button style={{ display: 'flex', alignItems: 'center', gap: '5px', padding: '8px 14px', background: 'rgba(167,139,250,0.08)', border: '1px solid rgba(167,139,250,0.2)', borderRadius: '10px', color: '#a78bfa', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>
                                                    <ChevronUp size={12} /> ارجاع
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <p style={{ fontSize: '15px', color: 'rgba(0,0,0,0.45)', margin: 0, lineHeight: 1.6, padding: '12px 14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(0,0,0,0.04)', borderRadius: '12px' }}>
                                        {d.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ════ STORIES ════ */}
                    {tab === 'stories' && (
                        <div style={{ animation: 'fadeUp 0.4s ease both' }}>
                            <div className="r-card">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
                                    <div style={{ fontSize: '17px', fontWeight: 800, color: '#111111', display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <span style={{ width: '3px', height: '15px', background: 'linear-gradient(180deg,#C7A66A,transparent)', borderRadius: '2px', display: 'inline-block' }} />
                                        استوری‌های شما
                                        <span style={{ fontSize: '13px', color: 'rgba(0,0,0,0.35)', fontWeight: 700 }}>({toFa(storyList.length)}/۱۰)</span>
                                    </div>
                                    {storyList.length < 10 && !storyDraft && (
                                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', padding: '9px 16px', background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', borderRadius: '10px', color: '#9A6E38', fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: storyBusy ? 0.55 : 1 }}>
                                            <Plus size={13} /> {storyBusy ? 'در حال آماده‌سازی…' : 'استوری جدید'}
                                            <input ref={storyInput} type="file" accept="image/*" hidden disabled={storyBusy}
                                                onChange={e => { void pickStoryImage(e.target.files?.[0]); e.currentTarget.value = ''; }} />
                                        </label>
                                    )}
                                </div>
                                <p style={{ fontSize: '13px', color: 'rgba(0,0,0,0.42)', lineHeight: 1.8, margin: '10px 0 16px' }}>
                                    استوری بلافاصله منتشر می‌شود و به‌مدت ۲۴ ساعت در نوار استوری صفحه‌ی اول سایت به‌عنوان «داور» نمایش داده می‌شود.
                                </p>

                                {storyDraft && (
                                    <div style={{ border: '1px solid rgba(0,0,0,0.07)', borderRadius: '14px', padding: '12px', marginBottom: '16px', display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                        <div style={{ width: '110px', height: '172px', borderRadius: '10px', overflow: 'hidden', background: '#000', flexShrink: 0 }}>
                                            <img src={storyDraft.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                        <div style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                            <textarea value={storyDraft.caption} onChange={e => setStoryDraft(d => (d ? { ...d, caption: e.target.value } : d))}
                                                placeholder="کپشن استوری (اختیاری)…" rows={3}
                                                style={{ width: '100%', padding: '10px 13px', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', fontSize: '14px', fontFamily: 'inherit', resize: 'vertical', lineHeight: 1.8, outline: 'none' }} />
                                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                                <button onClick={publishStory} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 22px', background: 'rgba(199,166,106,0.12)', border: '1px solid rgba(199,166,106,0.34)', borderRadius: '10px', color: '#9A6E38', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>انتشار استوری</button>
                                                <button onClick={() => setStoryDraft(null)} style={{ padding: '10px 20px', background: 'transparent', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '10px', color: 'rgba(0,0,0,0.45)', fontSize: '14px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' }}>انصراف</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {storyList.length > 0 ? (
                                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(100px,1fr))', gap: '10px' }}>
                                        {storyList.map(s => (
                                            <div key={s.id} style={{ position: 'relative', aspectRatio: '9/16', borderRadius: '10px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.07)', background: 'rgba(0,0,0,0.04)' }}>
                                                <img src={s.mediaUrl} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                {s.caption && (
                                                    <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '12px 7px 6px', background: 'linear-gradient(to top,rgba(0,0,0,0.72),transparent)', color: '#fff', fontSize: '10.5px', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{s.caption}</div>
                                                )}
                                                <button onClick={() => deleteStory(s.id)} aria-label="حذف استوری" style={{ position: 'absolute', top: '5px', left: '5px', width: '22px', height: '22px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    <X size={11} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                ) : !storyDraft ? (
                                    <div style={{ border: '1.5px dashed rgba(199,166,106,0.4)', borderRadius: '14px', padding: '30px 16px', textAlign: 'center', color: 'rgba(0,0,0,0.35)' }}>
                                        <Camera size={30} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                                        <div style={{ fontSize: '13px' }}>هنوز استوری‌ای منتشر نکرده‌اید — از دکمه‌ی «استوری جدید» یک استوری بگذارید.</div>
                                    </div>
                                ) : null}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}

export default function RefereeDashboardPage() {
    return <AuthGuard><DashboardContent /></AuthGuard>;
}