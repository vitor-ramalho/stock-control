import {
  IsBoolean,
  IsEnum,
  Matches,
  IsOptional,
  IsString,
  Length,
  MaxLength,
} from 'class-validator';
import {
  FiscalDocumentModel,
  FiscalEnvironment,
  IcmsTaxpayerIndicator,
  TaxRegimeCode,
} from '../enums/fiscal.enums';

export class UpsertFiscalProfileDto {
  @IsEnum(FiscalDocumentModel)
  documentModel: FiscalDocumentModel;

  @IsEnum(FiscalEnvironment)
  environment: FiscalEnvironment;

  @IsOptional()
  @IsEnum(IcmsTaxpayerIndicator)
  icmsTaxpayerIndicator?: IcmsTaxpayerIndicator;

  @IsOptional()
  @IsEnum(TaxRegimeCode)
  taxRegime?: TaxRegimeCode;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  stateRegistration?: string;

  @IsOptional()
  @IsString()
  @Length(2, 2)
  @Matches(/^[A-Z]{2}$/, {
    message: 'stateCode must be the UF acronym (e.g., MG)',
  })
  stateCode?: string;

  @IsOptional()
  @IsString()
  @Length(7, 7)
  @Matches(/^\d{7}$/, {
    message: 'cityIbgeCode must be the 7-digit municipality IBGE code',
  })
  cityIbgeCode?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;

  @IsOptional()
  @IsBoolean()
  accreditationReported?: boolean;

  @IsOptional()
  @IsBoolean()
  accreditationVerified?: boolean;
}
