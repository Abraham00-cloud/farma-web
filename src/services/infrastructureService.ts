import { apiClient } from './apiClient';
import type {
    FarmRequestDto,
    FarmResponseDto,
    SectionRequestDto,
    SectionResponseDto,
} from '../types/infrastructure';
import type { SpringPage } from '../types/pagination';

export const infrastructureService = {
    // --- FARMS ---
    createFarm: async (data: FarmRequestDto): Promise<FarmResponseDto> => {
        const response = await apiClient.post<FarmResponseDto>('/farms', data);
        return response.data;
    },

    getFarmsByOrganisation: async (
        organisationId: number,
        page: number = 0,
        size: number = 50
    ): Promise<FarmResponseDto[]> => {
        const response = await apiClient.get<SpringPage<FarmResponseDto>>(
            `/farms/organisation/${organisationId}?page=${page}&size=${size}`
        );
        return response.data.content;
    },

    getFarmById: async (farmId: number): Promise<FarmResponseDto> => {
        const response = await apiClient.get<FarmResponseDto>(`/farms/${farmId}`);
        return response.data;
    },

    // --- SECTIONS ---
    createSection: async (data: SectionRequestDto): Promise<SectionResponseDto> => {
        const response = await apiClient.post<SectionResponseDto>('/sections', data);
        return response.data;
    },

    getSectionsByFarm: async (
        farmId: number,
        page: number = 0,
        size: number = 100 // Fetch a large default page to get all pens at once
    ): Promise<SectionResponseDto[]> => {
        const response = await apiClient.get<SpringPage<SectionResponseDto>>(
            `/sections/farm/${farmId}?page=${page}&size=${size}`
        );
        // Extract the array from the paginated object
        return response.data.content;
    },

    // Used when populating the "Create Batch" dropdown to show ONLY unblocked pens
    getAvailableSectionsByFarm: async (
        farmId: number,
        page: number = 0,
        size: number = 100
    ): Promise<SectionResponseDto[]> => {
        const response = await apiClient.get<SpringPage<SectionResponseDto>>(
            `/sections/farm/${farmId}/available?page=${page}&size=${size}`
        );
        // Extract the array from the paginated object
        return response.data.content;
    },
};