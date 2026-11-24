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
import { FiscalDocumentsModule } from '../fiscal-documents/fiscal-documents.module';
import { Establishment } from '../fiscal-config/entities/establishment.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Sale, SaleItem, Product, CashRegister, Customer, Establishment]),
    StockModule, // Import to use StockService
    FinancialEntryModule, // Import to use FinancialEntryService
    FiscalDocumentsModule,
  ],
  controllers: [PosController, SalesController],
  providers: [PosService],
  exports: [PosService],
})
export class PosModule {}
