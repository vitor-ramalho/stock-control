import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomUUID } from 'crypto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SecretCipherService } from '../../common/services/secret-cipher.service';
import { SecureFileStorageService } from '../../common/services/secure-file-storage.service';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';
import { UpsertFiscalProfileDto } from './dto/upsert-fiscal-profile.dto';
import { UpsertSeriesControlDto } from './dto/upsert-series-control.dto';
import { ReplaceCertificateDto } from './dto/replace-certificate.dto';
import { ReplaceCscDto } from './dto/replace-csc.dto';
import { CreateFiscalReviewDto } from './dto/create-fiscal-review.dto';
import { CreateFiscalAttachmentDto } from './dto/create-fiscal-attachment.dto';
import { FiscalActor } from './dto/fiscal-actor.dto';
import { UploadSecureFileDto } from './dto/upload-secure-file.dto';
import { Establishment } from './entities/establishment.entity';
import { EstablishmentFiscalProfile } from './entities/establishment-fiscal-profile.entity';
import { FiscalSeriesControl } from './entities/fiscal-series-control.entity';
import { DigitalCertificate } from './entities/digital-certificate.entity';
import { NfceCscConfig } from './entities/nfce-csc-config.entity';
import { FiscalReadinessReview } from './entities/fiscal-readiness-review.entity';
import { FiscalAttachment } from './entities/fiscal-attachment.entity';
import { FiscalAuditLog } from './entities/fiscal-audit-log.entity';
import {
  CredentialStatus,
  FiscalAuditAction,
  FiscalDocumentModel,
  FiscalEnvironment,
  InternalFiscalStatus,
  ValidationStatus,
} from './enums/fiscal.enums';
import { isValidCnpj, normalizeCnpj } from './utils/cnpj.util';

@Injectable()
export class FiscalConfigService {
  constructor(
    @InjectRepository(Establishment)
    private readonly establishmentRepository: Repository<Establishment>,
    @InjectRepository(EstablishmentFiscalProfile)
    private readonly profileRepository: Repository<EstablishmentFiscalProfile>,
    @InjectRepository(FiscalSeriesControl)
    private readonly seriesRepository: Repository<FiscalSeriesControl>,
    @InjectRepository(DigitalCertificate)
    private readonly certificateRepository: Repository<DigitalCertificate>,
    @InjectRepository(NfceCscConfig)
    private readonly cscRepository: Repository<NfceCscConfig>,
    @InjectRepository(FiscalReadinessReview)
    private readonly readinessRepository: Repository<FiscalReadinessReview>,
    @InjectRepository(FiscalAttachment)
    private readonly attachmentRepository: Repository<FiscalAttachment>,
    @InjectRepository(FiscalAuditLog)
    private readonly auditRepository: Repository<FiscalAuditLog>,
    private readonly secretCipherService: SecretCipherService,
    private readonly secureFileStorageService: SecureFileStorageService,
  ) {}

  async uploadSecureFile(
    tenantId: string,
    establishmentId: string,
    dto: UploadSecureFileDto,
  ): Promise<{ storageKey: string; mimeType: string; size: number }> {
    await this.getEstablishment(tenantId, establishmentId);

    const content = this.decodeBase64(dto.contentBase64);
    const extension = this.getExtension(dto.originalFileName);
    const relativePath = `${tenantId}/${establishmentId}/${dto.category.toLowerCase()}/${randomUUID()}${extension}`;

    return this.secureFileStorageService.save(relativePath, content, dto.mimeType);
  }

  async createEstablishment(
    tenantId: string,
    dto: CreateEstablishmentDto,
    actor: FiscalActor,
  ): Promise<Establishment> {
    const cnpj = normalizeCnpj(dto.cnpj);
    this.ensureCnpj(cnpj);

    const existing = await this.establishmentRepository.findOne({
      where: { tenantId, cnpj },
    });

    if (existing) {
      throw new ConflictException('CNPJ already exists for tenant');
    }

    const entity = this.establishmentRepository.create({
      ...dto,
      cnpj,
      stateCode: dto.stateCode?.toUpperCase(),
      tenantId,
      registrationStatusUpdatedAt: dto.registrationStatusUpdatedAt
        ? new Date(dto.registrationStatusUpdatedAt)
        : null,
    });

    const saved = await this.establishmentRepository.save(entity);

    await this.addAudit(tenantId, saved.id, actor.userId, FiscalAuditAction.ESTABLISHMENT_CREATED, {
      legalName: saved.legalName,
    });

    return saved;
  }

