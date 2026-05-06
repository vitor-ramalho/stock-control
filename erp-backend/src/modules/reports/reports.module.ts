import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Sale } from '../pos/entities/sale.entity';
import { StockMovement } from '../stock/entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';
import { FinancialEntry } from '../financial-entry/entities/financial-entry.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      StockMovement,
      Product,
      CashRegister,
      FinancialEntry,
    ]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
