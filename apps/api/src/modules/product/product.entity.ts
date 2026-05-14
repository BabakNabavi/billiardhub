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

export enum ProductCondition {
  NEW = 'new',
  LIKE_NEW = 'like_new',
  USED = 'used',
}

export enum ProductCategory {
  TABLE = 'table',
  CUE = 'cue',
  BALL = 'ball',
  ACCESSORY = 'accessory',
  CLOTHING = 'clothing',
  EDUCATIONAL = 'educational',
  OTHER = 'other',
}

export enum ProductStatus {
  ACTIVE = 'active',
  SOLD = 'sold',
  INACTIVE = 'inactive',
}

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  description: string;

  @Column({ type: 'decimal', precision: 15, scale: 0 })
  price: number;

  @Column({ type: 'decimal', precision: 15, scale: 0, nullable: true })
  discountPrice: number;

  @Column({ default: 0 })
  discountPercent: number;

  @Column({ type: 'varchar', default: 'other' })
  category: string;

  @Column({ type: 'varchar', default: 'new' })
  condition: string;

  @Column({ type: 'varchar', default: 'active' })
  status: string;

  @Column({ nullable: true })
  city: string;

  @Column({ default: 1 })
  stock: number;

  @Column({ type: 'text', array: true, default: [] })
  images: string[];

  @Column({ nullable: true })
  video: string;

  // تخفیف روزانه
  @Column({ default: false })
  isDailyDeal: boolean;

  // فروش ویژه (مثل Black Friday)
  @Column({ default: false })
  isSpecialSale: boolean;

  // تأیید شده توسط بیلیارد پلاس
  @Column({ default: false })
  isVerified: boolean;

  // درخواست تأیید
  @Column({ default: false })
  requestedVerification: boolean;

  // فروشگاه رسمی بیلیارد پلاس
  @Column({ default: false })
  isOfficialStore: boolean;

  @Column()
  sellerId: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'sellerId' })
  seller: User;

  @Column({ default: 0 })
  views: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}