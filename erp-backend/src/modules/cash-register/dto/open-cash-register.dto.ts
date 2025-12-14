import { IsNumber, IsOptional, Min } from 'class-validator';

export class OpenCashRegisterDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  initialBalance?: number;
}
