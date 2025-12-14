import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { PosService } from './pos.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { AddSaleItemDto } from './dto/add-sale-item.dto';
import { CloseSaleDto } from './dto/close-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('pos')
@UseGuards(JwtAuthGuard, RolesGuard)
export class PosController {
  constructor(private readonly posService: PosService) {}

  /**
   * POST /pos/sale
   * Create a new sale
   * Only ADMIN, MANAGER, and CASHIER can create sales
   */
  @Post('sale')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  createSale(
    @Body() createSaleDto: CreateSaleDto,
    @TenantId() tenantId: string,
  ) {
    return this.posService.createSale(createSaleDto, tenantId);
  }

  /**
   * POST /pos/sale/:id/items
   * Add item to sale
   * Only ADMIN, MANAGER, and CASHIER can add items
   */
  @Post('sale/:id/items')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  addItem(
    @Param('id') saleId: string,
    @Body() addSaleItemDto: AddSaleItemDto,
    @TenantId() tenantId: string,
  ) {
    return this.posService.addItem(saleId, addSaleItemDto, tenantId);
  }

  /**
   * POST /pos/sale/:id/close
   * Close sale and create financial entry
   * Only ADMIN, MANAGER, and CASHIER can close sales
   */
  @Post('sale/:id/close')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  closeSale(
    @Param('id') saleId: string,
    @Body() closeSaleDto: CloseSaleDto,
    @TenantId() tenantId: string,
  ) {
    return this.posService.closeSale(saleId, closeSaleDto, tenantId);
  }

  /**
   * GET /pos/sale/:id
   * Get sale details with all items
   * All authenticated users can view sales
   */
  @Get('sale/:id')
  findOne(@Param('id') saleId: string, @TenantId() tenantId: string) {
    return this.posService.findOne(saleId, tenantId);
  }

  /**
   * POST /pos/checkout
   * Simplified checkout - Creates sale with items and closes it in one operation
   * Requires an open cash register
   */
  @Post('checkout')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.CASHIER)
  checkout(
    @Body() checkoutDto: any,
    @Request() req: any,
    @TenantId() tenantId: string,
  ) {
    return this.posService.checkout(checkoutDto, req.user.userId, tenantId);
  }

  /**
   * GET /pos/sales
   * Get all sales for tenant with pagination
   * Only ADMIN and MANAGER can view all sales
   */
  @Get('sales')
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
   * GET /pos/stats
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
}
