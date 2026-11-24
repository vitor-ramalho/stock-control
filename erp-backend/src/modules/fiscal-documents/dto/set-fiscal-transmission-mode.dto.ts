import { IsEnum } from 'class-validator';
import { FiscalTransmissionMode } from '../services/fiscal-transmission-mode.service';

export class SetFiscalTransmissionModeDto {
  @IsEnum(FiscalTransmissionMode)
  mode: FiscalTransmissionMode;
}
