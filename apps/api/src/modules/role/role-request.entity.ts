// apps/api/src/modules/role/role-request.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from '../user/user.entity';

export type RoleRequestStatus = 'pending' | 'approved' | 'rejected';

@Entity('role_requests')
export class RoleRequest {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ type: 'varchar', length: 50 })
  role: string;

  @Column({ type: 'varchar', length: 20, default: 'pending' })
  status: RoleRequestStatus;

  @Column({ name: 'doc_url', nullable: true })
  docUrl: string;

  @Column({ name: 'rejection_note', nullable: true })
  rejectionNote: string;

  @CreateDateColumn({ name: 'requested_at' })
  requestedAt: Date;

  @Column({ name: 'reviewed_at', nullable: true, type: 'timestamptz' })
  reviewedAt: Date;

  @Column({ name: 'reviewed_by', nullable: true })
  reviewedBy: string;
}
