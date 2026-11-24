export interface FiscalCertificateMaterial {
  secureFileRef: string;
  encryptedPassphrase: string;
}

export abstract class FiscalCertificateProvider {
  abstract getCurrentCertificate(
    tenantId: string,
    establishmentId: string,
  ): Promise<FiscalCertificateMaterial>;
}
