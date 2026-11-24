import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { TenantId } from '../../common/decorators/tenant-id.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FiscalDocumentsService } from './fiscal-documents.service';
import { RequestFiscalEmissionDto } from './dto/request-fiscal-emission.dto';
import { RequestFiscalCancelDto } from './dto/request-fiscal-cancel.dto';
import { RequestFiscalVoidDto } from './dto/request-fiscal-void.dto';
import { SetFiscalTransmissionModeDto } from './dto/set-fiscal-transmission-mode.dto';
import { RecoverStuckEmissionsDto } from './dto/recover-stuck-emissions.dto';

@Controller('fiscal/documents')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPERADMIN)
export class FiscalDocumentsController {
  constructor(private readonly fiscalDocumentsService: FiscalDocumentsService) {}

  @Post('emissions')
  requestEmission(
    @Body() dto: RequestFiscalEmissionDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string },
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    const actorUserId = user.userId ?? user.id;
    if (!actorUserId) {
      throw new BadRequestException('Authenticated user id is missing');
    }

    return this.fiscalDocumentsService.requestEmissionFromSale(
      tenantId,
      actorUserId,
      dto,
      idempotencyKey,
    );
  }

  @Get('transmission-mode')
  getTransmissionMode() {
    return this.fiscalDocumentsService.getTransmissionMode();
  }

  @Post('transmission-mode')
  setTransmissionMode(@Body() dto: SetFiscalTransmissionModeDto) {
    return this.fiscalDocumentsService.setTransmissionMode(dto.mode);
  }

  @Post('recovery/stuck-emissions')
  recoverStuckEmissions(
    @Body() dto: RecoverStuckEmissionsDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string },
  ) {
    const actorUserId = user.userId ?? user.id;
    if (!actorUserId) {
      throw new BadRequestException('Authenticated user id is missing');
    }

    return this.fiscalDocumentsService.recoverStuckEmissions(
      tenantId,
      actorUserId,
      dto,
    );
  }

  @Get('sale/:saleId')
  getBySaleId(@Param('saleId') saleId: string, @TenantId() tenantId: string) {
    return this.fiscalDocumentsService.getBySaleId(tenantId, saleId);
  }

  @Get('queue/pending')
  listPendingQueue(@TenantId() tenantId: string) {
    return this.fiscalDocumentsService.listPendingQueue(tenantId);
  }

  @Get()
  listDocuments(
    @TenantId() tenantId: string,
    @Query('limit') limit?: string,
  ) {
    const parsedLimit = limit ? Number(limit) : 20;
    return this.fiscalDocumentsService.listDocuments(tenantId, parsedLimit);
  }

  @Get(':documentId')
  getById(@Param('documentId') documentId: string, @TenantId() tenantId: string) {
    return this.fiscalDocumentsService.getById(tenantId, documentId);
  }

  @Get(':documentId/events')
  listEvents(@Param('documentId') documentId: string, @TenantId() tenantId: string) {
    return this.fiscalDocumentsService.listEvents(tenantId, documentId);
  }

  @Get(':documentId/attempts')
  listAttempts(@Param('documentId') documentId: string, @TenantId() tenantId: string) {
    return this.fiscalDocumentsService.listAttempts(tenantId, documentId);
  }

  @Get(':documentId/history')
  listHistory(@Param('documentId') documentId: string, @TenantId() tenantId: string) {
    return this.fiscalDocumentsService.listStateHistory(tenantId, documentId);
  }

  @Get(':documentId/xml')
  getAuthorizedXml(
    @Param('documentId') documentId: string,
    @TenantId() tenantId: string,
  ) {
    return this.fiscalDocumentsService.getAuthorizedXml(tenantId, documentId);
  }

  @Get(':documentId/xml/download')
  async downloadAuthorizedXml(
    @Param('documentId') documentId: string,
    @TenantId() tenantId: string,
    @Res() response: Response,
  ) {
    const payload = await this.fiscalDocumentsService.getAuthorizedXmlDownload(
      tenantId,
      documentId,
    );
    response.setHeader('Content-Type', 'application/xml; charset=utf-8');
    response.setHeader('Content-Disposition', `attachment; filename="${payload.fileName}"`);
    response.send(payload.xml);
  }

  @Get(':documentId/danfe')
  async getDanfeHtml(
    @Param('documentId') documentId: string,
    @TenantId() tenantId: string,
    @Res() response: Response,
  ) {
    const payload = await this.fiscalDocumentsService.getDanfeHtml(tenantId, documentId);
    response.setHeader('Content-Type', 'text/html; charset=utf-8');
    response.send(payload.html);
  }

  @Post(':documentId/cancel')
  requestCancel(
    @Param('documentId') documentId: string,
    @Body() dto: RequestFiscalCancelDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string },
  ) {
    const actorUserId = user.userId ?? user.id;
    if (!actorUserId) {
      throw new BadRequestException('Authenticated user id is missing');
    }

    return this.fiscalDocumentsService.requestCancel(
      tenantId,
      actorUserId,
      documentId,
      dto,
    );
  }

  @Post(':documentId/void-number')
  requestVoidNumber(
    @Param('documentId') documentId: string,
    @Body() dto: RequestFiscalVoidDto,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string },
  ) {
    const actorUserId = user.userId ?? user.id;
    if (!actorUserId) {
      throw new BadRequestException('Authenticated user id is missing');
    }

    return this.fiscalDocumentsService.requestVoidNumber(
      tenantId,
      actorUserId,
      documentId,
      dto,
    );
  }

  @Post(':documentId/reconcile-status')
  requestStatusReconciliation(
    @Param('documentId') documentId: string,
    @TenantId() tenantId: string,
    @CurrentUser() user: { userId?: string; id?: string },
  ) {
    const actorUserId = user.userId ?? user.id;
    if (!actorUserId) {
      throw new BadRequestException('Authenticated user id is missing');
    }

    return this.fiscalDocumentsService.requestStatusReconciliation(
      tenantId,
      actorUserId,
      documentId,
    );
  }
}
