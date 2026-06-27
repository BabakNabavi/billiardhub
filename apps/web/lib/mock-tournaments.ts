// ── Tournament Module — Mock Data & Types ─────────────────────────────────────

export type GameType         = '8ball' | '9ball' | 'snooker' | 'other';
export type TournamentStatus = 'upcoming' | 'registration_open' | 'bracket_ready' | 'live' | 'finished';
export type RegistrationStatus = 'pending' | 'approved' | 'rejected';
export type PaymentMethod    = 'online' | 'card_transfer';

export interface TournamentPlayer {
  id: string; name: string; phone: string; rank?: number;
}

export interface TournamentMatch {
  id: string;
  round: number;
  matchIndex: number;
  player1?: TournamentPlayer;
  player2?: TournamentPlayer;
  score1?: number;
  score2?: number;
  winner?: TournamentPlayer;
  status: 'waiting' | 'in_progress' | 'completed';
}

export interface Tournament {
  id: string;
  name: string;
  clubId: string;
  clubName: string;
  banner: string;
  description: string;
  gameType: GameType;
  date: string;
  startTime: string;
  registrationDeadline: string;
  maxPlayers: 8 | 16 | 32 | 64;
  entryFee: number;
  prizeInfo: string;
  rules: string;
  paymentMethod: PaymentMethod;
  cardNumber?: string;
  cardHolder?: string;
  bankName?: string;
  status: TournamentStatus;
  registeredCount: number;
  champion?: string;
  runnerUp?: string;
  thirdPlace?: string;
  fourthPlace?: string;
  highestBreak?: { player: string; score: number };
}

export interface Registration {
  id: string;
  tournamentId: string;
  playerName: string;
  phone: string;
  playerInfo: string;
  receiptNote: string;
  status: RegistrationStatus;
  registeredAt: string;
}

export interface BracketTemplate {
  id: string; name: string; date: string; players: number;
}

// ── Labels & Colors ───────────────────────────────────────────────────────────

export const GAME_TYPE_LABELS: Record<GameType, string> = {
  '8ball': 'ایت بال', '9ball': 'ناین بال', 'snooker': 'اسنوکر', 'other': 'سایر',
};
export const GAME_TYPE_COLORS: Record<GameType, string> = {
  '8ball': '#3b82f6', '9ball': '#30C55A', 'snooker': '#C7A66A', 'other': '#8b5cf6',
};
export const STATUS_LABELS: Record<TournamentStatus, string> = {
  'upcoming': 'به زودی', 'registration_open': 'ثبت‌نام باز',
  'bracket_ready': 'براکت آماده', 'live': 'در حال برگزاری', 'finished': 'پایان یافته',
};
export const STATUS_COLORS: Record<TournamentStatus, string> = {
  'upcoming': '#8b5cf6', 'registration_open': '#30C55A',
  'bracket_ready': '#C7A66A', 'live': '#ef4444', 'finished': '#999999',
};

// ── Utilities ─────────────────────────────────────────────────────────────────

export function toFa(v: string | number): string {
  return String(v).replace(/[0-9]/g, d => '۰۱۲۳۴۵۶۷۸۹'.charAt(Number(d)));
}
export function formatFee(fee: number): string {
  if (fee === 0) return 'رایگان';
  return toFa(fee.toLocaleString('en')) + ' تومان';
}

// ── Sample Players ────────────────────────────────────────────────────────────

export const SAMPLE_PLAYERS: TournamentPlayer[] = [
  { id:'p1',  name:'علی رضایی',    phone:'09121234561', rank:1  },
  { id:'p2',  name:'رضا کاظمی',    phone:'09121234562', rank:2  },
  { id:'p3',  name:'محمد حسینی',   phone:'09121234563', rank:3  },
  { id:'p4',  name:'حسین نوری',    phone:'09121234564', rank:4  },
  { id:'p5',  name:'امیر صادقی',   phone:'09121234565', rank:5  },
  { id:'p6',  name:'کاوه محمدی',   phone:'09121234566', rank:6  },
  { id:'p7',  name:'سجاد احمدی',   phone:'09121234567', rank:7  },
  { id:'p8',  name:'مجید ملکی',    phone:'09121234568', rank:8  },
  { id:'p9',  name:'داود قاسمی',   phone:'09121234569', rank:9  },
  { id:'p10', name:'فرهاد عباسی',  phone:'09121234570', rank:10 },
  { id:'p11', name:'بهرام یوسفی',  phone:'09121234571', rank:11 },
  { id:'p12', name:'سینا موسوی',   phone:'09121234572', rank:12 },
  { id:'p13', name:'آرش کریمی',    phone:'09121234573', rank:13 },
  { id:'p14', name:'پویا شریفی',   phone:'09121234574', rank:14 },
  { id:'p15', name:'مهران تهرانی', phone:'09121234575', rank:15 },
  { id:'p16', name:'نیما جعفری',   phone:'09121234576', rank:16 },
];

