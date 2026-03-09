import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getClients, createClient, updateClient } from '@/api/endpoints/clients';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';
import type { ClientInput } from '@/schemas/client.schema';
import i18next from 'i18next';

export const useClients = () =>
  useQuery({
    queryKey: [QUERY_KEYS.CLIENTS],
    queryFn: getClients,
    select: (data) => data.data,
  });

export const useCreateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createClient,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] });
      toast.success(i18next.t('toast.clientCreated'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || i18next.t('toast.clientCreateError'));
    },
  });
};

export const useUpdateClient = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClientInput }) => updateClient(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CLIENTS] });
      toast.success(i18next.t('toast.clientUpdated'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || i18next.t('toast.clientUpdateError'));
    },
  });
};
