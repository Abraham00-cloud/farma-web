export type TransactionType = 'CREDIT' | 'DEBIT';

export type TransactionCategory =
    | 'ANIMAL_PURCHASE'
    | 'FEED_PURCHASE'
    | 'MEDICINE_PURCHASE'
    | 'UTILITY_EXPENSE'
    | 'SALARY_EXPENSE'
    | 'HARVEST_SALE'
    | 'LIVESTOCK_SALE'
    | 'OTHER_EXPENSE'
    | 'OTHER_INCOME';

export interface TransactionRequestDto {
    amount: number;
    transactionType: TransactionType;
    transactionCategory: TransactionCategory;
    description: string;
    transactionDate: string; // YYYY-MM-DD
    isCashFlow: boolean;
    organisationId: number;
    batchId: number;
}

export interface TransactionResponseDto {
    transactionId: number;
    amount: number;
    type: TransactionType;
    category: TransactionCategory;
    transactionDate: string;
    description: string;
    isCashFlow: boolean;
    batchId: number;
    batchNumber: string;
    createdAt: string;
}