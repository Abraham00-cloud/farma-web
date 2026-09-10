import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { infrastructureService } from '../../services/infrastructureService';
import { batchService } from '../../services/batchService';
import { inventoryService } from '../../services/inventoryService';
import { transactionService } from '../../services/transactionService';
import { alertService } from '../../services/alertService';
import { apiClient } from '../../services/apiClient';
import type { AuthResponseDto } from '../../types/auth';

interface ManagerDashboardViewProps {
    authData: AuthResponseDto;
    setActiveTab: (tab: string) => void;
}

interface CashflowDataPoint {
    month: string;
    Income: number;
    Expense: number;
}

interface InventoryDataPoint {
    name: string;
    value: number;
    color: string;
}

interface MonthlyFinancialData {
    month: string;
    income?: number;
    revenue?: number;
    expense?: number;
    expenses?: number;
}

interface FinancialCashFlowDto {
    totalIncome?: number;
    totalRevenue?: number;
    income?: number;
    totalExpenses?: number;
    totalExpense?: number;
    expense?: number;
    netProfit?: number;
    companyValuation?: number;
    valuation?: number;
    monthlyBreakdown?: MonthlyFinancialData[];
    monthlyCashFlows?: MonthlyFinancialData[];
}

const THEME = {
    forest: 'var(--color-farma-forest)',
    cream: 'var(--color-farma-cream)',
    green: 'var(--color-farma-green)',
    gold: 'var(--color-farma-gold)',
    terracotta: 'var(--color-farma-terracotta)',
    lightGray: 'var(--color-farma-sand)'
};

