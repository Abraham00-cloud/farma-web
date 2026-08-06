export type AlertType =
    | 'FEED_UNDER_CONSUMPTION'
    | 'MORTALITY_LIMIT_BREACH'
    | 'PRODUCTION_YIELD_DROP'
    | 'CLIMATE_STRESS';

export type AlertStatus = 'TRIGGERED' | 'ACKNOWLEDGED' | 'RESOLVED';

export type AlertResolutionCategory =
    | 'VENTILATION_AND_COOLING'
    | 'WATER_SYSTEM_REPAIR'
    | 'MEDICINE_AND_TREATMENT'
    | 'FEED_ADJUSTMENT'
    | 'ENVIRONMENTAL_SANITATION'
    | 'EQUIPMENT_REPAIR'
    | 'FALSE_ALARM_VERIFIED';

export interface SystemAlertResponse {
    id: number;
    batchId: number;
    batchNumber: string;
    alertType: AlertType;
    status: AlertStatus;
    diagnosisMessage: string;
    resolutionNotes?: string;
    createdAt: string;
    resolvedAt?: string;
}

export interface AlertResolutionRequest {
    actionCategory: AlertResolutionCategory;
    actionTaken: string;
    verifiedTemperature?: number;
    verifiedWaterPressure?: number;
    supervisorNotes?: string;
}

export interface BatchPerformanceDashboardDto {
    batchId: number;
    batchNumber: string;
    sectionName: string;
    breed: string;
    initialCount: number;
    currentCount: number;
    totalMortality: number;
    mortalityRatePercentage: number;
    survivabilityRatePercentage: number;
    totalFeedConsumedKg: number;
    currentAverageWeightGrams: number;
    calculatedFcr: number;
    activeAlertsCount: number;
    resolvedAlertsCount: number;
    startDate: string;
    currentAgeInDays: number;
}