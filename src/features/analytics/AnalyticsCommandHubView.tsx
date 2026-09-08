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

const THEME = {
    forest: 'var(--color-farma-forest)',
    cream: 'var(--color-farma-cream)',
    green: 'var(--color-farma-green)',
    gold: 'var(--color-farma-gold)',
    terracotta: 'var(--color-farma-terracotta)',
    lightGray: 'var(--color-farma-sand)'
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
                if (isMounted) setErrorMessage('Failed to load farms.');
            } finally {
                if (isMounted) setLoading(false);
            }
        };
        init();
        return () => { isMounted = false; };
    }, [organisationId, isProprietor, currentUserId]);

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
                if (isMounted) setErrorMessage('Could not load flock analytics.');
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
            setSuccessMessage('Alert successfully resolved!');
            setSelectedAlertForResolution(null);
            setResolutionForm({ actionCategory: 'VENTILATION_AND_COOLING', actionTaken: '', supervisorNotes: '', verifiedTemperature: undefined, verifiedWaterPressure: undefined });
            await reloadBatchData();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || err.response?.data || 'Failed to resolve alert.');
            } else {
                setErrorMessage('An unexpected error occurred while resolving the alert.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const getFcrStatusBadge = (fcr: number) => {
        if (fcr <= 0) return { label: 'Awaiting Data', color: 'text-farma-forest/40 bg-farma-forest/5 border-farma-forest/10' };
        if (fcr <= 1.55) return { label: 'Exceptional (<1.55)', color: 'text-farma-green bg-farma-green/10 border-farma-green/30' };
        if (fcr <= 1.8) return { label: 'Standard (1.55-1.80)', color: 'text-farma-gold bg-farma-gold/10 border-farma-gold/30' };
        return { label: 'Poor (>1.80)', color: 'text-farma-terracotta bg-farma-terracotta/10 border-farma-terracotta/30' };
    };

    const generateMockGrowthCurve = () => {
        if (!dashboard) return [];
        const curve = [];
        const daysToShow = Math.min(dashboard.currentAgeInDays, 14);
        for (let i = daysToShow - 1; i >= 0; i--) {
            const day = dashboard.currentAgeInDays - i;
            const factor = Math.pow(day / dashboard.currentAgeInDays, 1.3); 
            curve.push({
                day: `Day ${day}`,
                actualWeight: Number((dashboard.currentAverageWeightGrams * factor).toFixed(0)),
                targetWeight: Number((dashboard.currentAverageWeightGrams * (factor * 1.05)).toFixed(0)),
            });
        }
        return curve;
    };

    const survivabilityData = dashboard ? [
        { name: 'Live Birds', value: dashboard.currentCount, color: THEME.green },
        { name: 'Mortality', value: dashboard.totalMortality, color: THEME.terracotta }
    ] : [];

    const currentTHI = 76; 
    const thiGaugeData = [
        { name: 'Current THI', value: currentTHI, color: currentTHI > 80 ? THEME.terracotta : THEME.gold },
        { name: 'Remaining', value: 100 - currentTHI, color: THEME.lightGray }
    ];

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">
            
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-farma-forest/10 pb-5">
                <div>
                    <h3 className="text-2xl md:text-3xl font-bold text-farma-forest tracking-tight">
                        {isProprietor ? 'Farm Analytics Dashboard' : 'My Farm Analytics'}
                    </h3>
                    <p className="text-sm text-farma-forest/70 font-medium mt-1">
                        Track flock growth, feed efficiency, and monitor farm health alerts in real-time.
                    </p>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                    <select
                        value={selectedFarmId}
                        onChange={(e) => setSelectedFarmId(Number(e.target.value))}
                        disabled={!isProprietor && farms.length <= 1}
                        className="px-4 py-2.5 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        {farms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                    </select>

                    <select
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(Number(e.target.value))}
                        disabled={batches.length === 0}
                        className="px-4 py-2.5 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 shadow-sm cursor-pointer disabled:opacity-50"
                    >
                        {batches.length > 0 ? batches.map((b) => (
                            <option key={b.id} value={b.id}>{b.sectionName} — #{b.batchNumber}</option>
                        )) : <option>No Active Flocks</option>}
                    </select>
                </div>
            </div>

            {errorMessage && (
                <div className="p-4 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/30 text-farma-terracotta text-sm font-semibold shadow-sm flex items-center gap-2">
                    <IconError />
                    {errorMessage}
                </div>
            )}
            {successMessage && (
                <div className="p-4 rounded-lg bg-farma-green/10 border border-farma-green/30 text-farma-green text-sm font-semibold shadow-sm flex items-center gap-2">
                    <IconCheck />
                    {successMessage}
                </div>
            )}

            {loading ? (
                <div className="py-24 text-center flex flex-col items-center justify-center">
                    <div className="w-10 h-10 border-4 border-farma-green/20 border-t-farma-green rounded-full animate-spin mb-4"></div>
                    <span className="text-xs font-semibold text-farma-forest/50 uppercase tracking-widest">Loading dashboard...</span>
                </div>
            ) : dashboard ? (
                <div className="space-y-6">
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        
                        <div className="bg-farma-forest border border-farma-forest rounded-xl p-6 shadow-sm flex flex-col justify-between group">
                            <span className="text-xs font-semibold text-farma-cream/60 uppercase tracking-widest block mb-2">
                                Feed Conversion (FCR)
                            </span>
                            <div className="text-4xl font-bold text-farma-cream tabular-nums tracking-tighter mb-4">
                                {dashboard.calculatedFcr > 0 ? dashboard.calculatedFcr.toFixed(2) : '-.--'}
                            </div>
                            <div>
                                <span className={`inline-block px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${getFcrStatusBadge(dashboard.calculatedFcr).color}`}>
                                    {getFcrStatusBadge(dashboard.calculatedFcr).label}
                                </span>
                            </div>
                        </div>

                        <div className="bg-white border border-farma-forest/10 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <span className="text-xs font-semibold text-farma-forest/60 uppercase tracking-widest block mb-2">Survival Rate</span>
                            <div className="text-4xl font-bold text-farma-green tabular-nums tracking-tighter mb-4">
                                {(dashboard.survivabilityRatePercentage || 0).toFixed(1)}<span className="text-2xl text-farma-green/70">%</span>
                            </div>
                            <span className="text-xs font-semibold text-farma-forest/50 block border-t border-farma-forest/5 pt-3">
                                Live Birds: <span className="text-farma-forest tabular-nums">{dashboard.currentCount.toLocaleString()}</span> / <span className="tabular-nums">{dashboard.initialCount.toLocaleString()}</span>
                            </span>
                        </div>

                        <div className="bg-white border border-farma-forest/10 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <span className="text-xs font-semibold text-farma-forest/60 uppercase tracking-widest block mb-2">Average Body Weight</span>
                            <div className="text-4xl font-bold text-farma-forest tabular-nums tracking-tighter mb-4">
                                {(dashboard.currentAverageWeightGrams || 0).toLocaleString()}<span className="text-2xl text-farma-forest/40">g</span>
                            </div>
                            <span className="text-xs font-semibold text-farma-forest/50 block border-t border-farma-forest/5 pt-3">
                                Total Feed Consumed: <span className="text-farma-forest tabular-nums">{(dashboard.totalFeedConsumedKg || 0).toLocaleString()} kg</span>
                            </span>
                        </div>

                        <div className="bg-white border border-farma-forest/10 rounded-xl p-6 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                            <span className="text-xs font-semibold text-farma-forest/60 uppercase tracking-widest block mb-2">Flock Age</span>
                            <div className="text-4xl font-bold text-farma-gold tabular-nums tracking-tighter mb-4">
                                Day {dashboard.currentAgeInDays || 0}
                            </div>
                            <div className="flex gap-2 pt-3 border-t border-farma-forest/5">
                                <span className={`text-[10px] font-bold px-2.5 py-1.5 rounded-md border ${dashboard.activeAlertsCount > 0 ? 'text-farma-terracotta bg-farma-terracotta/10 border-farma-terracotta/30' : 'text-farma-forest/40 bg-farma-forest/5 border-farma-forest/10'}`}>
                                    {dashboard.activeAlertsCount} Active
                                </span>
                                <span className="text-[10px] font-bold px-2.5 py-1.5 rounded-md border text-farma-green bg-farma-green/10 border-farma-green/30">
                                    {dashboard.resolvedAlertsCount} Fixed
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                        
                        <div className="xl:col-span-2 bg-white border border-farma-forest/10 rounded-xl p-7 shadow-sm">
                            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                                <div>
                                    <h4 className="text-lg font-bold text-farma-forest">Growth Tracking</h4>
                                    <p className="text-xs text-farma-forest/50 font-medium mt-1">
                                        Actual average weight vs. Target weight
                                    </p>
                                </div>
                                <div className="flex items-center gap-4 bg-farma-cream px-4 py-2 rounded-lg border border-farma-forest/5">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-1 bg-farma-green rounded-full"></div>
                                        <span className="text-[10px] font-bold text-farma-forest uppercase tracking-widest">Actual (g)</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-0 border-t-2 border-dashed border-farma-gold"></div>
                                        <span className="text-[10px] font-bold text-farma-forest/60 uppercase tracking-widest">Target (g)</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="h-72 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <LineChart data={generateMockGrowthCurve()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={THEME.lightGray} opacity={0.5} />
                                        <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: THEME.forest, opacity: 0.5 }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: THEME.forest, opacity: 0.5 }} />
                                        <RechartsTooltip 
                                            contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid var(--color-farma-forest)', borderColor: 'rgba(16, 27, 20, 0.1)', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                            itemStyle={{ color: THEME.forest, fontSize: '12px', fontWeight: '600' }}
                                            labelStyle={{ color: THEME.forest, opacity: 0.6, fontSize: '11px', textTransform: 'uppercase', marginBottom: '4px', fontWeight: 'bold' }}
                                        />
                                        <Line 
                                            type="monotone" dataKey="actualWeight" name="Actual" 
                                            stroke={THEME.green} strokeWidth={3} 
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

                        <div className="space-y-6 flex flex-col justify-between">
                            
                            <div className="bg-white border border-farma-forest/10 rounded-xl p-6 shadow-sm flex-1 flex flex-col items-center justify-center relative">
                                <h4 className="text-base font-bold text-farma-forest w-full text-left absolute top-6 left-6">
                                    Survival Breakdown
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
                                        <span className="text-2xl font-bold text-farma-forest tabular-nums">
                                            {(dashboard.survivabilityRatePercentage || 0).toFixed(0)}%
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white border border-farma-forest/10 rounded-xl p-6 shadow-sm flex-1 flex flex-col items-center relative overflow-hidden">
                                <h4 className="text-base font-bold text-farma-forest w-full text-left absolute top-6 left-6">
                                    Heat Stress Level
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
                                    <span className="text-3xl font-bold text-farma-forest tabular-nums leading-none">{currentTHI}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-md mt-2 border ${currentTHI > 80 ? 'text-farma-terracotta bg-farma-terracotta/10 border-farma-terracotta/30' : 'text-farma-gold bg-farma-gold/10 border-farma-gold/30'}`}>
                                        {currentTHI > 80 ? 'Heat Stress' : 'Moderate'}
                                    </span>
                                </div>
                            </div>

                        </div>
                    </div>

                    <div className="bg-white border border-farma-forest/10 rounded-xl overflow-hidden shadow-sm">
                        <div className="bg-farma-sand-dark px-6 py-5 flex items-center justify-between border-b border-farma-forest/15">
                            <div>
                                <h4 className="text-lg font-bold text-farma-forest tracking-tight">
                                    Active Farm Alerts
                                </h4>
                                <p className="text-[10px] text-farma-forest/60 font-semibold uppercase tracking-widest mt-1">
                                    System warnings and recorded fixes
                                </p>
                            </div>
                            <span className="px-3 py-1.5 rounded-md bg-white/50 text-farma-forest text-[10px] font-bold border border-farma-forest/10 shadow-sm">
                                {activeAlerts.length} Active Alerts
                            </span>
                        </div>

                        <div className="p-6 bg-farma-cream/50">
                            {activeAlerts.length > 0 ? (
                                <div className="space-y-4">
                                    {activeAlerts.map((alert) => (
                                        <div key={alert.id} className={`p-5 rounded-xl bg-white border flex flex-col md:flex-row md:items-center justify-between gap-4 transition-shadow shadow-sm ${alert.status === 'TRIGGERED' ? 'border-farma-terracotta/30 shadow-[inset_4px_0_0_var(--color-farma-terracotta)]' : 'border-farma-gold/30 shadow-[inset_4px_0_0_var(--color-farma-gold)]'}`}>
                                            <div>
                                                <div className="flex items-center gap-3 mb-2">
                                                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-widest ${alert.status === 'TRIGGERED' ? 'bg-farma-terracotta text-white' : 'bg-farma-gold text-farma-forest'}`}>
                                                        {alert.status}
                                                    </span>
                                                    <span className="text-[10px] font-semibold text-farma-forest/40 uppercase tracking-widest tabular-nums flex items-center gap-1">
                                                        <IconClock />
                                                        {new Date(alert.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                                <h5 className="text-sm font-bold text-farma-forest mb-1">{alert.alertType.replace(/_/g, ' ')}</h5>
                                                <p className="text-xs text-farma-forest/60 font-medium max-w-2xl">{alert.diagnosisMessage}</p>
                                            </div>
                                            
                                            <div className="shrink-0 flex gap-3 pt-2 md:pt-0">
                                                {alert.status === 'TRIGGERED' && (
                                                    <button onClick={() => handleAcknowledgeAlert(alert.id)} className="px-5 py-2.5 bg-farma-cream border border-farma-forest/10 rounded-lg text-[10px] font-bold uppercase tracking-widest text-farma-forest hover:bg-farma-sand transition-colors cursor-pointer shadow-sm">
                                                        Acknowledge Alert
                                                    </button>
                                                )}
                                                {alert.status === 'ACKNOWLEDGED' && (
                                                    <button onClick={() => { setSelectedAlertForResolution(alert); setResolutionForm({ actionCategory: 'VENTILATION_AND_COOLING', actionTaken: '', supervisorNotes: '', verifiedTemperature: undefined, verifiedWaterPressure: undefined }); }} className="px-5 py-2.5 bg-farma-forest rounded-lg text-[10px] font-bold uppercase tracking-widest text-white hover:bg-farma-green-light transition-colors cursor-pointer shadow-sm">
                                                        Resolve Alert
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-16 text-center flex flex-col items-center bg-white rounded-xl border border-farma-forest/5 shadow-sm">
                                    <div className="w-14 h-14 rounded-full bg-farma-green/10 flex items-center justify-center text-farma-green mb-4 shadow-inner">
                                        <IconCheckLarge />
                                    </div>
                                    <h5 className="text-lg font-bold text-farma-forest">All Systems Normal</h5>
                                    <span className="text-[10px] font-semibold text-farma-forest/50 uppercase tracking-widest mt-2">No active alerts or warnings</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-farma-cream border border-farma-forest/10 rounded-xl p-24 text-center flex flex-col items-center justify-center shadow-sm mt-6">
                    <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-inner border border-farma-forest/5 mb-6">
                        <IconEmptyState />
                    </div>
                    <h3 className="text-xl font-bold text-farma-forest mb-2">Dashboard Offline</h3>
                    <p className="text-sm text-farma-forest/60 font-medium max-w-sm">Please select a farm and active flock from the dropdowns above to view analytics.</p>
                </div>
            )}

            {selectedAlertForResolution && (
                <div className="fixed inset-0 bg-farma-forest/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-farma-cream rounded-2xl max-w-lg w-full shadow-2xl flex flex-col overflow-hidden border border-white/10 relative">
                        
                        <div className="p-8 bg-white border-b border-farma-forest/5 flex justify-between items-start">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest">Resolve Alert</h4>
                                <p className="text-[10px] font-semibold text-farma-forest/50 uppercase tracking-widest mt-2 tabular-nums">Record fix for Batch #{selectedAlertForResolution.batchNumber}</p>
                            </div>
                            <button onClick={() => setSelectedAlertForResolution(null)} className="text-farma-forest/30 hover:text-farma-terracotta bg-farma-forest/5 hover:bg-farma-terracotta/10 p-2 rounded-lg transition-colors cursor-pointer">
                                <IconClose />
                            </button>
                        </div>

                        <form onSubmit={handleResolveAlert} className="p-8 space-y-5">
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Issue Type *</label>
                                <select 
                                    value={resolutionForm.actionCategory} 
                                    onChange={(e) => setResolutionForm({ ...resolutionForm, actionCategory: e.target.value as AlertResolutionCategory })}
                                    className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-gold/40 transition-shadow shadow-sm cursor-pointer"
                                >
                                    <option value="VENTILATION_AND_COOLING">Ventilation & Cooling</option>
                                    <option value="WATER_SYSTEM_REPAIR">Water System Repair</option>
                                    <option value="MEDICINE_AND_TREATMENT">Medical Treatment</option>
                                    <option value="FEED_ADJUSTMENT">Feed Adjustment</option>
                                    <option value="ENVIRONMENTAL_SANITATION">Sanitation / Cleaning</option>
                                    <option value="FALSE_ALARM_VERIFIED">False Alarm (Sensor Error)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Action Taken *</label>
                                <textarea 
                                    required minLength={5} rows={3}
                                    placeholder="e.g. Fixed water valve and turned on fans."
                                    value={resolutionForm.actionTaken}
                                    onChange={(e) => setResolutionForm({ ...resolutionForm, actionTaken: e.target.value })}
                                    className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm focus:outline-none focus:ring-2 focus:ring-farma-gold/40 transition-shadow shadow-sm resize-none"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Verified Temp (°C)</label>
                                    <input 
                                        type="number" step="0.1" placeholder="e.g. 24.5"
                                        value={resolutionForm.verifiedTemperature || ''}
                                        onChange={(e) => setResolutionForm({ ...resolutionForm, verifiedTemperature: e.target.value ? Number(e.target.value) : undefined })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-farma-gold/40 transition-shadow shadow-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Water Pressure (Bar)</label>
                                    <input 
                                        type="number" step="0.1" placeholder="e.g. 2.0"
                                        value={resolutionForm.verifiedWaterPressure || ''}
                                        onChange={(e) => setResolutionForm({ ...resolutionForm, verifiedWaterPressure: e.target.value ? Number(e.target.value) : undefined })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm tabular-nums focus:outline-none focus:ring-2 focus:ring-farma-gold/40 transition-shadow shadow-sm"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-farma-forest/10 mt-2">
                                <button type="button" onClick={() => setSelectedAlertForResolution(null)} className="flex-1 py-3 bg-transparent text-farma-forest/60 font-bold text-xs uppercase tracking-widest hover:bg-farma-forest/5 rounded-lg transition-colors cursor-pointer">
                                    Cancel
                                </button>
                                <button type="submit" disabled={submitting || resolutionForm.actionTaken.trim().length < 5} className="flex-1 py-3 bg-farma-forest text-white font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-farma-green-light transition-colors cursor-pointer disabled:opacity-50 shadow-sm">
                                    {submitting ? 'Saving...' : 'Save Resolution'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// Reusable SVG Components
// ==========================================

const IconError = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconCheck = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
);

const IconCheckLarge = () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconClock = () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconClose = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconEmptyState = () => (
    <svg className="w-10 h-10 text-farma-forest/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
);