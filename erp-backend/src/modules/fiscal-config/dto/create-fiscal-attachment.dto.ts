import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { FiscalAttachmentType } from '../enums/fiscal.enums';

export class CreateFiscalAttachmentDto {
  @IsEnum(FiscalAttachmentType)
  attachmentType: FiscalAttachmentType;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalFileName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  storageKey: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  mimeType?: string;

  @IsOptional()
  @IsString()
  description?: string;
}
