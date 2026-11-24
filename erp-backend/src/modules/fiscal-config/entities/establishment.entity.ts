import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { EstablishmentFiscalProfile } from './establishment-fiscal-profile.entity';
import { FiscalSeriesControl } from './fiscal-series-control.entity';
import { DigitalCertificate } from './digital-certificate.entity';
import { NfceCscConfig } from './nfce-csc-config.entity';
import { FiscalReadinessReview } from './fiscal-readiness-review.entity';
import { FiscalAttachment } from './fiscal-attachment.entity';
import { FiscalAuditLog } from './fiscal-audit-log.entity';

@Entity('establishments')
@Index('IDX_ESTABLISHMENTS_TENANT', ['tenantId'])
@Index('UQ_ESTABLISHMENTS_TENANT_CNPJ', ['tenantId', 'cnpj'], {
  unique: true,
})
export class Establishment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column({ length: 200 })
  legalName: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  tradeName: string | null;

  @Column({ length: 14 })
  cnpj: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  legalNature: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  cnaeMain: string | null;

  @Column({ type: 'text', nullable: true })
  cnaeSecondary: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  street: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  number: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  complement: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  neighborhood: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  zipCode: string | null;

  @Column({ type: 'varchar', length: 120, nullable: true })
  cityName: string | null;

  @Column({ type: 'varchar', length: 2, nullable: true })
  stateCode: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  cityIbgeCode: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  countryCode: string | null;

  @Column({ type: 'varchar', length: 150, nullable: true })
  contactEmail: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  contactPhone: string | null;

  @Column({ type: 'varchar', length: 80, nullable: true })
  registrationStatus: string | null;

  @Column({ type: 'timestamp', nullable: true })
  registrationStatusUpdatedAt: Date | null;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => EstablishmentFiscalProfile, (profile) => profile.establishment)
  fiscalProfiles: EstablishmentFiscalProfile[];

  @OneToMany(() => FiscalSeriesControl, (series) => series.establishment)
  seriesControls: FiscalSeriesControl[];

  @OneToMany(() => DigitalCertificate, (certificate) => certificate.establishment)
  certificates: DigitalCertificate[];

  @OneToMany(() => NfceCscConfig, (csc) => csc.establishment)
  cscConfigs: NfceCscConfig[];

  @OneToMany(() => FiscalReadinessReview, (review) => review.establishment)
  readinessReviews: FiscalReadinessReview[];

  @OneToMany(() => FiscalAttachment, (attachment) => attachment.establishment)
  attachments: FiscalAttachment[];

  @OneToMany(() => FiscalAuditLog, (audit) => audit.establishment)
  auditLogs: FiscalAuditLog[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
