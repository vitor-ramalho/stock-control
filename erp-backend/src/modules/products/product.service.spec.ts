import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ProductService } from './product.service';
import { Product } from './entities/product.entity';

describe('ProductService', () => {
  let service: ProductService;
  let repository: jest.Mocked<Repository<Product>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductService,
        {
          provide: getRepositoryToken(Product),
          useValue: {
            find: jest.fn(),
            findOne: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<ProductService>(ProductService);
    repository = module.get(getRepositoryToken(Product));
  });

  it('creates a product scoped by tenant and SKU uniqueness', async () => {
    repository.findOne.mockResolvedValueOnce(null);

    const created = {
      id: 'product-1',
      tenantId: 'tenant-1',
      name: 'Notebook',
      sku: 'SKU-1',
      price: 100,
    } as Product;

    repository.create.mockReturnValue(created);
    repository.save.mockResolvedValue(created);

    const result = await service.create(
      {
        name: 'Notebook',
        sku: 'SKU-1',
        price: 100,
      },
      'tenant-1',
    );

    expect(result.tenantId).toBe('tenant-1');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: { sku: 'SKU-1', tenantId: 'tenant-1' },
    });
  });

  it('rejects duplicated SKU in same tenant', async () => {
    repository.findOne.mockResolvedValue({
      id: 'existing',
      tenantId: 'tenant-1',
      sku: 'SKU-1',
    } as Product);

    await expect(
      service.create(
        {
          name: 'Notebook',
          sku: 'SKU-1',
          price: 100,
        },
        'tenant-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns not found when product exists in another tenant', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne('product-1', 'tenant-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
