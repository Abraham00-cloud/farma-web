import { apiClient } from './apiClient';
import type { SystemAlertResponse, AlertResolutionRequest } from '../types/analytics';

export const alertService = {
    // GET /api/v1/alerts/batch/{batchId}
    getActiveAlertsForBatch: async (batchId: number): Promise<SystemAlertResponse[]> => {
        const response = await apiClient.get<SystemAlertResponse[]>(`/alerts/batch/${batchId}`);
        return response.data;
    },

    // PATCH /api/v1/alerts/{alertId}/acknowledge
    acknowledgeAlert: async (alertId: number): Promise<void> => {
        await apiClient.patch(`/alerts/${alertId}/acknowledge`);
    },

    // PATCH /api/v1/alerts/{alertId}/resolve
    resolveAlert: async (
        alertId: number,
        data: AlertResolutionRequest
    ): Promise<SystemAlertResponse> => {
        const response = await apiClient.patch<SystemAlertResponse>(
            `/alerts/${alertId}/resolve`,
            data
        );
        return response.data;
    },
};