import { apiClient } from './apiClient';
import type { FarmRequestDto, FarmResponseDto } from '../types/farm';
import type { SpringPage } from '../types/pagination';

export const farmService = {
    // GET /api/v1/farms/organisation/{organisationId}
    getFarmsByOrganisation: async (
        organisationId: number,
        page: number = 0,
        size: number = 50 // Fetch a large default page to load all farms seamlessly
    ): Promise<FarmResponseDto[]> => {
        const response = await apiClient.get<SpringPage<FarmResponseDto>>(
            `/farms/organisation/${organisationId}?page=${page}&size=${size}`
        );
        // Extract the array from the paginated object
        return response.data.content;
    },

    // POST /api/v1/farms
    createFarm: async (data: FarmRequestDto): Promise<FarmResponseDto> => {
        const response = await apiClient.post<FarmResponseDto>('/farms', data);
        return response.data;
    },
};