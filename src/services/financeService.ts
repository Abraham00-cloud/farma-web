import { apiClient } from './apiClient';
import type { 
    BatchFinancialPnlResponseDto, 
    FarmFinancialOverviewDto,
    ValuationRequestDto,
    ValuationResponseDto 
} from '../types/finance';

export const financeService = {
    // GET /api/v1/financials/batch/{batchId}/pnl
    getBatchPnl: async (batchId: number): Promise<BatchFinancialPnlResponseDto> => {
        const response = await apiClient.get<BatchFinancialPnlResponseDto>(`/financials/batch/${batchId}/pnl`);
        return response.data;
    },

    // GET /api/v1/financials/farm/{farmId}/overview
    getFarmOverview: async (farmId: number): Promise<FarmFinancialOverviewDto> => {
        const response = await apiClient.get<FarmFinancialOverviewDto>(`/financials/farm/${farmId}/overview`);
        return response.data;
    },

    // NEW: POST /api/v1/financials/estimator/profit
    calculateProjectedValuation: async (data: ValuationRequestDto): Promise<ValuationResponseDto> => {
        const response = await apiClient.post<ValuationResponseDto>('/financials/estimator/profit', data);
        return response.data;
    }
};