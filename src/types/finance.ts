export interface FinancialCategoryBreakdownDto {
    category: string;
    totalAmount: number;
    percentageOfTotalCost: number;
}

export interface BatchFinancialSummaryDto {
    batchId: number;
    batchNumber: string;
    sectionName: string;
    breed: string;
    status: string;
    revenue: number;
    expenses: number;
    netProfit: number;
    marginPercentage: number;
    costPerBird: number;
    profitPerBird: number;
}

export interface BatchFinancialPnlResponseDto {
    batchId: number;
    batchNumber: string;
    totalRevenue: number;
    totalExpenses: number;
    netProfitOrLoss: number;
    profitMarginPercentage: number;
    costPerBird: number;
    revenuePerBird: number;
    profitPerBird: number;
    expenseBreakdownChart: FinancialCategoryBreakdownDto[];
    isProfitable: boolean;
}

export interface FarmFinancialOverviewDto {
    farmId: number;
    farmName: string;
    totalRevenue: number;
    totalExpenses: number;
    totalNetProfit: number;
    overallMarginPercentage: number;
    totalBatchesCount: number;
    activeBatchesCount: number;
    completedBatchesCount: number;
    batchSummaries: BatchFinancialSummaryDto[];
    expenseBreakdownChart: FinancialCategoryBreakdownDto[];
}

// NEW: Valuation Engine DTOs
export interface ValuationRequestDto {
    scope: 'BATCH' | 'FARM' | 'ORGANISATION';
    scopeId: number;
    projectedPricePerKg?: number;
    projectedPricePerProduceUnit?: number;
}

export interface ValuationResponseDto {
    scope: string;
    scopeName: string;
    liveBirds: number;
    totalWeightKg: number;
    produceUnits: number;
    
    realizedRevenue: number;       // Money already earned
    totalUnsoldAssetValue: number; // Future value of live birds + stocked eggs
    totalProjectedRevenue: number; // realizedRevenue + totalUnsoldAssetValue
    actualSunkCosts: number;       // Sunk costs
    
    projectedNetProfit: number;
    profitMargin: number;
}