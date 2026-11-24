import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class UploadSecureFileDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  originalFileName: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  mimeType: string;

  @IsString()
  @IsNotEmpty()
  contentBase64: string;

  @IsString()
  @IsIn(['CERTIFICATE', 'ATTACHMENT'])
  category: 'CERTIFICATE' | 'ATTACHMENT';
}
