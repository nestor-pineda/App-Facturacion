import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getQuotes,
  createQuote,
  updateQuote,
  deleteQuote,
  sendQuote,
  convertQuoteToInvoice,
  downloadQuotePDF,
} from '@/api/endpoints/quotes';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';
import type { EstadoQuote } from '@/types/enums';

interface QuoteFilters {
  estado?: EstadoQuote;
  clientId?: string;
}

export const useQuotes = (filters?: QuoteFilters) =>
  useQuery({
    queryKey: [QUERY_KEYS.QUOTES, filters],
    queryFn: () => getQuotes(filters),
    select: (data) => data.data,
  });

export const useCreateQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTES] });
      toast.success('Presupuesto creado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al crear presupuesto');
    },
  });
};

export const useUpdateQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateQuote>[1] }) =>
      updateQuote(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTES] });
      toast.success('Presupuesto actualizado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al actualizar presupuesto');
    },
  });
};

export const useDeleteQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTES] });
      toast.success('Presupuesto eliminado');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al eliminar presupuesto');
    },
  });
};

export const useSendQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTES] });
      toast.success('Presupuesto enviado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al enviar presupuesto');
    },
  });
};

export const useConvertQuoteToInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, fechaEmision }: { id: string; fechaEmision?: string }) =>
      convertQuoteToInvoice(id, fechaEmision),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTES] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] });
      toast.success('Presupuesto convertido a factura');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al convertir presupuesto');
    },
  });
};

export const useDownloadQuotePDF = () =>
  useMutation({
    mutationFn: downloadQuotePDF,
    onSuccess: (blob, id) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `presupuesto-${id}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success('PDF descargado');
    },
    onError: () => {
      toast.error('Error al descargar PDF');
    },
  });
