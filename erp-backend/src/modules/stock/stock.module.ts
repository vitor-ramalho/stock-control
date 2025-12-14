import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StockService } from './stock.service';
import { StockController } from './stock.controller';
import { StockMovement } from './entities/stock-movement.entity';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [TypeOrmModule.forFeature([StockMovement, Product])],
  controllers: [StockController],
  providers: [StockService],
  exports: [StockService], // Export for use in Sales/POS module
})
export class StockModule {}
