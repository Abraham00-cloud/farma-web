import { apiClient } from './apiClient';
import type { FarmRequestDto, FarmResponseDto } from '../types/farm';

export const farmService = {
    // GET /api/v1/farms/organisation/{organisationId}
    getFarmsByOrganisation: async (organisationId: number): Promise<FarmResponseDto[]> => {
        const response = await apiClient.get<FarmResponseDto[]>(`/farms/organisation/${organisationId}`);
        return response.data;
    },

    // POST /api/v1/farms
    createFarm: async (data: FarmRequestDto): Promise<FarmResponseDto> => {
        const response = await apiClient.post<FarmResponseDto>('/farms', data);
        return response.data;
    },
};