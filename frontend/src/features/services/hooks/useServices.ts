import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices, createService } from '@/api/endpoints/services';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';
import i18next from 'i18next';

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
