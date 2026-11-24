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
import { SaleItem } from '../../pos/entities/sale-item.entity';
import { Product } from '../../products/entities/product.entity';
import { FiscalDocument } from './fiscal-document.entity';

@Entity('fiscal_document_items')
@Index('IDX_FISCAL_DOCUMENT_ITEM_TENANT', ['tenantId'])
@Index('IDX_FISCAL_DOCUMENT_ITEM_DOCUMENT', ['fiscalDocumentId'])
export class FiscalDocumentItem {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column('uuid')
  fiscalDocumentId: string;

  @ManyToOne(() => FiscalDocument, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'fiscalDocumentId' })
  fiscalDocument: FiscalDocument;

  @Column('uuid', { nullable: true })
  saleItemId: string | null;

  @ManyToOne(() => SaleItem, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'saleItemId' })
  saleItem: SaleItem | null;

  @Column('uuid', { nullable: true })
  productId: string | null;

  @ManyToOne(() => Product, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'productId' })
  product: Product | null;

  @Column({ type: 'int' })
  lineNumber: number;

  @Column({ type: 'varchar', length: 255 })
  description: string;

  @Column({ type: 'varchar', length: 8, nullable: true })
  ncm: string | null;

  @Column({ type: 'varchar', length: 4, nullable: true })
  cfop: string | null;

  @Column({ type: 'varchar', length: 7, nullable: true })
  cest: string | null;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  quantity: number;

  @Column({ type: 'decimal', precision: 14, scale: 4 })
  unitPrice: number;

  @Column({ type: 'decimal', precision: 14, scale: 2 })
  grossTotal: number;

  @Column({ type: 'decimal', precision: 14, scale: 2, default: 0 })
  discountTotal: number;

  @Column({ type: 'jsonb', nullable: true })
  taxSnapshot: Record<string, unknown> | null;

  @CreateDateColumn()
  createdAt: Date;
}