// ── Sample Tournaments ────────────────────────────────────────────────────────

export const SAMPLE_TOURNAMENTS: Tournament[] = [
  {
    id:'t1', name:'جام اسنوکر سنچوری — تابستان ۱۴۰۵',
    clubId:'1', clubName:'باشگاه سنچوری تهران',
    banner:'/images/clubs/club6.jpeg',
    description:'بزرگ‌ترین رویداد اسنوکر باشگاه سنچوری در تابستان ۱۴۰۵ با حضور برترین بازیکنان تهران. فضای VIP، میزهای استاندارد Viraka، و جوایز نقدی ارزنده.',
    gameType:'snooker', date:'۱۵ مرداد ۱۴۰۵', startTime:'۱۴:۰۰',
    registrationDeadline:'۱۰ مرداد ۱۴۰۵', maxPlayers:16, entryFee:500000,
    prizeInfo:'🏆 اول: ۵٬۰۰۰٬۰۰۰ ت | 🥈 دوم: ۲٬۵۰۰٬۰۰۰ ت | 🥉 سوم: ۱٬۰۰۰٬۰۰۰ ت',
    rules:'• فرمت حذفی یک‌طرفه\n• هر فریم ۱۵ قرمز\n• توپ‌های Aramith Pro\n• تاخیر بیش از ۱۵ دقیقه = باخت\n• پوشش رسمی الزامی',
    paymentMethod:'card_transfer', cardNumber:'6037-9975-1234-5678',
    cardHolder:'محمد احمدی', bankName:'ملت',
    status:'registration_open', registeredCount:12,
  },
  {
    id:'t2', name:'لیگ ۸ بال المپیک مشهد',
    clubId:'2', clubName:'باشگاه المپیک مشهد',
    banner:'/images/clubs/club7.jpeg',
    description:'رقابت‌های ۸ بال با فرمت حذفی. مناسب تمام سطوح. جو دوستانه و جوایز نقدی.',
    gameType:'8ball', date:'۲۰ مرداد ۱۴۰۵', startTime:'۱۶:۰۰',
    registrationDeadline:'۱۵ مرداد ۱۴۰۵', maxPlayers:16, entryFee:300000,
    prizeInfo:'🏆 اول: ۳٬۰۰۰٬۰۰۰ ت | 🥈 دوم: ۱٬۵۰۰٬۰۰۰ ت | 🥉 سوم: ۵۰۰٬۰۰۰ ت',
    rules:'• فرمت حذفی\n• قوانین BCA\n• Best of 3\n• سقف زمانی ۴۵ دقیقه',
    paymentMethod:'card_transfer', cardNumber:'6219-8619-9876-5432',
    cardHolder:'رضا کریمی', bankName:'صادرات',
    status:'live', registeredCount:16,
  },
  {
    id:'t3', name:'جام شاهین — پاکت ۹ بال',
    clubId:'4', clubName:'باشگاه شاهین شیراز',
    banner:'/images/clubs/club9.jpeg',
    description:'مسابقات ۹ بال به مناسبت سالگرد تاسیس باشگاه شاهین شیراز.',
    gameType:'9ball', date:'۱ شهریور ۱۴۰۵', startTime:'۱۰:۰۰',
    registrationDeadline:'۲۵ مرداد ۱۴۰۵', maxPlayers:8, entryFee:400000,
    prizeInfo:'🏆 اول: ۲٬۰۰۰٬۰۰۰ ت + تندیس | 🥈 دوم: ۱٬۰۰۰٬۰۰۰ ت | 🥉 سوم: ۵۰۰٬۰۰۰ ت',
    rules:'• فرمت حذفی\n• قوانین WPA\n• Best of 5',
    paymentMethod:'online',
    status:'finished', registeredCount:8,
    champion:'علی رضایی', runnerUp:'رضا کاظمی',
    thirdPlace:'محمد حسینی', fourthPlace:'حسین نوری',
    highestBreak:{ player:'علی رضایی', score:127 },
  },
  {
    id:'t4', name:'جام هفتگی آریا — ۹ بال',
    clubId:'5', clubName:'باشگاه آریا تبریز',
    banner:'/images/clubs/club1.png',
    description:'رقابت‌های هفتگی باشگاه آریا. هر جمعه برگزار می‌شود.',
    gameType:'9ball', date:'۵ مرداد ۱۴۰۵', startTime:'۱۸:۰۰',
    registrationDeadline:'۴ مرداد ۱۴۰۵', maxPlayers:8, entryFee:150000,
    prizeInfo:'🏆 اول: ۵۰۰٬۰۰۰ ت | 🥈 دوم: جایزه نقدی',
    rules:'• فرمت حذفی\n• قوانین WPA',
    paymentMethod:'card_transfer', cardNumber:'6037-9975-0000-1111',
    cardHolder:'کاوه رستمی', bankName:'ملی',
    status:'upcoming', registeredCount:3,
  },
  {
    id:'t5', name:'مسابقات اسنوکر مروارید کرج',
    clubId:'6', clubName:'باشگاه مروارید کرج',
    banner:'/images/clubs/club2.jpg',
    description:'اولین دوره مسابقات رسمی باشگاه مروارید.',
    gameType:'snooker', date:'۱۰ شهریور ۱۴۰۵', startTime:'۱۲:۰۰',
    registrationDeadline:'۵ شهریور ۱۴۰۵', maxPlayers:8, entryFee:250000,
    prizeInfo:'🏆 اول: ۱٬۰۰۰٬۰۰۰ ت | 🥈 دوم: ۵۰۰٬۰۰۰ ت',
    rules:'• فرمت حذفی\n• توپ‌های استاندارد',
    paymentMethod:'card_transfer', cardNumber:'5041-7212-3333-4444',
    cardHolder:'سارا حسینی', bankName:'پاسارگاد',
    status:'finished', registeredCount:8,
    champion:'سینا موسوی', runnerUp:'آرش کریمی',
    thirdPlace:'پویا شریفی', fourthPlace:'مهران تهرانی',
    highestBreak:{ player:'سینا موسوی', score:98 },
  },
];

