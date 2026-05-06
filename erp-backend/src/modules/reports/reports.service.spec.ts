import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ReportsService } from './reports.service';
import { Sale, PaymentMethod, SaleStatus } from '../pos/entities/sale.entity';
import {
  StockMovement,
  MovementType,
} from '../stock/entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import {
  FinancialEntry,
  EntryType,
} from '../financial-entry/entities/financial-entry.entity';

describe('ReportsService', () => {
  let service: ReportsService;
  let saleRepository: jest.Mocked<Repository<Sale>>;
  let stockMovementRepository: jest.Mocked<Repository<StockMovement>>;
  let productRepository: jest.Mocked<Repository<Product>>;
  let cashRegisterRepository: jest.Mocked<Repository<CashRegister>>;
  let financialEntryRepository: jest.Mocked<Repository<FinancialEntry>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReportsService,
        {
          provide: getRepositoryToken(Sale),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(StockMovement),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: { findOne: jest.fn() },
        },
        {
          provide: getRepositoryToken(CashRegister),
          useValue: { find: jest.fn() },
        },
        {
          provide: getRepositoryToken(FinancialEntry),
          useValue: { find: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<ReportsService>(ReportsService);
    saleRepository = module.get(getRepositoryToken(Sale));
    stockMovementRepository = module.get(getRepositoryToken(StockMovement));
    productRepository = module.get(getRepositoryToken(Product));
    cashRegisterRepository = module.get(getRepositoryToken(CashRegister));
    financialEntryRepository = module.get(getRepositoryToken(FinancialEntry));
  });

  it('aggregates sales report by payment method using tenant-scoped sales', async () => {
    saleRepository.find.mockResolvedValue([
      {
        id: 'sale-1',
        tenantId: 'tenant-1',
        total: 100,
        status: SaleStatus.CLOSED,
        paymentMethod: PaymentMethod.CASH,
        items: [{ quantity: 2 }],
      } as unknown as Sale,
      {
        id: 'sale-2',
        tenantId: 'tenant-1',
        total: 200,
        status: SaleStatus.CLOSED,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        items: [{ quantity: 1 }],
      } as unknown as Sale,
    ]);

    const report = await service.getSalesReport({}, 'tenant-1');

    expect(report.summary.totalSales).toBe(2);
    expect(report.summary.totalRevenue).toBe(300);
    expect(report.byPaymentMethod.cash).toBe(100);
    expect(report.byPaymentMethod.credit_card).toBe(200);

    const callArg = (saleRepository.find as jest.Mock).mock.calls[0][0] as {
      where: { tenantId: string; status: SaleStatus };
    };
    expect(callArg.where.tenantId).toBe('tenant-1');
    expect(callArg.where.status).toBe(SaleStatus.CLOSED);
  });

  it('aggregates stock movement report with in/out totals', async () => {
    stockMovementRepository.find.mockResolvedValue([
      {
        id: 'mv-1',
        tenantId: 'tenant-1',
        type: MovementType.IN,
        quantity: 10,
      } as StockMovement,
      {
        id: 'mv-2',
        tenantId: 'tenant-1',
        type: MovementType.OUT,
        quantity: 4,
      } as StockMovement,
    ]);

    const report = await service.getStockMovementsReport({}, 'tenant-1');

    expect(report.summary.totalIn).toBe(10);
    expect(report.summary.totalOut).toBe(4);
    expect(report.summary.netMovement).toBe(6);
  });

  it('builds cash report with register-scoped entries', async () => {
    cashRegisterRepository.find.mockResolvedValue([
      {
        id: 'register-1',
        tenantId: 'tenant-1',
        initialBalance: 100,
        finalBalance: 140,
      } as unknown as CashRegister,
    ]);

    financialEntryRepository.find.mockResolvedValue([
      {
        id: 'entry-1',
        tenantId: 'tenant-1',
        type: EntryType.IN,
        value: 60,
      } as FinancialEntry,
      {
        id: 'entry-2',
        tenantId: 'tenant-1',
        type: EntryType.OUT,
        value: 20,
      } as FinancialEntry,
    ]);

    const report = await service.getCashReportByDate('2026-01-10', 'tenant-1');

    expect(report.summary.totalRegisters).toBe(1);
    expect(report.summary.totalIn).toBe(60);
    expect(report.summary.totalOut).toBe(20);
    expect(report.summary.netBalance).toBe(40);
  });
});
