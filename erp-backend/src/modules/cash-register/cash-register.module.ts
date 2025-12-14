import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CashRegisterService } from './cash-register.service';
import { CashRegisterController } from './cash-register.controller';
import { CashRegister } from './entities/cash-register.entity';
import { FinancialEntry } from '../financial-entry/entities/financial-entry.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CashRegister, FinancialEntry])],
  controllers: [CashRegisterController],
  providers: [CashRegisterService],
  exports: [CashRegisterService], // Export for use in Sales/POS module
})
export class CashRegisterModule {}
