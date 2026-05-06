import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';

describe('CustomersService', () => {
  let service: CustomersService;
  let repository: jest.Mocked<Repository<Customer>>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: getRepositoryToken(Customer),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            createQueryBuilder: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
    repository = module.get(getRepositoryToken(Customer));
  });

  it('creates a tenant-scoped customer', async () => {
    repository.findOne.mockResolvedValueOnce(null);

    const created = {
      id: 'customer-1',
      tenantId: 'tenant-1',
      name: 'Alice',
      email: 'alice@example.com',
      isActive: true,
    } as Customer;

    repository.create.mockReturnValue(created);
    repository.save.mockResolvedValue(created);

    const result = await service.create(
      {
        name: 'Alice',
        email: 'alice@example.com',
      },
      'tenant-1',
    );

    expect(result.id).toBe('customer-1');
    expect(repository.findOne).toHaveBeenCalledWith({
      where: {
        tenantId: 'tenant-1',
        email: 'alice@example.com',
      },
    });
  });

  it('prevents duplicate email inside same tenant', async () => {
    repository.findOne.mockResolvedValue({
      id: 'existing-customer',
      tenantId: 'tenant-1',
      email: 'alice@example.com',
    } as Customer);

    await expect(
      service.create(
        {
          name: 'Alice',
          email: 'alice@example.com',
        },
        'tenant-1',
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('returns not found for tenant mismatch when fetching customer', async () => {
    repository.findOne.mockResolvedValue(null);

    await expect(service.findOne('customer-x', 'tenant-2')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('soft deletes customer by setting isActive=false', async () => {
    const existing = {
      id: 'customer-1',
      tenantId: 'tenant-1',
      isActive: true,
    } as Customer;

    repository.findOne.mockResolvedValue(existing);
    repository.save.mockResolvedValue({ ...existing, isActive: false });

    await service.remove('customer-1', 'tenant-1');

    expect(repository.save).toHaveBeenCalledWith({
      ...existing,
      isActive: false,
    });
  });
});
