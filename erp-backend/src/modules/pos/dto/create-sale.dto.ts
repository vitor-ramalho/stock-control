import { IsUUID, IsOptional } from 'class-validator';

export class CreateSaleDto {
  @IsUUID()
  cashRegisterId: string;
}
