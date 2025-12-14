import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FinancialEntryService } from './financial-entry.service';
import { FinancialEntryController } from './financial-entry.controller';
import { FinancialEntry } from './entities/financial-entry.entity';
import { CashRegister } from '../cash-register/entities/cash-register.entity';

@Module({
  imports: [TypeOrmModule.forFeature([FinancialEntry, CashRegister])],
  controllers: [FinancialEntryController],
  providers: [FinancialEntryService],
  exports: [FinancialEntryService], // Export for use in Sales/POS module
})
export class FinancialEntryModule {}
