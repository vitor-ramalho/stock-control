export abstract class FiscalXmlSigner {
  abstract sign(xml: string, tenantId: string, establishmentId: string): Promise<string>;
}
