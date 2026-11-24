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
import { Tenant } from '../../tenant/entities/tenant.entity';
import { Establishment } from './establishment.entity';
import {
  FiscalDocumentModel,
  FiscalEnvironment,
  InternalFiscalStatus,
} from '../enums/fiscal.enums';

@Entity('fiscal_readiness_reviews')
@Index('IDX_READINESS_TENANT', ['tenantId'])
@Index('IDX_READINESS_EST_MODEL_ENV', ['establishmentId', 'documentModel', 'environment'])
export class FiscalReadinessReview {
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
    enum: FiscalDocumentModel,
  })
  documentModel: FiscalDocumentModel;

  @Column({
    type: 'enum',
    enum: FiscalEnvironment,
  })
  environment: FiscalEnvironment;

  @Column({
    type: 'enum',
    enum: InternalFiscalStatus,
    default: InternalFiscalStatus.INCOMPLETE,
  })
  status: InternalFiscalStatus;

  @Column({ type: 'text' })
  pendingItems: string;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column('uuid')
  reviewedByUserId: string;

  @Column({ type: 'timestamp' })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
