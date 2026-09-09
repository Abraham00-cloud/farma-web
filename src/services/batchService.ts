import { apiClient } from './apiClient';
import type {
    BatchRequestDto,
    BatchResponseDto,
    BatchCloseRequestDto,
    BatchCloseResponseDto,
    PartialSaleRequestDto,
} from '../types/batch';
import type { SpringPage } from '../types/pagination';

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
    getBatchesBySection: async (
        sectionId: number,
        page: number = 0,
        size: number = 100 // Fetch a large default page to cover all batches in a section
    ): Promise<BatchResponseDto[]> => {
        const response = await apiClient.get<SpringPage<BatchResponseDto>>(
            `/batches/section/${sectionId}?page=${page}&size=${size}`
        );
        // Extract the array from the paginated object
        return response.data.content;
    },

    // GET /api/v1/batches/farm/{farmId}
    getBatchesByFarm: async (
        farmId: number,
        page: number = 0,
        size: number = 100
    ): Promise<BatchResponseDto[]> => {
        const response = await apiClient.get<SpringPage<BatchResponseDto>>(
            `/batches/farm/${farmId}?page=${page}&size=${size}`
        );
        // Extract the array from the paginated object
        return response.data.content;
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

    recordPartialSale: async (
        batchId: number, 
        data: PartialSaleRequestDto
    ): Promise<void> => {
        await apiClient.patch(`/batches/${batchId}/partial-sale`, data);
    },
};