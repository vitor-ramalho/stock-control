import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SecretCipherService } from '../../common/services/secret-cipher.service';
import { LocalSecretCipherService } from '../../common/services/local-secret-cipher.service';
import { SecureFileStorageService } from '../../common/services/secure-file-storage.service';
import { LocalPrivateFileStorageService } from '../../common/services/local-private-file-storage.service';
import { FiscalConfigController } from './fiscal-config.controller';
import { FiscalBackofficeController } from './fiscal-backoffice.controller';
import { FiscalConfigService } from './fiscal-config.service';
import { Establishment } from './entities/establishment.entity';
import { EstablishmentFiscalProfile } from './entities/establishment-fiscal-profile.entity';
import { FiscalSeriesControl } from './entities/fiscal-series-control.entity';
import { DigitalCertificate } from './entities/digital-certificate.entity';
import { NfceCscConfig } from './entities/nfce-csc-config.entity';
import { FiscalReadinessReview } from './entities/fiscal-readiness-review.entity';
import { FiscalAttachment } from './entities/fiscal-attachment.entity';
import { FiscalAuditLog } from './entities/fiscal-audit-log.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Establishment,
      EstablishmentFiscalProfile,
      FiscalSeriesControl,
      DigitalCertificate,
      NfceCscConfig,
      FiscalReadinessReview,
      FiscalAttachment,
      FiscalAuditLog,
    ]),
  ],
  controllers: [FiscalConfigController, FiscalBackofficeController],
  providers: [
    FiscalConfigService,
    {
      provide: SecretCipherService,
      useClass: LocalSecretCipherService,
    },
    {
      provide: SecureFileStorageService,
      useClass: LocalPrivateFileStorageService,
    },
  ],
  exports: [FiscalConfigService],
})
export class FiscalConfigModule {}
