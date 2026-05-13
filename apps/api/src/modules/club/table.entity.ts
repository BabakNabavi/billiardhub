import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Club } from './club.entity';

export enum TableType {
  SNOOKER = 'snooker',
  POCKET = 'pocket',
  HIGHBALL = 'highball',
  VIP_SNOOKER = 'vip_snooker',
  VIP_POCKET = 'vip_pocket',
}

@Entity('tables')
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  clubId: string;

  @ManyToOne(() => Club)
  @JoinColumn({ name: 'clubId' })
  club: Club;

  @Column()
  number: number;

  @Column()
  name: string;

  @Column({
    type: 'enum',
    enum: TableType,
  })
  type: TableType;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  model: string;

  @Column({ nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  pricePerHour: number;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;
}