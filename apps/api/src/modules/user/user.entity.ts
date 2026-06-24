// apps/api/src/modules/user/user.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum UserRole {
  USER         = 'user',
  PLAYER       = 'player',
  COACH        = 'coach',
  REFEREE      = 'referee',
  CLUB_OWNER   = 'club_owner',
  SELLER       = 'seller',
  MANUFACTURER = 'manufacturer',
  INSTALLER    = 'installer',
  ADMIN        = 'admin',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING    = 'pending',
  VERIFIED   = 'verified',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  // ─── نقش‌ها ───────────────────────────────────────────────
  @Column({ type: 'varchar', default: 'user' })
  primaryRole: string;

  @Column({ type: 'text', array: true, default: [] })
  secondaryRoles: string[];

  // ─── وضعیت تأیید کلی ─────────────────────────────────────
  @Column({ type: 'varchar', default: 'unverified' })
  verificationStatus: string;

  @Column({ default: false })
  isProfileComplete: boolean;

  // ─── احراز هویت ──────────────────────────────────────────
  @Column({ nullable: true, name: 'national_id' })
  nationalId: string;

  @Column({ default: false, name: 'national_id_verified' })
  nationalIdVerified: boolean;

  @Column({ default: false, name: 'phone_verified' })
  phoneVerified: boolean;

  @Column({ default: false, name: 'email_verified' })
  emailVerified: boolean;

  // ─── OTP موقت ────────────────────────────────────────────
  @Column({ nullable: true, name: 'otp_code', select: false })
  otpCode: string;

  @Column({ nullable: true, name: 'otp_expires_at', type: 'timestamptz' })
  otpExpiresAt: Date;

  @Column({ default: 0, name: 'otp_attempts' })
  otpAttempts: number;

  // ─── پروفایل پایه ────────────────────────────────────────
  @Column({ nullable: true })
  avatar: string;

  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  province: string;           // استان

  @Column({ nullable: true })
  city: string;               // شهر

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true, name: 'birth_date' })
  birthDate: string;          // 1370/01/01

  @Column({ nullable: true })
  gender: string;             // male | female

  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  telegram: string;

  // ─── باشگاه ──────────────────────────────────────────────
  @Column({ nullable: true, name: 'club_id' })
  clubId: string;

  @Column({ nullable: true, name: 'club_name_manual' })
  clubNameManual: string;     // اگه باشگاه تو لیست نبود

  // ─── کارت بانکی ──────────────────────────────────────────
  @Column({ nullable: true, name: 'bank_card', select: false })
  bankCard: string;

  @Column({ nullable: true, name: 'bank_card_owner' })
  bankCardOwner: string;

  // ─── پروفایل‌های تخصصی (JSON) ────────────────────────────
  @Column({ type: 'jsonb', nullable: true })
  playerProfile: object;

  @Column({ type: 'jsonb', nullable: true })
  coachProfile: object;

  @Column({ type: 'jsonb', nullable: true })
  refereeProfile: object;

  @Column({ type: 'jsonb', nullable: true })
  manufacturerProfile: object;

  @Column({ type: 'jsonb', nullable: true })
  installerProfile: object;

  @Column({ type: 'jsonb', nullable: true })
  sellerProfile: object;

  // ─── متفرقه ──────────────────────────────────────────────
  @Column({ type: 'text', array: true, default: [] })
  documents: string[];

  @Column({ default: 'fa' })
  language: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
