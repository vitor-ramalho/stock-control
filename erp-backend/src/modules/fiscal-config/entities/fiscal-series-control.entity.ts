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
import { FiscalDocumentModel, FiscalEnvironment } from '../enums/fiscal.enums';

@Entity('fiscal_series_controls')
@Index('IDX_SERIES_TENANT', ['tenantId'])
@Index(
  'UQ_SERIES_EST_MODEL_ENV_SERIES',
  ['establishmentId', 'documentModel', 'environment', 'series'],
  { unique: true },
)
export class FiscalSeriesControl {
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

  @Column({ type: 'int' })
  series: number;

  @Column({ type: 'bigint', default: 1 })
  nextNumber: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
