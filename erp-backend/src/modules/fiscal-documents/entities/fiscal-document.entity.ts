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
import { Establishment } from '../../fiscal-config/entities/establishment.entity';
import { Sale } from '../../pos/entities/sale.entity';
import { User } from '../../users/entities/user.entity';
import { FiscalDocumentModel, FiscalEnvironment } from '../../fiscal-config/enums/fiscal.enums';
import { FiscalDocumentState, FiscalEmissionMode } from '../fiscal-documents.enums';

@Entity('fiscal_documents')
@Index('IDX_FISCAL_DOCUMENT_TENANT', ['tenantId'])
@Index('IDX_FISCAL_DOCUMENT_ESTABLISHMENT', ['establishmentId'])
@Index('IDX_FISCAL_DOCUMENT_SALE', ['saleId'])
@Index('IDX_FISCAL_DOCUMENT_STATE', ['state'])
@Index(
  'UQ_FISCAL_DOCUMENT_NUMBER',
  ['tenantId', 'establishmentId', 'documentModel', 'environment', 'series', 'number'],
  { unique: true },
)
export class FiscalDocument {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column('uuid')
  establishmentId: string;

  @ManyToOne(() => Establishment, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'establishmentId' })
  establishment: Establishment;

  @Column('uuid', { nullable: true })
  saleId: string | null;

  @ManyToOne(() => Sale, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'saleId' })
  sale: Sale | null;

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

  @Column({ type: 'int' })
  series: number;

  @Column({ type: 'bigint' })
  number: string;

  @Column({ type: 'varchar', length: 44, nullable: true })
  accessKey: string | null;

  @Column({
    type: 'enum',
    enum: FiscalDocumentState,
  })
  state: FiscalDocumentState;

  @Column({
    type: 'enum',
    enum: FiscalEmissionMode,
    default: FiscalEmissionMode.NORMAL,
  })
  emissionMode: FiscalEmissionMode;

  @Column({ type: 'varchar', length: 20 })
  schemaVersion: string;

  @Column({ type: 'jsonb', nullable: true })
  totalsSnapshot: Record<string, unknown> | null;

  @Column({ type: 'text', nullable: true })
  generatedXml: string | null;

  @Column({ type: 'text', nullable: true })
  signedXml: string | null;

  @Column({ type: 'text', nullable: true })
  authorizedXml: string | null;

  @Column({ type: 'varchar', length: 30, nullable: true })
  protocolNumber: string | null;

  @Column({ type: 'varchar', length: 10, nullable: true })
  rejectionCode: string | null;

  @Column({ type: 'text', nullable: true })
  rejectionReason: string | null;

  @Column({ type: 'timestamp', nullable: true })
  queuedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  transmittedAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  responseAt: Date | null;

  @Column({ type: 'timestamp', nullable: true })
  authorizedAt: Date | null;

  @Column('uuid')
  createdByUserId: string;

  @ManyToOne(() => User, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'createdByUserId' })
  createdBy: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
