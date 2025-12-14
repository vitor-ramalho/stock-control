import { IsEnum } from 'class-validator';
import { PaymentMethod } from '../entities/sale.entity';

export class CloseSaleDto {
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
