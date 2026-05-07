import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../tenant/entities/tenant.entity';
import { User } from '../users/entities/user.entity';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto';

@Injectable()
export class BackofficeService {
  constructor(
    @InjectRepository(Tenant)
    private readonly tenantRepository: Repository<Tenant>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAllTenants() {
    const tenants = await this.tenantRepository.find({
      order: {
        createdAt: 'DESC',
      },
    });

    return tenants.map((tenant) => ({
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    }));
  }

  async findOneTenant(id: string) {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    return {
      id: tenant.id,
      name: tenant.name,
      slug: tenant.slug,
      isActive: tenant.isActive,
      createdAt: tenant.createdAt,
      updatedAt: tenant.updatedAt,
    };
  }

  async findTenantUsers(tenantId: string) {
    await this.ensureTenantExists(tenantId);

    const users = await this.userRepository.find({
      where: { tenantId },
      order: {
        createdAt: 'DESC',
      },
    });

    return users.map((user) => this.sanitizeUser(user));
  }

  async createTenantUser(tenantId: string, dto: CreateTenantUserDto) {
    await this.ensureTenantExists(tenantId);

    const existingUser = await this.userRepository.findOne({
      where: { tenantId, email: dto.email },
    });

    if (existingUser) {
      throw new ConflictException(
        'User with this email already exists in this tenant',
      );
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      tenantId,
      email: dto.email,
      name: dto.name,
      role: dto.role,
      isActive: true,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);
    return this.sanitizeUser(savedUser);
  }

  async updateTenantUser(
    tenantId: string,
    userId: string,
    dto: UpdateTenantUserDto,
  ) {
    await this.ensureTenantExists(tenantId);

    const user = await this.userRepository.findOne({
      where: { id: userId, tenantId },
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    if (dto.email && dto.email.toLowerCase() !== user.email.toLowerCase()) {
      const existingEmail = await this.userRepository.findOne({
        where: { tenantId, email: dto.email },
      });

      if (existingEmail && existingEmail.id !== userId) {
        throw new ConflictException(
          'User with this email already exists in this tenant',
        );
      }
    }

    if (dto.password) {
      user.password = await bcrypt.hash(dto.password, 10);
    }

    if (dto.name !== undefined) user.name = dto.name;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.role !== undefined) user.role = dto.role;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;

    const savedUser = await this.userRepository.save(user);
    return this.sanitizeUser(savedUser);
  }

  async updateTenantUserStatus(
    tenantId: string,
    userId: string,
    isActive: boolean,
  ) {
    const updated = await this.updateTenantUser(tenantId, userId, { isActive });

    return {
      ...updated,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  }

  async updateTenantStatus(id: string, isActive: boolean) {
    const tenant = await this.tenantRepository.findOne({
      where: { id },
    });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${id} not found`);
    }

    tenant.isActive = isActive;
    await this.tenantRepository.save(tenant);

    return {
      id: tenant.id,
      name: tenant.name,
      isActive: tenant.isActive,
      message: `Tenant ${isActive ? 'activated' : 'deactivated'} successfully`,
    };
  }

  private async ensureTenantExists(tenantId: string) {
    const tenant = await this.tenantRepository.findOne({ where: { id: tenantId } });

    if (!tenant) {
      throw new NotFoundException(`Tenant with ID ${tenantId} not found`);
    }
  }

  private sanitizeUser(user: User) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }
}
