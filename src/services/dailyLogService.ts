import { apiClient } from './apiClient';
import type { DailyLogRequestDto, DailyLogResponseDto } from '../types/dailyLog';
import type { SpringPage } from '../types/pagination';

export const dailyLogService = {
    createDailyLog: async (data: DailyLogRequestDto): Promise<DailyLogResponseDto> => {
        const response = await apiClient.post<DailyLogResponseDto>('/daily-logs', data);
        return response.data;
    },

    getLogsForBatch: async (
        batchId: number, 
        page: number = 0, 
        size: number = 50 
    ): Promise<DailyLogResponseDto[]> => {
        const response = await apiClient.get<SpringPage<DailyLogResponseDto>>(
            `/daily-logs/batch/${batchId}?page=${page}&size=${size}`
        );
        return response.data.content; 
    },

    getLogsForBatchInWindow: async (
        batchId: number,
        startDate: string,
        endDate: string,
        page: number = 0,
        size: number = 50
    ): Promise<DailyLogResponseDto[]> => {
        const response = await apiClient.get<SpringPage<DailyLogResponseDto>>(
            `/daily-logs/batch/${batchId}/window`,
            { params: { startDate, endDate, page, size } }
        );
        return response.data.content;
    },

    updateLog: async (logId: number, data: DailyLogRequestDto): Promise<DailyLogResponseDto> => {
        const response = await apiClient.put<DailyLogResponseDto>(`/daily-logs/${logId}`, data);
        return response.data;
    },

    deleteLog: async (logId: number): Promise<void> => {
        await apiClient.delete(`/daily-logs/${logId}`);
    }
};