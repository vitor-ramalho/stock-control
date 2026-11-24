import { Injectable } from '@nestjs/common';
import { FiscalDocument } from '../entities/fiscal-document.entity';
import { FiscalDocumentItem } from '../entities/fiscal-document-item.entity';
import { FiscalOperationType } from '../fiscal-documents.enums';
import { Establishment } from '../../fiscal-config/entities/establishment.entity';
import { EstablishmentFiscalProfile } from '../../fiscal-config/entities/establishment-fiscal-profile.entity';

@Injectable()
export class FiscalXmlBuilderService {
  buildEmissionXml(
    doc: FiscalDocument,
    items: FiscalDocumentItem[],
    establishment: Establishment,
    profile: EstablishmentFiscalProfile | null,
  ): string {
    const now = new Date().toISOString();
    const accessKeySeed = (doc.accessKey || `${doc.tenantId}${doc.id}`)
      .replace(/[^0-9A-Za-z]/g, '')
      .slice(0, 44);
    const infNFeId = `NFe${accessKeySeed.padEnd(44, '0')}`;
    const emitCnpj = establishment.cnpj;
    const emitName = this.escape(establishment.legalName || 'EMITENTE');
    const ie = profile?.stateRegistration || 'ISENTO';
    const cityCode = establishment.cityIbgeCode || profile?.cityIbgeCode || '3106200';
    const cityName = this.escape(establishment.cityName || 'BELO HORIZONTE');
    const stateCode = establishment.stateCode || profile?.stateCode || 'MG';
    const stateNumericCode = this.resolveUfCode(stateCode);
    const zipCode = establishment.zipCode?.replace(/\D/g, '') || '30000000';
    const crt = profile?.taxRegime === 'NORMAL_REGIME' ? '3' : '1';

    const detXml = items
      .map((item) => {
        const ncm = item.ncm || '99999999';
        const cfop = item.cfop || '5102';
        const cest = item.cest || null;
        const itemTax = item.taxSnapshot || {};
        const icmsOrigin = String(itemTax.icmsOrigin ?? '0');
        const icmsCst = String(itemTax.icmsCst ?? (crt === '1' ? '102' : '00'));
        const icmsRate = Number(itemTax.icmsRate ?? 0);
        const icmsValue = Number(itemTax.icmsValue ?? 0);
        const pisCst = String(itemTax.pisCst ?? '99');
        const pisRate = Number(itemTax.pisRate ?? 0);
        const pisValue = Number(itemTax.pisValue ?? 0);
        const cofinsCst = String(itemTax.cofinsCst ?? '99');
        const cofinsRate = Number(itemTax.cofinsRate ?? 0);
        const cofinsValue = Number(itemTax.cofinsValue ?? 0);

        const icmsXml =
          crt === '1'
            ? `<ICMSSN102><orig>${icmsOrigin}</orig><CSOSN>${icmsCst}</CSOSN></ICMSSN102>`
            : `<ICMS00><orig>${icmsOrigin}</orig><CST>${icmsCst}</CST><modBC>3</modBC><vBC>${Number(item.grossTotal).toFixed(2)}</vBC><pICMS>${icmsRate.toFixed(2)}</pICMS><vICMS>${icmsValue.toFixed(2)}</vICMS></ICMS00>`;

        return `
      <det nItem="${item.lineNumber}">
        <prod>
          <cProd>${item.productId || item.lineNumber}</cProd>
          <cEAN>SEM GTIN</cEAN>
          <xProd>${this.escape(item.description)}</xProd>
          <NCM>${ncm}</NCM>
          ${cest ? `<CEST>${cest}</CEST>` : ''}
          <CFOP>${cfop}</CFOP>
          <uCom>UN</uCom>
          <qCom>${Number(item.quantity).toFixed(4)}</qCom>
          <vUnCom>${Number(item.unitPrice).toFixed(4)}</vUnCom>
          <vProd>${Number(item.grossTotal).toFixed(2)}</vProd>
          <cEANTrib>SEM GTIN</cEANTrib>
          <uTrib>UN</uTrib>
          <qTrib>${Number(item.quantity).toFixed(4)}</qTrib>
          <vUnTrib>${Number(item.unitPrice).toFixed(4)}</vUnTrib>
          <indTot>1</indTot>
        </prod>
        <imposto>
          <ICMS>
            ${icmsXml}
          </ICMS>
          <PIS>
            <PISOutr>
              <CST>${pisCst}</CST>
              <vBC>${Number(item.grossTotal).toFixed(2)}</vBC>
              <pPIS>${pisRate.toFixed(2)}</pPIS>
              <vPIS>${pisValue.toFixed(2)}</vPIS>
            </PISOutr>
          </PIS>
          <COFINS>
            <COFINSOutr>
              <CST>${cofinsCst}</CST>
              <vBC>${Number(item.grossTotal).toFixed(2)}</vBC>
              <pCOFINS>${cofinsRate.toFixed(2)}</pCOFINS>
              <vCOFINS>${cofinsValue.toFixed(2)}</vCOFINS>
            </COFINSOutr>
          </COFINS>
        </imposto>
      </det>`;
      })
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<enviNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <idLote>${doc.id.replace(/-/g, '').slice(0, 15)}</idLote>
  <indSinc>1</indSinc>
  <NFe>
    <infNFe versao="4.00" Id="${infNFeId}">
      <ide>
        <cUF>${stateNumericCode}</cUF>
        <mod>${doc.documentModel === 'NFCE_65' ? '65' : '55'}</mod>
        <serie>${doc.series}</serie>
        <nNF>${doc.number}</nNF>
        <dhEmi>${now}</dhEmi>
        <tpNF>1</tpNF>
        <idDest>1</idDest>
        <cMunFG>${cityCode}</cMunFG>
        <tpImp>${doc.documentModel === 'NFCE_65' ? '4' : '1'}</tpImp>
        <tpEmis>1</tpEmis>
        <tpAmb>${doc.environment === 'HOMOLOGATION' ? '2' : '1'}</tpAmb>
        <finNFe>1</finNFe>
        <indFinal>1</indFinal>
        <indPres>1</indPres>
        <procEmi>0</procEmi>
        <verProc>stock-control-erp</verProc>
      </ide>
      <emit>
        <xNome>${emitName}</xNome>
        <CNPJ>${emitCnpj.replace(/\D/g, '')}</CNPJ>
        <enderEmit>
          <xLgr>${this.escape(establishment.street || 'NAO INFORMADO')}</xLgr>
          <nro>${this.escape(establishment.number || 'S/N')}</nro>
          <xBairro>${this.escape(establishment.neighborhood || 'NAO INFORMADO')}</xBairro>
          <cMun>${cityCode}</cMun>
          <xMun>${cityName}</xMun>
          <UF>${stateCode}</UF>
          <CEP>${zipCode}</CEP>
          <cPais>1058</cPais>
          <xPais>BRASIL</xPais>
          <fone>${(establishment.contactPhone || '31999999999').replace(/\D/g, '')}</fone>
        </enderEmit>
        <IE>${ie}</IE>
        <CRT>${crt}</CRT>
      </emit>${detXml}
      <total>
        <ICMSTot>
          <vProd>${Number(doc.totalsSnapshot?.subtotal || 0).toFixed(2)}</vProd>
          <vNF>${Number(doc.totalsSnapshot?.total || 0).toFixed(2)}</vNF>
        </ICMSTot>
      </total>
      <transp>
        <modFrete>9</modFrete>
      </transp>
      <pag>
        <detPag>
          <tPag>99</tPag>
          <vPag>${Number(doc.totalsSnapshot?.total || 0).toFixed(2)}</vPag>
        </detPag>
      </pag>
    </infNFe>
  </NFe>
</enviNFe>`;
  }

  buildCancelXml(doc: FiscalDocument, reason: string, establishment: Establishment): string {
    return this.buildEventXml(doc, '110111', reason, FiscalOperationType.CANCEL, establishment);
  }

  buildVoidXml(doc: FiscalDocument, reason: string, establishment: Establishment): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<inutNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <infInut Id="ID${doc.environment === 'HOMOLOGATION' ? '2' : '1'}31${new Date().getFullYear()}${establishment.cnpj}${doc.documentModel === 'NFCE_65' ? '65' : '55'}${String(doc.series).padStart(3, '0')}${String(doc.number).padStart(9, '0')}${String(doc.number).padStart(9, '0')}">
    <tpAmb>${doc.environment === 'HOMOLOGATION' ? '2' : '1'}</tpAmb>
    <xServ>INUTILIZAR</xServ>
    <cUF>31</cUF>
    <ano>${String(new Date().getFullYear()).slice(-2)}</ano>
    <CNPJ>${establishment.cnpj}</CNPJ>
    <mod>${doc.documentModel === 'NFCE_65' ? '65' : '55'}</mod>
    <serie>${doc.series}</serie>
    <nNFIni>${doc.number}</nNFIni>
    <nNFFin>${doc.number}</nNFFin>
    <xJust>${this.escape(reason).slice(0, 255)}</xJust>
  </infInut>
</inutNFe>`;
  }

