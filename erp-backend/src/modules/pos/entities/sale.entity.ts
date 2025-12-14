import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { CashRegister } from '../../cash-register/entities/cash-register.entity';
import { SaleItem } from './sale-item.entity';

export enum PaymentMethod {
  CASH = 'cash',
  CREDIT_CARD = 'credit_card',
  DEBIT_CARD = 'debit_card',
  PIX = 'pix',
}

export enum SaleStatus {
  PENDING = 'pending',
  CLOSED = 'closed',
  CANCELLED = 'cancelled',
}

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column('uuid')
  cashRegisterId: string;

  @ManyToOne(() => CashRegister, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cashRegisterId' })
  cashRegister: CashRegister;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({
    type: 'enum',
    enum: PaymentMethod,
    nullable: true,
  })
  paymentMethod: PaymentMethod;

  @Column({
    type: 'enum',
    enum: SaleStatus,
    default: SaleStatus.PENDING,
  })
  status: SaleStatus;

  @OneToMany(() => SaleItem, (saleItem) => saleItem.sale, { cascade: true })
  items: SaleItem[];

  @CreateDateColumn()
  createdAt: Date;
}
