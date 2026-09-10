import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Client } from '../../clients/entities/client.entity.js';
import { TaskStatus } from '../../common/enums/task-status.enum.js';
import { Deal } from '../../deals/entities/deal.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('tasks')
// status + dueDate together cover the dashboard/task-list "pending,
// soonest due date first" query that runs on nearly every page load.
@Index(['clientId'])
@Index(['dealId'])
@Index(['assignedToId'])
@Index(['status', 'dueDate'])
@Index(['createdAt'])
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // 'date' (no time component) — TypeORM's postgres driver returns this
  // as a plain 'YYYY-MM-DD' string, not a Date object, avoiding timezone
  // shifting a due date across midnight.
  @Column({ type: 'date', nullable: true })
  dueDate: string | null;

  @Column({ type: 'enum', enum: TaskStatus, default: TaskStatus.PENDING })
  status: TaskStatus;

  // A task can optionally be tied to a client and/or a deal (a general
  // admin task has neither) — both SET NULL on delete so removing a
  // client/deal doesn't take its follow-up tasks down with it.
  @ManyToOne(() => Client, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'clientId' })
  client: Client | null;

  @Column({ type: 'uuid', nullable: true })
  clientId: string | null;

  @ManyToOne(() => Deal, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'dealId' })
  deal: Deal | null;

  @Column({ type: 'uuid', nullable: true })
  dealId: string | null;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assignedToId' })
  assignedTo: User | null;

  @Column({ type: 'uuid', nullable: true })
  assignedToId: string | null;

  @ManyToOne(() => User, { eager: true, onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User | null;

  @Column({ type: 'uuid', nullable: true })
  createdById: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