  async listEstablishments(tenantId: string): Promise<Establishment[]> {
    return this.establishmentRepository.find({
      where: { tenantId },
      order: { legalName: 'ASC' },
    });
  }

  async getEstablishment(tenantId: string, establishmentId: string): Promise<Establishment> {
    const establishment = await this.establishmentRepository.findOne({
      where: { id: establishmentId, tenantId },
    });

    if (!establishment) {
      throw new NotFoundException('Establishment not found');
    }

    return establishment;
  }

  async updateEstablishment(
    tenantId: string,
    establishmentId: string,
    dto: UpdateEstablishmentDto,
    actor: FiscalActor,
  ): Promise<Establishment> {
    const establishment = await this.getEstablishment(tenantId, establishmentId);

    if (dto.cnpj) {
      const cnpj = normalizeCnpj(dto.cnpj);
      this.ensureCnpj(cnpj);

      const existing = await this.establishmentRepository.findOne({
        where: { tenantId, cnpj },
      });

      if (existing && existing.id !== establishmentId) {
        throw new ConflictException('CNPJ already exists for tenant');
      }

      establishment.cnpj = cnpj;
    }

    if (dto.registrationStatusUpdatedAt !== undefined) {
      establishment.registrationStatusUpdatedAt = dto.registrationStatusUpdatedAt
        ? new Date(dto.registrationStatusUpdatedAt)
        : null;
    }

    Object.assign(establishment, {
      ...dto,
      stateCode: dto.stateCode?.toUpperCase() ?? establishment.stateCode,
    });

    const saved = await this.establishmentRepository.save(establishment);

    await this.addAudit(
      tenantId,
      saved.id,
      actor.userId,
      FiscalAuditAction.ESTABLISHMENT_UPDATED,
      {
        legalName: saved.legalName,
      },
    );

    return saved;
  }

  async upsertFiscalProfile(
    tenantId: string,
    establishmentId: string,
    dto: UpsertFiscalProfileDto,
    actor: FiscalActor,
  ): Promise<EstablishmentFiscalProfile> {
    await this.getEstablishment(tenantId, establishmentId);

    const profile = await this.profileRepository.findOne({
      where: {
        tenantId,
        establishmentId,
        documentModel: dto.documentModel,
        environment: dto.environment,
      },
    });

    const entity = profile
      ? Object.assign(profile, {
          ...dto,
          stateCode: dto.stateCode?.toUpperCase(),
          lastFiscalValidationAt: new Date(),
        })
      : this.profileRepository.create({
          ...dto,
          stateCode: dto.stateCode?.toUpperCase(),
          tenantId,
          establishmentId,
          lastFiscalValidationAt: new Date(),
        });

    const saved = await this.profileRepository.save(entity);

    await this.addAudit(
      tenantId,
      establishmentId,
      actor.userId,
      FiscalAuditAction.FISCAL_PROFILE_UPDATED,
      {
        documentModel: saved.documentModel,
        environment: saved.environment,
      },
    );

    return saved;
  }

  async upsertSeries(
    tenantId: string,
    establishmentId: string,
    dto: UpsertSeriesControlDto,
    actor: FiscalActor,
  ): Promise<FiscalSeriesControl> {
    await this.getEstablishment(tenantId, establishmentId);

    const series = await this.seriesRepository.findOne({
      where: {
        tenantId,
        establishmentId,
        documentModel: dto.documentModel,
        environment: dto.environment,
        series: dto.series,
      },
    });

    const entity = series
      ? Object.assign(series, { nextNumber: String(dto.nextNumber), isActive: true })
      : this.seriesRepository.create({
          tenantId,
          establishmentId,
          documentModel: dto.documentModel,
          environment: dto.environment,
          series: dto.series,
          nextNumber: String(dto.nextNumber),
        });

    const saved = await this.seriesRepository.save(entity);

    await this.addAudit(tenantId, establishmentId, actor.userId, FiscalAuditAction.SERIES_UPDATED, {
      documentModel: saved.documentModel,
      environment: saved.environment,
      series: saved.series,
      nextNumber: saved.nextNumber,
    });

    return saved;
  }

