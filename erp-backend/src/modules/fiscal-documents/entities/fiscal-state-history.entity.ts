import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { FiscalDocument } from './fiscal-document.entity';
import { User } from '../../users/entities/user.entity';
import { FiscalDocumentState } from '../fiscal-documents.enums';

@Entity('fiscal_state_history')
@Index('IDX_FISCAL_STATE_HISTORY_TENANT', ['tenantId'])
@Index('IDX_FISCAL_STATE_HISTORY_DOCUMENT', ['fiscalDocumentId'])
export class FiscalStateHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column('uuid')
  fiscalDocumentId: string;

  @ManyToOne(() => FiscalDocument, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fiscalDocumentId' })
  fiscalDocument: FiscalDocument;

  @Column({
    type: 'enum',
    enum: FiscalDocumentState,
    nullable: true,
  })
  fromState: FiscalDocumentState | null;

  @Column({
    type: 'enum',
    enum: FiscalDocumentState,
  })
  toState: FiscalDocumentState;

  @Column({ type: 'text' })
  reason: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @Column('uuid', { nullable: true })
  createdByUserId: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User | null;

  @CreateDateColumn()
  createdAt: Date;
}
