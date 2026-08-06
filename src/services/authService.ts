import { jwtDecode } from 'jwt-decode';
import { apiClient } from './apiClient';
import type { AuthResponseDto, LoginRequestDto, OrganisationRequestDto } from '../types/auth';

interface JwtPayload {
    sub: string;
    userId?: number;
    id?: number;
    organisationId?: number;
    exp: number;
}

const AUTH_KEY = 'farma_auth';
const JWT_KEY = 'farma_jwt';

export const authService = {
    setAuth: (data: AuthResponseDto): AuthResponseDto => {
        let extractedUserId: number | undefined = data.userId;

        if (data.token) {
            try {
                const decoded = jwtDecode<JwtPayload>(data.token);
                extractedUserId = decoded.userId ?? decoded.id;
            } catch {
                // Fallback if token is unparseable
            }
        }

        const fullAuthData: AuthResponseDto = {
            ...data,
            userId: extractedUserId,
        };

        localStorage.setItem(JWT_KEY, data.token);
        localStorage.setItem(AUTH_KEY, JSON.stringify(fullAuthData));
        return fullAuthData;
    },

    getCurrentAuth: (): AuthResponseDto | null => {
        const rawData = localStorage.getItem(AUTH_KEY);
        if (!rawData) return null;
        try {
            return JSON.parse(rawData) as AuthResponseDto;
        } catch {
            return null;
        }
    },

    logout: () => {
        localStorage.removeItem(JWT_KEY);
        localStorage.removeItem(AUTH_KEY);
    },

    login: async (credentials: LoginRequestDto): Promise<AuthResponseDto> => {
        const response = await apiClient.post<AuthResponseDto>('/auth/login', credentials);
        return authService.setAuth(response.data);
    },

    registerOrganisation: async (
        data: OrganisationRequestDto
    ): Promise<AuthResponseDto> => {
        const response = await apiClient.post<AuthResponseDto>('/organisations', data);
        return authService.setAuth(response.data);
    },
};