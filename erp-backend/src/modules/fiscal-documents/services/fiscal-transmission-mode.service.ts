import { Injectable } from '@nestjs/common';

export enum FiscalTransmissionMode {
  SEFAZ = 'SEFAZ',
  MOCK = 'MOCK',
}

@Injectable()
export class FiscalTransmissionModeService {
  private mode: FiscalTransmissionMode;

  constructor() {
    const envMode = String(process.env.FISCAL_TRANSMISSION_MODE || '').toUpperCase();

    if (process.env.NODE_ENV === 'test') {
      this.mode = FiscalTransmissionMode.MOCK;
      return;
    }

    this.mode =
      envMode === FiscalTransmissionMode.MOCK
        ? FiscalTransmissionMode.MOCK
        : FiscalTransmissionMode.SEFAZ;
  }

  getMode(): FiscalTransmissionMode {
    return this.mode;
  }

  setMode(mode: FiscalTransmissionMode): FiscalTransmissionMode {
    this.mode = mode;
    return this.mode;
  }

  shouldUseMock(): boolean {
    return this.mode === FiscalTransmissionMode.MOCK;
  }
}
