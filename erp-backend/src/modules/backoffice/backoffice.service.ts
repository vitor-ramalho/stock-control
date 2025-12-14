import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tenant } from '../tenant/entities/tenant.entity';
import { User } from '../users/entities/user.entity';

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
    const users = await this.userRepository.find({
      where: { tenantId },
      order: {
        createdAt: 'DESC',
      },
    });

    return users.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    }));
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
}
