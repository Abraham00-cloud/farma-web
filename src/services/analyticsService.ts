import { apiClient } from './apiClient';
import type { BatchPerformanceDashboardDto } from '../types/analytics';

export const analyticsService = {
    // GET /api/v1/analytics/batch/{batchId}/dashboard
    getBatchPerformanceDashboard: async (batchId: number): Promise<BatchPerformanceDashboardDto> => {
        const response = await apiClient.get<BatchPerformanceDashboardDto>(
            `/analytics/batch/${batchId}/dashboard`
        );
        return response.data;
    },
};