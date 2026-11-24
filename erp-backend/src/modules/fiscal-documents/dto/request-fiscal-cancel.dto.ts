import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RequestFiscalCancelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  reason: string;
}
