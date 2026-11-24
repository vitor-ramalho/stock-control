import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { join } from 'path';
import { promises as fs } from 'fs';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SignedXml } from 'xml-crypto';
import * as forge from 'node-forge';
import { DigitalCertificate } from '../../fiscal-config/entities/digital-certificate.entity';
import { SecretCipherService } from '../../../common/services/secret-cipher.service';
import { FiscalXmlSigner } from '../ports/fiscal-xml-signer.port';

@Injectable()
export class FiscalXmlSignerService implements FiscalXmlSigner {
  constructor(
    @InjectRepository(DigitalCertificate)
    private readonly certificateRepository: Repository<DigitalCertificate>,
    private readonly secretCipherService: SecretCipherService,
  ) {}

  async sign(xml: string, tenantId: string, establishmentId: string): Promise<string> {
    const cert = await this.certificateRepository.findOne({
      where: {
        tenantId,
        establishmentId,
        isCurrent: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!cert) {
      throw new NotFoundException('No active certificate configured for establishment');
    }

    const passphrase = this.secretCipherService.decrypt(cert.encryptedPassphrase);
    const pfxBuffer = await this.readPfx(cert.secureFileRef);
    const { privateKeyPem, certificatePem } = this.extractPemFromPfx(pfxBuffer, passphrase);

    const signed = new SignedXml({
      privateKey: privateKeyPem,
      publicCert: certificatePem,
      signatureAlgorithm: 'http://www.w3.org/2001/04/xmldsig-more#rsa-sha256',
      canonicalizationAlgorithm: 'http://www.w3.org/2001/10/xml-exc-c14n#',
    });

    signed.addReference({
      xpath: "//*[local-name()='infNFe']",
      digestAlgorithm: 'http://www.w3.org/2001/04/xmlenc#sha256',
      transforms: [
        'http://www.w3.org/2000/09/xmldsig#enveloped-signature',
        'http://www.w3.org/2001/10/xml-exc-c14n#',
      ],
    });

    signed.computeSignature(xml, {
      location: {
        reference: "//*[local-name()='infNFe']",
        action: 'after',
      },
    });

    return signed.getSignedXml();
  }

  async getSigningMaterial(
    tenantId: string,
    establishmentId: string,
  ): Promise<{ pfx: Buffer; passphrase: string }> {
    const cert = await this.certificateRepository.findOne({
      where: {
        tenantId,
        establishmentId,
        isCurrent: true,
      },
      order: {
        createdAt: 'DESC',
      },
    });

    if (!cert) {
      throw new NotFoundException('No active certificate configured for establishment');
    }

    const passphrase = this.secretCipherService.decrypt(cert.encryptedPassphrase);
    const pfx = await this.readPfx(cert.secureFileRef);
    return { pfx, passphrase };
  }

  private async readPfx(storageKey: string): Promise<Buffer> {
    const rootPath = process.env.SECURE_FILES_ROOT || '/var/lib/stock-control/private-files';
    const filePath = join(rootPath, storageKey);
    return fs.readFile(filePath);
  }

  private extractPemFromPfx(
    pfxBuffer: Buffer,
    passphrase: string,
  ): { privateKeyPem: string; certificatePem: string } {
    const p12Der = forge.util.createBuffer(pfxBuffer.toString('binary'));
    const p12Asn1 = forge.asn1.fromDer(p12Der);
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, passphrase);

    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })[
      forge.pki.oids.pkcs8ShroudedKeyBag
    ];
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })[forge.pki.oids.certBag];

    const keyObj = keyBags?.[0]?.key;
    const certObj = certBags?.[0]?.cert;

    if (!keyObj || !certObj) {
      throw new InternalServerErrorException('Unable to extract key/certificate from PFX');
    }

    return {
      privateKeyPem: forge.pki.privateKeyToPem(keyObj),
      certificatePem: forge.pki.certificateToPem(certObj),
    };
  }
}
