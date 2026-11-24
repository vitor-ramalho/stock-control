import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Establishment,
  FiscalDocument,
  FiscalQueueItem,
  FiscalReadinessItem,
  FiscalRecoveryResult,
  FiscalTransmissionMode,
} from '@/types';
import { toast } from 'sonner';

export function useBackofficeTenantEstablishments(tenantId: string) {
  return useQuery<Establishment[]>({
    queryKey: ['backoffice-fiscal-establishments', tenantId],
    queryFn: async () => {
      const response = await api.get(`/backoffice/fiscal/tenants/${tenantId}/establishments`);
      return response.data;
    },
    enabled: !!tenantId,
  });
}

export function useBackofficeTenantReadiness(
  tenantId: string,
  establishmentId: string | null,
) {
  return useQuery<FiscalReadinessItem[]>({
    queryKey: ['backoffice-fiscal-readiness', tenantId, establishmentId],
    queryFn: async () => {
      const response = await api.get(
        `/backoffice/fiscal/tenants/${tenantId}/establishments/${establishmentId}/readiness`,
      );
      return response.data;
    },
    enabled: !!tenantId && !!establishmentId,
  });
}

export function useBackofficeTenantFiscalQueue(tenantId: string) {
  return useQuery<FiscalQueueItem[]>({
    queryKey: ['backoffice-fiscal-queue', tenantId],
    queryFn: async () => {
      const response = await api.get('/fiscal/documents/queue/pending', {
        headers: {
          'X-Tenant-ID': tenantId,
        },
      });
      return response.data;
    },
    enabled: !!tenantId,
  });
}

export function useBackofficeTenantFiscalDocuments(tenantId: string, limit = 20) {
  return useQuery<FiscalDocument[]>({
    queryKey: ['backoffice-fiscal-documents', tenantId, limit],
    queryFn: async () => {
      const response = await api.get('/fiscal/documents', {
        params: { limit },
        headers: {
          'X-Tenant-ID': tenantId,
        },
      });
      return response.data;
    },
    enabled: !!tenantId,
    staleTime: 10000,
  });
}

export function useBackofficeFiscalTransmissionMode(tenantId: string) {
  return useQuery<{ mode: FiscalTransmissionMode }>({
    queryKey: ['backoffice-fiscal-transmission-mode', tenantId],
    queryFn: async () => {
      const response = await api.get('/fiscal/documents/transmission-mode', {
        headers: {
          'X-Tenant-ID': tenantId,
        },
      });
      return response.data;
    },
    enabled: !!tenantId,
    staleTime: 5000,
  });
}

export function useSetBackofficeFiscalTransmissionMode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      tenantId: string;
      mode: FiscalTransmissionMode;
    }) => {
      const response = await api.post(
        '/fiscal/documents/transmission-mode',
        { mode: payload.mode },
        {
          headers: {
            'X-Tenant-ID': payload.tenantId,
          },
        },
      );
      return response.data as { mode: FiscalTransmissionMode };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['backoffice-fiscal-transmission-mode', variables.tenantId],
      });
      toast.success('Modo de transmissão fiscal atualizado');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao atualizar modo fiscal');
    },
  });
}

export function useRecoverBackofficeStuckEmissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      tenantId: string;
      dryRun: boolean;
      limit?: number;
      transmissionMode?: FiscalTransmissionMode;
    }) => {
      const response = await api.post(
        '/fiscal/documents/recovery/stuck-emissions',
        {
          dryRun: payload.dryRun,
          limit: payload.limit,
          transmissionMode: payload.transmissionMode,
        },
        {
          headers: {
            'X-Tenant-ID': payload.tenantId,
          },
        },
      );
      return response.data as FiscalRecoveryResult;
    },
    onSuccess: (result, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['backoffice-fiscal-queue', variables.tenantId],
      });
      queryClient.invalidateQueries({
        queryKey: ['backoffice-fiscal-documents', variables.tenantId],
      });
      queryClient.invalidateQueries({
        queryKey: ['backoffice-fiscal-transmission-mode', variables.tenantId],
      });
      if (result.dryRun) {
        toast.success(`Dry-run: ${result.documentsFound} nota(s) encontrada(s)`);
      } else {
        toast.success(
          `Recuperadas ${result.documentsRecovered} nota(s), ${result.queueItemsReset} item(ns) de fila resetados`,
        );
      }
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao recuperar notas travadas');
    },
  });
}

export function useBackofficeDownloadAuthorizedXmlFile() {
  return useMutation({
    mutationFn: async (payload: { tenantId: string; documentId: string }) => {
      const response = await api.get(`/fiscal/documents/${payload.documentId}/xml/download`, {
        responseType: 'blob',
        headers: {
          'X-Tenant-ID': payload.tenantId,
        },
      });

      const disposition = response.headers['content-disposition'] as string | undefined;
      const fileNameMatch = disposition?.match(/filename="([^"]+)"/i);
      return {
        blob: response.data as Blob,
        fileName: fileNameMatch?.[1] || `nfe-${payload.documentId}.xml`,
      };
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao baixar XML autorizado');
    },
  });
}

export function useBackofficeGetDanfeHtml() {
  return useMutation({
    mutationFn: async (payload: { tenantId: string; documentId: string }) => {
      const response = await api.get(`/fiscal/documents/${payload.documentId}/danfe`, {
        responseType: 'text',
        headers: {
          'X-Tenant-ID': payload.tenantId,
        },
      });
      return response.data as string;
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao carregar DANFE');
    },
  });
}
