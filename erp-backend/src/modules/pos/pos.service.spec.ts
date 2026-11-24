import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PosService } from './pos.service';
import { Sale, PaymentMethod } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { CashRegister, CashRegisterStatus } from '../cash-register/entities/cash-register.entity';
import { StockService } from '../stock/stock.service';
import { FinancialEntryService } from '../financial-entry/financial-entry.service';
import { Establishment } from '../fiscal-config/entities/establishment.entity';
import { FiscalDocumentsService } from '../fiscal-documents/fiscal-documents.service';

describe('PosService', () => {
  let service: PosService;
  let saleRepository: jest.Mocked<Repository<Sale>>;
  let cashRegisterRepository: jest.Mocked<Repository<CashRegister>>;
  let establishmentRepository: { findOne: jest.Mock };
  let fiscalDocumentsService: {
    getBySaleId: jest.Mock;
    requestEmissionFromSale: jest.Mock;
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PosService,
        {
          provide: getRepositoryToken(Sale),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
            findAndCount: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(SaleItem),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(CashRegister),
          useValue: {
            findOne: jest.fn(),
            save: jest.fn(),
            create: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Establishment),
          useValue: {
            findOne: jest.fn(),
          },
        },
        {
          provide: FiscalDocumentsService,
          useValue: {
            getBySaleId: jest.fn(),
            requestEmissionFromSale: jest.fn(),
          },
        },
        {
          provide: StockService,
          useValue: {
            automaticOutput: jest.fn(),
          },
        },
        {
          provide: FinancialEntryService,
          useValue: {
            autoEntryForSale: jest.fn(),
          },
        },
        {
          provide: DataSource,
          useValue: {
            transaction: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PosService>(PosService);
    saleRepository = module.get(getRepositoryToken(Sale));
    cashRegisterRepository = module.get(getRepositoryToken(CashRegister));
    establishmentRepository = module.get(getRepositoryToken(Establishment));
    fiscalDocumentsService = module.get(FiscalDocumentsService);
  });

  it('creates sale using open cash register from same tenant', async () => {
    cashRegisterRepository.findOne.mockResolvedValue({
      id: 'register-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      status: CashRegisterStatus.OPEN,
    } as CashRegister);

    saleRepository.create.mockReturnValue({
      id: 'sale-1',
      tenantId: 'tenant-1',
      cashRegisterId: 'register-1',
      userId: 'user-1',
      total: 0,
      status: 'pending',
    } as unknown as Sale);

    saleRepository.save.mockResolvedValue({
      id: 'sale-1',
      tenantId: 'tenant-1',
      cashRegisterId: 'register-1',
      userId: 'user-1',
    } as Sale);

    const result = await service.createSale(
      { cashRegisterId: 'register-1' },
      'tenant-1',
    );

    expect(result.tenantId).toBe('tenant-1');
    expect(cashRegisterRepository.findOne).toHaveBeenCalledWith({
      where: {
        id: 'register-1',
        tenantId: 'tenant-1',
        status: CashRegisterStatus.OPEN,
      },
    });
  });

  it('rejects sale creation when register is closed or from another tenant', async () => {
    cashRegisterRepository.findOne.mockResolvedValue(null);

    await expect(
      service.createSale({ cashRegisterId: 'register-1' }, 'tenant-2'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('starts automatic fiscal emission when a sale is closed', async () => {
    const sale = {
      id: 'sale-1',
      tenantId: 'tenant-1',
      userId: 'user-1',
      cashRegisterId: 'register-1',
      total: 100,
      subtotal: 100,
      tax: 0,
      discount: 0,
      status: 'pending',
      items: [{ id: 'item-1' }],
      paymentMethod: 'cash',
    } as unknown as Sale;

    saleRepository.findOne.mockResolvedValue(sale);
    saleRepository.save.mockResolvedValue({
      ...sale,
      status: 'closed',
      paymentMethod: 'cash',
    } as Sale);
    fiscalDocumentsService.getBySaleId.mockResolvedValue(null);
    establishmentRepository.findOne.mockResolvedValue({ id: 'est-1' });
    fiscalDocumentsService.requestEmissionFromSale.mockResolvedValue({ id: 'doc-1' });

    await service.closeSale('sale-1', { paymentMethod: PaymentMethod.CASH }, 'tenant-1');

    expect(fiscalDocumentsService.requestEmissionFromSale).toHaveBeenCalledWith(
      'tenant-1',
      'user-1',
      expect.objectContaining({
        saleId: 'sale-1',
        establishmentId: 'est-1',
        documentModel: 'NFCE_65',
        environment: 'HOMOLOGATION',
      }),
      'sale:sale-1:nfce:homologation',
    );
  });
});
