import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../users/entities/user.entity.js';

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  phone: string;

  // TypeORM can't infer a column type from a `string | null` TS type
  // (reflect-metadata erases the union to `Object`), so every nullable
  // column below spells out `type: 'varchar'`/`'text'` explicitly.
  @Column({ type: 'varchar', nullable: true })
  email: string | null;

  // Name of the beauty salon this contact represents — this CRM's
  // clients are contact people, not the salons themselves.
  @Column({ type: 'varchar', nullable: true })
  salonName: string | null;

  @Column({ type: 'varchar', nullable: true })
  position: string | null;

  @Column({ type: 'varchar', nullable: true })
  address: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

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
