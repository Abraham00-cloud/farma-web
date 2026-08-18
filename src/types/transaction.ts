export type TransactionType = "CREDIT" | "DEBIT";

export type TransactionCategory =
  | "LIVESTOCK_SALE"
  | "EQUIPMENT_PURCHASE"
  | "LABOR_COST"
  | "UTILITY_BILL"
  | "FEED_PURCHASE"
  | "MEDICINE_PURCHASE"
  | "VACCINE_PURCHASE"
  | "FEED_CONSUMPTION"
  | "MEDICINE_CONSUMPTION"
  | "VACCINE_CONSUMPTION"
  | "OTHER_INCOME"
  | "OTHER_EXPENSE";

export interface InternalTransactionRequestDto {
  organisationId: number;
  batchId: number;
  amount: number;
  category: TransactionCategory;
  description: string;
}

export interface TransactionRequestDto {
  amount: number;
  transactionType: TransactionType;
  transactionCategory: TransactionCategory;
  description: string;
  transactionDate: string; // LocalDate (YYYY-MM-DD)
  isCashFlow: boolean;
  organisationId: number;
  batchId?: number; // Nullable for general farm expenses
  farmId?: number;  // NEW: To link general overhead directly to the farm
}

export interface TransactionResponseDto {
  transactionId: number;
  amount: number;
  type: TransactionType;
  category: TransactionCategory;
  transactionDate: string; // LocalDate
  description: string;
  isCashFlow: boolean;
  batchId?: number;
  batchNumber?: string;
  farmId?: number;    // NEW
  farmName?: string;  // NEW
  createdAt: string; // LocalDateTime
}