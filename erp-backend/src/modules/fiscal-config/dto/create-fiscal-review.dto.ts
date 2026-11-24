import { IsEnum, IsOptional, IsString } from 'class-validator';
import {
  FiscalDocumentModel,
  FiscalEnvironment,
  InternalFiscalStatus,
} from '../enums/fiscal.enums';

export class CreateFiscalReviewDto {
  @IsEnum(FiscalDocumentModel)
  documentModel: FiscalDocumentModel;

  @IsEnum(FiscalEnvironment)
  environment: FiscalEnvironment;

  @IsEnum(InternalFiscalStatus)
  status: InternalFiscalStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}
