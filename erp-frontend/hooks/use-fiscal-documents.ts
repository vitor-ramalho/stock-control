import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  FiscalDocument,
  FiscalEvent,
  FiscalStateHistoryEntry,
  FiscalTransmissionAttempt,
} from '@/types';
import { toast } from 'sonner';

export function useFiscalDocumentBySale(saleId: string | null) {
  return useQuery<FiscalDocument | null>({
    queryKey: ['fiscal-document-by-sale', saleId],
    queryFn: async () => {
      const response = await api.get(`/fiscal/documents/sale/${saleId}`);
      return response.data;
    },
    enabled: !!saleId,
    staleTime: 15000,
  });
}

export function useFiscalDocuments(limit = 20) {
  return useQuery<FiscalDocument[]>({
    queryKey: ['fiscal-documents', limit],
    queryFn: async () => {
      const response = await api.get('/fiscal/documents', {
        params: { limit },
      });
      return response.data;
    },
    staleTime: 10000,
  });
}

export function useFiscalDocumentEvents(documentId: string | null) {
  return useQuery<FiscalEvent[]>({
    queryKey: ['fiscal-document-events', documentId],
    queryFn: async () => {
      const response = await api.get(`/fiscal/documents/${documentId}/events`);
      return response.data;
    },
    enabled: !!documentId,
  });
}

export function useFiscalDocumentAttempts(documentId: string | null) {
  return useQuery<FiscalTransmissionAttempt[]>({
    queryKey: ['fiscal-document-attempts', documentId],
    queryFn: async () => {
      const response = await api.get(`/fiscal/documents/${documentId}/attempts`);
      return response.data;
    },
    enabled: !!documentId,
  });
}

export function useFiscalDocumentHistory(documentId: string | null) {
  return useQuery<FiscalStateHistoryEntry[]>({
    queryKey: ['fiscal-document-history', documentId],
    queryFn: async () => {
      const response = await api.get(`/fiscal/documents/${documentId}/history`);
      return response.data;
    },
    enabled: !!documentId,
  });
}

export function useRequestFiscalEmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      saleId: string;
      establishmentId: string;
      documentModel: 'NFE_55' | 'NFCE_65';
      environment: 'HOMOLOGATION' | 'PRODUCTION';
      series?: number;
    }) => {
      const idempotency = `sale-${payload.saleId}-${payload.documentModel}-${payload.environment}`;
      const response = await api.post('/fiscal/documents/emissions', payload, {
        headers: {
          'x-idempotency-key': idempotency,
        },
      });
      return response.data as FiscalDocument;
    },
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-by-sale', doc.saleId] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-events', doc.id] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-history', doc.id] });
      toast.success('Emissão fiscal solicitada com sucesso');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao solicitar emissão fiscal');
    },
  });
}

export function useRequestFiscalCancel() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { documentId: string; reason: string }) => {
      const response = await api.post(
        `/fiscal/documents/${payload.documentId}/cancel`,
        { reason: payload.reason },
      );
      return response.data as FiscalDocument;
    },
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-by-sale', doc.saleId] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-events', doc.id] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-history', doc.id] });
      toast.success('Cancelamento solicitado');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao solicitar cancelamento');
    },
  });
}

export function useRequestFiscalVoid() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      documentId: string;
      startNumber: number;
      endNumber: number;
      justification: string;
    }) => {
      const response = await api.post(
        `/fiscal/documents/${payload.documentId}/void-number`,
        {
          startNumber: payload.startNumber,
          endNumber: payload.endNumber,
          justification: payload.justification,
        },
      );
      return response.data as FiscalDocument;
    },
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-by-sale', doc.saleId] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-events', doc.id] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-history', doc.id] });
      toast.success('Inutilização solicitada');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao solicitar inutilização');
    },
  });
}

export function useRequestFiscalReconciliation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.post(`/fiscal/documents/${documentId}/reconcile-status`);
      return response.data as FiscalDocument;
    },
    onSuccess: (doc) => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-by-sale', doc.saleId] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-events', doc.id] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-attempts', doc.id] });
      queryClient.invalidateQueries({ queryKey: ['fiscal-document-history', doc.id] });
      toast.success('Reconciliação de status solicitada');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao solicitar reconciliação');
    },
  });
}

export function useDownloadAuthorizedXml() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.get(`/fiscal/documents/${documentId}/xml`);
      return response.data as { xml: string };
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao carregar XML autorizado');
    },
  });
}

export function useDownloadAuthorizedXmlFile() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.get(`/fiscal/documents/${documentId}/xml/download`, {
        responseType: 'blob',
      });

      const disposition = response.headers['content-disposition'] as string | undefined;
      const fileNameMatch = disposition?.match(/filename="([^"]+)"/i);
      return {
        blob: response.data as Blob,
        fileName: fileNameMatch?.[1] || `nfe-${documentId}.xml`,
      };
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao baixar XML autorizado');
    },
  });
}

export function useGetDanfeHtml() {
  return useMutation({
    mutationFn: async (documentId: string) => {
      const response = await api.get(`/fiscal/documents/${documentId}/danfe`, {
        responseType: 'text',
      });
      return response.data as string;
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao carregar DANFE');
    },
  });
}
