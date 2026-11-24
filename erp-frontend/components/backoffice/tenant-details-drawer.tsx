'use client';

import { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PageLoading } from '@/components/ui/loading-spinner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Building2, FileDown, FileText, Mail, ShieldCheck, UserPlus, Users } from 'lucide-react';
import {
  useBackofficeTenant,
  useBackofficeTenantUsers,
  useCreateTenantUser,
  useToggleTenantUserStatus,
} from '@/hooks/use-backoffice';
import {
  useBackofficeTenantFiscalDocuments,
  useBackofficeTenantEstablishments,
  useBackofficeFiscalTransmissionMode,
  useRecoverBackofficeStuckEmissions,
  useSetBackofficeFiscalTransmissionMode,
  useBackofficeTenantFiscalQueue,
  useBackofficeTenantReadiness,
  useBackofficeDownloadAuthorizedXmlFile,
  useBackofficeGetDanfeHtml,
} from '@/hooks/use-backoffice-fiscal';

interface TenantDetailsDrawerProps {
  tenantId: string;
  open: boolean;
  onClose: () => void;
}

export function TenantDetailsDrawer({
  tenantId,
  open,
  onClose,
}: TenantDetailsDrawerProps) {
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | null>(null);
  const [newUserData, setNewUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'cashier' as 'admin' | 'manager' | 'cashier' | 'user',
  });

  const { data: tenant, isLoading: isTenantLoading } = useBackofficeTenant(tenantId);
  const { data: users, isLoading: isUsersLoading } = useBackofficeTenantUsers(tenantId);
  const { data: establishments, isLoading: isEstablishmentsLoading } =
    useBackofficeTenantEstablishments(tenantId);
  const { data: readiness, isLoading: isReadinessLoading } = useBackofficeTenantReadiness(
    tenantId,
    selectedEstablishmentId,
  );
  const { data: fiscalDocuments = [], isLoading: isDocumentsLoading } =
    useBackofficeTenantFiscalDocuments(tenantId, 20);
  const { data: transmissionModePayload, isLoading: isTransmissionModeLoading } =
    useBackofficeFiscalTransmissionMode(tenantId);
  const { data: fiscalQueue = [], isLoading: isQueueLoading } = useBackofficeTenantFiscalQueue(tenantId);
  const setTransmissionMode = useSetBackofficeFiscalTransmissionMode();
  const recoverStuckEmissions = useRecoverBackofficeStuckEmissions();
  const downloadAuthorizedXmlFile = useBackofficeDownloadAuthorizedXmlFile();
  const getDanfeHtml = useBackofficeGetDanfeHtml();
  const createTenantUser = useCreateTenantUser();
  const toggleTenantUserStatus = useToggleTenantUserStatus();
  const transmissionMode = transmissionModePayload?.mode;

  const isLoading = isTenantLoading || isUsersLoading || isEstablishmentsLoading;

  const handleCreateUser = async () => {
    await createTenantUser.mutateAsync({
      tenantId,
      data: newUserData,
    });

    setNewUserData({
      name: '',
      email: '',
      password: '',
      role: 'cashier',
    });
    setIsCreateUserOpen(false);
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-full">
            <PageLoading />
          </div>
        ) : (
          <>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {tenant?.name}
              </SheetTitle>
              <SheetDescription>
                Detalhes e usuários da empresa
              </SheetDescription>
            </SheetHeader>

            <div className="mt-6 space-y-6">
              {/* Tenant Info */}
              <div className="space-y-4">
                <h3 className="font-semibold">Informações</h3>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Nome:</span>
                    <span className="font-medium">{tenant?.name}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span className="text-muted-foreground">Slug:</span>
                    <span className="font-mono text-xs">{tenant?.slug}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Criado:</span>
                    <span>
                      {tenant?.createdAt
                        ? formatDistanceToNow(new Date(tenant.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })
                        : '-'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge variant={tenant?.isActive ? 'default' : 'secondary'}>
                      {tenant?.isActive ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Users List */}
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <h3 className="font-semibold">
                      Usuários ({users?.length || 0})
                    </h3>
                  </div>

                  <Button size="sm" onClick={() => setIsCreateUserOpen(true)}>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Novo Usuário
                  </Button>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4" />
                    <h3 className="font-semibold">Notas Emitidas Recentes</h3>
                  </div>

                  {isDocumentsLoading ? (
                    <div className="text-sm text-muted-foreground">Carregando notas...</div>
                  ) : fiscalDocuments.length === 0 ? (
                    <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                      Nenhuma nota fiscal encontrada para esta empresa.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {fiscalDocuments.map((doc) => (
                        <div key={doc.id} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">
                              {doc.documentModel} · {doc.environment}
                            </span>
                            <Badge variant={doc.state === 'AUTHORIZED' ? 'default' : 'secondary'}>
                              {doc.state}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Série/Número: {doc.series}/{doc.number}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Protocolo: {doc.protocolNumber || '-'}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Atualizada{' '}
                            {formatDistanceToNow(new Date(doc.updatedAt), {
                              addSuffix: true,
                              locale: ptBR,
                            })}
                          </div>
                          <div className="flex flex-wrap gap-2 pt-1">
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={downloadAuthorizedXmlFile.isPending}
                              onClick={async () => {
                                const payload = await downloadAuthorizedXmlFile.mutateAsync({
                                  tenantId,
                                  documentId: doc.id,
                                });

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
                              type="button"
                              size="sm"
                              variant="outline"
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
                                  const html = await getDanfeHtml.mutateAsync({
                                    tenantId,
                                    documentId: doc.id,
                                  });
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
                </div>

                <Separator />

                <div className="space-y-3">
                  {users?.map((user) => (
                    <div
                      key={user.id}
                      className="rounded-lg border p-3 space-y-2"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{user.name}</span>
                        <Badge variant="outline" className="capitalize">
                          {user.role}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {user.email}
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs text-muted-foreground">
                          Criado{' '}
                          {formatDistanceToNow(new Date(user.createdAt), {
                            addSuffix: true,
                            locale: ptBR,
                          })}
                        </span>

                        <Button
                          variant="outline"
                          size="sm"
                          disabled={toggleTenantUserStatus.isPending}
                          onClick={() =>
                            toggleTenantUserStatus.mutate({
                              tenantId,
                              userId: user.id,
                              isActive: !user.isActive,
                            })
                          }
                        >
                          {user.isActive ? 'Desativar' : 'Ativar'}
                        </Button>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge
                          variant={user.isActive ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {user.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                    </div>
                  ))}

                  {users?.length === 0 && (
                    <div className="text-center text-sm text-muted-foreground py-8">
                      Nenhum usuário cadastrado
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <h3 className="font-semibold">Fila de Emissão Fiscal</h3>
                </div>

                <div className="rounded-lg border p-3 space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium">Modo de Transmissão</span>
                    {isTransmissionModeLoading ? (
                      <span className="text-xs text-muted-foreground">Carregando...</span>
                    ) : (
                      <Badge variant={transmissionMode === 'MOCK' ? 'secondary' : 'default'}>
                        {transmissionMode || '-'}
                      </Badge>
                    )}
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      variant={transmissionMode === 'MOCK' ? 'default' : 'outline'}
                      disabled={setTransmissionMode.isPending}
                      onClick={() =>
                        setTransmissionMode.mutate({
                          tenantId,
                          mode: 'MOCK',
                        })
                      }
                    >
                      Usar MOCK
                    </Button>
                    <Button
                      variant={transmissionMode === 'SEFAZ' ? 'default' : 'outline'}
                      disabled={setTransmissionMode.isPending}
                      onClick={() =>
                        setTransmissionMode.mutate({
                          tenantId,
                          mode: 'SEFAZ',
                        })
                      }
                    >
                      Usar SEFAZ
                    </Button>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-2">
                    <Button
                      variant="outline"
                      disabled={recoverStuckEmissions.isPending}
                      onClick={() =>
                        recoverStuckEmissions.mutate({
                          tenantId,
                          dryRun: true,
                          limit: 100,
                          transmissionMode: transmissionMode || 'MOCK',
                        })
                      }
                    >
                      Simular Recuperação
                    </Button>
                    <Button
                      disabled={recoverStuckEmissions.isPending}
                      onClick={() =>
                        recoverStuckEmissions.mutate({
                          tenantId,
                          dryRun: false,
                          limit: 100,
                          transmissionMode: transmissionMode || 'MOCK',
                        })
                      }
                    >
                      Recuperar Travadas
                    </Button>
                  </div>
                </div>

                {isQueueLoading ? (
                  <div className="text-sm text-muted-foreground">Carregando fila...</div>
                ) : fiscalQueue.length === 0 ? (
                  <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                    Nenhuma emissão pendente para esta empresa.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {fiscalQueue.map((item) => {
                      const fiscalDocumentId =
                        typeof (item.payload as Record<string, unknown> | undefined)?.fiscalDocumentId === 'string'
                          ? (item.payload as Record<string, unknown>).fiscalDocumentId
                          : item.aggregateId;

                      return (
                        <div key={item.id} className="rounded-lg border p-3 space-y-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium capitalize">{item.operation.toLowerCase()}</span>
                            <Badge variant={item.status === 'PENDING' ? 'secondary' : 'default'}>
                              {item.status}
                            </Badge>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Documento: {String(fiscalDocumentId)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Tentativas: {item.attempts} · Próximo: {item.nextAttemptAt ? formatDistanceToNow(new Date(item.nextAttemptAt), { addSuffix: true, locale: ptBR }) : 'agora'}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  <h3 className="font-semibold">Configuração Fiscal</h3>
                </div>

                {!establishments?.length ? (
                  <div className="rounded-lg border p-3 text-sm text-muted-foreground">
                    Nenhum estabelecimento fiscal cadastrado para este tenant.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {establishments.map((establishment) => (
                      <button
                        key={establishment.id}
                        type="button"
                        onClick={() => setSelectedEstablishmentId(establishment.id)}
                        className="w-full rounded-lg border p-3 text-left hover:bg-muted/40"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{establishment.legalName}</span>
                          <Badge variant={establishment.isActive ? 'default' : 'secondary'}>
                            {establishment.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          CNPJ {establishment.cnpj} · {establishment.stateCode || '-'}
                        </p>
                      </button>
                    ))}

                    {selectedEstablishmentId && (
                      <div className="rounded-lg border p-3 space-y-2">
                        <div className="text-xs uppercase text-muted-foreground">Prontidão Fiscal</div>
                        {isReadinessLoading ? (
                          <div className="text-sm text-muted-foreground">Carregando prontidão...</div>
                        ) : (
                          readiness?.map((item) => (
                            <div key={`${item.documentModel}-${item.environment}`} className="rounded border p-2">
                              <div className="flex items-center justify-between gap-2 text-sm">
                                <span>{item.documentModel} · {item.environment}</span>
                                <Badge variant={item.canProceed ? 'default' : 'secondary'}>
                                  {item.status}
                                </Badge>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Novo Usuário</DialogTitle>
                  <DialogDescription>
                    Crie um usuário para a empresa {tenant?.name}
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input
                      id="name"
                      value={newUserData.name}
                      onChange={(e) =>
                        setNewUserData((prev) => ({ ...prev, name: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newUserData.email}
                      onChange={(e) =>
                        setNewUserData((prev) => ({ ...prev, email: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password">Senha</Label>
                    <Input
                      id="password"
                      type="password"
                      value={newUserData.password}
                      onChange={(e) =>
                        setNewUserData((prev) => ({ ...prev, password: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Papel</Label>
                    <Select
                      value={newUserData.role}
                      onValueChange={(value: 'admin' | 'manager' | 'cashier' | 'user') =>
                        setNewUserData((prev) => ({ ...prev, role: value }))
                      }
                    >
                      <SelectTrigger id="role">
                        <SelectValue placeholder="Selecione o papel" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="cashier">Cashier</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateUserOpen(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreateUser}
                    disabled={
                      createTenantUser.isPending ||
                      !newUserData.name ||
                      !newUserData.email ||
                      !newUserData.password
                    }
                  >
                    {createTenantUser.isPending ? 'Criando...' : 'Criar Usuário'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
