import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { infrastructureService } from '../../services/infrastructureService';
import { batchService } from '../../services/batchService';
import { dailyLogService } from '../../services/dailyLogService';
import { inventoryService } from '../../services/inventoryService'; 
import type { FarmResponseDto } from '../../types/infrastructure';
import type { BatchResponseDto } from '../../types/batch';
import type { DailyLogRequestDto, DailyLogResponseDto } from '../../types/dailyLog';
import type { InventoryResponseDto } from '../../types/inventory'; 

// FIXED: We extend the base DTO locally to satisfy strict TypeScript and ESLint rules
// without needing to use the forbidden `any` keyword.
interface ExtendedDailyLogResponse extends DailyLogResponseDto {
    feedInventoryId?: number | null;
    medicineInventoryId?: number | null;
    administrationMethod?: string;
    feedName?: string;
    medicineName?: string;
}

interface DailyLogsHubViewProps {
    organisationId: number;
    userRole?: string;
    currentUserId?: number;
}

interface FarmActiveBatches {
    farm: FarmResponseDto;
    batches: BatchResponseDto[];
}

export const DailyLogsHubView: React.FC<DailyLogsHubViewProps> = ({ 
    organisationId, 
    userRole = 'PROPRIETOR', 
    currentUserId 
}) => {
    const isProprietor = userRole?.toUpperCase() === 'PROPRIETOR' || userRole?.toUpperCase() === 'ADMIN';

    const [farmBatchMap, setFarmBatchMap] = useState<FarmActiveBatches[]>([]);
    const [selectedFarmId, setSelectedFarmId] = useState<number | ''>('');
    const [selectedBatchId, setSelectedBatchId] = useState<number | ''>('');
    const [selectedBatch, setSelectedBatch] = useState<BatchResponseDto | null>(null);

    const [farmInventories, setFarmInventories] = useState<InventoryResponseDto[]>([]);

    const [batchLogs, setBatchLogs] = useState<DailyLogResponseDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Edit Mode State
    const [editingLogId, setEditingLogId] = useState<number | null>(null);

    const [logForm, setLogForm] = useState<Omit<DailyLogRequestDto, 'batchId'>>({
        logDate: new Date().toISOString().split('T')[0],
        feedInventoryId: null,
        feedQuantityUsed: 0,
        medicineInventoryId: null,
        medicineQuantityUsed: 0,
        administrationMethod: '',
        mortalityCount: 0,
        averageWeight: 0,
        observations: '',
    });

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                let farmList = await infrastructureService.getFarmsByOrganisation(organisationId);

                if (!isProprietor && currentUserId) {
                    farmList = farmList.filter((farm) => farm.managerId === currentUserId);
                }

                const farmDataPromises = farmList.map(async (farm) => {
                    try {
                        const sections = await infrastructureService.getSectionsByFarm(farm.id);
                        const batchPromises = sections.map((sec) =>
                            batchService.getBatchesBySection(sec.id).catch(() => [])
                        );
                        const nestedBatches = await Promise.all(batchPromises);
                        const farmBatches = nestedBatches.flat().filter((b) => b.status === 'ACTIVE');

                        return { farm, batches: farmBatches };
                    } catch {
                        return { farm, batches: [] };
                    }
                });

                const results = await Promise.all(farmDataPromises);

                if (isMounted) {
                    setFarmBatchMap(results);
                    if (results.length > 0 && results[0].farm) {
                        setSelectedFarmId(results[0].farm.id);
                        if (results[0].batches.length > 0) {
                            const firstBatch = results[0].batches[0];
                            setSelectedBatchId(firstBatch.id);
                            setSelectedBatch(firstBatch);
                        }
                    }
                }
            } catch {
                // Fallback
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        init();
        return () => { isMounted = false; };
    }, [organisationId, isProprietor, currentUserId]);

    useEffect(() => {
        let isMounted = true;
        
        const fetchInventories = async () => {
            if (!selectedFarmId) {
                if (isMounted) setFarmInventories([]);
                return;
            }
            
            try {
                const data = await inventoryService.getInventoriesByFarm(Number(selectedFarmId));
                if (isMounted) setFarmInventories(data);
            } catch {
                if (isMounted) setFarmInventories([]);
            }
        };

        fetchInventories();

        return () => { isMounted = false; };
    }, [selectedFarmId]);

    useEffect(() => {
        let isMounted = true;
        if (!selectedBatchId) return;

        const fetchLogsForSelectedBatch = async () => {
            try {
                const logs = await dailyLogService.getLogsForBatch(Number(selectedBatchId));
                const sorted = Array.isArray(logs)
                    ? logs.sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime())
                    : [];

                if (isMounted) setBatchLogs(sorted);
            } catch {
                if (isMounted) setBatchLogs([]);
            }
        };

        fetchLogsForSelectedBatch();
        return () => { isMounted = false; };
    }, [selectedBatchId]);

    const handleFarmChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const farmId = Number(e.target.value);
        setSelectedFarmId(farmId);

        const group = farmBatchMap.find((g) => g.farm.id === farmId);
        if (group && group.batches.length > 0) {
            const firstBatch = group.batches[0];
            setSelectedBatchId(firstBatch.id);
            setSelectedBatch(firstBatch);
        } else {
            setSelectedBatchId('');
            setSelectedBatch(null);
            setBatchLogs([]);
        }
        cancelEdit(); 
    };

    const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const bId = Number(e.target.value);
        setSelectedBatchId(bId);

        const group = farmBatchMap.find((g) => g.farm.id === Number(selectedFarmId));
        const foundBatch = group?.batches.find((b) => b.id === bId) || null;
        setSelectedBatch(foundBatch);
        cancelEdit(); 
    };

    const refreshData = async () => {
        if (!selectedBatchId) return;
        const [updatedLogs, updatedBatch] = await Promise.all([
            dailyLogService.getLogsForBatch(Number(selectedBatchId)),
            batchService.getBatchById(Number(selectedBatchId))
        ]);
        
        const sorted = Array.isArray(updatedLogs)
            ? updatedLogs.sort((a, b) => new Date(b.logDate).getTime() - new Date(a.logDate).getTime())
            : [];
        setBatchLogs(sorted);
        setSelectedBatch(updatedBatch);

        if (selectedFarmId) {
            inventoryService.getInventoriesByFarm(Number(selectedFarmId))
                .then(setFarmInventories).catch(() => {});
        }
    };

    const cancelEdit = () => {
        setEditingLogId(null);
        setErrorMessage(null);
        setLogForm({
            logDate: new Date().toISOString().split('T')[0],
            feedInventoryId: null,
            feedQuantityUsed: 0,
            medicineInventoryId: null,
            medicineQuantityUsed: 0,
            administrationMethod: '',
            mortalityCount: 0,
            averageWeight: 0,
            observations: '',
        });
    };

    // FIXED: Strict typing applied using the extended interface
    const handleEditClick = (baseLog: DailyLogResponseDto) => {
        const log = baseLog as ExtendedDailyLogResponse;
        
        setEditingLogId(log.id);
        setLogForm({
            logDate: log.logDate,
            feedInventoryId: log.feedInventoryId || null, 
            feedQuantityUsed: log.feedQuantityUsed || 0,
            medicineInventoryId: log.medicineInventoryId || null,
            medicineQuantityUsed: log.medicineQuantityUsed || 0,
            administrationMethod: log.administrationMethod || '',
            mortalityCount: log.mortalityCount || 0,
            averageWeight: log.averageWeight || 0,
            observations: log.observations || '',
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDeleteClick = async (logId: number) => {
        if (!window.confirm("Are you sure you want to delete this log? This will reverse inventory deductions and mortality counts.")) return;
        
        setErrorMessage(null);
        try {
            await dailyLogService.deleteLog(logId);
            setSuccessMessage("Log deleted and metrics reversed successfully.");
            await refreshData();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(typeof err.response?.data === 'string' ? err.response.data : 'Failed to delete log.');
            } else {
                setErrorMessage('An unexpected error occurred during deletion.');
            }
        }
    };

    const handleCreateOrUpdateDailyLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatchId) return;

        if (Number(logForm.feedQuantityUsed) > 0 && !logForm.feedInventoryId) {
            setErrorMessage("Please select which feed was consumed.");
            return;
        }
        if (Number(logForm.medicineQuantityUsed) > 0 && !logForm.medicineInventoryId) {
            setErrorMessage("Please select which medicine was administered.");
            return;
        }

        setSubmitting(true);
        setErrorMessage(null);
        setSuccessMessage(null);

        const payload: DailyLogRequestDto = {
            batchId: Number(selectedBatchId),
            logDate: logForm.logDate,
            mortalityCount: Number(logForm.mortalityCount || 0),
            
            feedInventoryId: logForm.feedInventoryId,
            feedQuantityUsed: logForm.feedQuantityUsed ? Number(logForm.feedQuantityUsed) : undefined,
            
            medicineInventoryId: logForm.medicineInventoryId,
            medicineQuantityUsed: logForm.medicineQuantityUsed ? Number(logForm.medicineQuantityUsed) : undefined,
            
            administrationMethod: logForm.administrationMethod?.trim() || undefined,
            averageWeight: logForm.averageWeight ? Number(logForm.averageWeight) : undefined,
            observations: logForm.observations?.trim() || undefined,
        };

        try {
            if (editingLogId) {
                await dailyLogService.updateLog(editingLogId, payload);
                setSuccessMessage('Daily telemetry log successfully updated!');
            } else {
                await dailyLogService.createDailyLog(payload);
                setSuccessMessage('Daily telemetry log successfully saved and audited!');
            }

            await refreshData();
            cancelEdit();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(typeof err.response?.data === 'string' ? err.response.data : err.response?.data?.message || 'Failed to submit log.');
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const currentFarmGroup = farmBatchMap.find((g) => g.farm.id === Number(selectedFarmId));
    const availableBatches = currentFarmGroup ? currentFarmGroup.batches : [];

    const feedItems = farmInventories.filter(i => i.category === 'FEED');
    const medItems = farmInventories.filter(i => i.category === 'MEDICINE' || i.category === 'VACCINE');

    const totalFeedConsumed = batchLogs.reduce((acc, curr) => acc + (curr.feedQuantityUsed || 0), 0);
    const weightsWithValues = batchLogs.filter((l) => l.averageWeight && l.averageWeight > 0);
    const latestWeight = weightsWithValues[0]?.averageWeight || null;
    const prevWeight = weightsWithValues[1]?.averageWeight || null;
    const weightTrend = latestWeight && prevWeight ? (latestWeight - prevWeight).toFixed(2) : null;
    
    const survivalRate = selectedBatch && selectedBatch.initialCount > 0 
        ? (((selectedBatch.initialCount - selectedBatch.mortalityCount) / selectedBatch.initialCount) * 100).toFixed(1)
        : '100';

    const maxFeed = Math.max(...batchLogs.map(l => l.feedQuantityUsed || 0), 1);
    const maxWeight = Math.max(...batchLogs.map(l => l.averageWeight || 0), 1);
    const last7Logs = [...batchLogs].slice(0, 7).reverse();

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-12">
            
            {/* 1. TOP SELECTOR BAR */}
            <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-5 shadow-xs space-y-5">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-2 border-[#101B14]/10 pb-5">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                            {isProprietor ? 'Operations & Telemetry Log' : 'Site Shift Telemetry'}
                        </h3>
                        <p className="text-sm text-[#101B14]/70 font-medium mt-1">
                            {isProprietor 
                                ? 'Analyze daily performance trends, audit historical logs, and record new cohort data.'
                                : 'Record shift feed distribution, medication administration, and pen mortality.'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/60 mb-2">
                            Facility Assignment
                        </label>
                        <select
                            value={selectedFarmId}
                            onChange={handleFarmChange}
                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm cursor-pointer appearance-none"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                        >
                            {farmBatchMap.map(({ farm }) => (
                                <option key={farm.id} value={farm.id}>
                                    🏢 {farm.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/60 mb-2">
                            Active Cohort / Pen
                        </label>
                        <select
                            value={selectedBatchId}
                            onChange={handleBatchChange}
                            disabled={availableBatches.length === 0}
                            className="w-full px-4 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm cursor-pointer appearance-none disabled:opacity-50"
                            style={{ backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23101B14' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6 9 12 15 18 9'%3e%3c/polyline%3e%3c/svg%3e")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 1rem center', backgroundSize: '1em' }}
                        >
                            {availableBatches.length > 0 ? (
                                availableBatches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        🛖 {b.sectionName} — Batch #{b.batchNumber}
                                    </option>
                                ))
                            ) : (
                                <option value="">No active cohorts found</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {selectedBatch ? (
                <>
                    {/* 2. ANALYTICS & KPI DASHBOARD */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Live Population with Progress Bar */}
                        <div className="bg-white border border-[#101B14]/10 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-widest block">
                                    Live Population Balance
                                </span>
                                <span className="text-2xl font-extrabold text-[#101B14] mt-2 block font-mono">
                                    {selectedBatch.currentCount.toLocaleString()} 
                                    <span className="text-sm text-[#101B14]/40 font-sans ml-1">/ {selectedBatch.initialCount.toLocaleString()}</span>
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between text-[10px] font-bold font-mono mb-1">
                                    <span className="text-[#2A5C38]">{survivalRate}% Survival</span>
                                    <span className="text-[#E76F51]">{selectedBatch.mortalityCount} Lost</span>
                                </div>
                                <div className="w-full h-2 bg-[#E76F51]/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-[#2A5C38] rounded-full" style={{ width: `${survivalRate}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Feed Analytics */}
                        <div className="bg-white border border-[#101B14]/10 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-widest block">
                                    Total Feed Volume
                                </span>
                                <span className="text-2xl font-extrabold text-[#D9A63E] mt-2 block font-mono">
                                    {totalFeedConsumed.toFixed(1)} <span className="text-sm text-[#101B14]/40 font-sans">Units</span>
                                </span>
                            </div>
                            <div className="mt-4 pt-3 border-t border-[#101B14]/5">
                                <span className="text-[10px] font-bold text-[#101B14]/60 uppercase flex items-center gap-1">
                                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                    </svg>
                                    Avg {(totalFeedConsumed / (batchLogs.length || 1)).toFixed(1)} units / log
                                </span>
                            </div>
                        </div>

                        {/* Weight Analytics */}
                        <div className="bg-white border border-[#101B14]/10 rounded-xl p-5 shadow-xs flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-widest block">
                                    Latest Body Weight
                                </span>
                                <span className="text-2xl font-extrabold text-[#101B14] mt-2 block font-mono">
                                    {latestWeight ? `${latestWeight} kg` : 'N/A'}
                                </span>
                            </div>
                            <div className="mt-4 pt-3 border-t border-[#101B14]/5 flex items-center gap-2">
                                {weightTrend && Number(weightTrend) > 0 ? (
                                    <span className="text-[10px] font-bold text-[#2A5C38] uppercase bg-[#2A5C38]/10 px-2 py-0.5 rounded flex items-center gap-1">
                                        ↑ +{weightTrend}kg 
                                    </span>
                                ) : weightTrend && Number(weightTrend) < 0 ? (
                                    <span className="text-[10px] font-bold text-[#E76F51] uppercase bg-[#E76F51]/10 px-2 py-0.5 rounded flex items-center gap-1">
                                        ↓ {weightTrend}kg 
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-[#101B14]/40 uppercase">No recent change</span>
                                )}
                                <span className="text-[10px] font-bold text-[#101B14]/40">vs prior log</span>
                            </div>
                        </div>

                        {/* 7-Day Micro Trend Chart */}
                        <div className="bg-[#2A5C38] border border-[#2A5C38] rounded-xl p-5 shadow-xs flex flex-col justify-between relative overflow-hidden">
                            <div className="flex items-center justify-between relative z-10 mb-2">
                                <span className="text-[10px] font-mono font-bold text-white/70 uppercase tracking-widest">
                                    7-Day Trend
                                </span>
                                <div className="flex items-center gap-3 text-[9px] font-mono font-bold uppercase tracking-widest text-white/70">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-[#D9A63E] rounded-sm"></div> Feed
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-[#E76F51] rounded-full"></div> Lost
                                    </div>
                                </div>
                            </div>
                            
                            {last7Logs.length > 0 ? (
                                <div className="flex items-end justify-between h-20 relative z-10 gap-1.5 mt-2">
                                    {last7Logs.map((log, idx) => {
                                        const hPct = maxFeed > 0 ? ((log.feedQuantityUsed || 0) / maxFeed) * 100 : 0;
                                        const dateObj = new Date(log.logDate + 'T12:00:00');
                                        const dayName = isNaN(dateObj.getTime()) ? '' : dateObj.toLocaleDateString('en-US', { weekday: 'short' });

                                        return (
                                            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                                                <div className="absolute -top-10 bg-white text-[#101B14] text-[10px] font-bold px-2.5 py-1.5 rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-lg">
                                                    {log.logDate}: {log.feedQuantityUsed || 0}u
                                                    {log.mortalityCount > 0 && ` | ${log.mortalityCount} lost`}
                                                </div>
                                                <div className="w-full flex-1 flex flex-col items-center justify-end">
                                                    {log.mortalityCount > 0 && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#E76F51] mb-1.5 shadow-[0_0_4px_rgba(231,111,81,0.8)]"></div>
                                                    )}
                                                    <div className="w-full bg-[#D9A63E] rounded-t-sm opacity-90 group-hover:opacity-100 transition-opacity min-h-[4px]" style={{ height: `${Math.max(hPct, 5)}%` }}></div>
                                                </div>
                                                <span className="text-[9px] font-mono text-white/60 mt-2 uppercase tracking-tighter shrink-0">{dayName}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-20 flex items-center justify-center text-[10px] font-mono text-white/50 mt-4">Not enough data</div>
                            )}
                        </div>
                    </div>

                    {/* 3. MAIN WORKSPACE: FORM & ENRICHED TABLE */}
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        {/* LEFT: Auditor's Logbook Form (Span 4) */}
                        <div className={`lg:col-span-5 xl:col-span-4 border rounded-2xl p-6 shadow-inner h-fit relative transition-colors ${editingLogId ? 'bg-[#D9A63E]/5 border-[#D9A63E]/30' : 'bg-[#F5F1E6] border-[#101B14]/10'}`}>
                            <div className={`absolute top-0 right-6 w-8 h-10 opacity-10 rounded-b-lg ${editingLogId ? 'bg-[#D9A63E]' : 'bg-[#2A5C38]'}`}></div>
                            
                            <div className="border-b-2 border-[#101B14]/10 pb-4 mb-5 flex justify-between items-start">
                                <div>
                                    <h4 className="text-xl font-extrabold text-[#101B14] font-['Fraunces',serif]">
                                        {editingLogId ? 'Edit Telemetry' : 'Record Telemetry'}
                                    </h4>
                                    <p className="text-[10px] text-[#101B14]/60 font-mono uppercase tracking-widest mt-1">
                                        Auditing Cohort: #{selectedBatch.batchNumber}
                                    </p>
                                </div>
                                {editingLogId && (
                                    <button 
                                        type="button" 
                                        onClick={cancelEdit} 
                                        className="text-[10px] font-bold text-[#E76F51] bg-[#E76F51]/10 px-2 py-1 rounded cursor-pointer hover:bg-[#E76F51]/20 transition-colors"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                            {errorMessage && (
                                <div className="mb-4 p-3 rounded-lg bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-xs font-bold shadow-sm">
                                    {errorMessage}
                                </div>
                            )}

                            {successMessage && (
                                <div className="mb-4 p-3 rounded-lg bg-[#2A5C38]/10 border border-[#2A5C38]/30 text-[#2A5C38] text-xs font-bold shadow-sm flex items-center gap-2">
                                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                    {successMessage}
                                </div>
                            )}

                            <form onSubmit={handleCreateOrUpdateDailyLog} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Log Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={logForm.logDate}
                                            onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Casualties *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={logForm.mortalityCount}
                                            onChange={(e) => setLogForm({ ...logForm, mortalityCount: Number(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-[#101B14]/15 text-[#E76F51] text-sm font-extrabold focus:outline-none focus:border-[#E76F51] focus:ring-2 focus:ring-[#E76F51]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>
                                </div>

                                {/* Feed Sub-Form */}
                                <div className="pt-4 border-t border-[#101B14]/10 space-y-4">
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#2A5C38]">Feed Consumption</label>
                                    <select
                                        value={logForm.feedInventoryId || ''}
                                        onChange={(e) => setLogForm({ ...logForm, feedInventoryId: e.target.value ? Number(e.target.value) : null })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#2A5C38] focus:ring-2 focus:ring-[#2A5C38]/30 transition-all shadow-sm"
                                    >
                                        <option value="">-- Select Feed Item --</option>
                                        {feedItems.map(f => (
                                            <option key={f.id} value={f.id}>{f.name} ({f.currentQuantity} In Stock)</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        placeholder="Quantity used"
                                        value={logForm.feedQuantityUsed || ''}
                                        onChange={(e) => setLogForm({ ...logForm, feedQuantityUsed: Number(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/30 transition-all shadow-sm font-mono"
                                    />
                                </div>

                                {/* Medicine Sub-Form */}
                                <div className="pt-4 border-t border-[#101B14]/10 space-y-4">
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#E76F51]">Medicine / Vaccine</label>
                                    <select
                                        value={logForm.medicineInventoryId || ''}
                                        onChange={(e) => setLogForm({ ...logForm, medicineInventoryId: e.target.value ? Number(e.target.value) : null })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#E76F51] focus:ring-2 focus:ring-[#E76F51]/30 transition-all shadow-sm"
                                    >
                                        <option value="">-- Select Medicine --</option>
                                        {medItems.map(m => (
                                            <option key={m.id} value={m.id}>{m.name} ({m.currentQuantity} In Stock)</option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        placeholder="Quantity used"
                                        value={logForm.medicineQuantityUsed || ''}
                                        onChange={(e) => setLogForm({ ...logForm, medicineQuantityUsed: Number(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/30 transition-all shadow-sm font-mono"
                                    />
                                </div>

                                <div className="pt-4 border-t border-[#101B14]/10">
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Avg Weight Sample (kg)</label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        placeholder="e.g. 1.2"
                                        value={logForm.averageWeight || ''}
                                        onChange={(e) => setLogForm({ ...logForm, averageWeight: Number(e.target.value) })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/30 transition-all shadow-sm font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/70 mb-2">Auditor Notes</label>
                                    <textarea
                                        rows={2}
                                        maxLength={500}
                                        value={logForm.observations || ''}
                                        onChange={(e) => setLogForm({ ...logForm, observations: e.target.value })}
                                        placeholder="e.g. Normal feed intake. Temp normal."
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-[#101B14]/15 text-[#101B14] text-sm focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/30 transition-all shadow-sm"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`w-full py-4 rounded-lg text-white text-xs font-bold uppercase tracking-widest shadow-md transition-colors cursor-pointer disabled:opacity-50 mt-2 ${
                                        editingLogId ? 'bg-[#D9A63E] hover:bg-[#c99834] text-[#101B14]' : 'bg-[#2A5C38] hover:bg-[#1E4228]'
                                    }`}
                                >
                                    {submitting ? 'Processing...' : editingLogId ? 'Update Log' : 'Stamp Daily Log'}
                                </button>
                            </form>
                        </div>

                        {/* RIGHT: Enriched Telemetry Ledger (Span 8) */}
                        <div className="lg:col-span-7 xl:col-span-8 bg-[#FBF9F5] border border-[#101B14]/10 rounded-2xl overflow-hidden shadow-xs h-fit flex flex-col">
                            <div className="bg-[#DFD8C4] border-b-2 border-[#101B14]/15 px-6 py-5 flex items-center justify-between">
                                <div>
                                    <h4 className="text-lg font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                                        Telemetry Ledger
                                    </h4>
                                </div>
                                <span className="text-[10px] font-bold font-mono text-[#101B14]/60 uppercase tracking-widest bg-white/50 px-3 py-1 rounded-full border border-[#101B14]/10">
                                    {batchLogs.length} Records
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs font-sans text-[#101B14] min-w-[700px]">
                                    <thead className="bg-[#ECE6D6] text-[#101B14]/60 font-mono uppercase text-[9px] font-extrabold tracking-widest border-b border-[#101B14]/10">
                                        <tr>
                                            <th className="px-5 py-4 w-12 text-center">Status</th>
                                            <th className="px-5 py-4">Audit Date</th>
                                            <th className="px-5 py-4 w-40">Materials Consumed</th>
                                            <th className="px-5 py-4 w-32">Weight Trend</th>
                                            <th className="px-5 py-4">Casualties</th>
                                            <th className="px-5 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#101B14]/10 font-mono bg-white">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-16 text-center text-[#101B14]/40 font-bold">
                                                    Loading batch history...
                                                </td>
                                            </tr>
                                        ) : batchLogs.length > 0 ? (
                                            batchLogs.map((baseLog) => {
                                                const log = baseLog as ExtendedDailyLogResponse;
                                                const hasMortality = log.mortalityCount > 0;
                                                const feedPct = maxFeed > 0 ? ((log.feedQuantityUsed || 0) / maxFeed) * 100 : 0;
                                                const weightPct = maxWeight > 0 ? ((log.averageWeight || 0) / maxWeight) * 100 : 0;

                                                return (
                                                    <tr key={log.id} className={`hover:bg-[#FBF9F5] transition-colors ${editingLogId === log.id ? 'bg-[#D9A63E]/10' : hasMortality ? 'bg-[#E76F51]/5' : ''}`}>
                                                        <td className="px-5 py-4 text-center">
                                                            <div className={`w-2 h-2 rounded-full mx-auto ${hasMortality ? 'bg-[#E76F51] shadow-[0_0_8px_rgba(231,111,81,0.6)]' : 'bg-[#2A5C38]'}`}></div>
                                                        </td>
                                                        
                                                        <td className="px-5 py-4 font-bold text-[#101B14]">
                                                            {log.logDate}
                                                            <div className="text-[9px] font-sans text-[#101B14]/40 mt-1 truncate max-w-[100px]">
                                                                by {log.recordedByName || 'System'}
                                                            </div>
                                                        </td>
                                                        
                                                        <td className="px-5 py-4">
                                                            <div className="flex flex-col gap-2">
                                                                {log.feedQuantityUsed && log.feedQuantityUsed > 0 ? (
                                                                    <div className="flex items-center gap-2" title={log.feedName || ''}>
                                                                        <span className="w-8 text-right font-bold text-[#D9A63E] shrink-0">
                                                                            {log.feedQuantityUsed}
                                                                        </span>
                                                                        <div className="flex-1 h-1.5 bg-[#101B14]/5 rounded-full overflow-hidden">
                                                                            <div className="h-full bg-[#D9A63E] rounded-full" style={{ width: `${feedPct}%` }}></div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] text-[#101B14]/30 font-bold">No Feed</span>
                                                                )}

                                                                {log.medicineQuantityUsed && log.medicineQuantityUsed > 0 && (
                                                                    <div className="text-[10px] text-[#E76F51] font-bold truncate max-w-[120px]">
                                                                        + {log.medicineQuantityUsed} {log.medicineName || 'Medication'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-8 text-right font-bold text-[#101B14]">
                                                                    {log.averageWeight || 0}
                                                                </span>
                                                                <div className="flex-1 h-1.5 bg-[#101B14]/5 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-[#2A5C38] rounded-full" style={{ width: `${weightPct}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className={`px-5 py-4 font-extrabold ${hasMortality ? 'text-[#E76F51]' : 'text-[#101B14]/30'}`}>
                                                            {log.mortalityCount > 0 ? `${log.mortalityCount} Head` : '-'}
                                                        </td>

                                                        <td className="px-5 py-4 text-right space-x-2">
                                                            <button 
                                                                onClick={() => handleEditClick(baseLog)}
                                                                className="p-1.5 rounded bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#D9A63E] hover:bg-[#D9A63E]/10 transition-colors cursor-pointer"
                                                                title="Edit Log"
                                                            >
                                                                ✏️
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteClick(log.id)}
                                                                className="p-1.5 rounded bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#E76F51] hover:bg-[#E76F51]/10 transition-colors cursor-pointer"
                                                                title="Delete Log"
                                                            >
                                                                🗑️
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-5 py-16 text-center bg-[#FBF9F5]">
                                                    <div className="flex flex-col items-center justify-center space-y-3">
                                                        <div className="w-12 h-12 rounded-full bg-white border border-[#101B14]/10 flex items-center justify-center text-[#101B14]/20 shadow-sm">
                                                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                            </svg>
                                                        </div>
                                                        <span className="text-[#101B14]/60 font-bold text-sm font-sans">
                                                            No telemetry audited for this cohort yet.
                                                        </span>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </>
            ) : (
                <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-20 text-center flex flex-col items-center justify-center shadow-xs mt-6">
                    <div className="w-20 h-20 rounded-full bg-[#ECE6D6] flex items-center justify-center text-[#101B14]/30 mb-5 shadow-inner">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01-2-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] mb-2">
                        Telemetry Standby
                    </h3>
                    <p className="text-sm text-[#101B14]/60 font-medium max-w-sm leading-relaxed">
                        {isProprietor ? 'Please select a facility and active cohort from the dropdowns above to begin auditing.' : 'No assigned facility or active cohort found for your manager account.'}
                    </p>
                </div>
            )}
        </div>
    );
};