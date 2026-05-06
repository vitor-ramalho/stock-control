import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PosService } from './pos.service';
import { PosController } from './pos.controller';
import { SalesController } from './sales.controller';
import { Sale } from './entities/sale.entity';
import { SaleItem } from './entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { Customer } from '../customers/entities/customer.entity';
import { StockModule } from '../stock/stock.module';
import { FinancialEntryModule } from '../financial-entry/financial-entry.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, Product, CashRegister, Customer]),
    StockModule, // Import to use StockService
    FinancialEntryModule, // Import to use FinancialEntryService
  ],
  controllers: [PosController, SalesController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}
