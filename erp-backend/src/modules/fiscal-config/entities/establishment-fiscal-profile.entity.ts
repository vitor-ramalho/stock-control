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
  IcmsTaxpayerIndicator,
  InternalFiscalStatus,
  TaxRegimeCode,
} from '../enums/fiscal.enums';

@Entity('establishment_fiscal_profiles')
@Index('IDX_FISCAL_PROFILE_TENANT', ['tenantId'])
@Index(
  'UQ_FISCAL_PROFILE_EST_MODEL_ENV',
  ['establishmentId', 'documentModel', 'environment'],
  { unique: true },
)
export class EstablishmentFiscalProfile {
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
    enum: IcmsTaxpayerIndicator,
    nullable: true,
  })
  icmsTaxpayerIndicator: IcmsTaxpayerIndicator | null;

  @Column({
    type: 'enum',
    enum: TaxRegimeCode,
    nullable: true,
  })
  taxRegime: TaxRegimeCode | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  stateRegistration: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  stateCode: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  cityIbgeCode: string | null;

  @Column({ default: false })
  isEnabled: boolean;

  @Column({ default: false })
  accreditationReported: boolean;

  @Column({ default: false })
  accreditationVerified: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastFiscalValidationAt: Date | null;

  @Column({
    type: 'enum',
    enum: InternalFiscalStatus,
    default: InternalFiscalStatus.INCOMPLETE,
  })
  internalStatus: InternalFiscalStatus;

  @Column({ type: 'text', nullable: true })
  blockingReasons: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
