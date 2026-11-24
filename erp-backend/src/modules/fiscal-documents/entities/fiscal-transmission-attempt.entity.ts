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
import { FiscalOperationType } from '../fiscal-documents.enums';

@Entity('fiscal_transmission_attempts')
@Index('IDX_FISCAL_ATTEMPT_TENANT', ['tenantId'])
@Index('IDX_FISCAL_ATTEMPT_DOCUMENT', ['fiscalDocumentId'])
export class FiscalTransmissionAttempt {
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
    enum: FiscalOperationType,
  })
  operation: FiscalOperationType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  endpoint: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  transportStatus: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  fiscalStatusCode: string | null;

  @Column({ type: 'text', nullable: true })
  fiscalReason: string | null;

  @Column({ type: 'text', nullable: true })
  rawResponse: string | null;

  @Column({ type: 'text', nullable: true })
  errorClass: string | null;

  @Column({ type: 'text', nullable: true })
  errorMessage: string | null;

  @CreateDateColumn()
  createdAt: Date;
}
