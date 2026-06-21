import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum UserRole {
  USER = 'user',
  PLAYER = 'player',
  COACH = 'coach',
  REFEREE = 'referee',
  CLUB_OWNER = 'club_owner',
  SELLER = 'seller',
  MANUFACTURER = 'manufacturer',
  INSTALLER = 'installer',
  ADMIN = 'admin',
}

export enum VerificationStatus {
  UNVERIFIED = 'unverified',
  PENDING = 'pending',
  VERIFIED = 'verified',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column()
  password: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ nullable: true })
  phone: string;

  // role اصلی
  @Column({ type: 'varchar', default: 'user' })
  primaryRole: string;

  // role‌های فرعی
  @Column({ type: 'text', array: true, default: [] })
  secondaryRoles: string[];

  // وضعیت تأیید
  @Column({ type: 'varchar', default: 'unverified' })
  verificationStatus: string;

  // پروفایل تکمیل شده؟
  @Column({ default: false })
  isProfileComplete: boolean;

  // عکس پروفایل
  @Column({ nullable: true })
  avatar: string;

  // اطلاعات پایه پروفایل
  @Column({ nullable: true })
  bio: string;

  @Column({ nullable: true })
  city: string;

  @Column({ nullable: true })
  country: string;

  @Column({ nullable: true })
  birthDate: string;

  @Column({ nullable: true })
  instagram: string;

  @Column({ nullable: true })
  telegram: string;

  // اطلاعات اختصاصی هر role (JSON)
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

  // مدارک آپلود شده
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