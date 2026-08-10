import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { businessSettingsService } from '../businessSettingsService';
import type { BusinessSettingsRequest } from '../businessSettings.types';
import { toast } from 'sonner';

export const SETTINGS_KEYS = {
  detail: ['business-settings'] as const,
};

export const useBusinessSettings = () => {
  return useQuery({
    queryKey: SETTINGS_KEYS.detail,
    queryFn: () => businessSettingsService.getSettings(),
  });
};

export const useUpdateBusinessSettings = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BusinessSettingsRequest) => businessSettingsService.updateSettings(data),
    onSuccess: (updated) => {
      queryClient.setQueryData(SETTINGS_KEYS.detail, updated);
      queryClient.invalidateQueries({ queryKey: SETTINGS_KEYS.detail });
      toast.success('Business settings updated successfully.');
    },
    onError: (error: any) => {
      const message =
        error.response?.data?.message ||
        error.message ||
        'Failed to update business settings.';
      toast.error(message);
    },
  });
};