  async replaceCertificate(
    tenantId: string,
    establishmentId: string,
    dto: ReplaceCertificateDto,
    actor: FiscalActor,
  ): Promise<Omit<DigitalCertificate, 'encryptedPassphrase'>> {
    const establishment = await this.getEstablishment(tenantId, establishmentId);

    const holderCnpj = dto.holderCnpj ? normalizeCnpj(dto.holderCnpj) : null;
    if (holderCnpj && holderCnpj !== establishment.cnpj) {
      throw new BadRequestException(
        'Certificate holder CNPJ must match establishment CNPJ',
      );
    }

    const validTo = dto.validTo ? new Date(dto.validTo) : null;
    const isExpired = validTo ? validTo < new Date() : false;

    await this.certificateRepository.update(
      { tenantId, establishmentId, isCurrent: true },
      { isCurrent: false, replacedAt: new Date(), status: CredentialStatus.REPLACED },
    );

    const encryptedPassphrase = this.secretCipherService.encrypt(dto.passphrase);

    const created = this.certificateRepository.create({
      tenantId,
      establishmentId,
      certificateType: dto.certificateType,
      holderName: dto.holderName,
      holderCnpj,
      issuer: dto.issuer ?? null,
      validFrom: dto.validFrom ?? null,
      validTo: dto.validTo ?? null,
      secureFileRef: dto.secureFileRef,
      encryptedPassphrase,
      configuredByUserId: actor.userId,
      status: CredentialStatus.PENDING_VALIDATION,
      validationStatus: isExpired
        ? ValidationStatus.EXPIRED
        : ValidationStatus.NOT_VALIDATED,
      isCurrent: true,
    });

    const saved = await this.certificateRepository.save(created);

    await this.addAudit(
      tenantId,
      establishmentId,
      actor.userId,
      FiscalAuditAction.CERTIFICATE_REPLACED,
      {
        certificateType: saved.certificateType,
        holderName: saved.holderName,
      },
    );

    return this.toCertificateResponse(saved);
  }

  async listCertificates(
    tenantId: string,
    establishmentId: string,
  ): Promise<Array<Omit<DigitalCertificate, 'encryptedPassphrase'>>> {
    await this.getEstablishment(tenantId, establishmentId);

    const records = await this.certificateRepository.find({
      where: { tenantId, establishmentId },
      order: { createdAt: 'DESC' },
    });

    return records.map((record) => this.toCertificateResponse(record));
  }

  async replaceCsc(
    tenantId: string,
    establishmentId: string,
    dto: ReplaceCscDto,
    actor: FiscalActor,
  ): Promise<Omit<NfceCscConfig, 'encryptedCsc'>> {
    await this.getEstablishment(tenantId, establishmentId);

    await this.cscRepository.update(
      {
        tenantId,
        establishmentId,
        environment: dto.environment,
        isCurrent: true,
      },
      {
        isCurrent: false,
        replacedAt: new Date(),
        status: CredentialStatus.REPLACED,
      },
    );

    const saved = await this.cscRepository.save(
      this.cscRepository.create({
        tenantId,
        establishmentId,
        cscId: dto.cscId,
        encryptedCsc: this.secretCipherService.encrypt(dto.cscValue),
        environment: dto.environment,
        configuredAt: new Date(),
        configuredByUserId: actor.userId,
        status: CredentialStatus.PENDING_VALIDATION,
        validationStatus: ValidationStatus.NOT_VALIDATED,
        isCurrent: true,
      }),
    );

    await this.addAudit(tenantId, establishmentId, actor.userId, FiscalAuditAction.CSC_REPLACED, {
      environment: saved.environment,
      cscId: saved.cscId,
    });

    return this.toCscResponse(saved);
  }

