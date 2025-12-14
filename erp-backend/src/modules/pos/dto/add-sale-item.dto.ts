import { IsUUID, IsInt, Min } from 'class-validator';

export class AddSaleItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
