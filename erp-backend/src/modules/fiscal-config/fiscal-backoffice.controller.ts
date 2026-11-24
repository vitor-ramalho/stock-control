import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { FiscalConfigService } from './fiscal-config.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('backoffice/fiscal/tenants/:tenantId')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPERADMIN)
export class FiscalBackofficeController {
  constructor(private readonly fiscalConfigService: FiscalConfigService) {}

  @Get('establishments')
  listEstablishments(@Param('tenantId') tenantId: string) {
    return this.fiscalConfigService.listEstablishments(tenantId);
  }

  @Get('establishments/:establishmentId/readiness')
  getReadiness(
    @Param('tenantId') tenantId: string,
    @Param('establishmentId') establishmentId: string,
  ) {
    return this.fiscalConfigService.getReadiness(tenantId, establishmentId);
  }

  @Get('establishments/:establishmentId/audit')
  listAudit(
    @Param('tenantId') tenantId: string,
    @Param('establishmentId') establishmentId: string,
  ) {
    return this.fiscalConfigService.listAudit(tenantId, establishmentId);
  }
}