  async listCscConfigs(
    tenantId: string,
    establishmentId: string,
  ): Promise<Array<Omit<NfceCscConfig, 'encryptedCsc'>>> {
    await this.getEstablishment(tenantId, establishmentId);

    const configs = await this.cscRepository.find({
      where: { tenantId, establishmentId },
      order: { createdAt: 'DESC' },
    });

    return configs.map((config) => this.toCscResponse(config));
  }

  async createAttachment(
    tenantId: string,
    establishmentId: string,
    dto: CreateFiscalAttachmentDto,
    actor: FiscalActor,
  ): Promise<FiscalAttachment> {
    await this.getEstablishment(tenantId, establishmentId);

    const expectedPrefix = `${tenantId}/${establishmentId}/`;
    if (!dto.storageKey.startsWith(expectedPrefix)) {
      throw new BadRequestException(
        'Attachment storage key is outside tenant establishment scope',
      );
    }

    const attachment = this.attachmentRepository.create({
      tenantId,
      establishmentId,
      attachmentType: dto.attachmentType,
      originalFileName: dto.originalFileName,
      storageKey: dto.storageKey,
      mimeType: dto.mimeType ?? null,
      description: dto.description ?? null,
      uploadedByUserId: actor.userId,
      uploadedAt: new Date(),
    });

    const saved = await this.attachmentRepository.save(attachment);

    await this.addAudit(
      tenantId,
      establishmentId,
      actor.userId,
      FiscalAuditAction.ATTACHMENT_UPLOADED,
      {
        attachmentType: saved.attachmentType,
        storageKey: saved.storageKey,
      },
    );

    return saved;
  }

  async listAttachments(tenantId: string, establishmentId: string): Promise<FiscalAttachment[]> {
    await this.getEstablishment(tenantId, establishmentId);

    return this.attachmentRepository.find({
      where: { tenantId, establishmentId },
      order: { createdAt: 'DESC' },
    });
  }

  async createReview(
    tenantId: string,
    establishmentId: string,
    dto: CreateFiscalReviewDto,
    actor: FiscalActor,
  ): Promise<FiscalReadinessReview> {
    await this.getEstablishment(tenantId, establishmentId);

    const readiness = await this.getReadiness(tenantId, establishmentId);
    const current = readiness.find(
      (item) =>
        item.documentModel === dto.documentModel &&
        item.environment === dto.environment,
    );

    const review = this.readinessRepository.create({
      tenantId,
      establishmentId,
      documentModel: dto.documentModel,
      environment: dto.environment,
      status: dto.status,
      notes: dto.notes ?? null,
      pendingItems: JSON.stringify(current?.pendingItems ?? []),
      reviewedByUserId: actor.userId,
      reviewedAt: new Date(),
    });

    const saved = await this.readinessRepository.save(review);

    await this.addAudit(
      tenantId,
      establishmentId,
      actor.userId,
      FiscalAuditAction.READINESS_REVIEWED,
      {
        documentModel: saved.documentModel,
        environment: saved.environment,
        status: saved.status,
      },
    );

    return saved;
  }

