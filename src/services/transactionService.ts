import { apiClient } from './apiClient';
import type { TransactionRequestDto, TransactionResponseDto } from '../types/transaction';

export const transactionService = {
    // POST /api/v1/transactions
    createTransaction: async (data: TransactionRequestDto): Promise<TransactionResponseDto> => {
        const response = await apiClient.post<TransactionResponseDto>('/transactions', data);
        return response.data;
    },

    // GET /api/v1/transactions/cash-flow/organisation/{organisationId}
    getCompanyCashFlow: async (organisationId: number): Promise<TransactionResponseDto[]> => {
        const response = await apiClient.get<TransactionResponseDto[]>(
            `/transactions/cash-flow/organisation/${organisationId}`
        );
        return response.data;
    },

    // GET /api/v1/transactions/ledger/batch/{batchId}/organisation/{organisationId}
    getBatchLedger: async (
        batchId: number,
        organisationId: number
    ): Promise<TransactionResponseDto[]> => {
        const response = await apiClient.get<TransactionResponseDto[]>(
            `/transactions/ledger/batch/${batchId}/organisation/${organisationId}`
        );
        return response.data;
    },

    // GET /api/v1/transactions/pnl/batch/{batchId}/organisation/{organisationId}
    calculateBatchPnL: async (batchId: number, organisationId: number): Promise<number> => {
        const response = await apiClient.get<number>(
            `/transactions/pnl/batch/${batchId}/organisation/${organisationId}`
        );
        return response.data;
    },

    // GET /api/v1/transactions/farm/{farmId}/organisation/{organisationId}
    getFarmTransactions: async (
        farmId: number,
        organisationId: number
    ): Promise<TransactionResponseDto[]> => {
        const response = await apiClient.get<TransactionResponseDto[]>(
            `/transactions/farm/${farmId}/organisation/${organisationId}`
        );
        return response.data;
    },

    // GET /api/v1/transactions/pnl/farm/{farmId}/organisation/{organisationId}
    calculateFarmPnL: async (farmId: number, organisationId: number): Promise<number> => {
        const response = await apiClient.get<number>(
            `/transactions/pnl/farm/${farmId}/organisation/${organisationId}`
        );
        return response.data;
    },
};