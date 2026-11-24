import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecretCipherService } from '../../common/services/secret-cipher.service';
import { SecureFileStorageService } from '../../common/services/secure-file-storage.service';
import { FiscalConfigService } from './fiscal-config.service';
import { Establishment } from './entities/establishment.entity';
import { EstablishmentFiscalProfile } from './entities/establishment-fiscal-profile.entity';
import { FiscalSeriesControl } from './entities/fiscal-series-control.entity';
import { DigitalCertificate } from './entities/digital-certificate.entity';
import { NfceCscConfig } from './entities/nfce-csc-config.entity';
import { FiscalReadinessReview } from './entities/fiscal-readiness-review.entity';
import { FiscalAttachment } from './entities/fiscal-attachment.entity';
import { FiscalAuditLog } from './entities/fiscal-audit-log.entity';
import { CertificateType, FiscalAttachmentType } from './enums/fiscal.enums';

describe('FiscalConfigService', () => {
  let service: FiscalConfigService;
  let establishmentRepository: jest.Mocked<Repository<Establishment>>;
  let certificateRepository: jest.Mocked<Repository<DigitalCertificate>>;
  let attachmentRepository: jest.Mocked<Repository<FiscalAttachment>>;
  let secureFileStorageService: jest.Mocked<SecureFileStorageService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FiscalConfigService,
        {
          provide: getRepositoryToken(Establishment),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(EstablishmentFiscalProfile),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FiscalSeriesControl),
          useValue: {
            findOne: jest.fn(),
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(DigitalCertificate),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(NfceCscConfig),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FiscalReadinessReview),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FiscalAttachment),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(FiscalAuditLog),
          useValue: {
            find: jest.fn(),
            create: jest.fn(),
            save: jest.fn(),
          },
        },
        {
          provide: SecretCipherService,
          useValue: {
            encrypt: jest.fn().mockReturnValue('encrypted-value'),
            decrypt: jest.fn(),
          },
        },
        {
          provide: SecureFileStorageService,
          useValue: {
            save: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FiscalConfigService>(FiscalConfigService);
    establishmentRepository = module.get(getRepositoryToken(Establishment));
    certificateRepository = module.get(getRepositoryToken(DigitalCertificate));
    attachmentRepository = module.get(getRepositoryToken(FiscalAttachment));
    secureFileStorageService = module.get(SecureFileStorageService);

    establishmentRepository.findOne.mockResolvedValue({
      id: 'est-1',
      tenantId: 'tenant-1',
      cnpj: '11444777000161',
      legalName: 'Empresa Teste',
    } as Establishment);
  });

  it('rejects certificate replacement when holder cnpj does not match establishment cnpj', async () => {
    await expect(
      service.replaceCertificate(
        'tenant-1',
        'est-1',
        {
          certificateType: CertificateType.A1,
          holderName: 'Empresa Divergente',
          holderCnpj: '12345678000195',
          passphrase: '123456',
          secureFileRef: 'tenant-1/est-1/certificate/file.pfx',
        },
        { userId: 'user-1', role: 'admin' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects attachment creation when storage key is outside establishment scope', async () => {
    await expect(
      service.createAttachment(
        'tenant-1',
        'est-1',
        {
          attachmentType: FiscalAttachmentType.OTHER,
          originalFileName: 'doc.pdf',
          storageKey: 'tenant-2/est-2/attachment/doc.pdf',
          mimeType: 'application/pdf',
        },
        { userId: 'user-1', role: 'admin' },
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('stores uploaded secure files in tenant and establishment scoped path', async () => {
    secureFileStorageService.save.mockResolvedValue({
      storageKey: 'tenant-1/est-1/certificate/mock-file.pfx',
      mimeType: 'application/x-pkcs12',
      size: 10,
    });

    const contentBase64 = Buffer.from('content').toString('base64');

    const result = await service.uploadSecureFile('tenant-1', 'est-1', {
      originalFileName: 'certificado.pfx',
      mimeType: 'application/x-pkcs12',
      category: 'CERTIFICATE',
      contentBase64,
    });

    expect(result.storageKey).toContain('tenant-1/est-1/certificate/');
    expect(secureFileStorageService.save).toHaveBeenCalled();
  });
});
