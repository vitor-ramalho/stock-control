import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { CashRegister } from '../../cash-register/entities/cash-register.entity';

export enum EntryType {
  IN = 'in',
  OUT = 'out',
}

@Entity('financial_entries')
export class FinancialEntry {
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

  @Column('uuid', { nullable: true })
  saleId: string;

  @Column({
    type: 'enum',
    enum: EntryType,
  })
  type: EntryType;

  @Column('decimal', { precision: 10, scale: 2 })
  value: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ nullable: true })
  category: string;

  @CreateDateColumn()
  createdAt: Date;
}
