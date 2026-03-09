import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInvoices,
  createInvoice,
  updateInvoice,
  deleteInvoice,
  sendInvoice,
  downloadInvoicePDF,
} from '@/api/endpoints/invoices';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';
import type { EstadoInvoice } from '@/types/enums';

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
      toast.success('Factura creada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al crear factura');
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
      toast.success('Factura actualizada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al actualizar factura');
    },
  });
};

export const useDeleteInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] });
      toast.success('Factura eliminada');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al eliminar factura');
    },
  });
};

export const useSendInvoice = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: sendInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVOICES] });
      toast.success('Factura enviada y numerada correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al enviar factura');
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
      toast.success('PDF descargado');
    },
    onError: () => {
      toast.error('Error al descargar PDF');
    },
  });
