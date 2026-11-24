import { IsBoolean, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { FiscalTransmissionMode } from '../services/fiscal-transmission-mode.service';

export class RecoverStuckEmissionsDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  dryRun?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;

  @IsOptional()
  @IsEnum(FiscalTransmissionMode)
  transmissionMode?: FiscalTransmissionMode;
}
