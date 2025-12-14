import { Command, CommandRunner } from 'nest-commander';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Tenant } from '../modules/tenant/entities/tenant.entity';
import { User, UserRole } from '../modules/users/entities/user.entity';

@Command({
  name: 'seed',
  description: 'Seed the database with initial tenant and admin user',
})
export class SeedCommand extends CommandRunner {
  constructor(private readonly dataSource: DataSource) {
    super();
  }

  async run(): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Check if tenant already exists
      const existingTenant = await queryRunner.manager.findOne(Tenant, {
        where: { slug: 'default' },
      });

      let tenant: Tenant;

      if (existingTenant) {
        console.log('✅ Default tenant already exists');
        tenant = existingTenant;
      } else {
        // Create default tenant
        tenant = queryRunner.manager.create(Tenant, {
          name: 'Default Tenant',
          slug: 'default',
          isActive: true,
        });
        await queryRunner.manager.save(tenant);
        console.log('✅ Created default tenant');
      }

      // Check if admin user already exists
      const existingAdmin = await queryRunner.manager.findOne(User, {
        where: { email: 'admin@example.com', tenantId: tenant.id },
      });

      if (existingAdmin) {
        console.log('✅ Admin user already exists');
      } else {
        // Create admin user
        const hashedPassword = await bcrypt.hash('admin123', 10);
        const adminUser = queryRunner.manager.create(User, {
          email: 'admin@example.com',
          password: hashedPassword,
          name: 'Admin User',
          role: UserRole.ADMIN,
          isActive: true,
          tenantId: tenant.id,
        });
        await queryRunner.manager.save(adminUser);
        console.log('✅ Created admin user');
        console.log('   Email: admin@example.com');
        console.log('   Password: admin123');
      }

      await queryRunner.commitTransaction();
      console.log('\n🎉 Seeding completed successfully!');
      console.log(`\n📋 Tenant ID: ${tenant.id}`);
      console.log('   Use this ID in the X-Tenant-ID header\n');
    } catch (error) {
      await queryRunner.rollbackTransaction();
      console.error('❌ Error seeding database:', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }
}
