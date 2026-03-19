import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
  resendInvoice,
  copyInvoice,
  downloadInvoicePDF,
} from '@/api/endpoints/invoices';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';
import type { EstadoInvoice } from '@/types/enums';
import i18next from 'i18next';
import { getApiErrorMessage } from '@/lib/api-error';

interface InvoiceFilters {
  estado?: EstadoInvoice;
  clientId?: string;
}

export const useInvoices = (filters?: InvoiceFilters) =>
  useQuery({
    queryKey: [QUERY_KEYS.INVOICES, filters],
    queryFn: () => getInvoices(filters),
    select: (data) => data.data,
  });

export const useCreateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] });
      toast.success(i18next.t('toast.invoiceCreated'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, i18next.t('toast.invoiceCreateError')));
    },
  });
};

export const useUpdateInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateInvoice>[1] }) =>
      updateInvoice(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] });
      toast.success(i18next.t('toast.invoiceUpdated'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, i18next.t('toast.invoiceUpdateError')));
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] });
      toast.success(i18next.t('toast.invoiceDeleted'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, i18next.t('toast.invoiceDeleteError')));
    },
  });
};

export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] });
      toast.success(i18next.t('toast.invoiceSent'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, i18next.t('toast.invoiceSendError')));
    },
  });
};

export const useResendInvoice = () => {
  return useMutation({
    mutationFn: resendInvoice,
    onSuccess: () => {
      toast.success(i18next.t('toast.invoiceResent'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, i18next.t('toast.invoiceResendError')));
    },
  });
};

export const useCopyInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: copyInvoice,
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] });
      toast.success(i18next.t('toast.invoiceCopied'));
    },
    onError: (error: unknown) => {
      toast.error(getApiErrorMessage(error, i18next.t('toast.invoiceCopyError')));
    },
  });
};

export const useDownloadInvoicePDF = () =>
  useMutation({
    mutationFn: downloadInvoicePDF,
    onSuccess: (blob, id) => {
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `factura-${id}.pdf`;
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