  async getReadiness(
    tenantId: string,
    establishmentId: string,
  ): Promise<
    Array<{
      documentModel: FiscalDocumentModel;
      environment: FiscalEnvironment;
      status: InternalFiscalStatus;
      pendingItems: string[];
      canProceed: boolean;
      reviewedByUserId: string | null;
      reviewedAt: Date | null;
    }>
  > {
    const establishment = await this.getEstablishment(tenantId, establishmentId);

    const profiles = await this.profileRepository.find({
      where: { tenantId, establishmentId },
    });

    const certificates = await this.certificateRepository.find({
      where: { tenantId, establishmentId, isCurrent: true },
    });

    const cscConfigs = await this.cscRepository.find({
      where: { tenantId, establishmentId, isCurrent: true },
    });

    const series = await this.seriesRepository.find({
      where: { tenantId, establishmentId, isActive: true },
    });

    const attachments = await this.attachmentRepository.find({
      where: { tenantId, establishmentId },
    });

    const reviews = await this.readinessRepository.find({
      where: { tenantId, establishmentId },
      order: { reviewedAt: 'DESC' },
    });

    const models = [FiscalDocumentModel.NFE_55, FiscalDocumentModel.NFCE_65];
    const environments = [FiscalEnvironment.HOMOLOGATION, FiscalEnvironment.PRODUCTION];

    const result: Array<{
      documentModel: FiscalDocumentModel;
      environment: FiscalEnvironment;
      status: InternalFiscalStatus;
      pendingItems: string[];
      canProceed: boolean;
      reviewedByUserId: string | null;
      reviewedAt: Date | null;
    }> = [];

    for (const model of models) {
      for (const environment of environments) {
        const profile = profiles.find(
          (item) => item.documentModel === model && item.environment === environment,
        );

        const currentCertificate = certificates.find((entry) => entry.isCurrent);

        const currentCsc = cscConfigs.find(
          (entry) => entry.environment === environment && entry.isCurrent,
        );

        const latestReview = reviews.find(
          (review) =>
            review.documentModel === model && review.environment === environment,
        );

        const pendingItems = this.computePendingItems({
          establishment,
          profile,
          hasCertificate: !!currentCertificate,
          certificateValidationStatus: currentCertificate?.validationStatus,
          hasSeries: series.some(
            (entry) =>
              entry.documentModel === model &&
              entry.environment === environment,
          ),
          hasCsc: model !== FiscalDocumentModel.NFCE_65 || !!currentCsc,
          cscValidationStatus: currentCsc?.validationStatus,
          model,
          environment,
          hasAttachment: attachments.length > 0,
        });

        const computedStatus = this.computeInternalStatus(
          environment,
          pendingItems.length === 0,
          profile?.accreditationVerified ?? false,
        );

        const resolvedStatus = this.resolveStatus(computedStatus, latestReview?.status);

        result.push({
          documentModel: model,
          environment,
          status: resolvedStatus,
          pendingItems,
          canProceed: pendingItems.length === 0,
          reviewedByUserId: latestReview?.reviewedByUserId ?? null,
          reviewedAt: latestReview?.reviewedAt ?? null,
        });
      }
    }

    return result;
  }

  async listAudit(tenantId: string, establishmentId: string): Promise<FiscalAuditLog[]> {
    await this.getEstablishment(tenantId, establishmentId);

    return this.auditRepository.find({
      where: { tenantId, establishmentId },
      order: { createdAt: 'DESC' },
      take: 300,
    });
  }

  async ensureTenantAccess(
    routeTenantId: string,
    authenticatedTenantId: string,
    actorRole: string,
  ): Promise<void> {
    const normalizedRole = actorRole.toLowerCase();
    if (normalizedRole === 'superadmin') {
      return;
    }

    if (routeTenantId !== authenticatedTenantId) {
      throw new ForbiddenException('Cross-tenant access is not allowed');
    }
  }

