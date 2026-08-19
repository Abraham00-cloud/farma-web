import { apiClient } from './apiClient'; // <-- Adjust this path to match your project structure

// ==========================================
// 1. DATA SHAPE INTERFACES
// ==========================================
export interface FarmData {
    id: number;
    name: string;
    managerName?: string;
}

export interface InventoryData {
    quantity: number;
    unitPrice: number;
}

export interface FinancialOverview {
    totalIncome?: number;
    totalExpense?: number;
}

export interface SectionData {
    id: number;
}

export interface BatchData {
    id: number;
    status: string;
    currentCount: number;
    initialCount: number;
    mortalityCount: number;
}

export interface FacilityStatus {
    id: number;
    name: string;
    manager: string;
    activeBatches: number;
    status: 'OPTIMAL' | 'CRITICAL' | 'STANDBY';
    alerts: number;
}

export interface ProprietorDashboardMetrics {
    totalBirds: number;
    warehouseValuation: number;
    ytdRevenue: number;
    ytdExpense: number;
    activeAlerts: number;
    overallMortality: string;
    facilities: FacilityStatus[];
}

// ==========================================
// 2. THE AGGREGATOR SERVICE
// ==========================================
// Notice: We don't need to pass the 'token' parameter anymore!
export const fetchEnterpriseMetrics = async (orgId: number): Promise<ProprietorDashboardMetrics> => {
    try {
        // Clean relative path! apiClient handles the base URL and the Bearer token.
        const farmsRes = await apiClient.get<FarmData[]>(`/farms/organisation/${orgId}`);
        const farms = farmsRes.data;

        let totalBirds = 0;
        let totalInitialBirds = 0;
        let totalDead = 0;
        let warehouseValuation = 0;
        let totalActiveAlerts = 0;
        let ytdRevenue = 0;
        let ytdExpense = 0;
        const facilities: FacilityStatus[] = [];

        await Promise.all(farms.map(async (farm: FarmData) => {
            let farmAlerts = 0;
            let farmActiveBatches = 0;

            // Fetch Farm Inventory for Valuation
            try {
                const invRes = await apiClient.get<InventoryData[]>(`/inventories/farm/${farm.id}`);
                invRes.data.forEach((item: InventoryData) => {
                    warehouseValuation += (item.quantity * item.unitPrice);
                });
            } catch { console.warn(`Could not fetch inventory for farm ${farm.id}`); }

            // Fetch Financial Overview
            try {
                const finRes = await apiClient.get<FinancialOverview>(`/financials/farm/${farm.id}/overview`);
                if (finRes.data) {
                    ytdRevenue += finRes.data.totalIncome || 0;
                    ytdExpense += finRes.data.totalExpense || 0;
                }
            } catch { console.warn(`Could not fetch financials for farm ${farm.id}`); }

            // Fetch Sections -> Batches -> Analytics
            try {
                const sectionsRes = await apiClient.get<SectionData[]>(`/sections/farm/${farm.id}`);
                
                await Promise.all(sectionsRes.data.map(async (section: SectionData) => {
                    const batchesRes = await apiClient.get<BatchData[]>(`/batches/section/${section.id}`);
                    
                    await Promise.all(batchesRes.data.map(async (batch: BatchData) => {
                        if (batch.status !== 'COMPLETED') {
                            farmActiveBatches++;
                            totalBirds += batch.currentCount;
                            totalInitialBirds += batch.initialCount;
                            totalDead += batch.mortalityCount;

                            try {
                                const dashRes = await apiClient.get<{activeAlerts?: number}>(`/analytics/batch/${batch.id}/dashboard`);
                                const activeAlerts: number = dashRes.data.activeAlerts || 0;
                                totalActiveAlerts += activeAlerts;
                                farmAlerts += activeAlerts;
                            } catch  { /* Ignore batch analytics failure */ }
                        }
                    }));
                }));
            } catch { console.warn(`Could not fetch sections for farm ${farm.id}`); }

            // Determine Farm Status
            let status: 'OPTIMAL' | 'CRITICAL' | 'STANDBY' = 'STANDBY';
            if (farmAlerts > 0) status = 'CRITICAL';
            else if (farmActiveBatches > 0) status = 'OPTIMAL';

            facilities.push({
                id: farm.id,
                name: farm.name,
                manager: farm.managerName || "Pending Assignment",
                activeBatches: farmActiveBatches,
                status: status,
                alerts: farmAlerts
            });
        }));

        const overallMortality = totalInitialBirds > 0 
            ? ((totalDead / totalInitialBirds) * 100).toFixed(2) 
            : "0.00";

        return {
            totalBirds,
            warehouseValuation,
            ytdRevenue,
            ytdExpense,
            activeAlerts: totalActiveAlerts,
            overallMortality,
            facilities: facilities.sort((a, b) => b.alerts - a.alerts)
        };

    } catch (error) {
        console.error("Failed to aggregate enterprise metrics:", error);
        throw error;
    }
};