import { apiClient } from './apiClient';
import type { InventoryRequestDto, InventoryResponseDto, ProduceSaleRequestDto } from '../types/inventory';
import type { SpringPage } from '../types/pagination';

export const inventoryService = {
    // POST /api/v1/inventories
    createInventory: async (data: InventoryRequestDto): Promise<InventoryResponseDto> => {
        const response = await apiClient.post<InventoryResponseDto>('/inventories', data);
        return response.data;
    },

    // PATCH /api/v1/inventories/{inventoryId}/stock?adjustmentAmount=...
    updateStockLevel: async (inventoryId: number, adjustmentAmount: number): Promise<void> => {
        await apiClient.patch(`/inventories/${inventoryId}/stock`, null, {
            params: { adjustmentAmount },
        });
    },

    // POST /api/v1/inventories/{inventoryId}/restock
    restockInventory: async (inventoryId: number, addedQuantity: number, newUnitPrice: number): Promise<InventoryResponseDto> => {
        const response = await apiClient.post<InventoryResponseDto>(`/inventories/${inventoryId}/restock`, null, {
            params: { addedQuantity, newUnitPrice }
        });
        return response.data;
    },

    // NEW: POST /api/v1/inventories/produce/sale
    recordProduceSale: async (data: ProduceSaleRequestDto): Promise<void> => {
        await apiClient.post('/inventories/produce/sale', data);
    },

    // GET /api/v1/inventories/farm/{farmId}
    getInventoriesByFarm: async (
        farmId: number, 
        page: number = 0, 
        size: number = 100 // Fetch a larger page default so the frontend filtering works seamlessly
    ): Promise<InventoryResponseDto[]> => {
        const response = await apiClient.get<SpringPage<InventoryResponseDto>>(
            `/inventories/farm/${farmId}?page=${page}&size=${size}`
        );
        return response.data.content;
    },

    // GET /api/v1/inventories/organisation/{organisationId}
    getInventoriesByOrganisation: async (organisationId: number): Promise<InventoryResponseDto[]> => {
        const response = await apiClient.get<InventoryResponseDto[]>(`/inventories/organisation/${organisationId}`);
        return response.data;
    },
};