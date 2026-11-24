import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FinancialEntryService } from './financial-entry.service';
import { FinancialEntry } from './entities/financial-entry.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { UserRole } from '../users/entities/user.entity';

describe('FinancialEntryService', () => {
  let service: FinancialEntryService;
  let financialEntryRepository: jest.Mocked<Repository<FinancialEntry>>;
  let cashRegisterRepository: jest.Mocked<Repository<CashRegister>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FinancialEntryService,
        {
          provide: getRepositoryToken(FinancialEntry),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CashRegister),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FinancialEntryService>(FinancialEntryService);
    financialEntryRepository = module.get(getRepositoryToken(FinancialEntry));
    cashRegisterRepository = module.get(getRepositoryToken(CashRegister));
  });

  it('blocks CASHIER from reading entries of another user register', async () => {
    cashRegisterRepository.findOne.mockResolvedValue({
      id: 'register-1',
      tenantId: 'tenant-1',
      userId: 'owner-user',
    } as CashRegister);

    await expect(
      service.getEntriesByRegister(
        'register-1',
        'tenant-1',
        'another-user',
        UserRole.CASHIER,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows MANAGER to read entries from any register in the same tenant', async () => {
    cashRegisterRepository.findOne.mockResolvedValue({
      id: 'register-1',
      tenantId: 'tenant-1',
      userId: 'owner-user',
    } as CashRegister);

    financialEntryRepository.find.mockResolvedValue([]);

    await service.getEntriesByRegister(
      'register-1',
      'tenant-1',
      'another-user',
      UserRole.MANAGER,
    );

    expect(financialEntryRepository.find).toHaveBeenCalledWith({
      where: {
        cashRegisterId: 'register-1',
        tenantId: 'tenant-1',
      },
      order: { createdAt: 'DESC' },
    });
  });
});
