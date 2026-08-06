import { apiClient } from './apiClient';
import type {
    FarmRequestDto,
    FarmResponseDto,
    SectionRequestDto,
    SectionResponseDto,
} from '../types/infrastructure';

export const infrastructureService = {
    // --- FARMS ---
    createFarm: async (data: FarmRequestDto): Promise<FarmResponseDto> => {
        const response = await apiClient.post<FarmResponseDto>('/farms', data);
        return response.data;
    },

    getFarmsByOrganisation: async (organisationId: number): Promise<FarmResponseDto[]> => {
        const response = await apiClient.get<FarmResponseDto[]>(`/farms/organisation/${organisationId}`);
        return response.data;
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

    getSectionsByFarm: async (farmId: number): Promise<SectionResponseDto[]> => {
        const response = await apiClient.get<SectionResponseDto[]>(`/sections/farm/${farmId}`);
        return response.data;
    },

    // Used when populating the "Create Batch" dropdown to show ONLY unblocked pens
    getAvailableSectionsByFarm: async (farmId: number): Promise<SectionResponseDto[]> => {
        const response = await apiClient.get<SectionResponseDto[]>(`/sections/farm/${farmId}/available`);
        return response.data;
    },
};