  buildQueryXml(doc: FiscalDocument): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<consSitNFe versao="4.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <tpAmb>${doc.environment === 'HOMOLOGATION' ? '2' : '1'}</tpAmb>
  <xServ>CONSULTAR</xServ>
  <chNFe>${doc.accessKey || ''}</chNFe>
</consSitNFe>`;
  }

  private buildEventXml(
    doc: FiscalDocument,
    eventCode: string,
    reason: string,
    _operation: FiscalOperationType,
    establishment: Establishment,
  ): string {
    const now = new Date().toISOString();
    const cnpj = establishment.cnpj;
    const chNFe = (doc.accessKey || '').slice(0, 44);
    return `<?xml version="1.0" encoding="UTF-8"?>
<envEvento versao="1.00" xmlns="http://www.portalfiscal.inf.br/nfe">
  <idLote>${doc.id.replace(/-/g, '').slice(0, 15)}</idLote>
  <evento versao="1.00">
    <infEvento Id="ID${eventCode}${chNFe}01">
      <cOrgao>31</cOrgao>
      <tpAmb>${doc.environment === 'HOMOLOGATION' ? '2' : '1'}</tpAmb>
      <CNPJ>${cnpj}</CNPJ>
      <chNFe>${chNFe}</chNFe>
      <dhEvento>${now}</dhEvento>
      <tpEvento>${eventCode}</tpEvento>
      <nSeqEvento>1</nSeqEvento>
      <verEvento>1.00</verEvento>
      <detEvento versao="1.00">
        <descEvento>Cancelamento</descEvento>
        <nProt>${doc.protocolNumber || ''}</nProt>
        <xJust>${this.escape(reason).slice(0, 255)}</xJust>
      </detEvento>
    </infEvento>
  </evento>
</envEvento>`;
  }

  private escape(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private resolveUfCode(uf: string): string {
    const map: Record<string, string> = {
      RO: '11',
      AC: '12',
      AM: '13',
      RR: '14',
      PA: '15',
      AP: '16',
      TO: '17',
      MA: '21',
      PI: '22',
      CE: '23',
      RN: '24',
      PB: '25',
      PE: '26',
      AL: '27',
      SE: '28',
      BA: '29',
      MG: '31',
      ES: '32',
      RJ: '33',
      SP: '35',
      PR: '41',
      SC: '42',
      RS: '43',
      MS: '50',
      MT: '51',
      GO: '52',
      DF: '53',
    };

    return map[uf?.toUpperCase()] || '31';
  }
}
