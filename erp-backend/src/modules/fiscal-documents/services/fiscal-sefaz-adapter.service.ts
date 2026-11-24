import { Injectable } from '@nestjs/common';
import * as https from 'https';
import { FiscalAuthorizationPort } from '../ports/fiscal-authorization.port';
import {
  FiscalAuthorizationRequest,
  FiscalAuthorizationResponse,
} from '../ports/fiscal-authorization.port';
import { FiscalDocument } from '../entities/fiscal-document.entity';
import { getSefazEndpoint, SefazServiceName } from './fiscal-sefaz-endpoints';
import { FiscalTransmissionModeService } from './fiscal-transmission-mode.service';

@Injectable()
export class FiscalSefazAdapterService implements FiscalAuthorizationPort {
  constructor(
    private readonly transmissionModeService: FiscalTransmissionModeService,
  ) {}

  execute(
    request: FiscalAuthorizationRequest,
  ): Promise<FiscalAuthorizationResponse> {
    return Promise.resolve({
      success: false,
      reason: `Direct execute is not used. Use operation-specific dispatch for ${request.operation}`,
    });
  }

  async authorize(
    doc: FiscalDocument,
    signedXml: string,
    pfx: Buffer,
    passphrase: string,
  ): Promise<FiscalAuthorizationResponse> {
    return this.sendSoap(
      doc,
      'NFeAutorizacao4',
      'nfeAutorizacaoLote',
      signedXml,
      pfx,
      passphrase,
    );
  }

  async cancel(
    doc: FiscalDocument,
    eventXml: string,
    pfx: Buffer,
    passphrase: string,
  ): Promise<FiscalAuthorizationResponse> {
    return this.sendSoap(
      doc,
      'NFeRecepcaoEvento4',
      'nfeRecepcaoEvento',
      eventXml,
      pfx,
      passphrase,
    );
  }

  async voidNumber(
    doc: FiscalDocument,
    inutilizacaoXml: string,
    pfx: Buffer,
    passphrase: string,
  ): Promise<FiscalAuthorizationResponse> {
    return this.sendSoap(
      doc,
      'NFeInutilizacao4',
      'nfeInutilizacaoNF',
      inutilizacaoXml,
      pfx,
      passphrase,
    );
  }

  async queryProtocol(
    doc: FiscalDocument,
    queryXml: string,
    pfx: Buffer,
    passphrase: string,
  ): Promise<FiscalAuthorizationResponse> {
    return this.sendSoap(
      doc,
      'NFeConsultaProtocolo4',
      'nfeConsultaNF',
      queryXml,
      pfx,
      passphrase,
    );
  }

  private async sendSoap(
    doc: FiscalDocument,
    service: SefazServiceName,
    action:
      | 'nfeAutorizacaoLote'
      | 'nfeRecepcaoEvento'
      | 'nfeInutilizacaoNF'
      | 'nfeConsultaNF',
    xml: string,
    pfx: Buffer,
    passphrase: string,
  ): Promise<FiscalAuthorizationResponse> {
    if (this.transmissionModeService.shouldUseMock()) {
      return this.buildMockResponse(doc, service, action, xml);
    }

    const endpoint = getSefazEndpoint(
      doc.documentModel,
      doc.environment,
      service,
    );
    const body = this.buildSoapEnvelope(action, xml);
    const response = await this.postSoap(endpoint, body, pfx, passphrase);
    const parsed = this.parseSefazStatus(response);

    return {
      success: parsed.success,
      statusCode: parsed.code,
      reason: parsed.reason,
      protocol: parsed.protocol,
      rawResponse: response,
    };
  }

  private buildMockResponse(
    doc: FiscalDocument,
    service: SefazServiceName,
    action: string,
    payloadXml: string,
  ): FiscalAuthorizationResponse {
    const protocol = this.buildMockProtocol(doc);
    const reasonByAction: Record<string, string> = {
      nfeAutorizacaoLote: 'Autorizado o uso da NF-e (MOCK)',
      nfeRecepcaoEvento: 'Evento homologado e vinculado à NF-e (MOCK)',
      nfeInutilizacaoNF: 'Inutilizacao de numero homologada (MOCK)',
      nfeConsultaNF: 'Consulta processada com sucesso (MOCK)',
    };

    const reason =
      reasonByAction[action] || 'Operacao fiscal processada em modo MOCK';
    const cStat = action === 'nfeRecepcaoEvento' ? '135' : '100';
    const rawResponse =
      `<?xml version="1.0" encoding="utf-8"?>` +
      `<retMock service="${service}" mode="MOCK">` +
      `<cStat>${cStat}</cStat>` +
      `<xMotivo>${reason}</xMotivo>` +
      `<nProt>${protocol}</nProt>` +
      `<digest>${Buffer.from(payloadXml).toString('base64').slice(0, 64)}</digest>` +
      `</retMock>`;

    return {
      success: true,
      statusCode: cStat,
      reason,
      protocol,
      rawResponse,
    };
  }

  private buildMockProtocol(doc: FiscalDocument): string {
    const yyyymmdd = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const number = String(doc.number).padStart(9, '0').slice(-9);
    return `MOCK${yyyymmdd}${number}`;
  }

  private buildSoapEnvelope(action: string, payloadXml: string): string {
    return `<?xml version="1.0" encoding="utf-8"?>
<soap12:Envelope xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xsd="http://www.w3.org/2001/XMLSchema" xmlns:soap12="http://www.w3.org/2003/05/soap-envelope">
  <soap12:Body>
    <${action} xmlns="http://www.portalfiscal.inf.br/nfe/wsdl/${action}">
      <nfeDadosMsg>${this.escapeForSoap(payloadXml)}</nfeDadosMsg>
    </${action}>
  </soap12:Body>
</soap12:Envelope>`;
  }

  private escapeForSoap(xml: string): string {
    return xml
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  private postSoap(
    endpoint: string,
    body: string,
    pfx: Buffer,
    passphrase: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = new URL(endpoint);
      const req = https.request(
        {
          protocol: url.protocol,
          hostname: url.hostname,
          port: url.port || 443,
          path: url.pathname,
          method: 'POST',
          headers: {
            'Content-Type': 'application/soap+xml; charset=utf-8',
            'Content-Length': Buffer.byteLength(body),
          },
          pfx,
          passphrase,
          rejectUnauthorized: true,
          timeout: Number(process.env.FISCAL_SEFAZ_TIMEOUT_MS || 20000),
        },
        (res) => {
          const chunks: Uint8Array[] = [];
          res.on('data', (chunk) =>
            chunks.push(
              Buffer.isBuffer(chunk)
                ? chunk
                : Buffer.from(String(chunk), 'utf8'),
            ),
          );
          res.on('end', () => {
            resolve(Buffer.concat(chunks).toString('utf8'));
          });
        },
      );

      req.on('timeout', () => {
        req.destroy(new Error('SEFAZ request timeout'));
      });

      req.on('error', reject);
      req.write(body);
      req.end();
    });
  }

  private parseSefazStatus(responseXml: string): {
    success: boolean;
    code?: string;
    reason?: string;
    protocol?: string;
  } {
    const code = this.matchTag(responseXml, 'cStat');
    const reason = this.matchTag(responseXml, 'xMotivo');
    const protocol = this.matchTag(responseXml, 'nProt');
    const success = code === '100' || code === '150';

    return { success, code, reason, protocol };
  }

  private matchTag(xml: string, tag: string): string | undefined {
    const regex = new RegExp(`<${tag}>([^<]+)</${tag}>`);
    const match = xml.match(regex);
    return match?.[1];
  }
}
