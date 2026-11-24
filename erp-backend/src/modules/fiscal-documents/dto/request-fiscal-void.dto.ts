import { IsInt, IsNotEmpty, IsString, MaxLength, Min } from 'class-validator';

export class RequestFiscalVoidDto {
  @IsInt()
  @Min(1)
  startNumber: number;

  @IsInt()
  @Min(1)
  endNumber: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  justification: string;
}
