import { Controller, Get, Post, Body, UseGuards, Query } from '@nestjs/common';
import { CashRegisterService } from './cash-register.service';
import { OpenCashRegisterDto } from './dto/open-cash-register.dto';
import { CloseCashRegisterDto } from './dto/close-cash-register.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

interface AuthUserPayload {
  userId: string;
  role: UserRole;
  tenantId: string;
}

@Controller('cash')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CashRegisterController {
  constructor(private readonly cashRegisterService: CashRegisterService) {}

  /**
   * POST /cash/open
   * Open a new cash register
   * Only ADMIN, MANAGER, and CASHIER can open registers
   */
  @Post('open')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  openRegister(
    @Body() openCashRegisterDto: OpenCashRegisterDto,
    @CurrentUser() user: AuthUserPayload,
    @TenantId() tenantId: string,
  ) {
    return this.cashRegisterService.openRegister(
      openCashRegisterDto,
      user.userId,
      tenantId,
    );
  }

  /**
   * POST /cash/close
   * Close the current open cash register
   * Only ADMIN, MANAGER, and CASHIER can close registers
   */
  @Post('close')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  closeRegister(
    @Body() closeCashRegisterDto: CloseCashRegisterDto,
    @CurrentUser() user: AuthUserPayload,
    @TenantId() tenantId: string,
  ) {
    return this.cashRegisterService.closeRegister(
      closeCashRegisterDto,
      user.userId,
      tenantId,
    );
  }

  /**
   * GET /cash/current
   * Get the current open cash register for the logged-in user
   * All authenticated users can check their current register
   */
  @Get('current')
  getCurrentRegister(
    @CurrentUser() user: AuthUserPayload,
    @TenantId() tenantId: string,
  ) {
    return this.cashRegisterService.getCurrentRegister(user.userId, tenantId);
  }

  /**
   * GET /cash/report/daily
   * Get daily report for a specific date
   * Only ADMIN and MANAGER can view reports
   */
  @Get('report/daily')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getDailyReport(@Query('date') date: string, @TenantId() tenantId: string) {
    const reportDate = date ? new Date(date) : new Date();
    return this.cashRegisterService.getDailyReport(reportDate, tenantId);
  }

  /**
   * GET /cash/overview
   * Get overview of all open cash registers
   * Only ADMIN and MANAGER can view overview
   */
  @Get('overview')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getOverview(@TenantId() tenantId: string) {
    return this.cashRegisterService.getAdminOverview(tenantId);
  }
}
