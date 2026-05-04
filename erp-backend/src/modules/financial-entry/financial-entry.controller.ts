import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Query,
  Param,
} from '@nestjs/common';
import { FinancialEntryService } from './financial-entry.service';
import { CreateFinancialEntryDto } from './dto/create-financial-entry.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';
import { EntryType } from './entities/financial-entry.entity';

interface AuthUserPayload {
  userId: string;
  role: UserRole;
  tenantId: string;
}

@Controller('finance')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FinancialEntryController {
  constructor(private readonly financialEntryService: FinancialEntryService) {}

  /**
   * POST /finance/entry
   * Create a manual financial entry
   * Only ADMIN, MANAGER, and CASHIER can create entries
   */
  @Post('entry')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  create(
    @Body() createFinancialEntryDto: CreateFinancialEntryDto,
    @CurrentUser() user: AuthUserPayload,
    @TenantId() tenantId: string,
  ) {
    return this.financialEntryService.createEntry(
      createFinancialEntryDto,
      user.userId,
      tenantId,
    );
  }

  /**
   * GET /finance/entries
   * Get all financial entries for the tenant
   * Only ADMIN and MANAGER can view all entries
   */
  @Get('entries')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  findAll(
    @TenantId() tenantId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    const limitNum = Math.min(500, Math.max(1, limit ? +limit : 100));
    const offsetNum = Math.max(0, offset ? +offset : 0);

    return this.financialEntryService.findAll(tenantId, limitNum, offsetNum);
  }

  /**
   * GET /finance/entries/register/:id
   * Get all entries for a specific cash register
   * ADMIN and MANAGER can view any register
   * CASHIER can only view their own register
   */
  @Get('entries/register/:id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  getEntriesByRegister(
    @Param('id') cashRegisterId: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: AuthUserPayload,
  ) {
    return this.financialEntryService.getEntriesByRegister(
      cashRegisterId,
      tenantId,
      user.userId,
      user.role,
    );
  }

  /**
   * GET /finance/entries/type/:type
   * Get entries by type (in or out)
   * Only ADMIN and MANAGER can view filtered entries
   */
  @Get('entries/type/:type')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getEntriesByType(
    @Param('type') type: EntryType,
    @TenantId() tenantId: string,
    @Query('limit') limit?: number,
  ) {
    const limitNum = Math.min(500, Math.max(1, limit ? +limit : 100));

    return this.financialEntryService.getEntriesByType(
      type,
      tenantId,
      limitNum,
    );
  }

  /**
   * GET /finance/entries/category/:category
   * Get entries by category
   * Only ADMIN and MANAGER can view filtered entries
   */
  @Get('entries/category/:category')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  getEntriesByCategory(
    @Param('category') category: string,
    @TenantId() tenantId: string,
    @Query('limit') limit?: number,
  ) {
    const limitNum = Math.min(500, Math.max(1, limit ? +limit : 100));

    return this.financialEntryService.getEntriesByCategory(
      category,
      tenantId,
      limitNum,
    );
  }
}
