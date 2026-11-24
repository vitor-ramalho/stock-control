import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Sale } from '../pos/entities/sale.entity';
import { SaleItem } from '../pos/entities/sale-item.entity';
import { Establishment } from '../fiscal-config/entities/establishment.entity';
import { FiscalSeriesControl } from '../fiscal-config/entities/fiscal-series-control.entity';
import { FiscalDocument } from './entities/fiscal-document.entity';
import { FiscalDocumentItem } from './entities/fiscal-document-item.entity';
import { FiscalStateHistory } from './entities/fiscal-state-history.entity';
import { FiscalEvent } from './entities/fiscal-event.entity';
import { FiscalTransmissionAttempt } from './entities/fiscal-transmission-attempt.entity';
import { FiscalProcessingQueue } from './entities/fiscal-processing-queue.entity';
import { FiscalIdempotencyKey } from './entities/fiscal-idempotency-key.entity';
import { FiscalSchemaVersion } from './entities/fiscal-schema-version.entity';
import { FiscalDocumentsService } from './fiscal-documents.service';
import { FiscalDocumentsController } from './fiscal-documents.controller';
import { FiscalXmlBuilderService } from './services/fiscal-xml-builder.service';
import { FiscalXmlSignerService } from './services/fiscal-xml-signer.service';
import { FiscalSefazAdapterService } from './services/fiscal-sefaz-adapter.service';
import { FiscalDocumentWorkerService } from './services/fiscal-document-worker.service';
import { FiscalXmlValidatorService } from './services/fiscal-xml-validator.service';
import { FiscalTransmissionModeService } from './services/fiscal-transmission-mode.service';
import { DigitalCertificate } from '../fiscal-config/entities/digital-certificate.entity';
import { EstablishmentFiscalProfile } from '../fiscal-config/entities/establishment-fiscal-profile.entity';
import { SecretCipherService } from '../../common/services/secret-cipher.service';
import { LocalSecretCipherService } from '../../common/services/local-secret-cipher.service';
import { Product } from '../products/entities/product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Sale,
      SaleItem,
      Establishment,
      FiscalSeriesControl,
      FiscalDocument,
      FiscalDocumentItem,
      FiscalStateHistory,
      FiscalEvent,
      FiscalTransmissionAttempt,
      FiscalProcessingQueue,
      FiscalIdempotencyKey,
      FiscalSchemaVersion,
      DigitalCertificate,
      EstablishmentFiscalProfile,
      Product,
    ]),
  ],
  controllers: [FiscalDocumentsController],
  providers: [
    FiscalDocumentsService,
    FiscalXmlBuilderService,
    FiscalXmlValidatorService,
    FiscalXmlSignerService,
    FiscalSefazAdapterService,
    FiscalTransmissionModeService,
    FiscalDocumentWorkerService,
    {
      provide: SecretCipherService,
      useClass: LocalSecretCipherService,
    },
  ],
  exports: [FiscalDocumentsService, FiscalTransmissionModeService],
})
export class FiscalDocumentsModule {}
