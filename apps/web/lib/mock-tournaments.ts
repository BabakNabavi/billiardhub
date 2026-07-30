// ── Tournament Module — تایپ‌ها، برچسب‌ها و رنگ‌ها ─────────────────────────

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
  frames?: Array<1 | 2>;
  tableNumber?: number;
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
  matchFormat?: string;
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

// ── داده‌ی نمونه حذف شد ──────────────────────────────────────────
//
// SAMPLE_PLAYERS / SAMPLE_TOURNAMENTS / SAMPLE_REGISTRATIONS /
// SAMPLE_LIVE_BRACKET / BRACKET_TEMPLATES پاک شدند.
//
// این آرایه‌ها فقط «داده‌ی آزمایشی» نبودند: صفحه‌های واقعیِ سایت از
// آن‌ها می‌خواندند، پس کاربر باشگاه و مسابقه و بازیکنی می‌دید که وجود
// نداشتند. هر مصرف‌کننده حالا از API می‌خواند:
//   مسابقات → lib/tournaments/client.ts
//   براکت   → lib/tournaments/bracket-client.ts
//   باشگاه‌ها → lib/clubs-data.ts
//
// آنچه در این فایل مانده فقط تایپ‌ها و برچسب/رنگ‌هاست.
