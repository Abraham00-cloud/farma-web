import React, { useState, useEffect } from 'react';
import axios from 'axios';
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

    // Performance & Alert Data
    const [dashboard, setDashboard] = useState<BatchPerformanceDashboardDto | null>(null);
    const [activeAlerts, setActiveAlerts] = useState<SystemAlertResponse[]>([]);

    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Resolution Modal State
    const [selectedAlertForResolution, setSelectedAlertForResolution] = useState<SystemAlertResponse | null>(null);
    const [resolutionForm, setResolutionForm] = useState<AlertResolutionRequest>({
        actionCategory: 'VENTILATION_AND_COOLING',
        actionTaken: '',
        supervisorNotes: '',
        verifiedTemperature: undefined,
        verifiedWaterPressure: undefined,
    });

    // 1. Initial Load: Fetch Farms with Role Scoping
    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            setLoading(true);
            try {
                let farmList = await infrastructureService.getFarmsByOrganisation(organisationId);

                // 🔒 ROLE SCOPING: Filter farms if user is a Manager
                if (!isProprietor && currentUserId) {
                    farmList = farmList.filter((farm) => farm.managerId === currentUserId);
                }

                if (isMounted && Array.isArray(farmList) && farmList.length > 0) {
                    setFarms(farmList);
                    setSelectedFarmId(farmList[0].id);
                }
            } catch {
                if (isMounted) {
                    setErrorMessage('Failed to load farm facilities.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        init();

        return () => {
            isMounted = false;
        };
    }, [organisationId, isProprietor, currentUserId]);

    // 2. Fetch Batches when Selected Farm updates
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
                const flatBatches = nested.flat();

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
                if (isMounted) {
                    setBatches([]);
                    setSelectedBatchId('');
                }
            }
        };

        fetchBatches();

        return () => {
            isMounted = false;
        };
    }, [selectedFarmId]);

    // 3. Sync Dashboard & Active Alerts when selectedBatchId updates
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
                if (isMounted) {
                    setErrorMessage('Could not load batch performance analytics.');
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadBatchAnalytics();

        return () => {
            isMounted = false;
        };
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
        } catch {
            // Fallback
        }
    };

    const handleAcknowledgeAlert = async (alertId: number) => {
        try {
            await alertService.acknowledgeAlert(alertId);
            setSuccessMessage('Alert acknowledged.');
            await reloadBatchData();
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
            setResolutionForm({
                actionCategory: 'VENTILATION_AND_COOLING',
                actionTaken: '',
                supervisorNotes: '',
                verifiedTemperature: undefined,
                verifiedWaterPressure: undefined,
            });
            await reloadBatchData();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(
                    typeof err.response?.data === 'string'
                        ? err.response.data
                        : err.response?.data?.message || 'Failed to resolve alert.'
                );
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    // Helper for FCR Status Badge
    const getFcrStatusBadge = (fcr: number) => {
        if (fcr <= 0) return { label: 'No Biomass Logged', color: 'bg-slate-100 text-slate-700' };
        if (fcr <= 1.55) return { label: '🟢 Exceptional Efficiency (<1.55)', color: 'bg-emerald-50 text-emerald-800 border-emerald-200' };
        if (fcr <= 1.8) return { label: '🟡 Standard Conversion (1.55-1.80)', color: 'bg-amber-50 text-amber-800 border-amber-200' };
        return { label: '🔴 High Feed Drift (>1.80)', color: 'bg-rose-50 text-rose-800 border-rose-200' };
    };

    return (
        <div className="space-y-6">
            {/* 1. TOP EXECUTIVE HEADER BAR */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-5">
                <div>
                    <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                        {isProprietor ? 'Agronomic Intelligence & Early-Warning Command' : 'Site Biosecurity & Climate Radar'}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium mt-1">
                        Real-time THI microclimate stress gauges, WFR hydration tracking, and Cobb-500 / ISA-Brown performance benchmarks.
                    </p>
                </div>
            </div>

            {/* Inline Feedback Alerts */}
            {errorMessage && (
                <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                    🚨 {errorMessage}
                </div>
            )}

            {successMessage && (
                <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-mono">
                    ✅ {successMessage}
                </div>
            )}

            {/* 2. FLOCK SELECTION HEADER BAR */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                        Select Farm Location
                    </label>
                    <select
                        value={selectedFarmId}
                        onChange={(e) => setSelectedFarmId(Number(e.target.value))}
                        disabled={!isProprietor && farms.length <= 1}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C2410C] disabled:opacity-50"
                    >
                        {farms.map((f) => (
                            <option key={f.id} value={f.id}>
                                🏢 {f.name}
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                        Select Active Flock Cohort
                    </label>
                    <select
                        value={selectedBatchId}
                        onChange={(e) => setSelectedBatchId(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#C2410C]"
                    >
                        {batches.map((b) => (
                            <option key={b.id} value={b.id}>
                                🛖 {b.sectionName} — Batch #{b.batchNumber} ({b.breed || b.animalCategory})
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* 3. PERFORMANCE DASHBOARD & METRIC ENGINE */}
            {loading ? (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-mono text-xs">
                    Synchronizing performance indicators and early-warning diagnostics...
                </div>
            ) : dashboard ? (
                <div className="space-y-6">
                    {/* Hero Performance Stat Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Feed Conversion Ratio (FCR) Card */}
                        <div className="bg-slate-900 text-white border border-slate-800 rounded-2xl p-5 shadow-xs space-y-2">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase block">
                                Calculated FCR (Feed Efficiency)
                            </span>
                            <div className="text-3xl font-extrabold text-white">
                                {dashboard.calculatedFcr > 0 ? dashboard.calculatedFcr.toFixed(2) : 'N/A'}
                            </div>
                            <span
                                className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${getFcrStatusBadge(dashboard.calculatedFcr).color
                                    }`}
                            >
                                {getFcrStatusBadge(dashboard.calculatedFcr).label}
                            </span>
                        </div>

                        {/* Survivability & Population Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                                Survivability Rate
                            </span>
                            <div className="text-3xl font-extrabold text-emerald-700 mt-1">
                                {(dashboard.survivabilityRatePercentage || 0).toFixed(1)}%
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 block">
                                Live Headcount: {dashboard.currentCount.toLocaleString()} / {dashboard.initialCount.toLocaleString()}
                            </span>
                        </div>

                        {/* Average Weight Card */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                                Current Average Weight
                            </span>
                            <div className="text-3xl font-extrabold text-slate-900 mt-1">
                                {(dashboard.currentAverageWeightGrams || 0).toLocaleString()} g
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 block">
                                Total Feed Consumed: {(dashboard.totalFeedConsumedKg || 0).toLocaleString()} kg
                            </span>
                        </div>

                        {/* Biological Age & Alert Counter */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1">
                            <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                                Biological Age & Status
                            </span>
                            <div className="text-3xl font-extrabold text-[#C2410C] mt-1">
                                Day {dashboard.currentAgeInDays || 0}
                            </div>
                            <span className="text-[10px] font-mono text-slate-500 block">
                                🚨 {dashboard.activeAlertsCount || 0} Active / ✅ {dashboard.resolvedAlertsCount || 0} Resolved Alerts
                            </span>
                        </div>
                    </div>

                    {/* 4. VISUAL BENCHMARK GAUGES & DIAGNOSTIC METRIC METERS */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* THI Climate Thermal Stress Meter */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h4 className="text-base font-extrabold text-slate-900">
                                        🌡️ Microclimate THI Stress Index Gauge
                                    </h4>
                                    <p className="text-xs text-slate-500 font-mono">
                                        Formula: Temp + (0.36 × Humidity) + 41.5
                                    </p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold font-mono">
                                    Safe Threshold: &lt; 78.0
                                </span>
                            </div>

                            <div className="space-y-3 font-mono">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Thermal Comfort Spectrum:</span>
                                    <span className="font-bold text-slate-800">Operational Target: Safe Zone</span>
                                </div>

                                {/* THI Visual Scale Bar */}
                                <div className="relative w-full h-4 bg-gradient-to-r from-emerald-500 via-amber-400 to-rose-600 rounded-full overflow-hidden shadow-inner">
                                    {/* Target Zone Overlay Indicator */}
                                    <div className="absolute left-[65%] top-0 bottom-0 w-1 bg-white shadow-xs" />
                                </div>

                                <div className="flex justify-between text-[10px] text-slate-400">
                                    <span>Comfort (&lt;78)</span>
                                    <span>Moderate Stress (78-84)</span>
                                    <span className="text-rose-600 font-bold">Critical Heat Threat (&gt;84.0)</span>
                                </div>
                            </div>
                        </div>

                        {/* 72-Hour Water-to-Feed Ratio (WFR) Gauge */}
                        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <div>
                                    <h4 className="text-base font-extrabold text-slate-900">
                                        💧 72-Hour Water-to-Feed Ratio (WFR)
                                    </h4>
                                    <p className="text-xs text-slate-500 font-mono">
                                        Metabolic Target Ratio: 2.0 Liters / KG Feed
                                    </p>
                                </div>
                                <span className="px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold font-mono">
                                    Critical Floor: 1.5 L/kg
                                </span>
                            </div>

                            <div className="space-y-3 font-mono">
                                <div className="flex justify-between text-xs">
                                    <span className="text-slate-500">Rolling Metabolic Trend:</span>
                                    <span className="font-bold text-emerald-700">Healthy Hydration (2.0 L/kg)</span>
                                </div>

                                {/* WFR Visual Scale Bar */}
                                <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden p-0.5 border border-slate-200">
                                    <div className="bg-blue-600 h-full rounded-full transition-all duration-500 w-[80%]" />
                                </div>

                                <div className="flex justify-between text-[10px] text-slate-400">
                                    <span className="text-rose-600 font-bold">Acute Dehydration (&lt;1.5)</span>
                                    <span>Standard Target (2.0 L/kg)</span>
                                    <span>High Water Intake (&gt;2.5)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 5. ACTIVE BIOSECURITY & EARLY-WARNING RADAR */}
                    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs space-y-4">
                        <div className="bg-slate-900 px-6 py-4 text-white flex items-center justify-between">
                            <div>
                                <h4 className="text-base font-extrabold tracking-tight">
                                    🚨 Active Biosecurity Alerts & Diagnostic Warnings
                                </h4>
                                <p className="text-[10px] font-mono text-slate-400">
                                    Automated Evaluators: THI Microclimate, WFR Dehydration, and Exponential Mortality Velocity
                                </p>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-mono font-bold">
                                {activeAlerts.length} Active Warnings
                            </span>
                        </div>

                        <div className="p-6 pt-2">
                            {activeAlerts.length > 0 ? (
                                <div className="space-y-4">
                                    {activeAlerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            className={`border rounded-2xl p-5 space-y-3 transition ${alert.status === 'TRIGGERED'
                                                    ? 'border-rose-200 bg-rose-50/30'
                                                    : 'border-amber-200 bg-amber-50/30'
                                                }`}
                                        >
                                            <div className="flex items-center justify-between border-b border-slate-200/60 pb-3">
                                                <div className="flex items-center space-x-3">
                                                    <span
                                                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${alert.alertType === 'CLIMATE_STRESS' || alert.alertType === 'MORTALITY_LIMIT_BREACH'
                                                                ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                                                : 'bg-amber-100 text-amber-800 border border-amber-200'
                                                            }`}
                                                    >
                                                        {alert.alertType}
                                                    </span>
                                                    <span className="text-xs font-mono text-slate-500">
                                                        Logged: {new Date(alert.createdAt).toLocaleString()}
                                                    </span>
                                                </div>

                                                <span
                                                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${alert.status === 'TRIGGERED'
                                                            ? 'bg-rose-600 text-white'
                                                            : 'bg-amber-600 text-white'
                                                        }`}
                                                >
                                                    STATUS: {alert.status}
                                                </span>
                                            </div>

                                            {/* Diagnosis Output Text */}
                                            <p className="text-xs font-sans text-slate-800 leading-relaxed font-semibold">
                                                {alert.diagnosisMessage}
                                            </p>

                                            {/* Action Bar */}
                                            <div className="flex items-center justify-end space-x-3 pt-2">
                                                {alert.status === 'TRIGGERED' && (
                                                    <button
                                                        type="button"
                                                        onClick={() => handleAcknowledgeAlert(alert.id)}
                                                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition cursor-pointer"
                                                    >
                                                        👁️ Acknowledge (Investigating)
                                                    </button>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedAlertForResolution(alert);
                                                        setResolutionForm({
                                                            actionCategory: 'VENTILATION_AND_COOLING',
                                                            actionTaken: '',
                                                            supervisorNotes: '',
                                                            verifiedTemperature: undefined,
                                                            verifiedWaterPressure: undefined,
                                                        });
                                                    }}
                                                    className="px-4 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                                                >
                                                    🩺 Resolve Alert
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="py-10 text-center text-slate-400 font-mono text-xs">
                                    ✅ No active biosecurity alerts or environmental stress warnings for this cohort.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center text-slate-400 font-mono text-xs">
                    No active flock batch selected. Please select a farm facility and batch cohort above.
                </div>
            )}

            {/* 6. AUDITABLE RESOLUTION MODAL */}
            {selectedAlertForResolution && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Resolve Biosecurity Alert</h4>
                                <p className="text-xs text-slate-500 font-mono">
                                    Batch #{selectedAlertForResolution.batchNumber} • {selectedAlertForResolution.alertType}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setSelectedAlertForResolution(null)}
                                className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        <form onSubmit={handleResolveAlert} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Corrective Action Category *
                                </label>
                                <select
                                    value={resolutionForm.actionCategory}
                                    onChange={(e) =>
                                        setResolutionForm({
                                            ...resolutionForm,
                                            actionCategory: e.target.value as AlertResolutionCategory,
                                        })
                                    }
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-bold"
                                >
                                    <option value="VENTILATION_AND_COOLING">Ventilation & Cooling</option>
                                    <option value="WATER_SYSTEM_REPAIR">Water System Repair</option>
                                    <option value="MEDICINE_AND_TREATMENT">Medication & Treatment</option>
                                    <option value="FEED_ADJUSTMENT">Feed Adjustment</option>
                                    <option value="ENVIRONMENTAL_SANITATION">Environmental Sanitation</option>
                                    <option value="EQUIPMENT_REPAIR">Equipment Repair</option>
                                    <option value="FALSE_ALARM_VERIFIED">False Alarm Verified</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Primary Action Taken * (Min 5 chars)
                                </label>
                                <textarea
                                    rows={2}
                                    required
                                    minLength={5}
                                    placeholder="e.g. Unblocked water pipeline pressure valve and turned on mist cooling fans."
                                    value={resolutionForm.actionTaken}
                                    onChange={(e) => setResolutionForm({ ...resolutionForm, actionTaken: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Verified Temp (°C)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 24.5"
                                        value={resolutionForm.verifiedTemperature ?? ''}
                                        onChange={(e) =>
                                            setResolutionForm({
                                                ...resolutionForm,
                                                verifiedTemperature: e.target.value ? Number(e.target.value) : undefined,
                                            })
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Verified Water Pressure (Bar)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        placeholder="e.g. 2.0"
                                        value={resolutionForm.verifiedWaterPressure ?? ''}
                                        onChange={(e) =>
                                            setResolutionForm({
                                                ...resolutionForm,
                                                verifiedWaterPressure: e.target.value ? Number(e.target.value) : undefined,
                                            })
                                        }
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Supervisor Notes (Optional)
                                </label>
                                <input
                                    type="text"
                                    placeholder="e.g. Re-inspected fans at 14:00."
                                    value={resolutionForm.supervisorNotes || ''}
                                    onChange={(e) => setResolutionForm({ ...resolutionForm, supervisorNotes: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setSelectedAlertForResolution(null)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting || resolutionForm.actionTaken.trim().length < 5}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase tracking-wider disabled:opacity-50"
                                >
                                    {submitting ? 'Resolving...' : 'Complete Resolution'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};