// Matches com.project.farma.section.model.AnimalCategory EXACTLY
export const AnimalCategory = {
    POULTRY: 'POULTRY',
    LIVESTOCK: 'LIVESTOCK',
} as const;
export type AnimalCategory = (typeof AnimalCategory)[keyof typeof AnimalCategory];

// Matches com.project.farma.section.model.ProductionType EXACTLY (Title Case)
export const ProductionType = {
    Egg: 'Egg',
    Milk: 'Milk',
    Meat: 'Meat',
} as const;
export type ProductionType = (typeof ProductionType)[keyof typeof ProductionType];

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

// Matches com.project.farma.section.dto.SectionRequestDto
export interface SectionRequestDto {
    name: string;
    farmId: number;
    animalCategory: AnimalCategory;
    productionType: ProductionType;
    capacity: number;
}

// Matches com.project.farma.section.dto.SectionResponseDto EXACTLY
export interface SectionResponseDto {
    id: number;
    name: string;
    farmId: number;
    animalCategory: AnimalCategory;
    productionType: ProductionType;
    capacity: number;
}