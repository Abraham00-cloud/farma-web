import { apiClient } from './apiClient';
import type { InventoryRequestDto, InventoryResponseDto } from '../types/inventory';

export const inventoryService = {
    // POST /api/v1/inventories
    createInventory: async (data: InventoryRequestDto): Promise<InventoryResponseDto> => {
        const response = await apiClient.post<InventoryResponseDto>('/inventories', data);
        return response.data;
    },

    // PATCH /api/v1/inventories/{inventoryId}/stock?adjustmentAmount=... (For Spoilage/Errors)
    updateStockLevel: async (inventoryId: number, adjustmentAmount: number): Promise<void> => {
        await apiClient.patch(`/inventories/${inventoryId}/stock`, null, {
            params: { adjustmentAmount },
        });
    },

    // POST /api/v1/inventories/{inventoryId}/restock (For Commercial Purchases)
    restockInventory: async (inventoryId: number, addedQuantity: number, newUnitPrice: number): Promise<InventoryResponseDto> => {
        const response = await apiClient.post<InventoryResponseDto>(`/inventories/${inventoryId}/restock`, null, {
            params: { addedQuantity, newUnitPrice }
        });
        return response.data;
    },

    // GET /api/v1/inventories/farm/{farmId}
    getInventoriesByFarm: async (farmId: number): Promise<InventoryResponseDto[]> => {
        const response = await apiClient.get<InventoryResponseDto[]>(`/inventories/farm/${farmId}`);
        return response.data;
    },

    // GET /api/v1/inventories/organisation/{organisationId}
    getInventoriesByOrganisation: async (organisationId: number): Promise<InventoryResponseDto[]> => {
        const response = await apiClient.get<InventoryResponseDto[]>(`/inventories/organisation/${organisationId}`);
        return response.data;
    },
};