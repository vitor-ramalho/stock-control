import { IsNumber, IsOptional, Min } from 'class-validator';

export class CloseCashRegisterDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  finalBalance?: number;
}
