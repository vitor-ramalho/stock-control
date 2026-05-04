import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CashRegisterService } from './cash-register.service';
import { CashRegister } from './entities/cash-register.entity';
import { FinancialEntry } from '../financial-entry/entities/financial-entry.entity';

describe('CashRegisterService', () => {
  let service: CashRegisterService;
  let cashRegisterRepository: jest.Mocked<Repository<CashRegister>>;
  let financialEntryRepository: jest.Mocked<Repository<FinancialEntry>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CashRegisterService,
        {
          provide: getRepositoryToken(CashRegister),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FinancialEntry),
          useValue: {
            find: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: { transaction: jest.fn() },
        },
      ],
    }).compile();

    service = module.get<CashRegisterService>(CashRegisterService);
    cashRegisterRepository = module.get(getRepositoryToken(CashRegister));
    financialEntryRepository = module.get(getRepositoryToken(FinancialEntry));
  });

  it('uses IN operator when fetching daily report entries for non-contiguous registers', async () => {
    cashRegisterRepository.find.mockResolvedValue([
      {
        id: 'register-a',
        tenantId: 'tenant-1',
        openedAt: new Date('2026-01-01T08:00:00.000Z'),
        initialBalance: 100,
      } as CashRegister,
      {
        id: 'register-z',
        tenantId: 'tenant-1',
        openedAt: new Date('2026-01-01T10:00:00.000Z'),
        initialBalance: 50,
      } as CashRegister,
    ]);
    financialEntryRepository.find.mockResolvedValue([]);

    await service.getDailyReport(
      new Date('2026-01-01T12:00:00.000Z'),
      'tenant-1',
    );

    const findMock = financialEntryRepository.find as jest.Mock;
    expect(findMock).toHaveBeenCalledTimes(1);

    const [callArg] = findMock.mock.calls[0] as [
      {
        where: {
          tenantId: string;
          cashRegisterId: { _type: string; _value: string[] };
        };
      },
    ];

    expect(callArg.where.tenantId).toBe('tenant-1');
    expect(callArg.where.cashRegisterId._type).toBe('in');
    expect(callArg.where.cashRegisterId._value).toEqual([
      'register-a',
      'register-z',
    ]);
  });
});
