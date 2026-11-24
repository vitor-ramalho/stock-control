import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Tenant } from '../../tenant/entities/tenant.entity';
import { User } from '../../users/entities/user.entity';

export enum CashRegisterStatus {
  OPEN = 'open',
  CLOSED = 'closed',
}

@Entity('cash_registers')
export class CashRegister {
  constructor(
    id: string,
    tenantId: string,
    tenant: Tenant,
    userId: string,
    user: User,
    openedAt: Date,
    closedAt: Date,
    initialBalance: number,
    status: CashRegisterStatus = CashRegisterStatus.OPEN,
  ) {
    this.id = id;
    this.tenantId = tenantId;
    this.tenant = tenant;
    this.userId = userId;
    this.user = user;
    this.openedAt = openedAt;
    this.closedAt = closedAt;
    this.initialBalance = initialBalance;
    this.status = status;
  }
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  tenantId: string;

  @ManyToOne(() => Tenant, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @CreateDateColumn()
  openedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  closedAt: Date;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  initialBalance: number;

  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  finalBalance!: number;

  @Column({
    type: 'enum',
    enum: CashRegisterStatus,
    default: CashRegisterStatus.OPEN,
  })
  status: CashRegisterStatus;
}
