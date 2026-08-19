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
    forest: '#101B14',
    cream: '#FBF9F5',
    green: '#2A5C38',
    gold: '#D9A63E',
    terracotta: '#E76F51',
    lightGray: '#ECE6D6'
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
            let farms = await infrastructureService.getFarmsByOrganisation(orgId);
            if (!isProprietor && currentUserId) {
                farms = farms.filter(f => f.managerId === currentUserId);
            }

            if (farms.length === 0) {
                setLoading(false);
                return;
            }

            const farmIds = farms.map(f => f.id);
            
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
                    if (typeof transactionService.getCompanyCashFlow === 'function') {
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
                    console.warn("Company cashflow endpoint failed, attempting farm-level fallback...");
                }

                if (rev === 0 && exp === 0 && farmIds.length > 0) {
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

            let invValue = 0;
            let feedQty = 0, medQty = 0, equipQty = 0;
            
            allInventory.forEach(inv => {
                const qty = Number(inv.currentQuantity || 0);
                const price = Number(inv.unitPrice || 0);

                invValue += (qty * price);

                if (inv.category === 'FEED') feedQty += qty;
                else if (inv.category === 'MEDICINE' || inv.category === 'VACCINE') medQty += qty;
                else equipQty += qty;
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

            if (feedQty === 0 && medQty === 0 && equipQty === 0) {
                setInventoryData([{ name: 'No Stock', value: 1, color: THEME.lightGray }]);
            } else {
                setInventoryData([
                    ...(feedQty > 0 ? [{ name: 'Feed Stock', value: feedQty, color: THEME.gold }] : []),
                    ...(medQty > 0 ? [{ name: 'Medicine', value: medQty, color: THEME.terracotta }] : []),
                    ...(equipQty > 0 ? [{ name: 'Equipment', value: equipQty, color: THEME.green }] : []),
                ]);
            }

            // 🟢 FIX: Dynamic Current Month Calculation!
            const currentMonth = new Date().toLocaleString('default', { month: 'short' }); // Resolves to "Aug"

            if (realMonthlyBreakdown.length > 0) {
                setCashflowData(realMonthlyBreakdown);
            } else if (rev > 0 || exp > 0) {
                // If backend provides no array but we aggregated the data, dump all the real money into the actual current month
                setCashflowData([
                    { month: currentMonth, Income: rev, Expense: exp }
                ]);
            } else {
                // If the entire farm is broke, just show 0 for the current month
                setCashflowData([
                    { month: currentMonth, Income: 0, Expense: 0 }
                ]);
            }

            setLoading(false);
        } catch (err) {
            console.error("Critical failure compiling dashboard telemetry:", err);
            setLoading(false);
        }
    }, [orgId, isProprietor, currentUserId]);

    useEffect(() => {
        const timer = setTimeout(() => {
            bootDashboard();
        }, 0);
        return () => clearTimeout(timer);
    }, [bootDashboard]);

    if (loading) {
        return (
            <div className="py-32 flex flex-col items-center justify-center space-y-4 font-sans">
                <div className="w-12 h-12 border-4 border-[#2A5C38]/20 border-t-[#2A5C38] rounded-full animate-spin"></div>
                <p className="text-xs font-mono font-bold text-[#101B14]/60 uppercase tracking-widest">Compiling Enterprise Telemetry...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
            
            {/* 1. DYNAMIC HEADER */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#101B14]/10 pb-5">
                <div>
                    <h3 className="text-3xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                        {isProprietor ? 'Global Enterprise Overview' : 'Site Operations Command'}
                    </h3>
                    <p className="text-sm text-[#101B14]/70 font-medium mt-1">
                        {isProprietor 
                            ? 'Aggregated financial health, biological assets, and network-wide alerts.' 
                            : 'Real-time pen monitoring, local inventory stock, and daily telemetry tracking.'}
                    </p>
                </div>
                
                <div className="flex items-center space-x-3 shrink-0">
                    <button
                        onClick={bootDashboard}
                        className="px-3 py-1.5 rounded-lg bg-white border border-[#101B14]/15 hover:bg-[#101B14]/5 text-[#101B14] text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                        title="Sync Dashboard Data"
                    >
                        🔄 <span className="font-mono text-[10px] uppercase">Sync Radar</span>
                    </button>

                    <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#2A5C38] opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#2A5C38]"></span>
                    </span>
                    <span className="text-[10px] font-mono font-bold text-[#2A5C38] uppercase tracking-widest bg-[#2A5C38]/10 border border-[#2A5C38]/20 px-3 py-1.5 rounded-full">
                        {isProprietor ? 'Global Access' : `Scope: Farm Manager`}
                    </span>
                </div>
            </div>

            {/* 2. DYNAMIC KPI STRIP */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                
                {/* Card 1: Primary Metric */}
                <div 
                    onClick={() => handleNavigate(isProprietor ? 'financial-workspace' : 'sections')}
                    className="bg-[#101B14] text-[#FBF9F5] p-6 rounded-2xl shadow-lg relative overflow-hidden group cursor-pointer hover:scale-[1.01] transition-all"
                >
                    <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-[#D9A63E]/10 transition-colors duration-700 pointer-events-none"></div>
                    <span className="text-[10px] font-mono font-bold text-[#FBF9F5]/60 uppercase tracking-widest block relative z-10">
                        {isProprietor ? 'Total Gross Revenue' : 'Total Live Population'}
                    </span>
                    <div className="mt-2 text-4xl font-extrabold font-mono relative z-10">
                        {isProprietor 
                            ? `₦${globalStats.totalRevenue.toLocaleString()}` 
                            : globalStats.livePopulation.toLocaleString()}
                    </div>
                    <div className="mt-4 relative z-10 flex justify-between items-center">
                        <span className="text-[9px] font-bold text-[#2A5C38] bg-[#2A5C38]/20 px-2 py-1 rounded uppercase tracking-widest">
                            {isProprietor ? 'YTD Earnings' : 'Active Biomass'}
                        </span>
                        <span className="text-[10px] text-white/50 font-mono group-hover:text-white transition-colors">Details →</span>
                    </div>
                </div>

                {/* Card 2: Secondary Metric */}
                <div 
                    onClick={() => handleNavigate(isProprietor ? 'financial-workspace' : 'sections')}
                    className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#101B14]/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
                >
                    <span className="text-[10px] font-mono font-bold text-[#101B14]/50 uppercase tracking-widest block">
                        {isProprietor ? 'Total Operating Expenses' : 'Active Cohorts (Batches)'}
                    </span>
                    <div className={`mt-2 text-4xl font-extrabold font-mono ${isProprietor ? 'text-[#E76F51]' : 'text-[#2A5C38]'}`}>
                        {isProprietor 
                            ? `₦${globalStats.totalExpenses.toLocaleString()}` 
                            : globalStats.activeBatches}
                    </div>
                    <div className="mt-4 border-t border-[#101B14]/5 pt-3 flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-[#101B14]/40">
                            {isProprietor ? 'Enterprise Outflow' : 'Currently Rearing'}
                        </span>
                        <span className="text-[10px] text-[#101B14]/40 font-mono group-hover:text-[#101B14] transition-colors">View →</span>
                    </div>
                </div>

                {/* Card 3: Asset & Company Valuation */}
                <div 
                    onClick={() => handleNavigate('inventory')}
                    className="bg-[#FBF9F5] p-6 rounded-2xl border border-[#101B14]/10 shadow-sm flex flex-col justify-between hover:shadow-md transition-all cursor-pointer group"
                >
                    <span className="text-[10px] font-mono font-bold text-[#101B14]/50 uppercase tracking-widest block">
                        {isProprietor ? 'Company Asset Valuation' : 'Warehouse Valuation'}
                    </span>
                    <div className="mt-2 text-3xl sm:text-4xl font-extrabold font-mono text-[#101B14]">
                        ₦{(isProprietor ? globalStats.companyValuation : globalStats.totalInventoryValue).toLocaleString()}
                    </div>
                    <div className="mt-4 border-t border-[#101B14]/5 pt-3 flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-[#101B14]/40">
                            {isProprietor ? 'Stock + Capital Assets' : 'Physical Warehouse'}
                        </span>
                        <span className="text-[10px] font-bold text-[#D9A63E] group-hover:underline uppercase tracking-widest">Manage Stock →</span>
                    </div>
                </div>

                {/* Card 4: Security Radar */}
                <div 
                    onClick={() => handleNavigate('analytics')}
                    className={`p-6 rounded-2xl border shadow-sm flex flex-col justify-between transition-all cursor-pointer group ${globalStats.activeAlerts > 0 ? 'bg-[#E76F51]/5 border-[#E76F51]/30 hover:bg-[#E76F51]/10' : 'bg-white border-[#101B14]/10 hover:shadow-md'}`}
                >
                    <span className="text-[10px] font-mono font-bold text-[#101B14]/50 uppercase tracking-widest block">
                        Biosecurity Radar
                    </span>
                    <div className={`mt-2 text-4xl font-extrabold font-mono ${globalStats.activeAlerts > 0 ? 'text-[#E76F51]' : 'text-[#2A5C38]'}`}>
                        {globalStats.activeAlerts} <span className="text-xl">Alerts</span>
                    </div>
                    <div className="mt-4 border-t border-[#101B14]/5 pt-3 flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold text-[#101B14]/40">System State Machine</span>
                        <span className="text-[10px] font-bold text-[#E76F51] group-hover:underline uppercase tracking-widest">Audit Radar →</span>
                    </div>
                </div>
            </div>

            {/* 3. MACRO CHARTS & VISUALIZATIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pt-2">
                
                {/* Left Chart: Financial Cashflow or Performance Trend */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-[#101B14]/10 p-7 shadow-sm">
                    <div className="flex justify-between items-end mb-6">
                        <div>
                            <h4 className="text-lg font-extrabold text-[#101B14] font-['Fraunces',serif]">
                                {isProprietor ? 'Enterprise Cashflow (YTD)' : 'Production Trend'}
                            </h4>
                            <p className="text-[10px] text-[#101B14]/50 font-bold uppercase tracking-widest mt-1">
                                {isProprietor ? 'Monthly Income vs Expenditure' : 'Efficiency metrics over time'}
                            </p>
                        </div>
                        {isProprietor && (
                            <div className="flex gap-4">
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#2A5C38]"></div><span className="text-[10px] font-mono font-bold text-[#101B14]/60">Income</span></div>
                                <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-[#E76F51]"></div><span className="text-[10px] font-mono font-bold text-[#101B14]/60">Expense</span></div>
                            </div>
                        )}
                    </div>
                    
                    <div className="h-72 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={cashflowData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.lightGray} opacity={0.5} />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: THEME.forest, opacity: 0.5, fontFamily: 'monospace' }} dy={10} />
                                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: THEME.forest, opacity: 0.5, fontFamily: 'monospace' }} tickFormatter={(val) => `₦${(val/1000).toFixed(0)}k`} />
                                <RechartsTooltip 
                                    cursor={{ fill: THEME.lightGray, opacity: 0.2 }}
                                    contentStyle={{ backgroundColor: THEME.forest, borderRadius: '12px', border: 'none' }}
                                    itemStyle={{ fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}
                                    labelStyle={{ color: THEME.cream, opacity: 0.6, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                                />
                                <Bar dataKey="Income" fill={THEME.green} radius={[4, 4, 0, 0]} barSize={24} />
                                <Bar dataKey="Expense" fill={THEME.terracotta} radius={[4, 4, 0, 0]} barSize={24} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Right Chart: Inventory Distribution Donut */}
                <div className="bg-white rounded-2xl border border-[#101B14]/10 p-7 shadow-sm flex flex-col items-center">
                    <h4 className="text-lg font-extrabold text-[#101B14] font-['Fraunces',serif] w-full text-left">Asset Allocation</h4>
                    <p className="text-[10px] text-[#101B14]/50 font-bold uppercase tracking-widest mt-1 w-full text-left">Warehouse Distribution by Volume</p>
                    
                    <div className="h-48 w-full relative mt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie data={inventoryData} innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                                    {inventoryData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <RechartsTooltip contentStyle={{ borderRadius: '8px', border: `1px solid ${THEME.lightGray}`, fontSize: '12px', fontWeight: 'bold' }} />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
                            <span className="text-[10px] font-bold text-[#101B14]/40 uppercase tracking-widest">Total Stock Value</span>
                            <span className="text-lg font-extrabold text-[#101B14] font-mono">₦{globalStats.totalInventoryValue.toLocaleString()}</span>
                        </div>
                    </div>
                    
                    {/* Custom Legend */}
                    <div className="w-full mt-6 space-y-2">
                        {inventoryData.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-xs font-mono font-bold">
                                <div className="flex items-center gap-2">
                                    <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }}></div>
                                    <span className="text-[#101B14]/70 uppercase tracking-wider">{item.name}</span>
                                </div>
                                <span className="text-[#101B14]">{item.value === 1 && item.name === 'No Stock' ? '0' : item.value.toLocaleString()} Units</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* 4. WORKFLOW QUICK ACTIONS */}
            <div className="bg-white rounded-2xl border border-[#101B14]/10 p-6 shadow-sm mt-6">
                <div className="border-b border-[#101B14]/10 pb-4 mb-6">
                    <h4 className="text-lg font-extrabold text-[#101B14] font-['Fraunces',serif]">Quick Workflows</h4>
                    <span className="text-[10px] font-mono text-[#101B14]/40 uppercase tracking-widest">Accelerated Navigation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    
                    <button 
                        onClick={() => handleNavigate('daily-logs')} 
                        className="p-5 rounded-xl border border-[#101B14]/10 hover:border-[#D9A63E]/50 hover:bg-[#D9A63E]/5 text-left transition-all group cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#D9A63E]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-lg">📝</span>
                        </div>
                        <p className="text-sm font-bold text-[#101B14] group-hover:text-[#D9A63E]">Record Telemetry</p>
                        <p className="text-[10px] font-mono text-[#101B14]/50 mt-1">Log mortality, feed usage & weights</p>
                    </button>

                    <button 
                        onClick={() => handleNavigate('analytics')} 
                        className="p-5 rounded-xl border border-[#101B14]/10 hover:border-[#E76F51]/50 hover:bg-[#E76F51]/5 text-left transition-all group cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#E76F51]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-lg">🛡️</span>
                        </div>
                        <p className="text-sm font-bold text-[#101B14] group-hover:text-[#E76F51]">Biosecurity Radar</p>
                        <p className="text-[10px] font-mono text-[#101B14]/50 mt-1">Resolve active system alerts</p>
                    </button>

                    {isProprietor && (
                        <button 
                            onClick={() => handleNavigate('financial-workspace')} 
                            className="p-5 rounded-xl border border-[#101B14]/10 hover:border-[#2A5C38]/50 hover:bg-[#2A5C38]/5 text-left transition-all group cursor-pointer"
                        >
                            <div className="w-10 h-10 rounded-full bg-[#2A5C38]/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                <span className="text-lg">💰</span>
                            </div>
                            <p className="text-sm font-bold text-[#101B14] group-hover:text-[#2A5C38]">Financial Ledger</p>
                            <p className="text-[10px] font-mono text-[#101B14]/50 mt-1">Audit enterprise transactions</p>
                        </button>
                    )}

                    <button 
                        onClick={() => handleNavigate('inventory')} 
                        className="p-5 rounded-xl border border-[#101B14]/10 hover:border-[#101B14]/30 hover:bg-[#101B14]/5 text-left transition-all group cursor-pointer"
                    >
                        <div className="w-10 h-10 rounded-full bg-[#101B14]/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <span className="text-lg">📦</span>
                        </div>
                        <p className="text-sm font-bold text-[#101B14]">Warehouse Manager</p>
                        <p className="text-[10px] font-mono text-[#101B14]/50 mt-1">View stock & WAC valuation</p>
                    </button>
                </div>
            </div>

            {/* 5. OPERATOR PROFILE STRIP */}
            <div className="flex items-center justify-between p-4 mt-6 bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#101B14] text-white flex items-center justify-center font-bold font-mono">
                        {authData.email ? authData.email.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <p className="text-sm font-bold text-[#101B14]">{authData.email}</p>
                        <p className="text-[10px] font-mono text-[#101B14]/50">Tenant Org ID: #{authData.organisationId}</p>
                    </div>
                </div>
                <div className="text-right">
                    <span className="text-[9px] font-extrabold uppercase tracking-widest text-[#D9A63E] bg-[#D9A63E]/10 px-3 py-1.5 rounded border border-[#D9A63E]/20">
                        Clearance: {authData.role}
                    </span>
                </div>
            </div>

        </div>
    );
};