  private computePendingItems(input: {
    establishment: Establishment;
    profile: EstablishmentFiscalProfile | undefined;
    hasCertificate: boolean;
    certificateValidationStatus?: ValidationStatus;
    hasCsc: boolean;
    cscValidationStatus?: ValidationStatus;
    hasSeries: boolean;
    model: FiscalDocumentModel;
    environment: FiscalEnvironment;
    hasAttachment: boolean;
  }): string[] {
    const pending: string[] = [];

    if (!input.establishment.legalName || !input.establishment.cnpj) {
      pending.push('Missing legal registration data');
    }

    if (!input.establishment.stateCode || !input.establishment.cityIbgeCode) {
      pending.push('Missing address federation and IBGE codes');
    }

    if (!input.profile) {
      pending.push('Fiscal profile is not configured for model/environment');
      return pending;
    }

    if (!input.profile.isEnabled) {
      pending.push('Fiscal model is not enabled for this establishment');
    }

    if (!input.profile.icmsTaxpayerIndicator) {
      pending.push('ICMS taxpayer indicator not configured');
    }

    if (
      input.profile.icmsTaxpayerIndicator === 'TAXPAYER' &&
      !input.profile.stateRegistration
    ) {
      pending.push('State registration is required for ICMS taxpayers');
    }

    if (!input.profile.taxRegime) {
      pending.push('Tax regime not configured');
    }

    if (!input.profile.accreditationReported) {
      pending.push('Accreditation was not reported by responsible user');
    }

    if (!input.hasCertificate) {
      pending.push('No active certificate configured');
    } else if (input.certificateValidationStatus === ValidationStatus.EXPIRED) {
      pending.push('Current certificate is expired');
    }

    if (!input.hasSeries) {
      pending.push('Series and numbering controls are missing');
    }

    if (!input.hasCsc) {
      pending.push('CSC is missing for NFC-e');
    } else if (
      input.model === FiscalDocumentModel.NFCE_65 &&
      input.cscValidationStatus === ValidationStatus.INVALID
    ) {
      pending.push('CSC was marked as invalid and must be replaced');
    }

    if (!input.hasAttachment) {
      pending.push('No documentary evidence attached');
    }

    if (
      input.environment === FiscalEnvironment.PRODUCTION &&
      !input.profile.accreditationVerified
    ) {
      pending.push('Production accreditation is not verified');
    }

    return pending;
  }

  private resolveStatus(
    computedStatus: InternalFiscalStatus,
    reviewedStatus?: InternalFiscalStatus,
  ): InternalFiscalStatus {
    if (!reviewedStatus) {
      return computedStatus;
    }

    if (computedStatus === InternalFiscalStatus.INCOMPLETE) {
      return reviewedStatus === InternalFiscalStatus.BLOCKED
        ? InternalFiscalStatus.BLOCKED
        : InternalFiscalStatus.INCOMPLETE;
    }

    if (reviewedStatus === InternalFiscalStatus.HOMOLOGATION_IN_PROGRESS) {
      return InternalFiscalStatus.HOMOLOGATION_IN_PROGRESS;
    }

    if (reviewedStatus === InternalFiscalStatus.BLOCKED) {
      return InternalFiscalStatus.BLOCKED;
    }

    return computedStatus;
  }

  private computeInternalStatus(
    environment: FiscalEnvironment,
    hasNoPendingItems: boolean,
    accreditationVerified: boolean,
  ): InternalFiscalStatus {
    if (!hasNoPendingItems) {
      return InternalFiscalStatus.INCOMPLETE;
    }

    if (environment === FiscalEnvironment.HOMOLOGATION) {
      return InternalFiscalStatus.READY_FOR_HOMOLOGATION;
    }

    if (accreditationVerified) {
      return InternalFiscalStatus.READY_FOR_PRODUCTION;
    }

    return InternalFiscalStatus.PENDING_REVIEW;
  }

  private decodeBase64(value: string): Buffer {
    try {
      return Buffer.from(value, 'base64');
    } catch {
      throw new BadRequestException('Invalid base64 file content');
    }
  }

  private getExtension(fileName: string): string {
    const match = fileName.match(/(\.[a-zA-Z0-9]+)$/);
    return match ? match[1].toLowerCase() : '';
  }

  private toCertificateResponse(
    record: DigitalCertificate,
  ): Omit<DigitalCertificate, 'encryptedPassphrase'> {
    const { encryptedPassphrase, ...safe } = record;
    return safe;
  }

  private toCscResponse(record: NfceCscConfig): Omit<NfceCscConfig, 'encryptedCsc'> {
    const { encryptedCsc, ...safe } = record;
    return safe;
  }

  private async addAudit(
    tenantId: string,
    establishmentId: string,
    actorUserId: string,
    action: FiscalAuditAction,
    metadata: Record<string, unknown> | null,
  ): Promise<void> {
    await this.auditRepository.save(
      this.auditRepository.create({
        tenantId,
        establishmentId,
        actorUserId,
        action,
        metadata,
      }),
    );
  }

  private ensureCnpj(cnpj: string): void {
    if (!isValidCnpj(cnpj)) {
      throw new BadRequestException('Invalid CNPJ');
    }
  }
}
