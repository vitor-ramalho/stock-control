import {
  Controller,
  Get,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { PosService } from './pos.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserRole } from '../users/entities/user.entity';

/**
 * Sales Controller - Alias for POS endpoints
 * Frontend uses /sales routes, so we provide them here
 */
@Controller('sales')
@UseGuards(JwtAuthGuard, RolesGuard)
export class SalesController {
  constructor(private readonly posService: PosService) {}

  /**
   * GET /sales
   * Get all sales for tenant with pagination
   * Only ADMIN and MANAGER can view all sales
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findAll(
    @TenantId() tenantId: string,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ) {
    const pageNum = page ? +page : 1;
    const limitNum = limit ? +limit : 20;
    const offset = (pageNum - 1) * limitNum;

    return this.posService.findAll(tenantId, limitNum, offset);
  }

  /**
   * GET /sales/stats
   * Get sales statistics
   * Only ADMIN and MANAGER can view stats
   */
  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getStats(
    @TenantId() tenantId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.posService.getStats(tenantId, startDate, endDate);
  }

  /**
   * GET /sales/:id
   * Get sale details with all items
   * All authenticated users can view sales
   */
  @Get(':id')
  findOne(@Param('id') saleId: string, @TenantId() tenantId: string) {
    return this.posService.findOne(saleId, tenantId);
  }
}
