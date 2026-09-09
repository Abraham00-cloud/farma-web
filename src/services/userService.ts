import { apiClient } from "./apiClient";
import type { UserRequestDto, UserResponseDto } from "../types/auth";
import type { SpringPage } from "../types/pagination";

export const userService = {
    // 1. Fetches operational managers linked to a specific Proprietor ID
    getManagersByProprietor: async (
        proprietorId: number,
        page: number = 0,
        size: number = 50
    ): Promise<UserResponseDto[]> => {
        const response = await apiClient.get<SpringPage<UserResponseDto>>(
            `/users/proprietor/${proprietorId}?page=${page}&size=${size}`,
        );
        // Extract the array from the paginated object
        return response.data.content;
    },

    // 2. Registers a new user (Manager or Proprietor) under /api/v1/auth/register
    createUser: async (data: UserRequestDto): Promise<UserResponseDto> => {
        const response = await apiClient.post<UserResponseDto>(
            "/auth/register",
            data,
        );
        return response.data;
    },

    // 3. Deactivates (soft deletes) a user account
    deactivateUser: async (userId: number): Promise<{ message: string }> => {
        const response = await apiClient.delete<{ message: string }>(
            `/users/${userId}`
        );
        return response.data;
    },

    getUserById: async (userId: number): Promise<UserResponseDto> => {
        const response = await apiClient.get<UserResponseDto>(`/users/${userId}`);
        return response.data;
    },
};