// ── Sample Registrations ──────────────────────────────────────────────────────

export const SAMPLE_REGISTRATIONS: Registration[] = [
  { id:'r1', tournamentId:'t1', playerName:'علی رضایی',   phone:'09121234561', playerInfo:'بازیکن حرفه‌ای ۵ سال سابقه', receiptNote:'کارت به کارت',        status:'pending',  registeredAt:'۱۴۰۵/۰۴/۰۱' },
  { id:'r2', tournamentId:'t1', playerName:'رضا کاظمی',   phone:'09121234562', playerInfo:'عضو باشگاه سنچوری',          receiptNote:'',                    status:'approved', registeredAt:'۱۴۰۵/۰۴/۰۱' },
  { id:'r3', tournamentId:'t1', playerName:'محمد حسینی',  phone:'09121234563', playerInfo:'',                            receiptNote:'لطفا بررسی کنید',     status:'pending',  registeredAt:'۱۴۰۵/۰۴/۰۲' },
  { id:'r4', tournamentId:'t1', playerName:'حسین نوری',   phone:'09121234564', playerInfo:'قهرمان سال گذشته',           receiptNote:'',                    status:'approved', registeredAt:'۱۴۰۵/۰۴/۰۲' },
  { id:'r5', tournamentId:'t1', playerName:'امیر صادقی',  phone:'09121234565', playerInfo:'',                            receiptNote:'رسید واتساپ دادم',    status:'rejected', registeredAt:'۱۴۰۵/۰۴/۰۳' },
  { id:'r6', tournamentId:'t1', playerName:'کاوه محمدی',  phone:'09121234566', playerInfo:'بازیکن متوسط',               receiptNote:'',                    status:'approved', registeredAt:'۱۴۰۵/۰۴/۰۳' },
  { id:'r7', tournamentId:'t1', playerName:'سجاد احمدی',  phone:'09121234567', playerInfo:'',                            receiptNote:'',                    status:'approved', registeredAt:'۱۴۰۵/۰۴/۰۴' },
  { id:'r8', tournamentId:'t1', playerName:'مجید ملکی',   phone:'09121234568', playerInfo:'از باشگاه آریا',             receiptNote:'',                    status:'pending',  registeredAt:'۱۴۰۵/۰۴/۰۴' },
];

