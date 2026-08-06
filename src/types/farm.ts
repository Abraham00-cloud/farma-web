// Matches com.project.farma.farm.dto.FarmRequestDto
export interface FarmRequestDto {
    name: string;
    address: string;
    managerId: number;
    organisationId: number;
    latitude: number;
    longitude: number;
    isActive: boolean;
}

// Matches com.project.farma.farm.dto.FarmResponseDto EXACTLY
export interface FarmResponseDto {
    id: number;
    name: string;
    organisationId: number;
    managerId: number;
    address: string;
    latitude: number;
    longitude: number;
    isActive: boolean;
    createdAt: string; // Mapped from LocalDateTime
}