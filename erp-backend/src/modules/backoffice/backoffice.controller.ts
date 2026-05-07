import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BackofficeService } from './backoffice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';
import { CreateTenantUserDto } from './dto/create-tenant-user.dto';
import { UpdateTenantUserDto } from './dto/update-tenant-user.dto';

@Controller('backoffice')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class BackofficeController {
  constructor(private readonly backofficeService: BackofficeService) {}

  @Get('tenants')
  findAllTenants() {
    return this.backofficeService.findAllTenants();
  }

  @Get('tenants/:id')
  findOneTenant(@Param('id') id: string) {
    return this.backofficeService.findOneTenant(id);
  }

  @Get('tenants/:id/users')
  findTenantUsers(@Param('id') id: string) {
    return this.backofficeService.findTenantUsers(id);
  }

  @Post('tenants/:id/users')
  createTenantUser(
    @Param('id') id: string,
    @Body() createTenantUserDto: CreateTenantUserDto,
  ) {
    return this.backofficeService.createTenantUser(id, createTenantUserDto);
  }

  @Patch('tenants/:tenantId/users/:userId')
  updateTenantUser(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() updateTenantUserDto: UpdateTenantUserDto,
  ) {
    return this.backofficeService.updateTenantUser(
      tenantId,
      userId,
      updateTenantUserDto,
    );
  }

  @Patch('tenants/:tenantId/users/:userId/status')
  updateTenantUserStatus(
    @Param('tenantId') tenantId: string,
    @Param('userId') userId: string,
    @Body() updateDto: { isActive: boolean },
  ) {
    return this.backofficeService.updateTenantUserStatus(
      tenantId,
      userId,
      updateDto.isActive,
    );
  }

  @Patch('tenants/:id/status')
  updateTenantStatus(
    @Param('id') id: string,
    @Body() updateDto: { isActive: boolean },
  ) {
    return this.backofficeService.updateTenantStatus(id, updateDto.isActive);
  }
}
