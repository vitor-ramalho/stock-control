import { Controller, Get, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { BackofficeService } from './backoffice.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserRole } from '../users/entities/user.entity';

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

  @Patch('tenants/:id/status')
  updateTenantStatus(
    @Param('id') id: string,
    @Body() updateDto: { isActive: boolean },
  ) {
    return this.backofficeService.updateTenantStatus(id, updateDto.isActive);
  }
}
