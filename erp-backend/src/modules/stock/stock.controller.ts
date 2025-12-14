import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { CreateStockInDto } from './dto/create-stock-in.dto';
import { CreateStockOutDto } from './dto/create-stock-out.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('stock')
@UseGuards(JwtAuthGuard, RolesGuard)
export class StockController {
  constructor(private readonly stockService: StockService) {}

  /**
   * POST /stock/in
   * Manual stock input
   * Only ADMIN and MANAGER can perform stock input
   */
  @Post('in')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  stockIn(@Body() createStockInDto: CreateStockInDto, @TenantId() tenantId: string) {
    return this.stockService.stockIn(createStockInDto, tenantId);
  }

  /**
   * POST /stock/out
   * Manual stock output
   * Only ADMIN and MANAGER can perform manual stock output
   */
  @Post('out')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  stockOut(@Body() createStockOutDto: CreateStockOutDto, @TenantId() tenantId: string) {
    return this.stockService.stockOut(createStockOutDto, tenantId);
  }

  /**
   * GET /stock/product/:id
   * Get all stock movements for a specific product
   * All authenticated users can view stock movements
   */
  @Get('product/:id')
  getProductMovements(@Param('id') productId: string, @TenantId() tenantId: string) {
    return this.stockService.getProductMovements(productId, tenantId);
  }

  /**
   * GET /stock
   * Get all stock movements for the tenant
   * With pagination support
   */
  @Get()
  findAll(
    @TenantId() tenantId: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ) {
    return this.stockService.findAll(
      tenantId,
      limit ? +limit : 100,
      offset ? +offset : 0,
    );
  }
}
