export type InventoryCategory = 'FEED' | 'MEDICINE' | 'VACCINE' | 'EQUIPMENT' | 'OTHER';

export interface InventoryRequestDto {
    name: string;
    category: InventoryCategory;
    quantity: number;
    unit: string;
    farmId: number;
    unitPrice: number;
    lowStockThreshold: number;
    expiryDate: string; // YYYY-MM-DD
}

export interface InventoryResponseDto {
    id: number;
    name: string;
    category: string;
    farmId: number;
    farmName: string;
    currentQuantity: number;
    unitPrice: string | number;
    totalValue: number;
    expiryDate: string;
    lowStockThreshold: number;
    isLowStock: boolean;
}