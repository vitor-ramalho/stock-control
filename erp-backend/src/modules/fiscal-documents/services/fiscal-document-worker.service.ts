import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { FiscalDocument } from '../entities/fiscal-document.entity';
import { FiscalDocumentItem } from '../entities/fiscal-document-item.entity';
import { FiscalProcessingQueue } from '../entities/fiscal-processing-queue.entity';
import { FiscalTransmissionAttempt } from '../entities/fiscal-transmission-attempt.entity';
import { FiscalStateHistory } from '../entities/fiscal-state-history.entity';
import { Establishment } from '../../fiscal-config/entities/establishment.entity';
import { EstablishmentFiscalProfile } from '../../fiscal-config/entities/establishment-fiscal-profile.entity';
import {
  FiscalDocumentState,
  FiscalOperationType,
  FiscalProcessingStatus,
} from '../fiscal-documents.enums';
import { FiscalXmlBuilderService } from './fiscal-xml-builder.service';
import { FiscalXmlSignerService } from './fiscal-xml-signer.service';
import { FiscalSefazAdapterService } from './fiscal-sefaz-adapter.service';
import { FiscalXmlValidatorService } from './fiscal-xml-validator.service';

@Injectable()
export class FiscalDocumentWorkerService
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(FiscalDocumentWorkerService.name);
  private running = false;
  private workerInterval?: NodeJS.Timeout;

  constructor(
    @InjectRepository(FiscalProcessingQueue)
    private readonly queueRepository: Repository<FiscalProcessingQueue>,
    @InjectRepository(FiscalDocument)
    private readonly documentRepository: Repository<FiscalDocument>,
    @InjectRepository(FiscalDocumentItem)
    private readonly itemRepository: Repository<FiscalDocumentItem>,
    @InjectRepository(FiscalTransmissionAttempt)
    private readonly attemptRepository: Repository<FiscalTransmissionAttempt>,
    @InjectRepository(FiscalStateHistory)
    private readonly historyRepository: Repository<FiscalStateHistory>,
    @InjectRepository(Establishment)
    private readonly establishmentRepository: Repository<Establishment>,
    @InjectRepository(EstablishmentFiscalProfile)
    private readonly profileRepository: Repository<EstablishmentFiscalProfile>,
    private readonly xmlBuilder: FiscalXmlBuilderService,
    private readonly xmlValidator: FiscalXmlValidatorService,
    private readonly xmlSigner: FiscalXmlSignerService,
    private readonly sefazAdapter: FiscalSefazAdapterService,
  ) {}

  onModuleInit() {
    const enabled = process.env.FISCAL_WORKER_ENABLED !== 'false';
    if (process.env.NODE_ENV === 'test') {
      this.logger.warn('Fiscal worker disabled in test environment');
      return;
    }

    if (!enabled) {
      this.logger.warn('Fiscal worker disabled by FISCAL_WORKER_ENABLED=false');
      return;
    }

    const intervalMs = Number(process.env.FISCAL_WORKER_INTERVAL_MS || 5000);
    this.workerInterval = setInterval(() => {
      this.processBatch().catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Unknown worker error';
        this.logger.error(`Worker batch failed: ${message}`);
      });
    }, intervalMs);

    this.logger.log(`Fiscal worker started with interval ${intervalMs}ms`);
  }

  onModuleDestroy() {
    if (this.workerInterval) {
      clearInterval(this.workerInterval);
      this.workerInterval = undefined;
      this.logger.log('Fiscal worker stopped');
    }
  }

  async processBatch(): Promise<void> {
    if (this.running) {
      return;
    }

    this.running = true;
    try {
      const now = new Date();
      const pending = await this.queueRepository.find({
        where: {
          status: In([
            FiscalProcessingStatus.PENDING,
            FiscalProcessingStatus.FAILED,
          ]),
          nextAttemptAt: LessThanOrEqual(now),
        },
        order: {
          createdAt: 'ASC',
        },
        take: Number(process.env.FISCAL_WORKER_BATCH_SIZE || 10),
      });

      for (const item of pending) {
        await this.processItem(item);
      }
    } finally {
      this.running = false;
    }
  }

  private async processItem(item: FiscalProcessingQueue): Promise<void> {
    item.status = FiscalProcessingStatus.PROCESSING;
    item.lockedAt = new Date();
    item.lockToken = `${Date.now()}-${Math.random()}`;
    await this.queueRepository.save(item);

    try {
      switch (item.operation) {
        case FiscalOperationType.EMIT:
          await this.processEmit(item);
          break;
        case FiscalOperationType.CANCEL:
          await this.processCancel(item);
          break;
        case FiscalOperationType.VOID:
          await this.processVoid(item);
          break;
        case FiscalOperationType.QUERY:
          await this.processQuery(item);
          break;
        default:
          throw new Error(`Unsupported operation: ${String(item.operation)}`);
      }

      item.status = FiscalProcessingStatus.PROCESSED;
      item.processedAt = new Date();
      item.lastError = null;
      await this.queueRepository.save(item);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown processing error';
      if (item.operation === FiscalOperationType.EMIT) {
        await this.markEmitFailureState(item, message);
      }
      item.attempts += 1;
      item.lastError = message;
      const retryable = this.isRetryableError(message);
      item.status = retryable
        ? FiscalProcessingStatus.FAILED
        : FiscalProcessingStatus.REQUIRES_MANUAL_ACTION;
      item.nextAttemptAt = this.computeBackoff(item.attempts);
      await this.queueRepository.save(item);
    }
  }

  private async processEmit(item: FiscalProcessingQueue): Promise<void> {
    const fiscalDocumentId = String(item.payload.fiscalDocumentId);
    const tenantId = item.tenantId;

    const doc = await this.documentRepository.findOne({
      where: { id: fiscalDocumentId, tenantId },
    });

    if (!doc) {
      throw new Error('Fiscal document not found for outbox item');
    }

    if (
      ![
        FiscalDocumentState.QUEUED,
        FiscalDocumentState.TRANSMITTING,
        FiscalDocumentState.UNKNOWN_RESULT,
        FiscalDocumentState.TECHNICAL_FAILURE,
      ].includes(doc.state)
    ) {
      throw new Error(`Document state ${doc.state} is not valid for EMIT`);
    }

    const items = await this.itemRepository.find({
      where: { tenantId, fiscalDocumentId: doc.id },
      order: { lineNumber: 'ASC' },
    });

    const establishment = await this.establishmentRepository.findOne({
      where: {
        id: doc.establishmentId,
        tenantId,
      },
    });

    if (!establishment) {
      throw new Error('Establishment not found for fiscal document');
    }

    const profile = await this.profileRepository.findOne({
      where: {
        tenantId,
        establishmentId: doc.establishmentId,
        documentModel: doc.documentModel,
        environment: doc.environment,
      },
    });

    if (doc.state !== FiscalDocumentState.TRANSMITTING) {
      const previousState = doc.state;
      doc.state = FiscalDocumentState.TRANSMITTING;
      await this.documentRepository.save(doc);
      await this.historyRepository.save(
        this.historyRepository.create({
          tenantId,
          fiscalDocumentId: doc.id,
          fromState: previousState,
          toState: FiscalDocumentState.TRANSMITTING,
          reason: 'Worker started transmission',
        }),
      );
    }

    const generatedXml = this.xmlBuilder.buildEmissionXml(
      doc,
      items,
      establishment,
      profile,
    );
    await this.xmlValidator.validate(generatedXml);
    const signedXml = await this.xmlSigner.sign(
      generatedXml,
      tenantId,
      doc.establishmentId,
    );
    const signingMaterial = await this.xmlSigner.getSigningMaterial(
      tenantId,
      doc.establishmentId,
    );
    const response = await this.sefazAdapter.authorize(
      doc,
      signedXml,
      signingMaterial.pfx,
      signingMaterial.passphrase,
    );

    await this.attemptRepository.save(
      this.attemptRepository.create({
        tenantId,
        fiscalDocumentId: doc.id,
        operation: FiscalOperationType.EMIT,
        endpoint: null,
        transportStatus: response.success ? 'OK' : 'ERROR',
        fiscalStatusCode: response.statusCode || null,
        fiscalReason: response.reason || null,
        rawResponse: response.rawResponse || null,
      }),
    );

    doc.generatedXml = generatedXml;
    doc.signedXml = signedXml;
    doc.responseAt = new Date();

    if (response.success) {
      const fromState = doc.state;
      doc.state = FiscalDocumentState.AUTHORIZED;
      doc.protocolNumber = response.protocol || doc.protocolNumber;
      doc.authorizedAt = new Date();
      doc.accessKey = doc.accessKey || this.extractAccessKeyFromXml(signedXml);
      doc.authorizedXml = this.buildAuthorizedXml(doc, signedXml, response);
      await this.historyRepository.save(
        this.historyRepository.create({
          tenantId,
          fiscalDocumentId: doc.id,
          fromState,
          toState: FiscalDocumentState.AUTHORIZED,
          reason: 'SEFAZ authorization success',
          metadata: {
            statusCode: response.statusCode,
            reason: response.reason,
          },
        }),
      );
    } else if (response.statusCode?.startsWith('2')) {
      const fromState = doc.state;
      doc.state = FiscalDocumentState.REJECTED;
      doc.rejectionCode = response.statusCode || null;
      doc.rejectionReason = response.reason || null;
      await this.historyRepository.save(
        this.historyRepository.create({
          tenantId,
          fiscalDocumentId: doc.id,
          fromState,
          toState: FiscalDocumentState.REJECTED,
          reason: 'SEFAZ rejected document',
          metadata: {
            statusCode: response.statusCode,
            reason: response.reason,
          },
        }),
      );
    } else {
      const fromState = doc.state;
      doc.state = FiscalDocumentState.UNKNOWN_RESULT;
      doc.rejectionCode = response.statusCode || null;
      doc.rejectionReason = response.reason || null;
      await this.historyRepository.save(
        this.historyRepository.create({
          tenantId,
          fiscalDocumentId: doc.id,
          fromState,
          toState: FiscalDocumentState.UNKNOWN_RESULT,
          reason: 'SEFAZ returned unknown result',
          metadata: {
            statusCode: response.statusCode,
            reason: response.reason,
          },
        }),
      );
    }

    doc.transmittedAt = new Date();
    await this.documentRepository.save(doc);
  }

  private async processCancel(item: FiscalProcessingQueue): Promise<void> {
    const fiscalDocumentId = String(item.payload.fiscalDocumentId);
    const tenantId = item.tenantId;
    const reason =
      typeof item.payload.reason === 'string'
        ? item.payload.reason
        : 'Cancelamento solicitado';

    const doc = await this.documentRepository.findOne({
      where: { id: fiscalDocumentId, tenantId },
    });

    if (!doc) {
      throw new Error('Fiscal document not found for cancel item');
    }

    const establishment = await this.establishmentRepository.findOne({
      where: {
        id: doc.establishmentId,
        tenantId,
      },
    });

    if (!establishment) {
      throw new Error('Establishment not found for fiscal document');
    }

    const xml = this.xmlBuilder.buildCancelXml(doc, reason, establishment);
    const signedXml = await this.xmlSigner.sign(
      xml,
      tenantId,
      doc.establishmentId,
    );
    const signingMaterial = await this.xmlSigner.getSigningMaterial(
      tenantId,
      doc.establishmentId,
    );
    const response = await this.sefazAdapter.cancel(
      doc,
      signedXml,
      signingMaterial.pfx,
      signingMaterial.passphrase,
    );

    await this.attemptRepository.save(
      this.attemptRepository.create({
        tenantId,
        fiscalDocumentId: doc.id,
        operation: FiscalOperationType.CANCEL,
        endpoint: null,
        transportStatus: response.success ? 'OK' : 'ERROR',
        fiscalStatusCode: response.statusCode || null,
        fiscalReason: response.reason || null,
        rawResponse: response.rawResponse || null,
      }),
    );

    if (response.success) {
      const fromState = doc.state;
      doc.state = FiscalDocumentState.CANCELED;
      await this.documentRepository.save(doc);
      await this.historyRepository.save(
        this.historyRepository.create({
          tenantId,
          fiscalDocumentId: doc.id,
          fromState,
          toState: FiscalDocumentState.CANCELED,
          reason: 'SEFAZ cancellation success',
        }),
      );
      return;
    }

    const fromState = doc.state;
    doc.state = FiscalDocumentState.TECHNICAL_FAILURE;
    await this.documentRepository.save(doc);
    await this.historyRepository.save(
      this.historyRepository.create({
        tenantId,
        fiscalDocumentId: doc.id,
        fromState,
        toState: FiscalDocumentState.TECHNICAL_FAILURE,
        reason: 'SEFAZ cancellation failed',
        metadata: {
          statusCode: response.statusCode,
          reason: response.reason,
        },
      }),
    );
    throw new Error(response.reason || 'SEFAZ cancel failed');
  }

  private async processVoid(item: FiscalProcessingQueue): Promise<void> {
    const fiscalDocumentId = String(item.payload.fiscalDocumentId);
    const tenantId = item.tenantId;
    const justification =
      typeof item.payload.justification === 'string'
        ? item.payload.justification
        : 'Inutilizacao solicitada';

    const doc = await this.documentRepository.findOne({
      where: { id: fiscalDocumentId, tenantId },
    });

    if (!doc) {
      throw new Error('Fiscal document not found for void item');
    }

    const establishment = await this.establishmentRepository.findOne({
      where: {
        id: doc.establishmentId,
        tenantId,
      },
    });

    if (!establishment) {
      throw new Error('Establishment not found for fiscal document');
    }

    const xml = this.xmlBuilder.buildVoidXml(doc, justification, establishment);
    const signedXml = await this.xmlSigner.sign(
      xml,
      tenantId,
      doc.establishmentId,
    );
    const signingMaterial = await this.xmlSigner.getSigningMaterial(
      tenantId,
      doc.establishmentId,
    );
    const response = await this.sefazAdapter.voidNumber(
      doc,
      signedXml,
      signingMaterial.pfx,
      signingMaterial.passphrase,
    );

    await this.attemptRepository.save(
      this.attemptRepository.create({
        tenantId,
        fiscalDocumentId: doc.id,
        operation: FiscalOperationType.VOID,
        endpoint: null,
        transportStatus: response.success ? 'OK' : 'ERROR',
        fiscalStatusCode: response.statusCode || null,
        fiscalReason: response.reason || null,
        rawResponse: response.rawResponse || null,
      }),
    );

    if (response.success) {
      const fromState = doc.state;
      doc.state = FiscalDocumentState.VOIDED;
      await this.documentRepository.save(doc);
      await this.historyRepository.save(
        this.historyRepository.create({
          tenantId,
          fiscalDocumentId: doc.id,
          fromState,
          toState: FiscalDocumentState.VOIDED,
          reason: 'SEFAZ number void success',
        }),
      );
      return;
    }

    const fromState = doc.state;
    doc.state = FiscalDocumentState.TECHNICAL_FAILURE;
    await this.documentRepository.save(doc);
    await this.historyRepository.save(
      this.historyRepository.create({
        tenantId,
        fiscalDocumentId: doc.id,
        fromState,
        toState: FiscalDocumentState.TECHNICAL_FAILURE,
        reason: 'SEFAZ number void failed',
        metadata: {
          statusCode: response.statusCode,
          reason: response.reason,
        },
      }),
    );
    throw new Error(response.reason || 'SEFAZ void failed');
  }

  private async processQuery(item: FiscalProcessingQueue): Promise<void> {
    const fiscalDocumentId = String(item.payload.fiscalDocumentId);
    const tenantId = item.tenantId;

    const doc = await this.documentRepository.findOne({
      where: { id: fiscalDocumentId, tenantId },
    });

    if (!doc) {
      throw new Error('Fiscal document not found for query item');
    }

    if (!doc.accessKey) {
      throw new Error('Fiscal document access key is missing for query');
    }

    const queryXml = this.xmlBuilder.buildQueryXml(doc);
    const signingMaterial = await this.xmlSigner.getSigningMaterial(
      tenantId,
      doc.establishmentId,
    );
    const response = await this.sefazAdapter.queryProtocol(
      doc,
      queryXml,
      signingMaterial.pfx,
      signingMaterial.passphrase,
    );

    await this.attemptRepository.save(
      this.attemptRepository.create({
        tenantId,
        fiscalDocumentId: doc.id,
        operation: FiscalOperationType.QUERY,
        endpoint: null,
        transportStatus: response.success ? 'OK' : 'ERROR',
        fiscalStatusCode: response.statusCode || null,
        fiscalReason: response.reason || null,
        rawResponse: response.rawResponse || null,
      }),
    );

    const fromState = doc.state;
    if (response.success) {
      doc.state = FiscalDocumentState.AUTHORIZED;
      doc.protocolNumber = response.protocol || doc.protocolNumber;
      doc.authorizedAt = doc.authorizedAt || new Date();
    } else if (response.statusCode?.startsWith('2')) {
      doc.state = FiscalDocumentState.REJECTED;
      doc.rejectionCode = response.statusCode || null;
      doc.rejectionReason = response.reason || null;
    }

    await this.documentRepository.save(doc);
    await this.historyRepository.save(
      this.historyRepository.create({
        tenantId,
        fiscalDocumentId: doc.id,
        fromState,
        toState: doc.state,
        reason: 'SEFAZ protocol query reconciliation',
        metadata: {
          statusCode: response.statusCode,
          reason: response.reason,
        },
      }),
    );
  }

  private isRetryableError(message: string): boolean {
    const nonRetryTerms = ['rejeicao', 'invalid', 'rejected', 'nao permitida'];
    const normalized = message.toLowerCase();
    return !nonRetryTerms.some((term) => normalized.includes(term));
  }

  private async markEmitFailureState(
    item: FiscalProcessingQueue,
    errorMessage: string,
  ): Promise<void> {
    const fiscalDocumentId = String(item.payload.fiscalDocumentId);
    const doc = await this.documentRepository.findOne({
      where: {
        id: fiscalDocumentId,
        tenantId: item.tenantId,
      },
    });

    if (!doc) {
      return;
    }

    if (doc.state === FiscalDocumentState.TECHNICAL_FAILURE) {
      return;
    }

    const fromState = doc.state;
    doc.state = FiscalDocumentState.TECHNICAL_FAILURE;
    doc.rejectionReason = errorMessage.slice(0, 400);
    await this.documentRepository.save(doc);

    await this.historyRepository.save(
      this.historyRepository.create({
        tenantId: item.tenantId,
        fiscalDocumentId: doc.id,
        fromState,
        toState: FiscalDocumentState.TECHNICAL_FAILURE,
        reason: 'Emission failed before fiscal authorization response',
        metadata: {
          errorMessage,
        },
      }),
    );
  }

  private computeBackoff(attempts: number): Date {
    const seconds = Math.min(300, Math.max(5, 2 ** attempts));
    return new Date(Date.now() + seconds * 1000);
  }

  private buildAuthorizedXml(
    doc: FiscalDocument,
    signedXml: string,
    response: { protocol?: string; statusCode?: string; reason?: string },
  ): string {
    if (/<nfeProc[\s>]/i.test(signedXml)) {
      return signedXml;
    }

    const nfeXml = this.extractNfeXml(signedXml);
    if (!nfeXml) {
      return signedXml;
    }

    const accessKey =
      doc.accessKey || this.extractAccessKeyFromXml(nfeXml) || '';
    const protocol = response.protocol || doc.protocolNumber || '';
    const statusCode = response.statusCode || '100';
    const reason = response.reason || 'Autorizado o uso da NF-e';
    const tpAmb = doc.environment === 'HOMOLOGATION' ? '2' : '1';
    const dhRecbto = (doc.authorizedAt || new Date()).toISOString();

    return `<?xml version="1.0" encoding="UTF-8"?>
<nfeProc versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  ${nfeXml}
  <protNFe versao="4.00">
    <infProt>
      <tpAmb>${tpAmb}</tpAmb>
      <verAplic>stock-control-erp</verAplic>
      <chNFe>${this.escapeXml(accessKey)}</chNFe>
      <dhRecbto>${dhRecbto}</dhRecbto>
      <nProt>${this.escapeXml(protocol)}</nProt>
      <cStat>${this.escapeXml(statusCode)}</cStat>
      <xMotivo>${this.escapeXml(reason)}</xMotivo>
    </infProt>
  </protNFe>
</nfeProc>`;
  }

  private extractNfeXml(xml: string): string | null {
    const match = xml.match(/<NFe[\s\S]*<\/NFe>/i);
    if (!match) {
      return null;
    }

    return match[0].replace(/^\s*<\?xml[\s\S]*?\?>\s*/i, '').trim();
  }

  private extractAccessKeyFromXml(xml: string): string | null {
    const match = xml.match(/<infNFe[^>]*\sId=['"]NFe([^'"]+)['"]/i);
    return match?.[1] ?? null;
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}
