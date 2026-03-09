import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getServices, createService } from '@/api/endpoints/services';
import { QUERY_KEYS } from '@/lib/constants';
import { toast } from 'sonner';

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
      toast.success('Servicio creado correctamente');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Error al crear servicio');
    },
  });
};
