import { apiClient } from '../../../api/apiClient';
import type { BusinessSettingsResponse, BusinessSettingsRequest } from './businessSettings.types';

export const businessSettingsService = {
  getSettings: async (): Promise<BusinessSettingsResponse> => {
    const response = await apiClient.get<BusinessSettingsResponse>('/business-settings');
    return response.data;
  },

  updateSettings: async (data: BusinessSettingsRequest): Promise<BusinessSettingsResponse> => {
    const response = await apiClient.put<BusinessSettingsResponse>('/business-settings', data);
    return response.data;
  },
};