// ── Live Bracket (tournament t2 — 16 players) ─────────────────────────────────

export const SAMPLE_LIVE_BRACKET: TournamentMatch[] = [
  // R1
  { id:'m1',  round:1, matchIndex:0, player1:SAMPLE_PLAYERS[0],  player2:SAMPLE_PLAYERS[1],  score1:3, score2:1, winner:SAMPLE_PLAYERS[0],  status:'completed' },
  { id:'m2',  round:1, matchIndex:1, player1:SAMPLE_PLAYERS[2],  player2:SAMPLE_PLAYERS[3],  score1:2, score2:3, winner:SAMPLE_PLAYERS[3],  status:'completed' },
  { id:'m3',  round:1, matchIndex:2, player1:SAMPLE_PLAYERS[4],  player2:SAMPLE_PLAYERS[5],  score1:3, score2:0, winner:SAMPLE_PLAYERS[4],  status:'completed' },
  { id:'m4',  round:1, matchIndex:3, player1:SAMPLE_PLAYERS[6],  player2:SAMPLE_PLAYERS[7],  score1:1, score2:3, winner:SAMPLE_PLAYERS[7],  status:'completed' },
  { id:'m5',  round:1, matchIndex:4, player1:SAMPLE_PLAYERS[8],  player2:SAMPLE_PLAYERS[9],  score1:3, score2:2, winner:SAMPLE_PLAYERS[8],  status:'completed' },
  { id:'m6',  round:1, matchIndex:5, player1:SAMPLE_PLAYERS[10], player2:SAMPLE_PLAYERS[11], score1:2, score2:3, winner:SAMPLE_PLAYERS[11], status:'completed' },
  { id:'m7',  round:1, matchIndex:6, player1:SAMPLE_PLAYERS[12], player2:SAMPLE_PLAYERS[13], score1:2, score2:1,                            status:'in_progress' },
  { id:'m8',  round:1, matchIndex:7, player1:SAMPLE_PLAYERS[14], player2:SAMPLE_PLAYERS[15],                                                status:'waiting'  },
  // R2
  { id:'m9',  round:2, matchIndex:0, player1:SAMPLE_PLAYERS[0],  player2:SAMPLE_PLAYERS[3],  score1:3, score2:1, winner:SAMPLE_PLAYERS[0],  status:'completed' },
  { id:'m10', round:2, matchIndex:1, player1:SAMPLE_PLAYERS[4],  player2:SAMPLE_PLAYERS[7],  score1:2, score2:3, winner:SAMPLE_PLAYERS[7],  status:'completed' },
  { id:'m11', round:2, matchIndex:2, player1:SAMPLE_PLAYERS[8],  player2:SAMPLE_PLAYERS[11],                                                status:'waiting'  },
  { id:'m12', round:2, matchIndex:3,                                                                                                         status:'waiting'  },
  // R3
  { id:'m13', round:3, matchIndex:0, player1:SAMPLE_PLAYERS[0],  player2:SAMPLE_PLAYERS[7],                                                 status:'waiting'  },
  { id:'m14', round:3, matchIndex:1,                                                                                                         status:'waiting'  },
  // Final
  { id:'m15', round:4, matchIndex:0,                                                                                                         status:'waiting'  },
];

export const BRACKET_TEMPLATES: BracketTemplate[] = [
  { id:'tpl1', name:'جام اسنوکر پاییز ۱۴۰۴',  date:'۱۴۰۴/۰۷/۱۵', players:16 },
  { id:'tpl2', name:'هفتگی ۸ بال — هفته ۲۲',   date:'۱۴۰۵/۰۱/۲۸', players:8  },
  { id:'tpl3', name:'جام بهاره ۱۴۰۵',           date:'۱۴۰۵/۰۲/۱۰', players:16 },
];
