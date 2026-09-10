import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

/**
 * The raw API key is only ever shown once, right after creation — we
 * store a sha256 hash of it (keyHash) for lookup on every integrations
 * request, plus a short, non-secret `keyPrefix` (the key's first
 * characters) so the UI can help a user recognize which key is which
 * without ever being able to show the whole thing again.
 */
@Entity('api_keys')
export class ApiKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  keyPrefix: string;

  // Looked up on every single integrations/v1 request via ApiKeyGuard —
  // a unique index keeps that check O(log n) instead of a table scan.
  @Index({ unique: true })
  @Column()
  keyHash: string;

  @Column({ default: false })
  revoked: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  lastUsedAt: Date | null;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ type: 'uuid' })
  createdById: string;

  @CreateDateColumn()
  createdAt: Date;
}
