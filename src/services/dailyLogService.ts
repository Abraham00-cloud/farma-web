import { apiClient } from './apiClient';
import type { DailyLogRequestDto, DailyLogResponseDto } from '../types/dailyLog';

export const dailyLogService = {
    // POST /api/v1/daily-logs
    createDailyLog: async (data: DailyLogRequestDto): Promise<DailyLogResponseDto> => {
        const response = await apiClient.post<DailyLogResponseDto>('/daily-logs', data);
        return response.data;
    },

    // GET /api/v1/daily-logs/batch/{batchId}
    getLogsForBatch: async (batchId: number): Promise<DailyLogResponseDto[]> => {
        const response = await apiClient.get<DailyLogResponseDto[]>(`/daily-logs/batch/${batchId}`);
        return response.data;
    },

    // GET /api/v1/daily-logs/batch/{batchId}/window
    getLogsForBatchInWindow: async (
        batchId: number,
        startDate: string,
        endDate: string
    ): Promise<DailyLogResponseDto[]> => {
        const response = await apiClient.get<DailyLogResponseDto[]>(
            `/daily-logs/batch/${batchId}/window`,
            { params: { startDate, endDate } }
        );
        return response.data;
    },
};