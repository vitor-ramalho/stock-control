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
  CertificateType,
  CredentialStatus,
  ValidationStatus,
} from '../enums/fiscal.enums';

@Entity('digital_certificates')
@Index('IDX_CERT_TENANT', ['tenantId'])
@Index('IDX_CERT_ESTABLISHMENT', ['establishmentId'])
export class DigitalCertificate {
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
    enum: CertificateType,
  })
  certificateType: CertificateType;

  @Column({ length: 200 })
  holderName: string;

  @Column({ type: 'varchar', length: 14, nullable: true })
  holderCnpj: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  issuer: string | null;

  @Column({ type: 'date', nullable: true })
  validFrom: string | null;

  @Column({ type: 'date', nullable: true })
  validTo: string | null;

  @Column({ length: 500 })
  secureFileRef: string;

  @Column({ type: 'text' })
  encryptedPassphrase: string;

  @Column({
    type: 'enum',
    enum: ValidationStatus,
    default: ValidationStatus.NOT_VALIDATED,
  })
  validationStatus: ValidationStatus;

  @Column({ type: 'timestamp', nullable: true })
  lastVerifiedAt: Date | null;

  @Column({
    type: 'enum',
    enum: CredentialStatus,
    default: CredentialStatus.PENDING_VALIDATION,
  })
  status: CredentialStatus;

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
