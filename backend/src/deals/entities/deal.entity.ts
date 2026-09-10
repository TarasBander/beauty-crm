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
import { DealStage } from '../../common/enums/deal-stage.enum.js';
import { Client } from '../../clients/entities/client.entity.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('deals')
// clientId: the client-detail page's deal list. stage: the pipeline
// carousel filters by stage on every render. createdAt: default sort.
@Index(['clientId'])
@Index(['assignedToId'])
@Index(['stage'])
@Index(['createdAt'])
export class Deal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  // node-postgres returns NUMERIC columns as strings (to avoid silent
  // float precision loss), so the transformer converts both ways —
  // otherwise `deal.amount` would be a string at runtime despite the
  // `number` type here.
  @Column({
    type: 'numeric',
    precision: 12,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string | null) => (value === null ? null : parseFloat(value)),
    },
  })
  amount: number;

  @Column({ type: 'enum', enum: DealStage, default: DealStage.NEW })
  stage: DealStage;

  @ManyToOne(() => Client, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'clientId' })
  client: Client;

  @Column({ type: 'uuid' })
  clientId: string;

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

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
