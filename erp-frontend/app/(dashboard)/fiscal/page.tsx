'use client';

import { useMemo, useState } from 'react';
import { Building2, FileDown, FileText, PlusCircle } from 'lucide-react';
import { withAuth } from '@/components/auth/with-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageLoading } from '@/components/ui/loading-spinner';
import { EmptyState, ErrorState } from '@/components/ui/states';
import {
  useCertificates,
  useCreateFiscalAttachment,
  useCscConfigs,
  useCreateEstablishment,
  useEstablishments,
  useFiscalAttachments,
  useFiscalReadiness,
  useReplaceCertificate,
  useReplaceCsc,
  useUploadFiscalFile,
} from '@/hooks/use-fiscal-config';
import {
  useFiscalDocuments,
  useDownloadAuthorizedXmlFile,
  useGetDanfeHtml,
} from '@/hooks/use-fiscal-documents';

function FiscalPage() {
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [legalName, setLegalName] = useState('');
  const [tradeName, setTradeName] = useState('');
  const [cnpj, setCnpj] = useState('');
  const [stateCode, setStateCode] = useState('MG');
  const [cityIbgeCode, setCityIbgeCode] = useState('');
  const [certificateFile, setCertificateFile] = useState<File | null>(null);
  const [certificateType, setCertificateType] = useState<'A1' | 'A3'>('A1');
  const [holderName, setHolderName] = useState('');
  const [holderCnpj, setHolderCnpj] = useState('');
  const [certificatePassphrase, setCertificatePassphrase] = useState('');
  const [cscId, setCscId] = useState('');
  const [cscValue, setCscValue] = useState('');
  const [cscEnvironment, setCscEnvironment] = useState<'HOMOLOGATION' | 'PRODUCTION'>(
    'HOMOLOGATION',
  );
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentType, setAttachmentType] = useState<
    | 'COMPANY_REGISTRATION'
    | 'STATE_REGISTRATION_PROOF'
    | 'MUNICIPAL_REGISTRATION_PROOF'
    | 'CREDENCIAMENTO_EVIDENCE'
    | 'CERTIFICATE_OWNERSHIP'
    | 'OTHER'
  >('OTHER');
  const [attachmentDescription, setAttachmentDescription] = useState('');

  const { data: establishments, isLoading, error } = useEstablishments();
  const readinessQuery = useFiscalReadiness(selectedEstablishmentId);
  const certificatesQuery = useCertificates(selectedEstablishmentId);
  const cscQuery = useCscConfigs(selectedEstablishmentId);
  const attachmentsQuery = useFiscalAttachments(selectedEstablishmentId);
  const createEstablishment = useCreateEstablishment();
  const uploadFiscalFile = useUploadFiscalFile();
  const replaceCertificate = useReplaceCertificate();
  const replaceCsc = useReplaceCsc();
  const createFiscalAttachment = useCreateFiscalAttachment();
  const fiscalDocumentsQuery = useFiscalDocuments(20);
  const downloadAuthorizedXmlFile = useDownloadAuthorizedXmlFile();
  const getDanfeHtml = useGetDanfeHtml();

  const selectedEstablishment = useMemo(
    () => establishments?.find((item) => item.id === selectedEstablishmentId) ?? null,
    [establishments, selectedEstablishmentId],
  );

  const handleCreate = async () => {
    await createEstablishment.mutateAsync({
      legalName,
      tradeName: tradeName || undefined,
      cnpj,
      stateCode,
      cityIbgeCode,
    });

    setIsCreating(false);
    setLegalName('');
    setTradeName('');
    setCnpj('');
    setCityIbgeCode('');
  };

  const handleReplaceCertificate = async () => {
    if (!selectedEstablishmentId || !certificateFile) {
      return;
    }

    const upload = await uploadFiscalFile.mutateAsync({
      establishmentId: selectedEstablishmentId,
      category: 'CERTIFICATE',
      file: certificateFile,
    });

    await replaceCertificate.mutateAsync({
      establishmentId: selectedEstablishmentId,
      data: {
        certificateType,
        holderName,
        holderCnpj: holderCnpj || undefined,
        secureFileRef: upload.storageKey,
        passphrase: certificatePassphrase,
      },
    });

    setCertificateFile(null);
    setHolderName('');
    setHolderCnpj('');
    setCertificatePassphrase('');
  };

  const handleReplaceCsc = async () => {
    if (!selectedEstablishmentId) {
      return;
    }

    await replaceCsc.mutateAsync({
      establishmentId: selectedEstablishmentId,
      data: {
        cscId,
        cscValue,
        environment: cscEnvironment,
      },
    });

    setCscId('');
    setCscValue('');
  };

  const handleCreateAttachment = async () => {
    if (!selectedEstablishmentId || !attachmentFile) {
      return;
    }

    const upload = await uploadFiscalFile.mutateAsync({
      establishmentId: selectedEstablishmentId,
      category: 'ATTACHMENT',
      file: attachmentFile,
    });

    await createFiscalAttachment.mutateAsync({
      establishmentId: selectedEstablishmentId,
      data: {
        attachmentType,
        originalFileName: attachmentFile.name,
        storageKey: upload.storageKey,
        mimeType: upload.mimeType,
        description: attachmentDescription || undefined,
      },
    });

    setAttachmentFile(null);
    setAttachmentDescription('');
    setAttachmentType('OTHER');
  };

  if (isLoading) {
    return <PageLoading />;
  }

  if (error) {
    return <ErrorState message="Falha ao carregar configurações fiscais." />;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Configuração Fiscal</h1>
        <p className="text-muted-foreground">
          Cadastre e acompanhe a prontidão fiscal de cada estabelecimento para NF-e e NFC-e.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Notas Fiscais Recentes</CardTitle>
          <CardDescription>
            Visualize emissões recentes deste tenant e acesse DANFE/XML rapidamente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {fiscalDocumentsQuery.isLoading ? (
            <PageLoading />
          ) : fiscalDocumentsQuery.error ? (
            <ErrorState message="Falha ao carregar notas fiscais recentes." />
          ) : !fiscalDocumentsQuery.data?.length ? (
            <EmptyState
              title="Nenhuma nota fiscal encontrada"
              description="As emissões aparecerão aqui quando forem criadas."
            />
          ) : (
            <div className="space-y-3">
              {fiscalDocumentsQuery.data.map((doc) => (
                <div key={doc.id} className="rounded-lg border p-4 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">
                      {doc.documentModel} · {doc.environment}
                    </span>
                    <Badge variant={doc.state === 'AUTHORIZED' ? 'default' : 'secondary'}>
                      {doc.state}
                    </Badge>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    Série/Número: {doc.series}/{doc.number}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Protocolo: {doc.protocolNumber || '-'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Atualizada em {new Date(doc.updatedAt).toLocaleString('pt-BR')}
                  </p>

                  <div className="flex flex-wrap gap-2 pt-1">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={downloadAuthorizedXmlFile.isPending}
                      onClick={async () => {
                        const payload = await downloadAuthorizedXmlFile.mutateAsync(doc.id);
                        const url = URL.createObjectURL(payload.blob);
                        const anchor = window.document.createElement('a');
                        anchor.href = url;
                        anchor.download = payload.fileName;
                        window.document.body.appendChild(anchor);
                        anchor.click();
                        anchor.remove();
                        URL.revokeObjectURL(url);
                      }}
                    >
                      <FileDown className="mr-2 h-4 w-4" />
                      Baixar XML
                    </Button>

                    <Button
                      size="sm"
                      variant="outline"
                      disabled={getDanfeHtml.isPending}
                      onClick={async () => {
                        const win = window.open('', '_blank');
                        if (!win) {
                          return;
                        }

                        win.opener = null;
                        win.document.write(
                          '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>DANFE</title></head><body><p>Carregando DANFE...</p></body></html>',
                        );
                        win.document.close();

                        try {
                          const html = await getDanfeHtml.mutateAsync(doc.id);
                          win.document.open();
                          win.document.write(html);
                          win.document.close();
                        } catch (error) {
                          const message =
                            error instanceof Error
                              ? error.message
                              : 'Falha ao carregar DANFE';
                          win.document.open();
                          win.document.write(
                            `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Erro ao abrir DANFE</title></head><body><h1>Falha ao abrir DANFE</h1><p>${message}</p></body></html>`,
                          );
                          win.document.close();
                        }
                      }}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Abrir DANFE
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle>Estabelecimentos</CardTitle>
            <CardDescription>Base fiscal por CNPJ, com isolamento por tenant.</CardDescription>
          </div>
          <Button onClick={() => setIsCreating((prev) => !prev)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Novo Estabelecimento
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCreating && (
            <div className="grid gap-4 rounded-lg border p-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="legal-name">Razão social</Label>
                <Input
                  id="legal-name"
                  value={legalName}
                  onChange={(event) => setLegalName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="trade-name">Nome fantasia</Label>
                <Input
                  id="trade-name"
                  value={tradeName}
                  onChange={(event) => setTradeName(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ</Label>
                <Input
                  id="cnpj"
                  value={cnpj}
                  onChange={(event) => setCnpj(event.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state-code">UF (sigla)</Label>
                <Input
                  id="state-code"
                  value={stateCode}
                  maxLength={2}
                  placeholder="MG"
                  onChange={(event) => setStateCode(event.target.value.toUpperCase())}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city-ibge">Código IBGE do município (7 dígitos)</Label>
                <Input
                  id="city-ibge"
                  value={cityIbgeCode}
                  placeholder="Ex.: 3106200 (Belo Horizonte)"
                  onChange={(event) => setCityIbgeCode(event.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  O código 31 é da UF Minas Gerais. Aqui informe o código IBGE do município.
                </p>
              </div>
              <div className="flex items-end justify-end gap-2">
                <Button variant="outline" onClick={() => setIsCreating(false)}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleCreate}
                  disabled={
                    createEstablishment.isPending ||
                    !legalName ||
                    !cnpj ||
                    !stateCode ||
                    !cityIbgeCode
                  }
                >
                  {createEstablishment.isPending ? 'Salvando...' : 'Salvar'}
                </Button>
              </div>
            </div>
          )}

          {!establishments?.length ? (
            <EmptyState
              title="Nenhum estabelecimento fiscal cadastrado"
              description="Crie o primeiro estabelecimento para iniciar a configuração fiscal."
            />
          ) : (
            <div className="space-y-3">
              {establishments.map((establishment) => (
                <button
                  key={establishment.id}
                  type="button"
                  onClick={() => setSelectedEstablishmentId(establishment.id)}
                  className="w-full rounded-lg border p-4 text-left hover:bg-muted/40"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      <span className="font-medium">{establishment.legalName}</span>
                    </div>
                    <Badge variant={establishment.isActive ? 'default' : 'secondary'}>
                      {establishment.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    CNPJ: {establishment.cnpj} · UF: {establishment.stateCode || '-'} · IBGE:{' '}
                    {establishment.cityIbgeCode || '-'}
                  </p>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Prontidão Fiscal</CardTitle>
          <CardDescription>
            {selectedEstablishment
              ? `Pendências por modelo para ${selectedEstablishment.legalName}`
              : 'Selecione um estabelecimento para visualizar a prontidão fiscal'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!selectedEstablishmentId ? (
            <p className="text-sm text-muted-foreground">
              Selecione um estabelecimento na lista acima para continuar.
            </p>
          ) : readinessQuery.isLoading ? (
            <PageLoading />
          ) : readinessQuery.error ? (
            <ErrorState message="Falha ao carregar prontidão fiscal." />
          ) : (
            <div className="space-y-3">
              {readinessQuery.data?.map((item) => (
                <div key={`${item.documentModel}-${item.environment}`} className="rounded-lg border p-4">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">
                      {item.documentModel} · {item.environment}
                    </span>
                    <Badge variant={item.canProceed ? 'default' : 'secondary'}>
                      {item.status}
                    </Badge>
                  </div>
                  <Separator className="my-3" />
                  {item.pendingItems.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Sem pendências internas.</p>
                  ) : (
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {item.pendingItems.map((pending) => (
                        <li key={pending}>{pending}</li>
                      ))}
                    </ul>
                  )}
                  {item.reviewedAt && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Revisado em {new Date(item.reviewedAt).toLocaleString('pt-BR')}
                      {item.reviewedByUserId ? ` · por ${item.reviewedByUserId}` : ''}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Certificado Digital</CardTitle>
          <CardDescription>
            Substituição controlada com armazenamento seguro. O segredo não é exibido após gravação.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedEstablishmentId ? (
            <p className="text-sm text-muted-foreground">Selecione um estabelecimento para configurar o certificado.</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="certificate-type">Tipo</Label>
                  <select
                    id="certificate-type"
                    value={certificateType}
                    onChange={(event) => setCertificateType(event.target.value as 'A1' | 'A3')}
                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  >
                    <option value="A1">A1</option>
                    <option value="A3">A3</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate-holder">Titular</Label>
                  <Input
                    id="certificate-holder"
                    value={holderName}
                    onChange={(event) => setHolderName(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate-holder-cnpj">CNPJ do titular</Label>
                  <Input
                    id="certificate-holder-cnpj"
                    value={holderCnpj}
                    onChange={(event) => setHolderCnpj(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="certificate-passphrase">Senha do certificado</Label>
                  <Input
                    id="certificate-passphrase"
                    type="password"
                    value={certificatePassphrase}
                    onChange={(event) => setCertificatePassphrase(event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="certificate-file">Arquivo do certificado</Label>
                  <Input
                    id="certificate-file"
                    type="file"
                    onChange={(event) => setCertificateFile(event.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleReplaceCertificate}
                  disabled={
                    uploadFiscalFile.isPending ||
                    replaceCertificate.isPending ||
                    !certificateFile ||
                    !holderName ||
                    !certificatePassphrase
                  }
                >
                  {uploadFiscalFile.isPending || replaceCertificate.isPending
                    ? 'Salvando...'
                    : 'Substituir Certificado'}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                {(certificatesQuery.data || []).map((item) => (
                  <div key={item.id} className="rounded border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.holderName}</span>
                      <Badge variant={item.isCurrent ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.certificateType} · {item.validationStatus}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CSC da NFC-e</CardTitle>
          <CardDescription>
            O CSC é tratado como segredo e não é exibido após cadastro.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedEstablishmentId ? (
            <p className="text-sm text-muted-foreground">Selecione um estabelecimento para configurar o CSC.</p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="csc-id">Identificador CSC</Label>
                  <Input id="csc-id" value={cscId} onChange={(event) => setCscId(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csc-value">CSC</Label>
                  <Input
                    id="csc-value"
                    type="password"
                    value={cscValue}
                    onChange={(event) => setCscValue(event.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csc-env">Ambiente</Label>
                  <select
                    id="csc-env"
                    value={cscEnvironment}
                    onChange={(event) =>
                      setCscEnvironment(event.target.value as 'HOMOLOGATION' | 'PRODUCTION')
                    }
                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  >
                    <option value="HOMOLOGATION">Homologação</option>
                    <option value="PRODUCTION">Produção</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleReplaceCsc}
                  disabled={replaceCsc.isPending || !cscId || !cscValue}
                >
                  {replaceCsc.isPending ? 'Salvando...' : 'Substituir CSC'}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                {(cscQuery.data || []).map((item) => (
                  <div key={item.id} className="rounded border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{item.cscId}</span>
                      <Badge variant={item.isCurrent ? 'default' : 'secondary'}>
                        {item.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.environment} · {item.validationStatus}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Evidências Cadastrais</CardTitle>
          <CardDescription>
            Upload seguro de documentos comprobatórios. O envio não representa validação oficial.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedEstablishmentId ? (
            <p className="text-sm text-muted-foreground">
              Selecione um estabelecimento para anexar evidências.
            </p>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="attachment-type">Tipo</Label>
                  <select
                    id="attachment-type"
                    value={attachmentType}
                    onChange={(event) =>
                      setAttachmentType(
                        event.target.value as
                          | 'COMPANY_REGISTRATION'
                          | 'STATE_REGISTRATION_PROOF'
                          | 'MUNICIPAL_REGISTRATION_PROOF'
                          | 'CREDENCIAMENTO_EVIDENCE'
                          | 'CERTIFICATE_OWNERSHIP'
                          | 'OTHER',
                      )
                    }
                    className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                  >
                    <option value="COMPANY_REGISTRATION">Cadastro da Empresa</option>
                    <option value="STATE_REGISTRATION_PROOF">Comprovante de IE</option>
                    <option value="MUNICIPAL_REGISTRATION_PROOF">Comprovante Municipal</option>
                    <option value="CREDENCIAMENTO_EVIDENCE">Evidência de Credenciamento</option>
                    <option value="CERTIFICATE_OWNERSHIP">Titularidade de Certificado</option>
                    <option value="OTHER">Outro</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="attachment-description">Descrição</Label>
                  <Input
                    id="attachment-description"
                    value={attachmentDescription}
                    onChange={(event) => setAttachmentDescription(event.target.value)}
                  />
                </div>
                <div className="space-y-2 md:col-span-3">
                  <Label htmlFor="attachment-file">Arquivo</Label>
                  <Input
                    id="attachment-file"
                    type="file"
                    onChange={(event) => setAttachmentFile(event.target.files?.[0] ?? null)}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={handleCreateAttachment}
                  disabled={
                    uploadFiscalFile.isPending ||
                    createFiscalAttachment.isPending ||
                    !attachmentFile
                  }
                >
                  {uploadFiscalFile.isPending || createFiscalAttachment.isPending
                    ? 'Salvando...'
                    : 'Adicionar Evidência'}
                </Button>
              </div>

              <Separator />

              <div className="space-y-2">
                {(attachmentsQuery.data || []).map((attachment) => (
                  <div key={attachment.id} className="rounded border p-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{attachment.originalFileName}</span>
                      <Badge variant="outline">{attachment.attachmentType}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {attachment.description || 'Sem descrição'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Enviado em {new Date(attachment.uploadedAt).toLocaleString('pt-BR')}
                    </p>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default withAuth(FiscalPage, ['admin', 'superadmin']);
