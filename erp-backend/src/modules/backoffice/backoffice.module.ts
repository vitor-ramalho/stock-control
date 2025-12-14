import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BackofficeController } from './backoffice.controller';
import { BackofficeService } from './backoffice.service';
import { Tenant } from '../tenant/entities/tenant.entity';
import { User } from '../users/entities/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Tenant, User])],
  controllers: [BackofficeController],
  providers: [BackofficeService],
  exports: [BackofficeService],
})
export class BackofficeModule {}
