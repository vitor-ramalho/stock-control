import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserRole } from '../users/entities/user.entity';
import { SalesReportQueryDto } from './dto/sales-report-query.dto';
import { StockReportQueryDto } from './dto/stock-report-query.dto';
import { CashReportQueryDto } from './dto/cash-report-query.dto';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getSalesReport(
    @Query() query: SalesReportQueryDto,
    @TenantId() tenantId: string,
  ) {
    return this.reportsService.getSalesReport(query, tenantId);
  }

  @Get('stock-movements')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getStockMovementsReport(
    @Query() query: StockReportQueryDto,
    @TenantId() tenantId: string,
  ) {
    return this.reportsService.getStockMovementsReport(query, tenantId);
  }

  @Get('cash')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getCashReport(
    @Query() query: CashReportQueryDto,
    @TenantId() tenantId: string,
  ) {
    return this.reportsService.getCashReportByDate(query.date, tenantId);
  }
}
