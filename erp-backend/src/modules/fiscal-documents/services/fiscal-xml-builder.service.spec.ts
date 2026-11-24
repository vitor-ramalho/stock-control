import { FiscalXmlBuilderService } from './fiscal-xml-builder.service';
import { FiscalDocument } from '../entities/fiscal-document.entity';
import { FiscalDocumentItem } from '../entities/fiscal-document-item.entity';
import { Establishment } from '../../fiscal-config/entities/establishment.entity';
import { EstablishmentFiscalProfile } from '../../fiscal-config/entities/establishment-fiscal-profile.entity';

describe('FiscalXmlBuilderService', () => {
  const service = new FiscalXmlBuilderService();

  it('builds XML with tax and product tags for each item', () => {
    const doc = {
      id: '550e8400-e29b-41d4-a716-446655440010',
      tenantId: '550e8400-e29b-41d4-a716-446655440011',
      documentModel: 'NFCE_65',
      environment: 'HOMOLOGATION',
      series: 1,
      number: '123',
      accessKey: null,
      totalsSnapshot: {
        subtotal: 100,
        total: 100,
      },
    } as unknown as FiscalDocument;

    const items = [
      {
        lineNumber: 1,
        productId: '550e8400-e29b-41d4-a716-446655440012',
        description: 'Produto Teste',
        ncm: '22030000',
        cfop: '5102',
        cest: null,
        quantity: 2,
        unitPrice: 50,
        grossTotal: 100,
        taxSnapshot: {
          icmsOrigin: '0',
          icmsCst: '102',
          pisCst: '99',
          cofinsCst: '99',
        },
      },
    ] as unknown as FiscalDocumentItem[];

    const establishment = {
      cnpj: '12345678000190',
      legalName: 'Empresa Teste',
      cityIbgeCode: '3106200',
      cityName: 'Belo Horizonte',
      stateCode: 'MG',
      zipCode: '30110-012',
      street: 'Rua Teste',
      number: '100',
      neighborhood: 'Centro',
      contactPhone: '(31)99999-9999',
    } as Establishment;

    const profile = {
      stateRegistration: '1234567890001',
      taxRegime: 'SIMPLES_NACIONAL',
      stateCode: 'MG',
      cityIbgeCode: '3106200',
    } as unknown as EstablishmentFiscalProfile;

    const xml = service.buildEmissionXml(doc, items, establishment, profile);

    expect(xml).toContain('<NCM>22030000</NCM>');
    expect(xml).toContain('<CFOP>5102</CFOP>');
    expect(xml).toContain('<ICMSSN102>');
    expect(xml).toContain('<PISOutr>');
    expect(xml).toContain('<COFINSOutr>');
    expect(xml).toContain('<cUF>31</cUF>');
    expect(xml).toContain('<cMunFG>3106200</cMunFG>');
  });

  it('builds query XML with access key', () => {
    const doc = {
      environment: 'PRODUCTION',
      accessKey: '31123456789012345678901234567890123456789012',
    } as FiscalDocument;

    const query = service.buildQueryXml(doc);

    expect(query).toContain('<tpAmb>1</tpAmb>');
    expect(query).toContain('<xServ>CONSULTAR</xServ>');
    expect(query).toContain('<chNFe>31123456789012345678901234567890123456789012</chNFe>');
  });
});
