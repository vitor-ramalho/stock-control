import { FiscalOperationType } from '../fiscal-documents.enums';

export interface FiscalAuthorizationRequest {
  tenantId: string;
  fiscalDocumentId: string;
  operation: FiscalOperationType;
}

export interface FiscalAuthorizationResponse {
  success: boolean;
  statusCode?: string;
  reason?: string;
  protocol?: string;
  rawResponse?: string;
}

export abstract class FiscalAuthorizationPort {
  abstract execute(
    request: FiscalAuthorizationRequest,
  ): Promise<FiscalAuthorizationResponse>;
}
