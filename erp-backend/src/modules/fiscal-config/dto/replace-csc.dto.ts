import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { FiscalEnvironment } from '../enums/fiscal.enums';

export class ReplaceCscDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  cscId: string;

  @IsString()
  @IsNotEmpty()
  cscValue: string;

  @IsEnum(FiscalEnvironment)
  environment: FiscalEnvironment;
}
