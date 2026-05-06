import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Customer } from './entities/customer.entity';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { ListCustomersDto } from './dto/list-customers.dto';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepository: Repository<Customer>,
  ) {}

  async create(
    createCustomerDto: CreateCustomerDto,
    tenantId: string,
  ): Promise<Customer> {
    if (!tenantId) {
      throw new BadRequestException('TenantId is required');
    }

    if (createCustomerDto.email) {
      const existingEmail = await this.customerRepository.findOne({
        where: {
          tenantId,
          email: createCustomerDto.email,
        },
      });

      if (existingEmail) {
        throw new ConflictException('Customer with this email already exists');
      }
    }

    const customer = this.customerRepository.create({
      ...createCustomerDto,
      tenantId,
      isActive: createCustomerDto.isActive ?? true,
    });

    return this.customerRepository.save(customer);
  }

  async findAll(
    query: ListCustomersDto,
    tenantId: string,
  ): Promise<{
    data: Customer[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const qb = this.customerRepository
      .createQueryBuilder('customer')
      .where('customer.tenantId = :tenantId', { tenantId });

    if (typeof query.isActive === 'boolean') {
      qb.andWhere('customer.isActive = :isActive', {
        isActive: query.isActive,
      });
    }

    if (query.q) {
      qb.andWhere(
        '(customer.name ILIKE :term OR customer.email ILIKE :term OR customer.phone ILIKE :term OR customer.document ILIKE :term)',
        {
          term: `%${query.q}%`,
        },
      );
    }

    const [data, total] = await qb
      .orderBy('customer.name', 'ASC')
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      data,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async search(term: string, tenantId: string): Promise<Customer[]> {
    const query = term?.trim();
    if (!query) {
      return [];
    }

    return this.customerRepository.find({
      where: [
        { tenantId, name: ILike(`%${query}%`), isActive: true },
        { tenantId, email: ILike(`%${query}%`), isActive: true },
        { tenantId, phone: ILike(`%${query}%`), isActive: true },
        { tenantId, document: ILike(`%${query}%`), isActive: true },
      ],
      order: { name: 'ASC' },
      take: 50,
    });
  }

  async findOne(id: string, tenantId: string): Promise<Customer> {
    const customer = await this.customerRepository.findOne({
      where: { id, tenantId },
    });

    if (!customer) {
      throw new NotFoundException('Customer not found');
    }

    return customer;
  }

  async update(
    id: string,
    updateCustomerDto: UpdateCustomerDto,
    tenantId: string,
  ): Promise<Customer> {
    const customer = await this.findOne(id, tenantId);

    if (
      updateCustomerDto.email &&
      updateCustomerDto.email.toLowerCase() !== customer.email?.toLowerCase()
    ) {
      const existingEmail = await this.customerRepository.findOne({
        where: { tenantId, email: updateCustomerDto.email },
      });

      if (existingEmail && existingEmail.id !== id) {
        throw new ConflictException('Customer with this email already exists');
      }
    }

    Object.assign(customer, updateCustomerDto);
    return this.customerRepository.save(customer);
  }

  async remove(id: string, tenantId: string): Promise<void> {
    const customer = await this.findOne(id, tenantId);
    customer.isActive = false;
    await this.customerRepository.save(customer);
  }
}
