import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import api from '@/lib/api';
import {
  CertificateMetadata,
  CscMetadata,
  Establishment,
  EstablishmentFormData,
  FiscalAttachmentMetadata,
  FiscalAttachmentPayload,
  FiscalReadinessItem,
  ReplaceCertificatePayload,
  ReplaceCscPayload,
  SecureFileUploadResult,
} from '@/types';

export function useEstablishments() {
  return useQuery<Establishment[]>({
    queryKey: ['fiscal-establishments'],
    queryFn: async () => {
      const response = await api.get('/fiscal/establishments');
      return response.data;
    },
  });
}

export function useCreateEstablishment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: EstablishmentFormData) => {
      const response = await api.post('/fiscal/establishments', data);
      return response.data as Establishment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-establishments'] });
      toast.success('Estabelecimento fiscal criado com sucesso');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao criar estabelecimento');
    },
  });
}

export function useUpdateEstablishment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      establishmentId,
      data,
    }: {
      establishmentId: string;
      data: Partial<EstablishmentFormData>;
    }) => {
      const response = await api.patch(`/fiscal/establishments/${establishmentId}`, data);
      return response.data as Establishment;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fiscal-establishments'] });
      toast.success('Estabelecimento fiscal atualizado com sucesso');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao atualizar estabelecimento');
    },
  });
}

export function useFiscalReadiness(establishmentId: string | null) {
  return useQuery<FiscalReadinessItem[]>({
    queryKey: ['fiscal-readiness', establishmentId],
    queryFn: async () => {
      const response = await api.get(
        `/fiscal/establishments/${establishmentId}/readiness`,
      );
      return response.data;
    },
    enabled: !!establishmentId,
  });
}

export function useUploadFiscalFile() {
  return useMutation({
    mutationFn: async ({
      establishmentId,
      category,
      file,
    }: {
      establishmentId: string;
      category: 'CERTIFICATE' | 'ATTACHMENT';
      file: File;
    }) => {
      const contentBase64 = await fileToBase64(file);
      const response = await api.post(
        `/fiscal/establishments/${establishmentId}/files`,
        {
          originalFileName: file.name,
          mimeType: file.type || 'application/octet-stream',
          contentBase64,
          category,
        },
      );

      return response.data as SecureFileUploadResult;
    },
  });
}

export function useReplaceCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      establishmentId,
      data,
    }: {
      establishmentId: string;
      data: ReplaceCertificatePayload;
    }) => {
      const response = await api.post(
        `/fiscal/establishments/${establishmentId}/certificates/replace`,
        data,
      );
      return response.data as CertificateMetadata;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['fiscal-certificates', variables.establishmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['fiscal-readiness', variables.establishmentId],
      });
      toast.success('Certificado atualizado com sucesso');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao atualizar certificado');
    },
  });
}

export function useCertificates(establishmentId: string | null) {
  return useQuery<CertificateMetadata[]>({
    queryKey: ['fiscal-certificates', establishmentId],
    queryFn: async () => {
      const response = await api.get(
        `/fiscal/establishments/${establishmentId}/certificates`,
      );
      return response.data;
    },
    enabled: !!establishmentId,
  });
}

export function useReplaceCsc() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      establishmentId,
      data,
    }: {
      establishmentId: string;
      data: ReplaceCscPayload;
    }) => {
      const response = await api.post(
        `/fiscal/establishments/${establishmentId}/csc/replace`,
        data,
      );
      return response.data as CscMetadata;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['fiscal-csc', variables.establishmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['fiscal-readiness', variables.establishmentId],
      });
      toast.success('CSC atualizado com sucesso');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao atualizar CSC');
    },
  });
}

export function useCscConfigs(establishmentId: string | null) {
  return useQuery<CscMetadata[]>({
    queryKey: ['fiscal-csc', establishmentId],
    queryFn: async () => {
      const response = await api.get(`/fiscal/establishments/${establishmentId}/csc`);
      return response.data;
    },
    enabled: !!establishmentId,
  });
}

export function useCreateFiscalAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      establishmentId,
      data,
    }: {
      establishmentId: string;
      data: FiscalAttachmentPayload;
    }) => {
      const response = await api.post(
        `/fiscal/establishments/${establishmentId}/attachments`,
        data,
      );
      return response.data as FiscalAttachmentMetadata;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['fiscal-attachments', variables.establishmentId],
      });
      queryClient.invalidateQueries({
        queryKey: ['fiscal-readiness', variables.establishmentId],
      });
      toast.success('Anexo fiscal registrado com sucesso');
    },
    onError: (error) => {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Falha ao registrar anexo fiscal');
    },
  });
}

export function useFiscalAttachments(establishmentId: string | null) {
  return useQuery<FiscalAttachmentMetadata[]>({
    queryKey: ['fiscal-attachments', establishmentId],
    queryFn: async () => {
      const response = await api.get(
        `/fiscal/establishments/${establishmentId}/attachments`,
      );
      return response.data;
    },
    enabled: !!establishmentId,
  });
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('Invalid file content'));
        return;
      }

      const [, base64] = result.split(',');
      resolve(base64 || '');
    };
    reader.onerror = () => reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}
