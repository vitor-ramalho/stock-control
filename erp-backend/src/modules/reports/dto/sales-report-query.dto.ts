import { IsDateString, IsOptional } from 'class-validator';

export class SalesReportQueryDto {
  @IsOptional()
  @IsDateString()
  start?: string;

  @IsOptional()
  @IsDateString()
  end?: string;
}
