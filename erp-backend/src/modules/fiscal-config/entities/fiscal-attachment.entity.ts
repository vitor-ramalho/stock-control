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
import { FiscalAttachmentType } from '../enums/fiscal.enums';

@Entity('fiscal_attachments')
@Index('IDX_FISCAL_ATTACHMENT_TENANT', ['tenantId'])
@Index('IDX_FISCAL_ATTACHMENT_EST', ['establishmentId'])
export class FiscalAttachment {
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
    enum: FiscalAttachmentType,
  })
  attachmentType: FiscalAttachmentType;

  @Column({ length: 255 })
  originalFileName: string;

  @Column({ length: 255 })
  storageKey: string;

  @Column({ type: 'varchar', length: 120, nullable: true })
  mimeType: string | null;

  @Column({ type: 'bigint', nullable: true })
  fileSize: string | null;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column('uuid')
  uploadedByUserId: string;

  @Column({ type: 'timestamp' })
  uploadedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
