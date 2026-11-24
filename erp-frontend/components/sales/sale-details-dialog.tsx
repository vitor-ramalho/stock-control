'use client';

import { useMemo, useState } from 'react';
import { useSaleById } from '@/hooks/use-sales';
import { useEstablishments } from '@/hooks/use-fiscal-config';
import {
  useFiscalDocumentAttempts,
  useFiscalDocumentBySale,
  useFiscalDocumentEvents,
  useFiscalDocumentHistory,
  useRequestFiscalCancel,
  useRequestFiscalEmission,
  useRequestFiscalReconciliation,
  useRequestFiscalVoid,
  useDownloadAuthorizedXml,
  useDownloadAuthorizedXmlFile,
  useGetDanfeHtml,
} from '@/hooks/use-fiscal-documents';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SaleItemsList } from './sale-items-list';
import { User, Wallet, CreditCard, Receipt, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface SaleDetailsDialogProps {
  saleId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleDetailsDialog({ saleId, open, onOpenChange }: SaleDetailsDialogProps) {
  const [establishmentId, setEstablishmentId] = useState('');
  const [documentModel, setDocumentModel] = useState<'NFCE_65' | 'NFE_55'>('NFCE_65');
  const [environment, setEnvironment] = useState<'HOMOLOGATION' | 'PRODUCTION'>('HOMOLOGATION');
  const [cancelReason, setCancelReason] = useState('Solicitação de cancelamento operacional');
  const [voidJustification, setVoidJustification] = useState('Inutilização por fluxo rejeitado');
  const [authorizedXmlPreview, setAuthorizedXmlPreview] = useState<string | null>(null);
  const { data: sale, isLoading } = useSaleById(saleId);
  const { data: establishments } = useEstablishments();
  const { data: fiscalDocument } = useFiscalDocumentBySale(saleId);
  const { data: fiscalAttempts } = useFiscalDocumentAttempts(fiscalDocument?.id || null);
  const { data: fiscalEvents } = useFiscalDocumentEvents(fiscalDocument?.id || null);
  const { data: fiscalHistory } = useFiscalDocumentHistory(fiscalDocument?.id || null);
  const requestEmission = useRequestFiscalEmission();
  const requestCancel = useRequestFiscalCancel();
  const requestVoid = useRequestFiscalVoid();
  const requestReconciliation = useRequestFiscalReconciliation();
  const downloadAuthorizedXml = useDownloadAuthorizedXml();
  const downloadAuthorizedXmlFile = useDownloadAuthorizedXmlFile();
  const getDanfeHtml = useGetDanfeHtml();

  const selectedEstablishmentId = useMemo(() => {
    if (establishmentId) {
      return establishmentId;
    }
    return establishments?.[0]?.id || '';
  }, [establishmentId, establishments]);

  if (isLoading || !sale) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[700px]">
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const subtotal = Number(sale.subtotal || sale.total);
  const discount = Number(sale.discount || 0);
  const tax = Number(sale.tax || 0);
  const total = Number(sale.total);

  const canRequestEmission = !fiscalDocument;
  const canCancel = fiscalDocument?.state === 'AUTHORIZED';
  const canVoid = ['REJECTED', 'TECHNICAL_FAILURE', 'UNKNOWN_RESULT'].includes(
    fiscalDocument?.state || '',
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Sale Details
              </DialogTitle>
              <DialogDescription className="mt-1">
                Transaction ID: #{sale.id.slice(0, 12)}
              </DialogDescription>
            </div>
            <Badge variant={sale.status === 'completed' ? 'default' : 'secondary'}>
              {sale.status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sale Information */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                Customer
              </div>
              <div className="font-medium">
                {sale.customerName || (
                  <span className="text-muted-foreground italic">Walk-in Customer</span>
                )}
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                Payment Method
              </div>
              <Badge variant="secondary" className="capitalize">
                {sale.paymentMethod}
              </Badge>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                Date & Time
              </div>
              <div className="font-medium">
                {format(new Date(sale.createdAt), 'MMM dd, yyyy - HH:mm:ss')}
              </div>
            </div>

            {sale.cashRegister && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Wallet className="h-4 w-4" />
                  Cash Register
                </div>
                <div className="font-medium text-sm">
                  #{sale.cashRegister.id.slice(0, 8)}
                </div>
              </div>
            )}

            {sale.user && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <User className="h-4 w-4" />
                  POS Operator
                </div>
                <div className="font-medium">
                  {sale.user.name || sale.user.email}
                </div>
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Documento Fiscal</h3>
            {fiscalDocument ? (
              <div className="space-y-2 rounded-md border p-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge variant="outline">{fiscalDocument.state}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Modelo {fiscalDocument.documentModel} · Série {fiscalDocument.series} · Número{' '}
                  {fiscalDocument.number}
                </div>
                {fiscalDocument.protocolNumber && (
                  <div className="text-sm text-muted-foreground">
                    Protocolo: {fiscalDocument.protocolNumber}
                  </div>
                )}
                {fiscalDocument.rejectionReason && (
                  <div className="text-sm text-red-600">
                    {fiscalDocument.rejectionCode}: {fiscalDocument.rejectionReason}
                  </div>
                )}

                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="cancel-reason">Motivo de cancelamento</Label>
                    <Input
                      id="cancel-reason"
                      value={cancelReason}
                      onChange={(event) => setCancelReason(event.target.value)}
                    />
                    <Button
                      variant="outline"
                      disabled={!canCancel || requestCancel.isPending}
                      onClick={() =>
                        requestCancel.mutate({
                          documentId: fiscalDocument.id,
                          reason: cancelReason,
                        })
                      }
                    >
                      Solicitar Cancelamento
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="void-justification">Justificativa de inutilização</Label>
                    <Input
                      id="void-justification"
                      value={voidJustification}
                      onChange={(event) => setVoidJustification(event.target.value)}
                    />
                    <Button
                      variant="outline"
                      disabled={!canVoid || requestVoid.isPending}
                      onClick={() =>
                        requestVoid.mutate({
                          documentId: fiscalDocument.id,
                          startNumber: Number(fiscalDocument.number),
                          endNumber: Number(fiscalDocument.number),
                          justification: voidJustification,
                        })
                      }
                    >
                      Solicitar Inutilização
                    </Button>
                  </div>
                </div>

                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded border p-2">
                    <p className="text-xs text-muted-foreground">Eventos</p>
                    <p className="text-lg font-semibold">{(fiscalEvents || []).length}</p>
                  </div>
                  <div className="rounded border p-2">
                    <p className="text-xs text-muted-foreground">Tentativas</p>
                    <p className="text-lg font-semibold">{(fiscalAttempts || []).length}</p>
                  </div>
                  <div className="rounded border p-2">
                    <p className="text-xs text-muted-foreground">Transições</p>
                    <p className="text-lg font-semibold">{(fiscalHistory || []).length}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    disabled={requestReconciliation.isPending}
                    onClick={() => requestReconciliation.mutate(fiscalDocument.id)}
                  >
                    Reconciliar Status
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={downloadAuthorizedXml.isPending}
                    onClick={async () => {
                      const payload = await downloadAuthorizedXml.mutateAsync(fiscalDocument.id);
                      setAuthorizedXmlPreview(payload.xml);
                    }}
                  >
                    Ver XML Autorizado
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={downloadAuthorizedXmlFile.isPending}
                    onClick={async () => {
                      const payload = await downloadAuthorizedXmlFile.mutateAsync(
                        fiscalDocument.id,
                      );
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
                    Baixar XML
                  </Button>
                  <Button
                    variant="secondary"
                    disabled={getDanfeHtml.isPending}
                    onClick={async () => {
                      const win = window.open('', '_blank');
                      if (!win) {
                        return;
                      }

                      // Prevent opener access while still keeping the window handle writable.
                      win.opener = null;

                      win.document.write(
                        '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>DANFE</title></head><body><p>Carregando DANFE...</p></body></html>',
                      );
                      win.document.close();

                      try {
                        const html = await getDanfeHtml.mutateAsync(fiscalDocument.id);
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
                    Abrir DANFE
                  </Button>
                </div>

                {authorizedXmlPreview && (
                  <div className="space-y-2">
                    <Label>XML Autorizado</Label>
                    <pre className="max-h-56 overflow-auto rounded border bg-muted p-2 text-xs">
                      {authorizedXmlPreview}
                    </pre>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3 rounded-md border p-3">
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="fiscal-est">Estabelecimento</Label>
                    <select
                      id="fiscal-est"
                      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                      value={selectedEstablishmentId}
                      onChange={(event) => setEstablishmentId(event.target.value)}
                    >
                      {(establishments || []).map((establishment) => (
                        <option key={establishment.id} value={establishment.id}>
                          {establishment.legalName}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscal-model">Modelo</Label>
                    <select
                      id="fiscal-model"
                      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                      value={documentModel}
                      onChange={(event) =>
                        setDocumentModel(event.target.value as 'NFCE_65' | 'NFE_55')
                      }
                    >
                      <option value="NFCE_65">NFC-e (65)</option>
                      <option value="NFE_55">NF-e (55)</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fiscal-env">Ambiente</Label>
                    <select
                      id="fiscal-env"
                      className="h-9 w-full rounded-md border bg-transparent px-3 text-sm"
                      value={environment}
                      onChange={(event) =>
                        setEnvironment(event.target.value as 'HOMOLOGATION' | 'PRODUCTION')
                      }
                    >
                      <option value="HOMOLOGATION">Homologação</option>
                      <option value="PRODUCTION">Produção</option>
                    </select>
                  </div>
                </div>

                <Button
                  disabled={
                    !canRequestEmission ||
                    requestEmission.isPending ||
                    !selectedEstablishmentId ||
                    !sale
                  }
                  onClick={() =>
                    requestEmission.mutate({
                      saleId: sale.id,
                      establishmentId: selectedEstablishmentId,
                      documentModel,
                      environment,
                    })
                  }
                >
                  Solicitar Emissão Fiscal
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Items List */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Items</h3>
            <SaleItemsList items={sale.items || []} />
          </div>

          <Separator />

          {/* Totals */}
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium">${subtotal.toFixed(2)}</span>
            </div>

            {discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Discount</span>
                <span className="font-medium text-red-600">-${discount.toFixed(2)}</span>
              </div>
            )}

            {tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Tax</span>
                <span className="font-medium">${tax.toFixed(2)}</span>
              </div>
            )}

            <Separator />

            <div className="flex justify-between">
              <span className="font-semibold text-lg">Total</span>
              <span className="font-bold text-2xl text-green-600">
                ${total.toFixed(2)}
              </span>
            </div>
          </div>

          {sale.notes && (
            <>
              <Separator />
              <div className="space-y-2">
                <h4 className="font-semibold text-sm">Notes</h4>
                <p className="text-sm text-muted-foreground">{sale.notes}</p>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