export const ManagerDashboardView: React.FC<ManagerDashboardViewProps> = ({
    authData,
    setActiveTab,
}) => {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    
    const portalNamespace = pathname.split('/')[1] || (authData.role?.toLowerCase() === 'manager' ? 'manager' : 'proprietor');
    const isProprietor = authData.role?.toUpperCase() === 'PROPRIETOR' || authData.role?.toUpperCase() === 'ADMIN';
    
    const currentUserId = (authData as { userId?: number; id?: number }).userId || (authData as { userId?: number; id?: number }).id;
    const orgId = authData.organisationId || 0;

    const [loading, setLoading] = useState(true);
    const [globalStats, setGlobalStats] = useState({
        totalRevenue: 0,
        totalExpenses: 0,
        companyValuation: 0,
        totalInventoryValue: 0,
        livePopulation: 0,
        activeBatches: 0,
        activeAlerts: 0,
    });

    const [cashflowData, setCashflowData] = useState<CashflowDataPoint[]>([]);
    const [inventoryData, setInventoryData] = useState<InventoryDataPoint[]>([]);

    const [allFarms, setAllFarms] = useState<{id: number, name: string}[]>([]);
    const [selectedFarmIds, setSelectedFarmIds] = useState<number[]>([]);
    const [isFilterOpen, setIsFilterOpen] = useState(false);
    const [farmSearchQuery, setFarmSearchQuery] = useState("");

    const handleNavigate = useCallback((tabKey: string) => {
        if (setActiveTab) {
            setActiveTab(tabKey);
        }
        navigate(`/${portalNamespace}/${tabKey}`);
    }, [setActiveTab, portalNamespace, navigate]);

    const bootDashboard = useCallback(async () => {
        if (!orgId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            let fetchedFarms = await infrastructureService.getFarmsByOrganisation(orgId);
            
            if (!isProprietor && currentUserId) {
                fetchedFarms = fetchedFarms.filter(f => f.managerId === currentUserId);
            }

            setAllFarms(fetchedFarms.map(f => ({ id: f.id, name: f.name })));

            let activeFarms = fetchedFarms;
            if (isProprietor && selectedFarmIds.length > 0) {
                activeFarms = fetchedFarms.filter(f => selectedFarmIds.includes(f.id));
            }

            const farmIds = activeFarms.map(f => f.id);
            
            if (farmIds.length === 0) {
                setGlobalStats({
                    totalRevenue: 0, totalExpenses: 0, companyValuation: 0,
                    totalInventoryValue: 0, livePopulation: 0, activeBatches: 0, activeAlerts: 0,
                });
                setInventoryData([{ name: 'No Stock', value: 1, color: THEME.lightGray }]);
                setCashflowData([{ month: new Date().toLocaleString('default', { month: 'short' }), Income: 0, Expense: 0 }]);
                setLoading(false);
                return;
            }
            
            const sectionPromises = farmIds.map(id => infrastructureService.getSectionsByFarm(id).catch(() => []));
            const sectionsNested = await Promise.all(sectionPromises);
            const sections = sectionsNested.flat();
            
            const batchPromises = sections.map(sec => batchService.getBatchesBySection(sec.id).catch(() => []));
            const batchesNested = await Promise.all(batchPromises);
            const activeBatches = batchesNested.flat().filter(b => b.status === 'ACTIVE');

            const alertPromises = activeBatches.map(b => alertService.getActiveAlertsForBatch(b.id).catch(() => []));
            const alertsNested = await Promise.all(alertPromises);
            const activeAlerts = alertsNested.flat().filter(a => a.status !== 'RESOLVED');

            const invPromises = farmIds.map(id => inventoryService.getInventoriesByFarm(id).catch(() => []));
            const invNested = await Promise.all(invPromises);
            const allInventory = invNested.flat();

            let rev = 0;
            let exp = 0;
            let valuation = 0;
            let realMonthlyBreakdown: CashflowDataPoint[] = [];

            if (isProprietor) {
                try {
                    if (selectedFarmIds.length === 0 && typeof transactionService.getCompanyCashFlow === 'function') {
                        const cashFlowResponse = await transactionService.getCompanyCashFlow(orgId).catch(() => null);
                        if (cashFlowResponse) {
                            const cashFlow = cashFlowResponse as unknown as FinancialCashFlowDto;
                            rev = Number(cashFlow?.totalRevenue || cashFlow?.totalIncome || cashFlow?.income || 0);
                            exp = Number(cashFlow?.totalExpenses || cashFlow?.totalExpense || cashFlow?.expense || 0);
                            valuation = Number(cashFlow?.companyValuation || cashFlow?.valuation || 0);

                            const rawMonthly = cashFlow?.monthlyBreakdown || cashFlow?.monthlyCashFlows;
                            if (Array.isArray(rawMonthly) && rawMonthly.length > 0) {
                                realMonthlyBreakdown = rawMonthly.map((item: MonthlyFinancialData) => ({
                                    month: item.month,
                                    Income: Number(item.income || item.revenue || 0),
                                    Expense: Number(item.expense || item.expenses || 0)
                                }));
                            }
                        }
                    }
                } catch {
                    console.debug("Company cashflow endpoint failed, attempting farm-level fallback...");
                }

                if ((rev === 0 && exp === 0) || selectedFarmIds.length > 0) {
                    try {
                        const finPromises = farmIds.map(id => 
                            apiClient.get(`/financials/farm/${id}/overview`).catch(() => ({ data: {} }))
                        );
                        const finResults = await Promise.all(finPromises);
                        
                        finResults.forEach(res => {
                            const data = res.data || {};
                            rev += Number(data.totalIncome || data.totalRevenue || data.income || data.revenue || 0);
                            exp += Number(data.totalExpense || data.totalExpenses || data.expense || data.expenses || 0);
                        });
                    } catch (fallbackErr) {
                        console.error("Fallback aggregation failed", fallbackErr);
                    }
                }
            }

            let pop = 0;
            activeBatches.forEach(b => pop += b.currentCount);

            // --- PROPER INVENTORY AGGREGATION ---
            let invValue = 0;
            let feedQty = 0, medVaxQty = 0, equipQty = 0, produceQty = 0, otherQty = 0;
            
            allInventory.forEach(inv => {
                const qty = Number(inv.currentQuantity || 0);
                const price = Number(inv.unitPrice || 0);
                const category = String(inv.category || '').toUpperCase();

                invValue += (qty * price);

                if (category === 'FEED') {
                    feedQty += qty;
                } else if (category === 'MEDICINE' || category === 'VACCINE') {
                    medVaxQty += qty;
                } else if (category === 'PRODUCE') {
                    produceQty += qty;
                } else if (category === 'EQUIPMENT') {
                    equipQty += qty;
                } else {
                    otherQty += qty;
                }
            });

            const calculatedValuation = valuation > 0 ? valuation : (invValue + (rev - exp));

            setGlobalStats({
                totalRevenue: rev,
                totalExpenses: exp,
                companyValuation: calculatedValuation,
                totalInventoryValue: invValue,
                livePopulation: pop,
                activeBatches: activeBatches.length,
                activeAlerts: activeAlerts.length,
            });

            // Map the parsed quantities to the Pie Chart
            if (feedQty === 0 && medVaxQty === 0 && equipQty === 0 && produceQty === 0 && otherQty === 0) {
                setInventoryData([{ name: 'No Stock', value: 1, color: THEME.lightGray }]);
            } else {
                setInventoryData([
                    ...(feedQty > 0 ? [{ name: 'Feed Stock', value: feedQty, color: THEME.gold }] : []),
                    ...(medVaxQty > 0 ? [{ name: 'Meds & Vaccines', value: medVaxQty, color: THEME.terracotta }] : []),
                    ...(produceQty > 0 ? [{ name: 'Produce (Eggs)', value: produceQty, color: THEME.green }] : []),
                    ...(equipQty > 0 ? [{ name: 'Equipment', value: equipQty, color: THEME.forest }] : []),
                    ...(otherQty > 0 ? [{ name: 'Other', value: otherQty, color: THEME.lightGray }] : []),
                ]);
            }

            const currentMonth = new Date().toLocaleString('default', { month: 'short' });

            if (realMonthlyBreakdown.length > 0) {
                setCashflowData(realMonthlyBreakdown);
            } else if (rev > 0 || exp > 0) {
                setCashflowData([
                    { month: currentMonth, Income: rev, Expense: exp }
                ]);
            } else {
                setCashflowData([
                    { month: currentMonth, Income: 0, Expense: 0 }
                ]);
            }

            setLoading(false);
        } catch (err) {
            console.error("Critical failure compiling dashboard telemetry:", err);
            setLoading(false);
        }
    }, [orgId, isProprietor, currentUserId, selectedFarmIds]);

    useEffect(() => {
        const timer = setTimeout(() => {
            bootDashboard();
        }, 0);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []); 

    if (loading) {
        return (
            <div className="py-32 flex flex-col items-center justify-center space-y-4 font-sans">
                <div className="w-10 h-10 border-4 border-farma-green/20 border-t-farma-green rounded-full animate-spin"></div>
                <p className="text-xs font-bold text-farma-forest/60 uppercase tracking-widest">Loading farm data...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-farma-forest/10 pb-5">
                <div>
                    <h3 className="text-2xl font-bold text-farma-forest tracking-tight">
                        {isProprietor ? 'All Farms Overview' : 'My Farm Dashboard'}
                    </h3>
                    <p className="text-sm text-farma-forest/70 font-medium mt-1">
                        {isProprietor 
                            ? 'Track income, live birds, and health alerts across all your farms.' 
                            : 'Monitor your pens, stock, and daily farm updates.'}
                    </p>
                    
                    {isProprietor && allFarms.length > 0 && (
                        <div className="mt-4 flex items-center gap-3 relative">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-farma-forest/60">
                                Analytics Scope:
                            </span>
                            
                            <div className="relative">
                                <button 
                                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                                    className="flex items-center gap-2 bg-white border border-farma-forest/15 px-4 py-2 rounded-lg text-xs font-bold text-farma-forest shadow-sm hover:bg-farma-cream transition-colors cursor-pointer"
                                >
                                    <span>
                                        {selectedFarmIds.length === 0 
                                            ? 'All Farms' 
                                            : selectedFarmIds.length === 1 
                                                ? '1 Farm Selected' 
                                                : `${selectedFarmIds.length} Farms Selected`}
                                    </span>
                                    <svg className="w-3.5 h-3.5 text-farma-forest/50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                                </button>

                                {isFilterOpen && (
                                    <div className="absolute top-full left-0 mt-2 w-64 bg-white border border-farma-forest/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                                        <div className="p-2 border-b border-farma-forest/5">
                                            <div className="relative">
                                                <input 
                                                    type="text" 
                                                    placeholder="Search farms..." 
                                                    value={farmSearchQuery}
                                                    onChange={(e) => setFarmSearchQuery(e.target.value)}
                                                    className="w-full pl-8 pr-3 py-2 bg-farma-cream border-none rounded-md text-xs focus:ring-2 focus:ring-farma-gold/20 outline-none"
                                                />
                                                <svg className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-farma-forest/40" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                            </div>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto p-2 space-y-1">
                                            <button 
                                                onClick={() => { setSelectedFarmIds([]); setIsFilterOpen(false); setTimeout(() => bootDashboard(), 0); }}
                                                className={`w-full text-left px-3 py-2 rounded-md text-xs font-bold transition-colors cursor-pointer ${selectedFarmIds.length === 0 ? 'bg-farma-forest text-white' : 'hover:bg-farma-cream text-farma-forest/70'}`}
                                            >
                                                Select All Farms
                                            </button>
                                            {allFarms.filter(f => f.name.toLowerCase().includes(farmSearchQuery.toLowerCase())).map(farm => {
                                                const isSelected = selectedFarmIds.includes(farm.id);
                                                return (
                                                    <button 
                                                        key={farm.id}
                                                        onClick={() => {
                                                            const newSelection = isSelected 
                                                                ? selectedFarmIds.filter(id => id !== farm.id)
                                                                : [...selectedFarmIds, farm.id];
                                                            setSelectedFarmIds(newSelection);
                                                        }}
                                                        className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-farma-cream transition-colors text-left cursor-pointer"
                                                    >
                                                        <div className={`w-3.5 h-3.5 rounded-sm border flex items-center justify-center shrink-0 ${isSelected ? 'bg-farma-green border-farma-green text-white' : 'border-farma-forest/20'}`}>
                                                            {isSelected && <svg className="w-2.5 h-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                                                        </div>
                                                        <span className="text-xs font-semibold text-farma-forest truncate">{farm.name}</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        {selectedFarmIds.length > 0 && (
                                            <div className="p-2 border-t border-farma-forest/5 bg-farma-cream">
                                                <button 
                                                    onClick={() => { setIsFilterOpen(false); bootDashboard(); }}
                                                    className="w-full py-2 bg-farma-gold hover:bg-[#c49332] text-farma-forest rounded-md text-xs font-bold uppercase tracking-wider shadow-sm transition-colors cursor-pointer"
                                                >
                                                    Apply Filter
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                
                <div 
                    onClick={() => handleNavigate(isProprietor ? 'financials' : 'sections')}
                    className="bg-farma-forest text-farma-cream p-5 rounded-xl shadow-sm cursor-pointer hover:shadow-md transition-shadow group"
                >
                    <span className="text-xs font-semibold text-farma-cream/60 block">
                        {isProprietor ? 'Total Income' : 'Total Live Birds'}
                    </span>
                    <div className="mt-2 text-3xl font-bold tabular-nums">
                        {isProprietor 
                            ? `₦${globalStats.totalRevenue.toLocaleString()}` 
                            : globalStats.livePopulation.toLocaleString()}
                    </div>
                    <div className="mt-4 flex justify-between items-center border-t border-white/10 pt-3">
                        <span className="text-[10px] font-bold text-farma-green bg-farma-green/20 px-2 py-1 rounded uppercase tracking-widest">
                            {isProprietor ? 'Total Income' : 'Live Birds'}
                        </span>
                        <span className="text-xs font-semibold text-white/50 group-hover:text-white transition-colors">Details &rarr;</span>
                    </div>
                </div>

                <div 
                    onClick={() => handleNavigate(isProprietor ? 'financials' : 'sections')}
                    className="bg-white p-5 rounded-xl border border-farma-forest/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer group"
                >
                    <span className="text-xs font-semibold text-farma-forest/60 block">
                        {isProprietor ? 'Total Expenses' : 'Active Flocks'}
                    </span>
                    <div className={`mt-2 text-3xl font-bold tabular-nums ${isProprietor ? 'text-farma-terracotta' : 'text-farma-green'}`}>
                        {isProprietor 
                            ? `₦${globalStats.totalExpenses.toLocaleString()}` 
                            : globalStats.activeBatches}
                    </div>
                    <div className="mt-4 border-t border-farma-forest/5 pt-3 flex justify-between items-center">
                        <span className="text-xs font-semibold text-farma-forest/50">
                            {isProprietor ? 'Money Spent' : 'Active Flocks'}
                        </span>
                        <span className="text-xs font-semibold text-farma-forest/40 group-hover:text-farma-forest transition-colors">View &rarr;</span>
                    </div>
                </div>

                <div 
                    onClick={() => handleNavigate('inventory')}
                    className="bg-white p-5 rounded-xl border border-farma-forest/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow cursor-pointer group"
                >
                    <span className="text-xs font-semibold text-farma-forest/60 block">
                        {isProprietor ? 'Total Farm Value' : 'Warehouse Value'}
                    </span>
                    <div className="mt-2 text-3xl font-bold tabular-nums text-farma-forest">
                        ₦{(isProprietor ? globalStats.companyValuation : globalStats.totalInventoryValue).toLocaleString()}
                    </div>
                    <div className="mt-4 border-t border-farma-forest/5 pt-3 flex justify-between items-center">
                        <span className="text-xs font-semibold text-farma-forest/50">
                            {isProprietor ? 'Stock & Assets' : 'Inventory'}
                        </span>
                        <span className="text-[10px] font-bold text-farma-gold group-hover:underline uppercase tracking-widest">Manage Stock &rarr;</span>
                    </div>
                </div>

                <div 
                    onClick={() => handleNavigate('analytics')}
                    className={`p-5 rounded-xl border shadow-sm flex flex-col justify-between transition-shadow cursor-pointer group ${globalStats.activeAlerts > 0 ? 'bg-farma-terracotta/5 border-farma-terracotta/30 hover:shadow-md' : 'bg-white border-farma-forest/10 hover:shadow-md'}`}
                >
                    <span className="text-xs font-semibold text-farma-forest/60 block">
                        Farm Health Alerts
                    </span>
                    <div className={`mt-2 text-3xl font-bold tabular-nums ${globalStats.activeAlerts > 0 ? 'text-farma-terracotta' : 'text-farma-green'}`}>
                        {globalStats.activeAlerts} <span className="text-lg font-sans font-medium text-farma-forest/60">Alerts</span>
                    </div>
                    <div className="mt-4 border-t border-farma-forest/5 pt-3 flex justify-between items-center">
                        <span className="text-xs font-semibold text-farma-forest/50">System Warnings</span>
                        <span className={`text-[10px] font-bold uppercase tracking-widest ${globalStats.activeAlerts > 0 ? 'text-farma-terracotta group-hover:underline' : 'text-farma-green'}`}>
                            {globalStats.activeAlerts > 0 ? 'View Alerts \u2192' : 'All Clear'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                
                <div className="lg:col-span-2 bg-white rounded-xl border border-farma-forest/10 p-6 shadow-sm">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h4 className="text-lg font-bold text-farma-forest">
                                {isProprietor ? 'Farm Cashflow' : 'Production Trend'}
                            </h4>
                            <p className="text-sm text-farma-forest/50 font-medium mt-1">
                                {isProprietor ? 'Monthly Income vs Expenses' : 'Performance over time'}
                            </p>
                        </div>
                        {isProprietor && (
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-farma-green"></div>
                                    <span className="text-xs font-medium text-farma-forest/60">Income</span>
                                </div>
                                <div className="flex items-center gap-1.5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-farma-terracotta"></div>
                                    <span className="text-xs font-medium text-farma-forest/60">Expense</span>
                                </div>
                            </div>
                        )}
                    </div>
                    
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashflowData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.lightGray} opacity={0.5} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: THEME.forest, opacity: 0.5 }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: THEME.forest, opacity: 0.5 }} tickFormatter={(val) => `₦${(val/1000).toFixed(0)}k`} />
                                <RechartsTooltip 
                                    cursor={{ fill: THEME.lightGray, opacity: 0.2 }}
                                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--color-farma-forest)', borderColor: 'rgba(16, 27, 20, 0.1)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: '600' }}
                                    labelStyle={{ color: 'var(--color-farma-forest)', opacity: 0.6, fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 'bold' }}
                                />
                                <Bar dataKey="Income" fill={THEME.green} radius={[4, 4, 0, 0]} barSize={24} />
                                <Bar dataKey="Expense" fill={THEME.terracotta} radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-farma-forest/10 p-6 shadow-sm flex flex-col items-center">
                    <h4 className="text-lg font-bold text-farma-forest w-full text-left">Inventory Breakdown</h4>
                    <p className="text-sm text-farma-forest/50 font-medium mt-1 w-full text-left">What is currently in stock</p>
                    
                    <div className="h-48 w-full relative mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={inventoryData} innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value" stroke="none">
                                    {inventoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${THEME.lightGray}`, fontSize: '12px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                            <span className="text-[10px] font-bold text-farma-forest/40 uppercase tracking-widest">Stock Value</span>
                            <span className="text-base font-bold text-farma-forest tabular-nums mt-1">₦{(globalStats.totalInventoryValue / 1000).toFixed(0)}k</span>
                        </div>
                    </div>
                    
                    <div className="w-full mt-6 space-y-3">
                        {inventoryData.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-medium">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-farma-forest/70">{item.name}</span>
                                </div>
                                <span className="text-farma-forest tabular-nums">{item.value === 1 && item.name === 'No Stock' ? '0' : item.value.toLocaleString()} Units</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-xl border border-farma-forest/10 p-6 shadow-sm mt-6">
                <div className="border-b border-farma-forest/10 pb-4 mb-6">
                    <h4 className="text-lg font-bold text-farma-forest">Quick Actions</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {isProprietor ? (
                        <>
                            <button onClick={() => handleNavigate('farms')} className="p-5 rounded-lg border border-farma-forest/10 hover:border-farma-forest/30 hover:bg-farma-cream text-left transition-colors cursor-pointer">
                                <div className="w-8 h-8 rounded-md bg-white border border-farma-forest/10 flex items-center justify-center mb-3 text-farma-forest">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-farma-forest">Add New Farm</p>
                                <p className="text-xs text-farma-forest/50 mt-1">Expand infrastructure</p>
                            </button>
                            <button onClick={() => handleNavigate('managers')} className="p-5 rounded-lg border border-farma-forest/10 hover:border-farma-forest/30 hover:bg-farma-cream text-left transition-colors cursor-pointer">
                                <div className="w-8 h-8 rounded-md bg-white border border-farma-forest/10 flex items-center justify-center mb-3 text-farma-forest">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-farma-forest">Add New Manager</p>
                                <p className="text-xs text-farma-forest/50 mt-1">Onboard operational staff</p>
                            </button>
                            <button onClick={() => handleNavigate('financials')} className="p-5 rounded-lg border border-farma-forest/10 hover:border-farma-forest/30 hover:bg-farma-cream text-left transition-colors cursor-pointer">
                                <div className="w-8 h-8 rounded-md bg-white border border-farma-forest/10 flex items-center justify-center mb-3 text-farma-forest">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-farma-forest">Financial Ledger</p>
                                <p className="text-xs text-farma-forest/50 mt-1">Review farm P&L</p>
                            </button>
                            <button onClick={() => handleNavigate('inventory')} className="p-5 rounded-lg border border-farma-forest/10 hover:border-farma-forest/30 hover:bg-farma-cream text-left transition-colors cursor-pointer">
                                <div className="w-8 h-8 rounded-md bg-white border border-farma-forest/10 flex items-center justify-center mb-3 text-farma-forest">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-farma-forest">Bulk Restock</p>
                                <p className="text-xs text-farma-forest/50 mt-1">Authorize feed/meds purchase</p>
                            </button>
                        </>
                    ) : (
                        <>
                            <button onClick={() => handleNavigate('daily-logs')} className="p-5 rounded-lg border border-farma-forest/10 hover:border-farma-forest/30 hover:bg-farma-cream text-left transition-colors cursor-pointer">
                                <div className="w-8 h-8 rounded-md bg-white border border-farma-forest/10 flex items-center justify-center mb-3 text-farma-forest">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-farma-forest">Log Field Data</p>
                                <p className="text-xs text-farma-forest/50 mt-1">Record feed, mortality & weight</p>
                            </button>
                            <button onClick={() => handleNavigate('batches')} className="p-5 rounded-lg border border-farma-forest/10 hover:border-farma-forest/30 hover:bg-farma-cream text-left transition-colors cursor-pointer">
                                <div className="w-8 h-8 rounded-md bg-white border border-farma-forest/10 flex items-center justify-center mb-3 text-farma-forest">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-farma-forest">Stock New Batch</p>
                                <p className="text-xs text-farma-forest/50 mt-1">Receive Day-Old Chicks (DOC)</p>
                            </button>
                            <button onClick={() => handleNavigate('batches')} className="p-5 rounded-lg border border-farma-forest/10 hover:border-farma-forest/30 hover:bg-farma-cream text-left transition-colors cursor-pointer">
                                <div className="w-8 h-8 rounded-md bg-white border border-farma-forest/10 flex items-center justify-center mb-3 text-farma-forest">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08-.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-farma-forest">Record Harvest/Sale</p>
                                <p className="text-xs text-farma-forest/50 mt-1">Sell mature birds or eggs</p>
                            </button>
                            <button onClick={() => handleNavigate('analytics')} className="p-5 rounded-lg border border-farma-forest/10 hover:border-farma-forest/30 hover:bg-farma-cream text-left transition-colors cursor-pointer">
                                <div className="w-8 h-8 rounded-md bg-white border border-farma-forest/10 flex items-center justify-center mb-3 text-farma-terracotta">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                </div>
                                <p className="text-sm font-semibold text-farma-forest">Review System Alerts</p>
                                <p className="text-xs text-farma-forest/50 mt-1">Check veterinary & feed warnings</p>
                            </button>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between p-4 mt-6 bg-white border border-farma-forest/10 rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-farma-forest text-white flex items-center justify-center font-bold text-sm">
                        {authData.email ? authData.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-farma-forest">{authData.email}</p>
                        <p className="text-xs text-farma-forest/50">Farm ID: #{authData.organisationId}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 bg-farma-forest/5 px-3 py-1.5 rounded-md border border-farma-forest/10">
                        Role: {authData.role}
                    </span>
                </div>
            </div>

        </div>
    );
};