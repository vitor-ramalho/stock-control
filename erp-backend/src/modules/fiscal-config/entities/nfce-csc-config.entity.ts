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
  CredentialStatus,
  FiscalEnvironment,
  ValidationStatus,
} from '../enums/fiscal.enums';

@Entity('nfce_csc_configs')
@Index('IDX_CSC_TENANT', ['tenantId'])
@Index('UQ_CSC_ESTABLISHMENT_ENV_CURRENT', ['establishmentId', 'environment', 'isCurrent'])
export class NfceCscConfig {
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

  @Column({ length: 80 })
  cscId: string;

  @Column({ type: 'text' })
  encryptedCsc: string;

  @Column({
    type: 'enum',
    enum: FiscalEnvironment,
  })
  environment: FiscalEnvironment;

  @Column({
    type: 'enum',
    enum: ValidationStatus,
    default: ValidationStatus.NOT_VALIDATED,
  })
  validationStatus: ValidationStatus;

  @Column({
    type: 'enum',
    enum: CredentialStatus,
    default: CredentialStatus.PENDING_VALIDATION,
  })
  status: CredentialStatus;

  @Column({ type: 'timestamp', nullable: true })
  configuredAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  lastValidatedAt: Date | null;

  @Column('uuid')
  configuredByUserId: string;

  @Column({ default: true })
  isCurrent: boolean;

  @Column({ type: 'timestamp', nullable: true })
  replacedAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
