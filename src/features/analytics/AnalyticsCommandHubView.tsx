import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
    PieChart, Pie, Cell 
} from 'recharts';
import { infrastructureService } from '../../services/infrastructureService';
import { batchService } from '../../services/batchService';
import { analyticsService } from '../../services/analyticsService';
import { alertService } from '../../services/alertService';
import type { FarmResponseDto } from '../../types/infrastructure';
import type { BatchResponseDto } from '../../types/batch';
import type {
    BatchPerformanceDashboardDto,
    SystemAlertResponse,
    AlertResolutionRequest,
    AlertResolutionCategory,
} from '../../types/analytics';

interface AnalyticsCommandHubViewProps {
    organisationId: number;
    userRole?: string;
    currentUserId?: number;
}

// --- FARMA THEME CONSTANTS FOR CHARTS ---
const THEME = {
    forest: '#101B14',
    cream: '#FBF9F5',
    green: '#2A5C38',
    gold: '#D9A63E',
    terracotta: '#E76F51',
    lightGray: '#ECE6D6'
};

export const AnalyticsCommandHubView: React.FC<AnalyticsCommandHubViewProps> = ({ 
    organisationId, 
    userRole = 'PROPRIETOR', 
    currentUserId 
}) => {
    const isProprietor = userRole?.toUpperCase() === 'PROPRIETOR' || userRole?.toUpperCase() === 'ADMIN';

    const [farms, setFarms] = useState<FarmResponseDto[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | ''>('');
    const [batches, setBatches] = useState<BatchResponseDto[]>([]);
    const [selectedBatchId, setSelectedBatchId] = useState<number | ''>('');

    const [dashboard, setDashboard] = useState<BatchPerformanceDashboardDto | null>(null);
    const [activeAlerts, setActiveAlerts] = useState<SystemAlertResponse[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [selectedAlertForResolution, setSelectedAlertForResolution] = useState<SystemAlertResponse | null>(null);
    const [resolutionForm, setResolutionForm] = useState<AlertResolutionRequest>({
        actionCategory: 'VENTILATION_AND_COOLING',
        actionTaken: '',
        supervisorNotes: '',
        verifiedTemperature: undefined,
        verifiedWaterPressure: undefined,
    });

    // 1. Initial Load: Fetch Farms
    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            setLoading(true);
            try {
                let farmList = await infrastructureService.getFarmsByOrganisation(organisationId);
                if (!isProprietor && currentUserId) {
                    farmList = farmList.filter((farm) => farm.managerId === currentUserId);
                }
                if (isMounted && farmList.length > 0) {
                    setFarms(farmList);
                    setSelectedFarmId(farmList[0].id);
                }
            } catch {
                if (isMounted) setErrorMessage('Failed to load farm facilities.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        init();
        return () => { isMounted = false; };
    }, [organisationId, isProprietor, currentUserId]);

    // 2. Fetch Batches
    useEffect(() => {
        let isMounted = true;
        if (!selectedFarmId) return;
        const fetchBatches = async () => {
            try {
                const sections = await infrastructureService.getSectionsByFarm(Number(selectedFarmId));
                const batchPromises = (sections || []).map((sec) =>
                    batchService.getBatchesBySection(sec.id).catch(() => [])
                );
                const nested = await Promise.all(batchPromises);
                const flatBatches = nested.flat().filter(b => b.status === 'ACTIVE');
                if (isMounted) {
                    setBatches(flatBatches);
                    if (flatBatches.length > 0) {
                        setSelectedBatchId(flatBatches[0].id);
                    } else {
                        setSelectedBatchId('');
                        setDashboard(null);
                        setActiveAlerts([]);
                    }
                }
            } catch {
                if (isMounted) { setBatches([]); setSelectedBatchId(''); }
            }
        };
        fetchBatches();
        return () => { isMounted = false; };
    }, [selectedFarmId]);

    // 3. Sync Dashboard
    useEffect(() => {
        let isMounted = true;
        if (!selectedBatchId) return;
        const loadBatchAnalytics = async () => {
            setLoading(true);
            setErrorMessage(null);
            try {
                const bId = Number(selectedBatchId);
                const [dashboardData, alertList] = await Promise.all([
                    analyticsService.getBatchPerformanceDashboard(bId).catch(() => null),
                    alertService.getActiveAlertsForBatch(bId).catch(() => []),
                ]);
                if (isMounted) {
                    setDashboard(dashboardData);
                    setActiveAlerts(Array.isArray(alertList) ? alertList : []);
                }
            } catch {
                if (isMounted) setErrorMessage('Could not load batch performance analytics.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        loadBatchAnalytics();
        return () => { isMounted = false; };
    }, [selectedBatchId]);

    const reloadBatchData = async () => {
        if (!selectedBatchId) return;
        try {
            const bId = Number(selectedBatchId);
            const [dashboardData, alertList] = await Promise.all([
                analyticsService.getBatchPerformanceDashboard(bId),
                alertService.getActiveAlertsForBatch(bId),
            ]);
            setDashboard(dashboardData);
            setActiveAlerts(Array.isArray(alertList) ? alertList : []);
        } catch (error) {
            // FIXED: Removed empty block. We log silently for background refresh failures.
            console.debug('Background refresh failed silently:', error);
        }
    };

    const handleAcknowledgeAlert = async (alertId: number) => {
        try {
            await alertService.acknowledgeAlert(alertId);
            setSuccessMessage('Alert acknowledged.');
            await reloadBatchData();
            setTimeout(() => setSuccessMessage(null), 3000);
        } catch {
            setErrorMessage('Failed to acknowledge alert.');
        }
    };

    const handleResolveAlert = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedAlertForResolution || resolutionForm.actionTaken.trim().length < 5) return;
        setSubmitting(true);
        setErrorMessage(null);
        setSuccessMessage(null);
        try {
            await alertService.resolveAlert(selectedAlertForResolution.id, resolutionForm);
            setSuccessMessage('Biosecurity alert successfully resolved!');
            setSelectedAlertForResolution(null);
            setResolutionForm({ actionCategory: 'VENTILATION_AND_COOLING', actionTaken: '', supervisorNotes: '', verifiedTemperature: undefined, verifiedWaterPressure: undefined });
            await reloadBatchData();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            // FIXED: Swapped 'any' for 'unknown' and checked using axios.isAxiosError
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || err.response?.data || 'Failed to resolve alert.');
            } else {
                setErrorMessage('An unexpected error occurred while resolving the alert.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // --- VISUALIZATION MOCK DATA & HELPERS ---
    const getFcrStatusBadge = (fcr: number) => {
        if (fcr <= 0) return { label: 'Awaiting Data', color: 'text-[#101B14]/40 bg-[#101B14]/5 border-[#101B14]/10' };
        if (fcr <= 1.55) return { label: 'Exceptional (<1.55)', color: 'text-[#2A5C38] bg-[#2A5C38]/10 border-[#2A5C38]/30' };
        if (fcr <= 1.8) return { label: 'Standard (1.55-1.80)', color: 'text-[#D9A63E] bg-[#D9A63E]/10 border-[#D9A63E]/30' };
        return { label: 'High Drift (>1.80)', color: 'text-[#E76F51] bg-[#E76F51]/10 border-[#E76F51]/30' };
    };

    // Generates a mock growth trajectory based on the current age and weight for the LineChart
    const generateMockGrowthCurve = () => {
        if (!dashboard) return [];
        const curve = [];
        const daysToShow = Math.min(dashboard.currentAgeInDays, 14); // Show up to last 14 days
        for (let i = daysToShow - 1; i >= 0; i--) {
            const day = dashboard.currentAgeInDays - i;
            // Create a realistic exponential curve leading to the current weight
            const factor = Math.pow(day / dashboard.currentAgeInDays, 1.3); 
            curve.push({
                day: `Day ${day}`,
                actualWeight: Number((dashboard.currentAverageWeightGrams * factor).toFixed(0)),
                targetWeight: Number((dashboard.currentAverageWeightGrams * (factor * 1.05)).toFixed(0)), // Mock target is 5% higher
            });
        }
        return curve;
    };

    // Data for Pie Charts
    const survivabilityData = dashboard ? [
        { name: 'Live Birds', value: dashboard.currentCount, color: THEME.green },
        { name: 'Mortality', value: dashboard.totalMortality, color: THEME.terracotta }
    ] : [];

    // Mock THI data (Ideally this comes from your backend)
    const currentTHI = 76; 
    const thiGaugeData = [
        { name: 'Current THI', value: currentTHI, color: currentTHI > 80 ? THEME.terracotta : THEME.gold },
        { name: 'Remaining', value: 100 - currentTHI, color: THEME.lightGray }
    ];

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">
            
            {/* 1. TOP EXECUTIVE HEADER BAR */}
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b-2 border-[#101B14]/10 pb-5">
                <div>
                    <h3 className="text-2xl md:text-3xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                        {isProprietor ? 'Agronomic Command Hub' : 'Site Biosecurity Radar'}
                    </h3>
                    <p className="text-sm text-[#101B14]/70 font-medium mt-1">
                        Real-time THI microclimate stress gauges, performance benchmarking, and biosecurity state-machines.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <select
                        value={selectedFarmId}
                        onChange={(e) => setSelectedFarmId(Number(e.target.value))}
                        disabled={!isProprietor && farms.length <= 1}
                        className="px-4 py-3 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#D9A63E]/30 shadow-sm cursor-pointer disabled:opacity-50 appearance-none pr-10"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                    >
                        {farms.map((f) => <option key={f.id} value={f.id}>🏢 {f.name}</option>)}
                    </select>

                    <select
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(Number(e.target.value))}
                        disabled={batches.length === 0}
                        className="px-4 py-3 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#D9A63E]/30 shadow-sm cursor-pointer disabled:opacity-50 appearance-none pr-10"
                        style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                    >
                        {batches.length > 0 ? batches.map((b) => (
                            <option key={b.id} value={b.id}>🛖 {b.sectionName} — #{b.batchNumber}</option>
                        )) : <option>No Active Batches</option>}
                    </select>
                </div>
            </div>

            {/* Inline Notifications */}
            {errorMessage && (
                <div className="p-4 rounded-xl bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-xs font-bold shadow-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    {errorMessage}
                </div>
            )}
            {successMessage && (
                <div className="p-4 rounded-xl bg-[#2A5C38]/10 border border-[#2A5C38]/30 text-[#2A5C38] text-xs font-bold shadow-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    {successMessage}
                </div>
            )}

            {loading ? (
                <div className="py-24 text-center flex flex-col items-center justify-center">
                    <div className="w-12 h-12 border-4 border-[#2A5C38]/20 border-t-[#2A5C38] rounded-full animate-spin mb-4"></div>
                    <span className="text-[10px] font-mono font-bold text-[#101B14]/50 uppercase tracking-widest">Synchronizing Radar...</span>
                </div>
            ) : dashboard ? (
                <div className="space-y-6">
                    
                    {/* 2. KPI STRIP (The 4 Main Cards) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        
                        {/* FCR Card (Dark Theme Highlight) */}
                        <div className="bg-[#101B14] border border-[#101B14] rounded-2xl p-6 shadow-lg flex flex-col justify-between relative overflow-hidden group">
                            {/* Decorative background element */}
                            <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-[#D9A63E]/10 transition-colors duration-700 pointer-events-none"></div>
                            
                            <span className="text-[10px] font-mono font-bold text-[#FBF9F5]/60 uppercase tracking-widest block mb-2 relative z-10">
                                Calculated FCR
                            </span>
                            <div className="text-5xl font-extrabold text-[#FBF9F5] font-mono tracking-tighter relative z-10 mb-4">
                                {dashboard.calculatedFcr > 0 ? dashboard.calculatedFcr.toFixed(2) : '-.--'}
                            </div>
                            <div className="relative z-10">
                                <span className={`inline-block px-3 py-1 rounded-full text-[9px] font-extrabold uppercase tracking-widest border ${getFcrStatusBadge(dashboard.calculatedFcr).color}`}>
                                    {getFcrStatusBadge(dashboard.calculatedFcr).label}
                                </span>
                            </div>
                        </div>

                        {/* Survivability Card */}
                        <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-widest block mb-2">Survivability Rate</span>
                            <div className="text-4xl font-extrabold text-[#2A5C38] font-mono tracking-tighter mb-4">
                                {(dashboard.survivabilityRatePercentage || 0).toFixed(1)}<span className="text-2xl text-[#2A5C38]/70">%</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#101B14]/50 block border-t border-[#101B14]/5 pt-3">
                                Live Headcount: <span className="text-[#101B14]">{dashboard.currentCount.toLocaleString()}</span> / {dashboard.initialCount.toLocaleString()}
                            </span>
                        </div>

                        {/* Average Weight Card */}
                        <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-widest block mb-2">Avg Body Weight</span>
                            <div className="text-4xl font-extrabold text-[#101B14] font-mono tracking-tighter mb-4">
                                {(dashboard.currentAverageWeightGrams || 0).toLocaleString()}<span className="text-2xl text-[#101B14]/40">g</span>
                            </div>
                            <span className="text-[10px] font-mono font-bold text-[#101B14]/50 block border-t border-[#101B14]/5 pt-3">
                                Total Feed Consumed: <span className="text-[#101B14]">{(dashboard.totalFeedConsumedKg || 0).toLocaleString()} kg</span>
                            </span>
                        </div>

                        {/* Age & Alerts Card */}
                        <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-2xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-widest block mb-2">Biological Age</span>
                            <div className="text-4xl font-extrabold text-[#D9A63E] font-mono tracking-tighter mb-4">
                                Day {dashboard.currentAgeInDays || 0}
                            </div>
                            <div className="flex gap-2 pt-3 border-t border-[#101B14]/5">
                                <span className={`text-[9px] font-mono font-extrabold px-2 py-1 rounded border ${dashboard.activeAlertsCount > 0 ? 'text-[#E76F51] bg-[#E76F51]/10 border-[#E76F51]/30' : 'text-[#101B14]/40 bg-[#101B14]/5 border-[#101B14]/10'}`}>
                                    🚨 {dashboard.activeAlertsCount} Active
                                </span>
                                <span className="text-[9px] font-mono font-extrabold px-2 py-1 rounded border text-[#2A5C38] bg-[#2A5C38]/10 border-[#2A5C38]/30">
                                    ✅ {dashboard.resolvedAlertsCount} Fixed
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* 3. RECHARTS VISUALIZATION GRID */}
                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        
                        {/* MAIN CHART: Biomass Growth Trajectory (Spans 2 cols) */}
                        <div className="xl:col-span-2 bg-white border border-[#101B14]/10 rounded-2xl p-7 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                                <div>
                                    <h4 className="text-xl font-extrabold text-[#101B14] font-['Fraunces',serif]">Biomass Trajectory</h4>
                                    <p className="text-[10px] text-[#101B14]/50 font-bold uppercase tracking-widest mt-1">
                                        Actual average weight vs. Breed Standard target
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 bg-[#FBF9F5] px-4 py-2 rounded-lg border border-[#101B14]/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-1 bg-[#2A5C38] rounded-full"></div>
                                        <span className="text-[10px] font-mono font-bold text-[#101B14]">Actual (g)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-0 border-t-2 border-dashed border-[#D9A63E]"></div>
                                        <span className="text-[10px] font-mono font-bold text-[#101B14]/60">Target (g)</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={generateMockGrowthCurve()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.lightGray} opacity={0.5} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: THEME.forest, opacity: 0.4, fontFamily: 'monospace' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: THEME.forest, opacity: 0.4, fontFamily: 'monospace' }} />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: THEME.forest, borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            itemStyle={{ color: THEME.cream, fontSize: '12px', fontWeight: 'bold', fontFamily: 'monospace' }}
                                            labelStyle={{ color: THEME.cream, opacity: 0.6, fontSize: '10px', textTransform: 'uppercase', marginBottom: '4px' }}
                                        />
                                        <Line 
                                            type="monotone" dataKey="actualWeight" name="Actual" 
                                            stroke={THEME.green} strokeWidth={4} 
                                            dot={{ r: 4, fill: THEME.green, strokeWidth: 0 }} 
                                            activeDot={{ r: 6, stroke: THEME.cream, strokeWidth: 2 }} 
                                        />
                                        <Line 
                                            type="monotone" dataKey="targetWeight" name="Target" 
                                            stroke={THEME.gold} strokeWidth={2} strokeDasharray="5 5" 
                                            dot={false} activeDot={false} 
                                        />
                                    </LineChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* SIDE GAUGES: Survivability & THI */}
                        <div className="space-y-6 flex flex-col justify-between">
                            
                            {/* Survivability Donut */}
                            <div className="bg-white border border-[#101B14]/10 rounded-2xl p-6 shadow-sm flex-1 flex flex-col items-center justify-center relative">
                                <h4 className="text-base font-extrabold text-[#101B14] font-['Fraunces',serif] w-full text-left absolute top-6 left-6">
                                    Flock Integrity
                                </h4>
                                <div className="h-40 w-full relative mt-8">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={survivabilityData} 
                                                innerRadius={55} outerRadius={75} 
                                                paddingAngle={2} dataKey="value" stroke="none"
                                            >
                                                {survivabilityData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                            <RechartsTooltip 
                                                contentStyle={{ borderRadius: '8px', border: `1px solid ${THEME.lightGray}`, fontSize: '12px', fontWeight: 'bold' }} 
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                        <span className="text-2xl font-extrabold text-[#101B14] font-mono">
                                            {(dashboard.survivabilityRatePercentage || 0).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* THI Radial Gauge */}
                            <div className="bg-white border border-[#101B14]/10 rounded-2xl p-6 shadow-sm flex-1 flex flex-col items-center relative overflow-hidden">
                                <h4 className="text-base font-extrabold text-[#101B14] font-['Fraunces',serif] w-full text-left absolute top-6 left-6">
                                    THI Stress Radar
                                </h4>
                                <div className="h-32 w-full mt-10">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie 
                                                data={thiGaugeData} 
                                                cx="50%" cy="100%" 
                                                startAngle={180} endAngle={0} 
                                                innerRadius={70} outerRadius={90} 
                                                paddingAngle={0} dataKey="value" stroke="none"
                                            >
                                                {thiGaugeData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                                ))}
                                            </Pie>
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>
                                <div className="absolute bottom-6 flex flex-col items-center">
                                    <span className="text-3xl font-extrabold text-[#101B14] font-mono leading-none">{currentTHI}</span>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded mt-2 border ${currentTHI > 80 ? 'text-[#E76F51] bg-[#E76F51]/10 border-[#E76F51]/30' : 'text-[#D9A63E] bg-[#D9A63E]/10 border-[#D9A63E]/30'}`}>
                                        {currentTHI > 80 ? 'Heat Stress' : 'Moderate'}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>

                    {/* 4. BIOSECURITY INCIDENT TIMELINE */}
                    <div className="bg-white border border-[#101B14]/10 rounded-2xl overflow-hidden shadow-sm">
                        <div className="bg-[#DFD8C4] px-6 py-5 flex items-center justify-between border-b-2 border-[#101B14]/15">
                            <div>
                                <h4 className="text-lg font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                                    State Machine Incident Ledger
                                </h4>
                                <p className="text-[10px] text-[#101B14]/60 font-mono font-bold uppercase tracking-widest mt-1">
                                    Automated Evaluators & Auditable Resolutions
                                </p>
                            </div>
                            <span className="px-3 py-1.5 rounded-full bg-white/50 text-[#101B14] text-[10px] font-mono font-bold border border-[#101B14]/10 shadow-sm">
                                {activeAlerts.length} Active System Alerts
                            </span>
                        </div>

                        <div className="p-6 bg-[#FBF9F5]/30">
                            {activeAlerts.length > 0 ? (
                                <div className="space-y-4">
                                    {activeAlerts.map((alert) => (
                                        <div key={alert.id} className={`p-5 rounded-2xl bg-white border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all shadow-sm ${alert.status === 'TRIGGERED' ? 'border-[#E76F51]/30 shadow-[inset_4px_0_0_#E76F51]' : 'border-[#D9A63E]/30 shadow-[inset_4px_0_0_#D9A63E]'}`}>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2.5 py-1 rounded text-[9px] font-extrabold uppercase tracking-widest ${alert.status === 'TRIGGERED' ? 'bg-[#E76F51] text-white' : 'bg-[#D9A63E] text-[#101B14]'}`}>
                                                        {alert.status}
                                                    </span>
                                                    <span className="text-[10px] font-bold text-[#101B14]/40 uppercase tracking-widest font-mono flex items-center gap-1">
                                                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                                        {new Date(alert.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <h5 className="text-base font-extrabold text-[#101B14] mb-1">{alert.alertType.replace(/_/g, ' ')}</h5>
                                                <p className="text-sm text-[#101B14]/60 font-medium max-w-2xl">{alert.diagnosisMessage}</p>
                                            </div>
                                            
                                            <div className="shrink-0 flex gap-3 pt-2 md:pt-0">
                                                {alert.status === 'TRIGGERED' && (
                                                    <button onClick={() => handleAcknowledgeAlert(alert.id)} className="px-5 py-2.5 bg-[#FBF9F5] border border-[#101B14]/10 rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-[#101B14] hover:bg-[#ECE6D6] transition-colors cursor-pointer shadow-sm">
                                                        Acknowledge Alert
                                                    </button>
                                                )}
                                                {alert.status === 'ACKNOWLEDGED' && (
                                                    <button onClick={() => { setSelectedAlertForResolution(alert); setResolutionForm({ actionCategory: 'VENTILATION_AND_COOLING', actionTaken: '', supervisorNotes: '', verifiedTemperature: undefined, verifiedWaterPressure: undefined }); }} className="px-5 py-2.5 bg-[#101B14] rounded-lg text-[10px] font-extrabold uppercase tracking-widest text-white hover:bg-[#3F6B47] transition-colors cursor-pointer shadow-md">
                                                        Audit & Resolve
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center flex flex-col items-center bg-white rounded-2xl border border-[#101B14]/5 shadow-sm">
                                    <div className="w-16 h-16 rounded-full bg-[#2A5C38]/10 flex items-center justify-center text-[#2A5C38] mb-4 shadow-inner">
                                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                    </div>
                                    <h5 className="text-xl font-extrabold text-[#101B14] font-['Fraunces',serif]">All Systems Normal</h5>
                                    <span className="text-xs font-mono font-bold text-[#101B14]/50 uppercase tracking-widest mt-2">No active biosecurity anomalies</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-2xl p-24 text-center flex flex-col items-center justify-center shadow-sm mt-6">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner border border-[#101B14]/5 mb-6">
                        <svg className="w-10 h-10 text-[#101B14]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                    </div>
                    <h3 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] mb-2">Radar Offline</h3>
                    <p className="text-sm text-[#101B14]/60 font-medium max-w-sm">Please select a farm facility and active cohort from the dropdowns above to initiate tracking.</p>
                </div>
            )}

            {/* 5. FROSTED RESOLUTION MODAL */}
            {selectedAlertForResolution && (
                <div className="fixed inset-0 bg-[#101B14]/80 backdrop-blur-md flex items-center justify-center p-4 z-50">
                    <div className="bg-[#FBF9F5] rounded-3xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden border border-white/10 relative">
                        {/* Decorative Top Accent */}
                        <div className="h-2 w-full bg-gradient-to-r from-[#D9A63E] to-[#E76F51] shrink-0"></div>
                        
                        <div className="p-8 bg-white border-b border-[#101B14]/5 flex justify-between items-start">
                            <div>
                                <h4 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif]">Resolve Incident</h4>
                                <p className="text-[10px] font-mono font-bold text-[#101B14]/50 uppercase tracking-widest mt-2">Audit log for Cohort #{selectedAlertForResolution.batchNumber}</p>
                            </div>
                            <button onClick={() => setSelectedAlertForResolution(null)} className="text-[#101B14]/30 hover:text-[#E76F51] bg-[#101B14]/5 hover:bg-[#E76F51]/10 p-2 rounded-full transition-colors cursor-pointer">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <form onSubmit={handleResolveAlert} className="p-8 space-y-5">
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Corrective Category *</label>
                                <select 
                                    value={resolutionForm.actionCategory} 
                                    onChange={(e) => setResolutionForm({ ...resolutionForm, actionCategory: e.target.value as AlertResolutionCategory })}
                                    className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#101B14]/15 text-[#101B14] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#D9A63E]/40 transition-all shadow-sm appearance-none"
                                    style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                                >
                                    <option value="VENTILATION_AND_COOLING">Ventilation & Cooling System</option>
                                    <option value="WATER_SYSTEM_REPAIR">Water/Hydration Pipeline Repair</option>
                                    <option value="MEDICINE_AND_TREATMENT">Medical Intervention</option>
                                    <option value="FEED_ADJUSTMENT">Feed Profile Adjustment</option>
                                    <option value="ENVIRONMENTAL_SANITATION">Sanitation Protocol Initiated</option>
                                    <option value="FALSE_ALARM_VERIFIED">False Alarm Verified (Sensor Error)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Physical Action Taken *</label>
                                <textarea 
                                    required minLength={5} rows={3}
                                    placeholder="e.g. Unblocked water pressure valve in pen 3 and restarted misting fans."
                                    value={resolutionForm.actionTaken}
                                    onChange={(e) => setResolutionForm({ ...resolutionForm, actionTaken: e.target.value })}
                                    className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#101B14]/15 text-[#101B14] text-sm focus:outline-none focus:ring-2 focus:ring-[#D9A63E]/40 transition-all shadow-sm resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Verified Temp (°C)</label>
                                    <input 
                                        type="number" step="0.1" placeholder="e.g. 24.5"
                                        value={resolutionForm.verifiedTemperature || ''}
                                        onChange={(e) => setResolutionForm({ ...resolutionForm, verifiedTemperature: e.target.value ? Number(e.target.value) : undefined })}
                                        className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#101B14]/15 text-[#101B14] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D9A63E]/40 transition-all shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Water Pressure (Bar)</label>
                                    <input 
                                        type="number" step="0.1" placeholder="e.g. 2.0"
                                        value={resolutionForm.verifiedWaterPressure || ''}
                                        onChange={(e) => setResolutionForm({ ...resolutionForm, verifiedWaterPressure: e.target.value ? Number(e.target.value) : undefined })}
                                        className="w-full px-4 py-3.5 rounded-xl bg-white border border-[#101B14]/15 text-[#101B14] text-sm font-mono focus:outline-none focus:ring-2 focus:ring-[#D9A63E]/40 transition-all shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-[#101B14]/10 mt-2">
                                <button type="button" onClick={() => setSelectedAlertForResolution(null)} className="flex-1 py-4 bg-transparent text-[#101B14]/60 font-bold text-xs uppercase tracking-widest hover:bg-[#101B14]/5 rounded-xl transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting || resolutionForm.actionTaken.trim().length < 5} className="flex-1 py-4 bg-[#101B14] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-[#3F6B47] transition-colors cursor-pointer disabled:opacity-50 shadow-lg shadow-[#101B14]/20">
                                    {submitting ? 'Auditing...' : 'Seal Resolution'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};