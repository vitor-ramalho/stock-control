import { IsEnum, IsOptional, IsUUID, Min, IsInt, IsString, MaxLength } from 'class-validator';
import { FiscalDocumentModel, FiscalEnvironment } from '../../fiscal-config/enums/fiscal.enums';

export class RequestFiscalEmissionDto {
  @IsUUID()
  saleId: string;

  @IsUUID()
  establishmentId: string;

  @IsEnum(FiscalDocumentModel)
  documentModel: FiscalDocumentModel;

  @IsEnum(FiscalEnvironment)
  environment: FiscalEnvironment;

  @IsOptional()
  @IsInt()
  @Min(1)
  series?: number;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  schemaVersion?: string;
}
