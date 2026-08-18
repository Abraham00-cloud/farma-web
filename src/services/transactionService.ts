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

    // Add this inside your transactionService object
    exportLedgerToCsv: async (organisationId: number, startDate: string, endDate: string): Promise<void> => {
        const response = await apiClient.get(`/transactions/export/organisation/${organisationId}`, {
            params: { startDate, endDate },
            responseType: 'blob', // Crucial: Tells axios to treat the response as a file, not JSON
        });

        const blob = new Blob([response.data], { type: 'text/csv' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        
        const contentDisposition = response.headers['content-disposition'];
        let filename = `Audit_${startDate}_to_${endDate}.csv`;
        if (contentDisposition && contentDisposition.includes('filename=')) {
            filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
        }

        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        
        link.remove();
        window.URL.revokeObjectURL(downloadUrl);
    },
};