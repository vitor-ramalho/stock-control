import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { FiscalOperationType, FiscalProcessingStatus } from '../fiscal-documents.enums';

@Entity('fiscal_processing_queue')
@Index('IDX_FISCAL_QUEUE_STATUS_NEXT_ATTEMPT', ['status', 'nextAttemptAt'])
@Index('IDX_FISCAL_QUEUE_TENANT', ['tenantId'])
@Index('IDX_FISCAL_QUEUE_AGGREGATE', ['aggregateType', 'aggregateId'])
export class FiscalProcessingQueue {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @Column({ type: 'varchar', length: 80 })
  aggregateType: string;

  @Column('uuid')
  aggregateId: string;

  @Column({
    type: 'enum',
    enum: FiscalOperationType,
  })
  operation: FiscalOperationType;

  @Column({ type: 'jsonb' })
  payload: Record<string, unknown>;

  @Column({
    type: 'enum',
    enum: FiscalProcessingStatus,
    default: FiscalProcessingStatus.PENDING,
  })
  status: FiscalProcessingStatus;

  @Column({ type: 'int', default: 0 })
  attempts: number;

  @Column({ type: 'timestamp' })
  nextAttemptAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  lockedAt: Date | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  lockToken: string | null;

  @Column({ type: 'timestamp', nullable: true })
  processedAt: Date | null;

  @Column({ type: 'text', nullable: true })
  lastError: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
