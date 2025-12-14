import { IsUUID, IsInt, Min, IsOptional, IsString } from 'class-validator';

export class CreateStockOutDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsOptional()
  @IsString()
  origin?: string;
}
