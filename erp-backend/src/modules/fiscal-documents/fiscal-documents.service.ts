import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { Sale, SaleStatus } from '../pos/entities/sale.entity';
import { SaleItem } from '../pos/entities/sale-item.entity';
import { Product } from '../products/entities/product.entity';
import { Establishment } from '../fiscal-config/entities/establishment.entity';
import { FiscalSeriesControl } from '../fiscal-config/entities/fiscal-series-control.entity';
import { FiscalDocument } from './entities/fiscal-document.entity';
import { FiscalDocumentItem } from './entities/fiscal-document-item.entity';
import { FiscalStateHistory } from './entities/fiscal-state-history.entity';
import { FiscalEvent } from './entities/fiscal-event.entity';
import { FiscalProcessingQueue } from './entities/fiscal-processing-queue.entity';
import { FiscalIdempotencyKey } from './entities/fiscal-idempotency-key.entity';
import { FiscalTransmissionAttempt } from './entities/fiscal-transmission-attempt.entity';
import {
  FiscalDocumentState,
  FiscalEventType,
  FiscalOperationType,
  FiscalProcessingStatus,
} from './fiscal-documents.enums';
import { RequestFiscalEmissionDto } from './dto/request-fiscal-emission.dto';
import { RequestFiscalCancelDto } from './dto/request-fiscal-cancel.dto';
import { RequestFiscalVoidDto } from './dto/request-fiscal-void.dto';
import { RecoverStuckEmissionsDto } from './dto/recover-stuck-emissions.dto';
import {
  FiscalTransmissionMode,
  FiscalTransmissionModeService,
} from './services/fiscal-transmission-mode.service';

