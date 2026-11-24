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
import { Establishment } from '../../fiscal-config/entities/establishment.entity';
import { FiscalDocument } from './fiscal-document.entity';
import { FiscalOperationType } from '../fiscal-documents.enums';

@Entity('fiscal_idempotency_keys')
@Index('UQ_FISCAL_IDEMPOTENCY_SCOPE', ['tenantId', 'establishmentId', 'operation', 'key'], {
  unique: true,
})
export class FiscalIdempotencyKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column('uuid')
  establishmentId: string;

  @ManyToOne(() => Establishment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'establishmentId' })
  establishment: Establishment;

  @Column({
    type: 'enum',
    enum: FiscalOperationType,
  })
  operation: FiscalOperationType;

  @Column({ type: 'varchar', length: 120 })
  key: string;

  @Column('uuid', { nullable: true })
  fiscalDocumentId: string | null;

  @ManyToOne(() => FiscalDocument, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'fiscalDocumentId' })
  fiscalDocument: FiscalDocument | null;

  @Column({ type: 'timestamp', nullable: true })
  expiresAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;
}
