import { apiClient } from './apiClient';
import type {
    BatchRequestDto,
    BatchResponseDto,
    BatchCloseRequestDto,
    BatchCloseResponseDto,
    PartialSaleRequestDto, // <-- Added import
} from '../types/batch';

export const batchService = {
    createBatch: async (data: BatchRequestDto): Promise<BatchResponseDto> => {
        const response = await apiClient.post<BatchResponseDto>('/batches', data);
        return response.data;
    },

    getBatchById: async (batchId: number): Promise<BatchResponseDto> => {
        const response = await apiClient.get<BatchResponseDto>(`/batches/${batchId}`);
        return response.data;
    },

    // GET /api/v1/batches/section/{sectionId}
    getBatchesBySection: async (sectionId: number): Promise<BatchResponseDto[]> => {
        const response = await apiClient.get<BatchResponseDto[]>(`/batches/section/${sectionId}`);
        return response.data;
    },

    // GET /api/v1/batches/farm/{farmId}
    getBatchesByFarm: async (farmId: number): Promise<BatchResponseDto[]> => {
        const response = await apiClient.get<BatchResponseDto[]>(`/batches/farm/${farmId}`);
        return response.data;
    },

    logMortality: async (batchId: number, deathCount: number): Promise<void> => {
        await apiClient.patch(`/batches/${batchId}/mortality`, null, {
            params: { deathCount },
        });
    },

    closeBatch: async (
        batchId: number,
        data: BatchCloseRequestDto
    ): Promise<BatchCloseResponseDto> => {
        const response = await apiClient.patch<BatchCloseResponseDto>(
            `/batches/${batchId}/close`,
            data
        );
        return response.data;
    },

    // NEW: Partial Sale Endpoint
    recordPartialSale: async (
        batchId: number, 
        data: PartialSaleRequestDto
    ): Promise<void> => {
        await apiClient.patch(`/batches/${batchId}/partial-sale`, data);
    },
};