import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { StockService } from './stock.service';
import { StockMovement, MovementType } from './entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';

describe('StockService', () => {
  let service: StockService;
  let stockMovementRepository: jest.Mocked<Repository<StockMovement>>;
  let productRepository: jest.Mocked<Repository<Product>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StockService,
        {
          provide: getRepositoryToken(StockMovement),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<StockService>(StockService);
    stockMovementRepository = module.get(getRepositoryToken(StockMovement));
    productRepository = module.get(getRepositoryToken(Product));
  });

  it('increases product quantity on stock input', async () => {
    const product = {
      id: 'product-1',
      tenantId: 'tenant-1',
      quantity: 5,
    } as Product;

    productRepository.findOne.mockResolvedValue(product);
    stockMovementRepository.create.mockReturnValue({
      id: 'movement-1',
      tenantId: 'tenant-1',
      productId: 'product-1',
      type: MovementType.IN,
      quantity: 3,
    } as StockMovement);
    stockMovementRepository.save.mockResolvedValue({
      id: 'movement-1',
      tenantId: 'tenant-1',
      productId: 'product-1',
      type: MovementType.IN,
      quantity: 3,
    } as StockMovement);

    await service.stockIn(
      {
        productId: 'product-1',
        quantity: 3,
      },
      'tenant-1',
    );

    expect(productRepository.save).toHaveBeenCalledWith({
      ...product,
      quantity: 8,
    });
  });

  it('rejects stock output when quantity is insufficient', async () => {
    productRepository.findOne.mockResolvedValue({
      id: 'product-1',
      tenantId: 'tenant-1',
      quantity: 1,
      name: 'Notebook',
    } as Product);

    await expect(
      service.stockOut(
        {
          productId: 'product-1',
          quantity: 2,
        },
        'tenant-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('returns not found when product does not belong to tenant', async () => {
    productRepository.findOne.mockResolvedValue(null);

    await expect(
      service.getProductMovements('product-1', 'tenant-2'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
