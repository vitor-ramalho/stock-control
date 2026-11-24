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
import { Establishment } from './establishment.entity';
import { FiscalAuditAction } from '../enums/fiscal.enums';

@Entity('fiscal_audit_logs')
@Index('IDX_FISCAL_AUDIT_TENANT', ['tenantId'])
@Index('IDX_FISCAL_AUDIT_EST', ['establishmentId'])
export class FiscalAuditLog {
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
    enum: FiscalAuditAction,
  })
  action: FiscalAuditAction;

  @Column('uuid')
  actorUserId: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
