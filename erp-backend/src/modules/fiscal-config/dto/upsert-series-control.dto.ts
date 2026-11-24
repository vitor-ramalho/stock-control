import { IsEnum, IsInt, Min } from 'class-validator';
import { FiscalDocumentModel, FiscalEnvironment } from '../enums/fiscal.enums';

export class UpsertSeriesControlDto {
  @IsEnum(FiscalDocumentModel)
  documentModel: FiscalDocumentModel;

  @IsEnum(FiscalEnvironment)
  environment: FiscalEnvironment;

  @IsInt()
  @Min(0)
  series: number;

  @IsInt()
  @Min(1)
  nextNumber: number;
}
