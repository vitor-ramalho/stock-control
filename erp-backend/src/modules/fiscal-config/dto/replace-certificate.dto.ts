import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { CertificateType } from '../enums/fiscal.enums';

export class ReplaceCertificateDto {
  @IsEnum(CertificateType)
  certificateType: CertificateType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  holderName: string;

  @IsOptional()
  @IsString()
  @MaxLength(18)
  holderCnpj?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  issuer?: string;

  @IsOptional()
  @IsDateString()
  validFrom?: string;

  @IsOptional()
  @IsDateString()
  validTo?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  secureFileRef: string;

  @IsString()
  @IsNotEmpty()
  passphrase: string;
}
