import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { FiscalConfigService } from './fiscal-config.service';
import { CreateEstablishmentDto } from './dto/create-establishment.dto';
import { UpdateEstablishmentDto } from './dto/update-establishment.dto';
import { UpsertFiscalProfileDto } from './dto/upsert-fiscal-profile.dto';
import { UpsertSeriesControlDto } from './dto/upsert-series-control.dto';
import { ReplaceCertificateDto } from './dto/replace-certificate.dto';
import { ReplaceCscDto } from './dto/replace-csc.dto';
import { CreateFiscalAttachmentDto } from './dto/create-fiscal-attachment.dto';
import { CreateFiscalReviewDto } from './dto/create-fiscal-review.dto';
import { UploadSecureFileDto } from './dto/upload-secure-file.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FiscalActor } from './dto/fiscal-actor.dto';

@Controller('fiscal')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class FiscalConfigController {
  constructor(private readonly fiscalConfigService: FiscalConfigService) {}

  @Post('establishments')
  createEstablishment(
    @Body() dto: CreateEstablishmentDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string; role: string; tenantId: string },
  ) {
    return this.fiscalConfigService.createEstablishment(
      tenantId,
      dto,
      this.toActor(user),
    );
  }

  @Get('establishments')
  listEstablishments(@TenantId() tenantId: string) {
    return this.fiscalConfigService.listEstablishments(tenantId);
  }

  @Get('establishments/:establishmentId')
  getEstablishment(
    @Param('establishmentId') establishmentId: string,
    @TenantId() tenantId: string,
  ) {
    return this.fiscalConfigService.getEstablishment(tenantId, establishmentId);
  }

  @Patch('establishments/:establishmentId')
  updateEstablishment(
    @Param('establishmentId') establishmentId: string,
    @Body() dto: UpdateEstablishmentDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string; role: string; tenantId: string },
  ) {
    return this.fiscalConfigService.updateEstablishment(
      tenantId,
      establishmentId,
      dto,
      this.toActor(user),
    );
  }

  @Patch('establishments/:establishmentId/profile')
  upsertProfile(
    @Param('establishmentId') establishmentId: string,
    @Body() dto: UpsertFiscalProfileDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string; role: string; tenantId: string },
  ) {
    return this.fiscalConfigService.upsertFiscalProfile(
      tenantId,
      establishmentId,
      dto,
      this.toActor(user),
    );
  }

  @Patch('establishments/:establishmentId/series')
  upsertSeries(
    @Param('establishmentId') establishmentId: string,
    @Body() dto: UpsertSeriesControlDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string; role: string; tenantId: string },
  ) {
    return this.fiscalConfigService.upsertSeries(
      tenantId,
      establishmentId,
      dto,
      this.toActor(user),
    );
  }

  @Post('establishments/:establishmentId/certificates/replace')
  replaceCertificate(
    @Param('establishmentId') establishmentId: string,
    @Body() dto: ReplaceCertificateDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string; role: string; tenantId: string },
  ) {
    return this.fiscalConfigService.replaceCertificate(
      tenantId,
      establishmentId,
      dto,
      this.toActor(user),
    );
  }

  @Get('establishments/:establishmentId/certificates')
  listCertificates(
    @Param('establishmentId') establishmentId: string,
    @TenantId() tenantId: string,
  ) {
    return this.fiscalConfigService.listCertificates(tenantId, establishmentId);
  }

  @Post('establishments/:establishmentId/csc/replace')
  replaceCsc(
    @Param('establishmentId') establishmentId: string,
    @Body() dto: ReplaceCscDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string; role: string; tenantId: string },
  ) {
    return this.fiscalConfigService.replaceCsc(
      tenantId,
      establishmentId,
      dto,
      this.toActor(user),
    );
  }

  @Get('establishments/:establishmentId/csc')
  listCsc(
    @Param('establishmentId') establishmentId: string,
    @TenantId() tenantId: string,
  ) {
    return this.fiscalConfigService.listCscConfigs(tenantId, establishmentId);
  }

  @Post('establishments/:establishmentId/attachments')
  createAttachment(
    @Param('establishmentId') establishmentId: string,
    @Body() dto: CreateFiscalAttachmentDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string; role: string; tenantId: string },
  ) {
    return this.fiscalConfigService.createAttachment(
      tenantId,
      establishmentId,
      dto,
      this.toActor(user),
    );
  }

  @Post('establishments/:establishmentId/files')
  uploadSecureFile(
    @Param('establishmentId') establishmentId: string,
    @Body() dto: UploadSecureFileDto,
    @TenantId() tenantId: string,
  ) {
    return this.fiscalConfigService.uploadSecureFile(
      tenantId,
      establishmentId,
      dto,
    );
  }

  @Get('establishments/:establishmentId/attachments')
  listAttachments(
    @Param('establishmentId') establishmentId: string,
    @TenantId() tenantId: string,
  ) {
    return this.fiscalConfigService.listAttachments(tenantId, establishmentId);
  }

  @Post('establishments/:establishmentId/reviews')
  createReview(
    @Param('establishmentId') establishmentId: string,
    @Body() dto: CreateFiscalReviewDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string; role: string; tenantId: string },
  ) {
    return this.fiscalConfigService.createReview(
      tenantId,
      establishmentId,
      dto,
      this.toActor(user),
    );
  }

  @Get('establishments/:establishmentId/readiness')
  getReadiness(
    @Param('establishmentId') establishmentId: string,
    @TenantId() tenantId: string,
  ) {
    return this.fiscalConfigService.getReadiness(tenantId, establishmentId);
  }

  @Get('establishments/:establishmentId/audit')
  listAudit(
    @Param('establishmentId') establishmentId: string,
    @TenantId() tenantId: string,
  ) {
    return this.fiscalConfigService.listAudit(tenantId, establishmentId);
  }

  private toActor(user: {
    userId?: string;
    id?: string;
    role: string;
  }): FiscalActor {
    const userId = user.userId ?? user.id;
    if (!userId) {
      throw new BadRequestException('Authenticated user id is missing');
    }

    return {
      userId,
      role: user.role,
    };
  }
}
