import type { AnimalCategory, ProductionType } from "./infrastructure";

export const Status = {
    ACTIVE: "ACTIVE",
    COMPLETED: "COMPLETED",
} as const;
export type Status = (typeof Status)[keyof typeof Status];

export const Breed = {
    COBB_500: "COBB_500",
    ROSS_308: "ROSS_308",
    HUBBARD: "HUBBARD",
    ISA_BROWN: "ISA_BROWN",
    HY_LINE: "HY_LINE",
    BOVANS_WHITE: "BOVANS_WHITE",
    DUROC: "DUROC",
    LARGE_WHITE: "LARGE_WHITE",
    LANDRACE: "LANDRACE",
    RED_SOKOTO: "RED_SOKOTO",
    WEST_AFRICAN_DWARF: "WEST_AFRICAN_DWARF",
    BALAMI: "BALAMI",
    YANKASA: "YANKASA",
    OTHER: "OTHER",
} as const;
export type Breed = (typeof Breed)[keyof typeof Breed];

export interface BatchRequestDto {
    batchNumber: string;
    sectionId: number;
    initialCount: number;
    startDate: string; // YYYY-MM-DD
    expectedEndDate: string; // YYYY-MM-DD
    breed: Breed;
}

export interface BatchResponseDto {
    id: number;
    batchNumber: string;
    sectionName: string;
    breed?: Breed; // Added optional breed field
    initialCount: number;
    currentCount: number;
    mortalityCount: number;
    animalCategory: AnimalCategory;
    productionType: ProductionType;
    status: Status;
    startDate: string;
    expectedEndDate: string;
    actualEndDate?: string;
    createdAt?: string;
}

export interface BatchCloseRequestDto {
    actualEndDate: string; // YYYY-MM-DD
    totalBirdsSold: number;
    totalSaleRevenue: number;
    harvestNotes?: string;
}

export interface BatchCloseResponseDto {
    batchId: number;
    batchNumber: string;
    status: Status;
    startDate: string;
    actualEndDate: string;
    finalBirdCount: number;
    totalBirdsSold: number;
    totalSaleRevenue: number;
    sectionUnlocked: boolean;
    harvestNotes?: string;
}