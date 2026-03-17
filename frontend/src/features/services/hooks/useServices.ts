import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices, createService, updateService } from '@/api/endpoints/services';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';
import i18next from 'i18next';
import type { ServiceInput } from '@/schemas/service.schema';

export const useServices = () =>
  useQuery({
    queryKey: [QUERY_KEYS.SERVICES],
    queryFn: getServices,
    select: (data) => data.data,
  });

export const useCreateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createService,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] });
      toast.success(i18next.t('toast.serviceCreated'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || i18next.t('toast.serviceCreateError'));
    },
  });
};

export const useUpdateService = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ServiceInput }) => updateService(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.SERVICES] });
      toast.success(i18next.t('toast.serviceUpdated'));
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || i18next.t('toast.serviceUpdateError'));
    },
  });
};
