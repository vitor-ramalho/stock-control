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
import { FiscalEventType, FiscalProcessingStatus } from '../fiscal-documents.enums';

@Entity('fiscal_events')
@Index('IDX_FISCAL_EVENT_TENANT', ['tenantId'])
@Index('IDX_FISCAL_EVENT_DOCUMENT', ['fiscalDocumentId'])
export class FiscalEvent {
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
    enum: FiscalEventType,
  })
  eventType: FiscalEventType;

  @Column({ type: 'jsonb', nullable: true })
  payload: Record<string, unknown> | null;

  @Column({
    type: 'enum',
    enum: FiscalProcessingStatus,
    default: FiscalProcessingStatus.PENDING,
  })
  status: FiscalProcessingStatus;

  @CreateDateColumn()
  createdAt: Date;
}
