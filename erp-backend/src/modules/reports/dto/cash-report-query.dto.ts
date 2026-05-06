import { IsDateString, IsOptional } from 'class-validator';

export class CashReportQueryDto {
  @IsOptional()
  @IsDateString()
  date?: string;
}