@Injectable()
export class FiscalDocumentsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Sale)
    private readonly saleRepository: Repository<Sale>,
    @InjectRepository(SaleItem)
    private readonly saleItemRepository: Repository<SaleItem>,
    @InjectRepository(Establishment)
    private readonly establishmentRepository: Repository<Establishment>,
    @InjectRepository(FiscalSeriesControl)
    private readonly seriesRepository: Repository<FiscalSeriesControl>,
    @InjectRepository(FiscalDocument)
    private readonly fiscalDocumentRepository: Repository<FiscalDocument>,
    @InjectRepository(FiscalIdempotencyKey)
    private readonly idempotencyRepository: Repository<FiscalIdempotencyKey>,
    @InjectRepository(FiscalEvent)
    private readonly eventRepository: Repository<FiscalEvent>,
    @InjectRepository(FiscalStateHistory)
    private readonly stateHistoryRepository: Repository<FiscalStateHistory>,
    @InjectRepository(FiscalTransmissionAttempt)
    private readonly attemptRepository: Repository<FiscalTransmissionAttempt>,
    private readonly transmissionModeService: FiscalTransmissionModeService,
  ) {}

  getTransmissionMode(): { mode: FiscalTransmissionMode } {
    return { mode: this.transmissionModeService.getMode() };
  }

  setTransmissionMode(mode: FiscalTransmissionMode): { mode: FiscalTransmissionMode } {
    return { mode: this.transmissionModeService.setMode(mode) };
  }

  async recoverStuckEmissions(
    tenantId: string,
    userId: string,
    dto: RecoverStuckEmissionsDto,
  ): Promise<{
    dryRun: boolean;
    mode: FiscalTransmissionMode;
    documentsFound: number;
    documentsRecovered: number;
    queueItemsReset: number;
    documentIds: string[];
  }> {
    if (dto.transmissionMode) {
      this.transmissionModeService.setMode(dto.transmissionMode);
    }

    const dryRun = dto.dryRun ?? false;
    const limit = dto.limit ?? 100;

    const stuckDocuments = await this.fiscalDocumentRepository.find({
      where: {
        tenantId,
        state: FiscalDocumentState.TRANSMITTING,
      },
      order: {
        updatedAt: 'ASC',
      },
      take: limit,
    });

    if (dryRun || stuckDocuments.length === 0) {
      return {
        dryRun,
        mode: this.transmissionModeService.getMode(),
        documentsFound: stuckDocuments.length,
        documentsRecovered: 0,
        queueItemsReset: 0,
        documentIds: stuckDocuments.map((doc) => doc.id),
      };
    }

    const docIds = stuckDocuments.map((doc) => doc.id);

    const queueItems = await this.dataSource.getRepository(FiscalProcessingQueue).find({
      where: {
        tenantId,
        operation: FiscalOperationType.EMIT,
        aggregateId: In(docIds),
      },
    });

    return this.dataSource.transaction(async (manager) => {
      let queueItemsReset = 0;
      let documentsRecovered = 0;

      for (const document of stuckDocuments) {
        const previousState = document.state;

        document.state = FiscalDocumentState.TECHNICAL_FAILURE;
        document.rejectionReason =
          document.rejectionReason ||
          'Recovered from stuck TRANSMITTING state for reprocessing';
        await manager.save(document);

        await manager.save(
          manager.create(FiscalStateHistory, {
            tenantId,
            fiscalDocumentId: document.id,
            fromState: previousState,
            toState: FiscalDocumentState.TECHNICAL_FAILURE,
            reason: 'Manual recovery of stuck TRANSMITTING document',
            createdByUserId: userId,
          }),
        );

        documentsRecovered += 1;
      }

      for (const queueItem of queueItems) {
        queueItem.status = FiscalProcessingStatus.PENDING;
        queueItem.attempts = 0;
        queueItem.nextAttemptAt = new Date();
        queueItem.processedAt = null;
        queueItem.lastError = null;
        queueItem.lockedAt = null;
        queueItem.lockToken = null;
        await manager.save(queueItem);
        queueItemsReset += 1;
      }

      return {
        dryRun,
        mode: this.transmissionModeService.getMode(),
        documentsFound: stuckDocuments.length,
        documentsRecovered,
        queueItemsReset,
        documentIds: docIds,
      };
    });
  }

  async requestEmissionFromSale(
    tenantId: string,
    userId: string,
    dto: RequestFiscalEmissionDto,
    idempotencyKey?: string,
  ): Promise<FiscalDocument> {
    if (idempotencyKey) {
      const existingKey = await this.idempotencyRepository.findOne({
        where: {
          tenantId,
          establishmentId: dto.establishmentId,
          operation: FiscalOperationType.EMIT,
          key: idempotencyKey,
        },
      });

      if (existingKey?.fiscalDocumentId) {
        return this.getById(tenantId, existingKey.fiscalDocumentId);
      }
    }

    return this.dataSource.transaction(async (manager) => {
      const establishment = await manager.findOne(Establishment, {
        where: { id: dto.establishmentId, tenantId, isActive: true },
      });

      if (!establishment) {
        throw new NotFoundException('Establishment not found for tenant');
      }

      const sale = await manager.findOne(Sale, {
        where: { id: dto.saleId, tenantId },
      });

      if (!sale) {
        throw new NotFoundException('Sale not found for tenant');
      }

      if (sale.status !== SaleStatus.CLOSED) {
        throw new BadRequestException('Only closed sales can request fiscal emission');
      }

      const seriesValue = dto.series ?? 1;

      let seriesControl = await manager
        .createQueryBuilder(FiscalSeriesControl, 'series')
        .setLock('pessimistic_write')
        .where('series.tenantId = :tenantId', { tenantId })
        .andWhere('series.establishmentId = :establishmentId', {
          establishmentId: dto.establishmentId,
        })
        .andWhere('series.documentModel = :documentModel', {
          documentModel: dto.documentModel,
        })
        .andWhere('series.environment = :environment', {
          environment: dto.environment,
        })
        .andWhere('series.series = :seriesValue', { seriesValue })
        .getOne();

      if (!seriesControl) {
        seriesControl = manager.create(FiscalSeriesControl, {
          tenantId,
          establishmentId: dto.establishmentId,
          documentModel: dto.documentModel,
          environment: dto.environment,
          series: seriesValue,
          nextNumber: '1',
          isActive: true,
        });
      }

      const reservedNumber = Number(seriesControl.nextNumber);
      if (reservedNumber <= 0) {
        throw new BadRequestException('Invalid fiscal series next number state');
      }

      seriesControl.nextNumber = String(Number(seriesControl.nextNumber) + 1);
      await manager.save(seriesControl);

      const fiscalDocument = manager.create(FiscalDocument, {
        tenantId,
        establishmentId: dto.establishmentId,
        saleId: sale.id,
        documentModel: dto.documentModel,
        environment: dto.environment,
        series: seriesValue,
        number: String(reservedNumber),
        state: FiscalDocumentState.QUEUED,
        schemaVersion: dto.schemaVersion || '4.00',
        totalsSnapshot: {
          subtotal: sale.subtotal,
          discount: sale.discount,
          tax: sale.tax,
          total: sale.total,
        },
        queuedAt: new Date(),
        createdByUserId: userId,
      });

      const savedDocument = await manager.save(fiscalDocument);

      const saleItems = await manager.find(SaleItem, {
        where: { tenantId, saleId: sale.id },
      });

      const productIds = saleItems.map((item) => item.productId).filter(Boolean);
      const products = productIds.length
        ? await manager.find(Product, {
            where: {
              tenantId,
              id: In(productIds),
            },
          })
        : [];
      const productMap = new Map(products.map((product) => [product.id, product]));
      const subtotalValue = Number(sale.subtotal || 0) || 0;
      const saleTaxValue = Number(sale.tax || 0) || 0;

      for (const [index, item] of saleItems.entries()) {
        const product = productMap.get(item.productId);
        const itemGross = Number(item.subtotal || 0);
        const proportionalTax =
          subtotalValue > 0 ? Number(((itemGross / subtotalValue) * saleTaxValue).toFixed(2)) : 0;
        await manager.save(
          manager.create(FiscalDocumentItem, {
            tenantId,
            fiscalDocumentId: savedDocument.id,
            saleItemId: item.id,
            productId: item.productId,
            lineNumber: index + 1,
            description: product?.name || `Product ${item.productId}`,
            ncm: '99999999',
            cfop: '5102',
            cest: null,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            grossTotal: item.subtotal,
            discountTotal: 0,
            taxSnapshot: {
              icmsOrigin: '0',
              icmsCst: '102',
              icmsRate: 0,
              icmsValue: 0,
              pisCst: '99',
              pisRate: 0,
              pisValue: 0,
              cofinsCst: '99',
              cofinsRate: 0,
              cofinsValue: 0,
              estimatedTax: proportionalTax,
            },
          }),
        );
      }

      await manager.save(
        manager.create(FiscalStateHistory, {
          tenantId,
          fiscalDocumentId: savedDocument.id,
          fromState: null,
          toState: FiscalDocumentState.QUEUED,
          reason: 'Emission requested from sale checkout',
          createdByUserId: userId,
        }),
      );

      await manager.save(
        manager.create(FiscalEvent, {
          tenantId,
          fiscalDocumentId: savedDocument.id,
          eventType: FiscalEventType.EMISSION_REQUESTED,
          payload: {
            saleId: sale.id,
            establishmentId: dto.establishmentId,
          },
          status: FiscalProcessingStatus.PENDING,
        }),
      );

      await manager.save(
        manager.create(FiscalProcessingQueue, {
          tenantId,
          aggregateType: 'fiscal_document',
          aggregateId: savedDocument.id,
          operation: FiscalOperationType.EMIT,
          payload: {
            fiscalDocumentId: savedDocument.id,
            tenantId,
          },
          nextAttemptAt: new Date(),
          status: FiscalProcessingStatus.PENDING,
        }),
      );

      if (idempotencyKey) {
        await manager.save(
          manager.create(FiscalIdempotencyKey, {
            tenantId,
            establishmentId: dto.establishmentId,
            operation: FiscalOperationType.EMIT,
            key: idempotencyKey,
            fiscalDocumentId: savedDocument.id,
          }),
        );
      }

      return savedDocument;
    });
  }

  async requestCancel(
    tenantId: string,
    userId: string,
    documentId: string,
    dto: RequestFiscalCancelDto,
  ): Promise<FiscalDocument> {
    const doc = await this.getById(tenantId, documentId);

    if (doc.state !== FiscalDocumentState.AUTHORIZED) {
      throw new BadRequestException('Only authorized documents can be canceled');
    }

    return this.dataSource.transaction(async (manager) => {
      const previousState = doc.state;
      doc.state = FiscalDocumentState.CANCEL_REQUESTED;
      const saved = await manager.save(doc);

      await manager.save(
        manager.create(FiscalStateHistory, {
          tenantId,
          fiscalDocumentId: saved.id,
          fromState: previousState,
          toState: FiscalDocumentState.CANCEL_REQUESTED,
          reason: dto.reason,
          createdByUserId: userId,
        }),
      );

      await manager.save(
        manager.create(FiscalEvent, {
          tenantId,
          fiscalDocumentId: saved.id,
          eventType: FiscalEventType.CANCEL_REQUESTED,
          payload: {
            reason: dto.reason,
          },
          status: FiscalProcessingStatus.PENDING,
        }),
      );

      await manager.save(
        manager.create(FiscalProcessingQueue, {
          tenantId,
          aggregateType: 'fiscal_document',
          aggregateId: saved.id,
          operation: FiscalOperationType.CANCEL,
          payload: {
            fiscalDocumentId: saved.id,
            tenantId,
            reason: dto.reason,
          },
          nextAttemptAt: new Date(),
          status: FiscalProcessingStatus.PENDING,
        }),
      );

      return saved;
    });
  }

  async requestVoidNumber(
    tenantId: string,
    userId: string,
    documentId: string,
    dto: RequestFiscalVoidDto,
  ): Promise<FiscalDocument> {
    const doc = await this.getById(tenantId, documentId);

    if (
      ![
        FiscalDocumentState.REJECTED,
        FiscalDocumentState.TECHNICAL_FAILURE,
        FiscalDocumentState.UNKNOWN_RESULT,
      ].includes(doc.state)
    ) {
      throw new BadRequestException(
        'Number voiding can only be requested for rejected or failed document flows',
      );
    }

    if (dto.endNumber < dto.startNumber) {
      throw new BadRequestException('endNumber must be greater than or equal to startNumber');
    }

    return this.dataSource.transaction(async (manager) => {
      const previousState = doc.state;
      doc.state = FiscalDocumentState.VOID_REQUESTED;
      const saved = await manager.save(doc);

      await manager.save(
        manager.create(FiscalStateHistory, {
          tenantId,
          fiscalDocumentId: saved.id,
          fromState: previousState,
          toState: FiscalDocumentState.VOID_REQUESTED,
          reason: dto.justification,
          createdByUserId: userId,
          metadata: {
            startNumber: dto.startNumber,
            endNumber: dto.endNumber,
          },
        }),
      );

      await manager.save(
        manager.create(FiscalEvent, {
          tenantId,
          fiscalDocumentId: saved.id,
          eventType: FiscalEventType.VOID_REQUESTED,
          payload: {
            startNumber: dto.startNumber,
            endNumber: dto.endNumber,
            justification: dto.justification,
          },
          status: FiscalProcessingStatus.PENDING,
        }),
      );

      await manager.save(
        manager.create(FiscalProcessingQueue, {
          tenantId,
          aggregateType: 'fiscal_document',
          aggregateId: saved.id,
          operation: FiscalOperationType.VOID,
          payload: {
            fiscalDocumentId: saved.id,
            tenantId,
            startNumber: dto.startNumber,
            endNumber: dto.endNumber,
            justification: dto.justification,
          },
          nextAttemptAt: new Date(),
          status: FiscalProcessingStatus.PENDING,
        }),
      );

      return saved;
    });
  }

  async requestStatusReconciliation(
    tenantId: string,
    userId: string,
    documentId: string,
  ): Promise<FiscalDocument> {
    const doc = await this.getById(tenantId, documentId);

    if (!doc.accessKey) {
      throw new BadRequestException('Document has no access key for protocol query');
    }

    return this.dataSource.transaction(async (manager) => {
      await manager.save(
        manager.create(FiscalEvent, {
          tenantId,
          fiscalDocumentId: doc.id,
          eventType: FiscalEventType.TRANSMISSION_RESULT,
          payload: {
            action: 'STATUS_RECONCILIATION_REQUESTED',
            requestedByUserId: userId,
          },
          status: FiscalProcessingStatus.PENDING,
        }),
      );

      await manager.save(
        manager.create(FiscalProcessingQueue, {
          tenantId,
          aggregateType: 'fiscal_document',
          aggregateId: doc.id,
          operation: FiscalOperationType.QUERY,
          payload: {
            fiscalDocumentId: doc.id,
            tenantId,
          },
          nextAttemptAt: new Date(),
          status: FiscalProcessingStatus.PENDING,
        }),
      );

      if (doc.state === FiscalDocumentState.UNKNOWN_RESULT) {
        const previousState = doc.state;
        doc.state = FiscalDocumentState.TRANSMITTING;
        await manager.save(doc);
        await manager.save(
          manager.create(FiscalStateHistory, {
            tenantId,
            fiscalDocumentId: doc.id,
            fromState: previousState,
            toState: FiscalDocumentState.TRANSMITTING,
            reason: 'Status reconciliation requested',
            createdByUserId: userId,
          }),
        );
      }

      return doc;
    });
  }

  async getAuthorizedXml(tenantId: string, documentId: string): Promise<{ xml: string }> {
    const doc = await this.getById(tenantId, documentId);

    const authorizedXml = this.normalizeAuthorizedXml(doc);
    if (!authorizedXml) {
      throw new BadRequestException('Authorized XML is not available for this document');
    }

    if (doc.authorizedXml !== authorizedXml) {
      doc.authorizedXml = authorizedXml;
      await this.fiscalDocumentRepository.save(doc);
    }

    return { xml: authorizedXml };
  }

  async getAuthorizedXmlDownload(
    tenantId: string,
    documentId: string,
  ): Promise<{ xml: string; fileName: string }> {
    const doc = await this.getById(tenantId, documentId);

    const authorizedXml = this.normalizeAuthorizedXml(doc);
    if (!authorizedXml) {
      throw new BadRequestException('Authorized XML is not available for this document');
    }

    if (doc.authorizedXml !== authorizedXml) {
      doc.authorizedXml = authorizedXml;
      await this.fiscalDocumentRepository.save(doc);
    }

    return {
      xml: authorizedXml,
      fileName: `nfe-${doc.number}.xml`,
    };
  }

  async getDanfeHtml(tenantId: string, documentId: string): Promise<{ html: string }> {
    const doc = await this.getById(tenantId, documentId);
    const establishment = await this.establishmentRepository.findOne({
      where: { id: doc.establishmentId, tenantId },
    });

    if (!establishment) {
      throw new NotFoundException('Establishment not found for DANFE rendering');
    }

    const items = await this.dataSource.getRepository(FiscalDocumentItem).find({
      where: { tenantId, fiscalDocumentId: doc.id },
      order: { lineNumber: 'ASC' },
    });

    const itemLines = items
      .map(
        (item) => `
        <tr>
          <td>${item.lineNumber}</td>
          <td>${item.description}</td>
          <td>${Number(item.quantity).toFixed(2)}</td>
          <td>R$ ${Number(item.unitPrice).toFixed(2)}</td>
          <td>R$ ${Number(item.grossTotal).toFixed(2)}</td>
        </tr>`,
      )
      .join('');

    const html = `<!doctype html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>DANFE ${doc.number}</title>
    <style>
      body { font-family: Arial, sans-serif; margin: 24px; color: #1f2937; }
      .title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
      .subtitle { color: #4b5563; margin-bottom: 16px; }
      .card { border: 1px solid #d1d5db; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #d1d5db; padding: 6px; font-size: 12px; }
      th { background: #f3f4f6; text-align: left; }
    </style>
  </head>
  <body>
    <div class="title">DANFE Simplificado</div>
    <div class="subtitle">Documento Auxiliar da Nota Fiscal Eletrônica</div>
    <div class="card">
      <div><strong>Emitente:</strong> ${establishment.legalName}</div>
      <div><strong>CNPJ:</strong> ${establishment.cnpj}</div>
      <div><strong>Modelo:</strong> ${doc.documentModel}</div>
      <div><strong>Série/Número:</strong> ${doc.series}/${doc.number}</div>
      <div><strong>Status:</strong> ${doc.state}</div>
      <div><strong>Chave:</strong> ${doc.accessKey || '-'}</div>
      <div><strong>Protocolo:</strong> ${doc.protocolNumber || '-'}</div>
    </div>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Descrição</th>
          <th>Qtd</th>
          <th>Unitário</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>${itemLines}</tbody>
    </table>
    <div class="card" style="margin-top: 12px;">
      <div><strong>Subtotal:</strong> R$ ${Number(doc.totalsSnapshot?.subtotal || 0).toFixed(2)}</div>
      <div><strong>Desconto:</strong> R$ ${Number(doc.totalsSnapshot?.discount || 0).toFixed(2)}</div>
      <div><strong>Tributos:</strong> R$ ${Number(doc.totalsSnapshot?.tax || 0).toFixed(2)}</div>
      <div><strong>Total NF:</strong> R$ ${Number(doc.totalsSnapshot?.total || 0).toFixed(2)}</div>
    </div>
  </body>
</html>`;

    return { html };
  }

  async getById(tenantId: string, documentId: string): Promise<FiscalDocument> {
    const document = await this.fiscalDocumentRepository.findOne({
      where: { id: documentId, tenantId },
    });

    if (!document) {
      throw new NotFoundException('Fiscal document not found');
    }

    return document;
  }

  async getBySaleId(tenantId: string, saleId: string): Promise<FiscalDocument | null> {
    return this.fiscalDocumentRepository.findOne({
      where: {
        tenantId,
        saleId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async listEvents(tenantId: string, documentId: string): Promise<FiscalEvent[]> {
    await this.getById(tenantId, documentId);
    return this.eventRepository.find({
      where: {
        tenantId,
        fiscalDocumentId: documentId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async listAttempts(
    tenantId: string,
    documentId: string,
  ): Promise<FiscalTransmissionAttempt[]> {
    await this.getById(tenantId, documentId);
    return this.attemptRepository.find({
      where: {
        tenantId,
        fiscalDocumentId: documentId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async listStateHistory(tenantId: string, documentId: string): Promise<FiscalStateHistory[]> {
    await this.getById(tenantId, documentId);
    return this.stateHistoryRepository.find({
      where: {
        tenantId,
        fiscalDocumentId: documentId,
      },
      order: {
        createdAt: 'ASC',
      },
    });
  }

  async listPendingQueue(tenantId: string): Promise<FiscalProcessingQueue[]> {
    return this.dataSource.getRepository(FiscalProcessingQueue).find({
      where: {
        tenantId,
        status: In([
          FiscalProcessingStatus.PENDING,
          FiscalProcessingStatus.PROCESSING,
          FiscalProcessingStatus.FAILED,
          FiscalProcessingStatus.REQUIRES_MANUAL_ACTION,
        ]),
      },
      order: {
        createdAt: 'ASC',
      },
      take: 100,
    });
  }

  async listDocuments(tenantId: string, limit = 20): Promise<FiscalDocument[]> {
    const safeLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(200, Math.floor(limit)))
      : 20;

    return this.fiscalDocumentRepository.find({
      where: {
        tenantId,
      },
      order: {
        createdAt: 'DESC',
      },
      take: safeLimit,
    });
  }

  private normalizeAuthorizedXml(doc: FiscalDocument): string | null {
    const sourceXml = doc.authorizedXml || doc.signedXml;
    if (!sourceXml) {
      return null;
    }

    if (/<nfeProc[\s>]/i.test(sourceXml)) {
      return sourceXml;
    }

    const nfeXml = this.extractNfeXml(sourceXml);
    if (!nfeXml) {
      return sourceXml;
    }

    const accessKey = doc.accessKey || this.extractAccessKeyFromXml(nfeXml) || '';
    const tpAmb = doc.environment === 'HOMOLOGATION' ? '2' : '1';
    const protocol = doc.protocolNumber || '';
    const dhRecbto = (doc.authorizedAt || doc.updatedAt || new Date()).toISOString();

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
      <cStat>100</cStat>
      <xMotivo>Autorizado o uso da NF-e</xMotivo>
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
