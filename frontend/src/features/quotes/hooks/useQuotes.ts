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
import i18next from 'i18next';
import { getApiErrorMessage } from '@/lib/api-error';

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
      toast.success(i18next.t('toast.quoteCreated'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, i18next.t('toast.quoteCreateError')));
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
      toast.success(i18next.t('toast.quoteUpdated'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, i18next.t('toast.quoteUpdateError')));
    },
  });
};

export const useDeleteQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTES] });
      toast.success(i18next.t('toast.quoteDeleted'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, i18next.t('toast.quoteDeleteError')));
    },
  });
};

export const useSendQuote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendQuote,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.QUOTES] });
      toast.success(i18next.t('toast.quoteSent'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, i18next.t('toast.quoteSendError')));
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
      toast.success(i18next.t('toast.quoteConverted'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, i18next.t('toast.quoteConvertError')));
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
      toast.success(i18next.t('toast.pdfDownloaded'));
    },
    onError: () => {
      toast.error(i18next.t('toast.pdfDownloadError'));
    },
  });
