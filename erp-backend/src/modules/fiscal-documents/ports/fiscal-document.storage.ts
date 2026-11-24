export interface FiscalStoredDocument {
  storageKey: string;
}

export abstract class FiscalDocumentStorage {
  abstract saveXml(
    tenantId: string,
    documentId: string,
    fileName: string,
    content: string,
  ): Promise<FiscalStoredDocument>;
}
