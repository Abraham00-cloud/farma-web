export interface DailyLogRequestDto {
    batchId: number;
    logDate: string; // YYYY-MM-DD
    feedInventoryId?: number | null;
    feedQuantityUsed?: number | null;
    medicineInventoryId?: number | null;
    medicineQuantityUsed?: number | null;
    administrationMethod?: string | null;
    mortalityCount: number;
    averageWeight?: number | null;
    observations?: string | null;
    assignedToId?: number | null;
}

export interface DailyLogResponseDto {
    id: number;
    logDate: string;
    batchId: number;
    batchName: string;
    feedName?: string | null;
    feedQuantityUsed?: number | null;
    medicineName?: string | null;
    medicineQuantityUsed?: number | null;
    mortalityCount: number;
    averageWeight?: number | null;
    observations?: string | null;
    recordedByName: string;
    assignedToName?: string | null;
    createdAt: string;
}