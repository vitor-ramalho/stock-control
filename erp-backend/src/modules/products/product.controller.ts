import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { ProductService } from './product.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('products')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(
    @Body() createProductDto: CreateProductDto,
    @TenantId() tenantId: string,
  ) {
    return this.productService.create(createProductDto, tenantId);
  }

  @Get()
  findAll(@TenantId() tenantId: string) {
    return this.productService.findAll(tenantId);
  }

  @Get('search')
  search(@Query('q') query: string, @TenantId() tenantId: string) {
    return this.productService.search(query, tenantId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productService.findOne(id, tenantId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id') id: string,
    @Body() updateProductDto: UpdateProductDto,
    @TenantId() tenantId: string,
  ) {
    return this.productService.update(id, updateProductDto, tenantId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @TenantId() tenantId: string) {
    return this.productService.remove(id, tenantId);
  }
}
