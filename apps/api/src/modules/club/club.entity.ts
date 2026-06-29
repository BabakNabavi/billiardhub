import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

@Entity('clubs')
export class Club {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ nullable: true })
  managerName: string;

  @Column({ nullable: true })
  description: string;

  @Column()
  address: string;

  @Column()
  city: string;

  @Column()
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  website: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ default: 'Asia/Tehran' })
  timezone: string;

  // امکانات — تعداد میزها
  @Column({ default: 0 })
  snookerTables: number;

  @Column({ default: 0 })
  pocketTables: number;

  @Column({ default: 0 })
  highballTables: number;

  @Column({ default: 0 })
  vipSnookerTables: number;

  @Column({ default: 0 })
  vipPocketTables: number;

  @Column({ default: 0 })
  airHockeyTables: number;

  @Column({ default: 0 })
  dartBoards: number;

  @Column({ default: 0 })
  playstations: number;

  // امکانات رفاهی
  @Column({ default: false })
  hasCafe: boolean;

  @Column({ default: false })
  hasParking: boolean;

  @Column({ default: false })
  hasWifi: boolean;

  @Column({ default: false })
  hasProfessionalCoach: boolean;

  // امکانات ویژه
  @Column({ nullable: true })
  specialFeatures: string;

  // ساعات کاری
  @Column({ type: 'jsonb', nullable: true })
  workingHours: object;

  // رسانه
  @Column({ type: 'text', array: true, default: [] })
  images: string[];

  @Column({ type: 'text', array: true, default: [] })
  videos: string[];

  @Column({ nullable: true })
  province: string;

  @Column({ nullable: true })
  licenseDocumentUrl: string;

  @Column({ default: 'pending' })
  verificationStatus: string;

  @Column({ nullable: true })
  bankCard: string;

  @Column({ nullable: true })
  bankCardOwner: string;

  @Column({ nullable: true })
  bankName: string;

  @Column({ nullable: true })
  logo: string;

  @Column({ nullable: true })
  storyMediaUrl: string;

  @Column({ default: 'image' })
  storyType: string;

  @Column({ nullable: true, type: 'timestamptz' })
  storyExpiresAt: Date;

  @Column({ default: false })
  hasActiveStory: boolean;

  @Column({ type: 'jsonb', nullable: true, default: [] })
  discountRules: object[];

  @Column({ nullable: true })
  storyText: string;

  @Column()
  ownerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'ownerId' })
  owner: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}