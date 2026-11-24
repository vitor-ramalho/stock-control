import { IsEnum, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import {
  FiscalDocumentModel,
  FiscalEnvironment,
} from '../enums/fiscal.enums';

export class ListReadinessDto {
  @IsOptional()
  @Type(() => String)
  @IsEnum(FiscalDocumentModel)
  documentModel?: FiscalDocumentModel;

  @IsOptional()
  @Type(() => String)
  @IsEnum(FiscalEnvironment)
  environment?: FiscalEnvironment;
}
