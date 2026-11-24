import {
  FiscalDocumentModel,
  FiscalEnvironment,
} from '../../fiscal-config/enums/fiscal.enums';

export type SefazServiceName =
  | 'NFeAutorizacao4'
  | 'NFeRetAutorizacao4'
  | 'NFeConsultaProtocolo4'
  | 'NFeStatusServico4'
  | 'NFeRecepcaoEvento4'
  | 'NFeInutilizacao4';

const NFCE_ENDPOINTS: Record<
  FiscalEnvironment,
  Record<SefazServiceName, string>
> = {
  [FiscalEnvironment.HOMOLOGATION]: {
    NFeAutorizacao4:
      'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4',
    NFeRetAutorizacao4:
      'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeRetAutorizacao4',
    NFeConsultaProtocolo4:
      'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeConsultaProtocolo4',
    NFeStatusServico4:
      'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeStatusServico4',
    NFeRecepcaoEvento4:
      'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeRecepcaoEvento4',
    NFeInutilizacao4:
      'https://hnfce.fazenda.mg.gov.br/nfce/services/NFeInutilizacao4',
  },
  [FiscalEnvironment.PRODUCTION]: {
    NFeAutorizacao4:
      'https://nfce.fazenda.mg.gov.br/nfce/services/NFeAutorizacao4',
    NFeRetAutorizacao4:
      'https://nfce.fazenda.mg.gov.br/nfce/services/NFeRetAutorizacao4',
    NFeConsultaProtocolo4:
      'https://nfce.fazenda.mg.gov.br/nfce/services/NFeConsultaProtocolo4',
    NFeStatusServico4:
      'https://nfce.fazenda.mg.gov.br/nfce/services/NFeStatusServico4',
    NFeRecepcaoEvento4:
      'https://nfce.fazenda.mg.gov.br/nfce/services/NFeRecepcaoEvento4',
    NFeInutilizacao4:
      'https://nfce.fazenda.mg.gov.br/nfce/services/NFeInutilizacao4',
  },
};

const NFE_ENDPOINTS: Record<
  FiscalEnvironment,
  Record<SefazServiceName, string>
> = {
  [FiscalEnvironment.HOMOLOGATION]: {
    NFeAutorizacao4:
      'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4',
    NFeRetAutorizacao4:
      'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4',
    NFeConsultaProtocolo4:
      'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4',
    NFeStatusServico4:
      'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeStatusServico4',
    NFeRecepcaoEvento4:
      'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeRecepcaoEvento4',
    NFeInutilizacao4:
      'https://hnfe.fazenda.mg.gov.br/nfe2/services/NFeInutilizacao4',
  },
  [FiscalEnvironment.PRODUCTION]: {
    NFeAutorizacao4:
      'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeAutorizacao4',
    NFeRetAutorizacao4:
      'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeRetAutorizacao4',
    NFeConsultaProtocolo4:
      'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeConsultaProtocolo4',
    NFeStatusServico4:
      'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeStatusServico4',
    NFeRecepcaoEvento4:
      'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeRecepcaoEvento4',
    NFeInutilizacao4:
      'https://nfe.fazenda.mg.gov.br/nfe2/services/NFeInutilizacao4',
  },
};

export function getSefazEndpoint(
  model: FiscalDocumentModel,
  environment: FiscalEnvironment,
  service: SefazServiceName,
): string {
  const map =
    model === FiscalDocumentModel.NFCE_65 ? NFCE_ENDPOINTS : NFE_ENDPOINTS;
  return map[environment][service];
}
