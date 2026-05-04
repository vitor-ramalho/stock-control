import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { EntryType } from '../entities/financial-entry.entity';

export class CreateFinancialEntryDto {
  @IsEnum(EntryType)
  type: EntryType;

  @IsNumber()
  @Min(0)
  value: number;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsUUID()
  saleId?: string;
}
