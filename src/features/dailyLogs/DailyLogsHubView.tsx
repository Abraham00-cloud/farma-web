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
        eggsCollected: 0,
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
            eggsCollected: 0,
            observations: '',
        });
    };

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
            eggsCollected: log.eggsCollected || 0,
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

    // --- THE BULLETPROOF EGG CHECK ---
    const isEggBatch = selectedBatch ? (
        String(selectedBatch.productionType || '').toUpperCase().includes('EGG') || 
        String(selectedBatch.sectionName || '').toUpperCase().includes('LAYER')
    ) : false;

    const handleCreateOrUpdateDailyLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedBatchId || !selectedBatch) return;

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
            
            // Now safely uses the robust boolean
            eggsCollected: (isEggBatch && logForm.eggsCollected) ? Number(logForm.eggsCollected) : undefined,
            
            observations: logForm.observations?.trim() || undefined,
        };

        try {
            if (editingLogId) {
                await dailyLogService.updateLog(editingLogId, payload);
                setSuccessMessage('Daily log successfully updated!');
            } else {
                await dailyLogService.createDailyLog(payload);
                setSuccessMessage('Daily log successfully saved and audited!');
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
    const totalEggsCollected = batchLogs.reduce((acc, curr) => acc + (curr.eggsCollected || 0), 0);

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
            
            <div className="bg-farma-cream border border-farma-forest/10 rounded-xl p-5 shadow-sm space-y-5">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-farma-forest/10 pb-5">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-bold text-farma-forest tracking-tight">
                            {isProprietor ? 'Daily Farm Records' : 'My Daily Logs'}
                        </h3>
                        <p className="text-sm text-farma-forest/70 font-medium mt-1">
                            {isProprietor 
                                ? 'Review past daily logs and record new feed, medicine, and mortality updates for your flocks.'
                                : 'Record shift feed distribution, medication administration, and pen mortality.'}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-2">
                            Select Farm
                        </label>
                        <select
                            value={selectedFarmId}
                            onChange={handleFarmChange}
                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm cursor-pointer"
                        >
                            {farmBatchMap.map(({ farm }) => (
                                <option key={farm.id} value={farm.id}>
                                    {farm.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-2">
                            Select Pen & Flock
                        </label>
                        <select
                            value={selectedBatchId}
                            onChange={handleBatchChange}
                            disabled={availableBatches.length === 0}
                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm cursor-pointer disabled:opacity-50"
                        >
                            {availableBatches.length > 0 ? (
                                availableBatches.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.sectionName} — Batch #{b.batchNumber}
                                    </option>
                                ))
                            ) : (
                                <option value="">No active flocks found</option>
                            )}
                        </select>
                    </div>
                </div>
            </div>

            {selectedBatch ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-white border border-farma-forest/10 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-farma-forest/60 uppercase tracking-widest block">
                                    Live Birds
                                </span>
                                <span className="text-2xl font-bold text-farma-forest mt-2 block tabular-nums">
                                    {selectedBatch.currentCount.toLocaleString()} 
                                    <span className="text-sm text-farma-forest/40 font-semibold ml-1">/ {selectedBatch.initialCount.toLocaleString()}</span>
                                </span>
                            </div>
                            <div className="mt-4">
                                <div className="flex justify-between text-[10px] font-bold mb-1">
                                    <span className="text-farma-green tabular-nums">{survivalRate}% Survival</span>
                                    <span className="text-farma-terracotta tabular-nums">{selectedBatch.mortalityCount} Lost</span>
                                </div>
                                <div className="w-full h-2 bg-farma-terracotta/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-farma-green rounded-full transition-all duration-500" style={{ width: `${survivalRate}%` }}></div>
                                </div>
                            </div>
                        </div>

                        {isEggBatch ? (
                            <div className="bg-white border border-farma-gold/30 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] font-bold text-farma-gold uppercase tracking-widest block">
                                        Total Eggs Laid
                                    </span>
                                    <span className="text-2xl font-bold text-farma-forest mt-2 block tabular-nums">
                                        {totalEggsCollected.toLocaleString()} <span className="text-sm text-farma-forest/40 font-semibold">Pieces</span>
                                    </span>
                                </div>
                                <div className="mt-4 pt-3 border-t border-farma-forest/5">
                                    <span className="text-[10px] font-bold text-farma-forest/60 uppercase flex items-center gap-1 tabular-nums">
                                        <IconAverage />
                                        Avg {(totalEggsCollected / (batchLogs.length || 1)).toFixed(0)} eggs / log
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white border border-farma-forest/10 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                                <div>
                                    <span className="text-[10px] font-bold text-farma-forest/60 uppercase tracking-widest block">
                                        Total Feed Used
                                    </span>
                                    <span className="text-2xl font-bold text-farma-gold mt-2 block tabular-nums">
                                        {totalFeedConsumed.toFixed(1)} <span className="text-sm text-farma-forest/40 font-semibold">Units</span>
                                    </span>
                                </div>
                                <div className="mt-4 pt-3 border-t border-farma-forest/5">
                                    <span className="text-[10px] font-bold text-farma-forest/60 uppercase flex items-center gap-1 tabular-nums">
                                        <IconAverage />
                                        Avg {(totalFeedConsumed / (batchLogs.length || 1)).toFixed(1)} units / log
                                    </span>
                                </div>
                            </div>
                        )}

                        <div className="bg-white border border-farma-forest/10 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                            <div>
                                <span className="text-[10px] font-bold text-farma-forest/60 uppercase tracking-widest block">
                                    Latest Avg Weight
                                </span>
                                <span className="text-2xl font-bold text-farma-forest mt-2 block tabular-nums">
                                    {latestWeight ? `${latestWeight} kg` : 'N/A'}
                                </span>
                            </div>
                            <div className="mt-4 pt-3 border-t border-farma-forest/5 flex items-center gap-2">
                                {weightTrend && Number(weightTrend) > 0 ? (
                                    <span className="text-[10px] font-bold text-farma-green uppercase bg-farma-green/10 px-2 py-0.5 rounded-md flex items-center gap-1 tabular-nums">
                                        <IconTrendUp /> +{weightTrend}kg 
                                    </span>
                                ) : weightTrend && Number(weightTrend) < 0 ? (
                                    <span className="text-[10px] font-bold text-farma-terracotta uppercase bg-farma-terracotta/10 px-2 py-0.5 rounded-md flex items-center gap-1 tabular-nums">
                                        <IconTrendDown /> {weightTrend}kg 
                                    </span>
                                ) : (
                                    <span className="text-[10px] font-bold text-farma-forest/40 uppercase">No recent change</span>
                                )}
                                <span className="text-[10px] font-bold text-farma-forest/40">vs prior log</span>
                            </div>
                        </div>

                        <div className="bg-farma-green border border-farma-green rounded-xl p-5 shadow-sm flex flex-col justify-between relative overflow-hidden">
                            <div className="flex items-center justify-between relative z-10 mb-2">
                                <span className="text-[10px] font-bold text-white/70 uppercase tracking-widest">
                                    7-Day History
                                </span>
                                <div className="flex items-center gap-3 text-[9px] font-bold uppercase tracking-widest text-white/70">
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-farma-gold rounded-sm"></div> Feed
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <div className="w-2 h-2 bg-farma-terracotta rounded-full"></div> Lost
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
                                                <div className="absolute -top-10 bg-white text-farma-forest text-[10px] font-bold px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-20 shadow-sm tabular-nums">
                                                    {log.logDate}: {log.feedQuantityUsed || 0}u
                                                    {log.mortalityCount > 0 && ` | ${log.mortalityCount} lost`}
                                                </div>
                                                <div className="w-full flex-1 flex flex-col items-center justify-end">
                                                    {log.mortalityCount > 0 && (
                                                        <div className="w-1.5 h-1.5 rounded-full bg-farma-terracotta mb-1.5"></div>
                                                    )}
                                                    <div className="w-full bg-farma-gold rounded-t-sm opacity-90 group-hover:opacity-100 transition-opacity min-h-[4px]" style={{ height: `${Math.max(hPct, 5)}%` }}></div>
                                                </div>
                                                <span className="text-[9px] font-bold text-white/60 mt-2 uppercase tracking-tighter shrink-0">{dayName}</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="h-20 flex items-center justify-center text-[10px] font-semibold text-white/50 mt-4 uppercase tracking-widest">Not enough data</div>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                        
                        <div className={`lg:col-span-5 xl:col-span-4 border rounded-xl p-6 shadow-sm h-fit relative transition-colors ${editingLogId ? 'bg-farma-gold/5 border-farma-gold/30' : 'bg-white border-farma-forest/10'}`}>
                            
                            <div className="border-b border-farma-forest/10 pb-4 mb-5 flex justify-between items-start">
                                <div>
                                    <h4 className="text-lg font-bold text-farma-forest">
                                        {editingLogId ? 'Edit Daily Data' : 'Record Daily Data'}
                                    </h4>
                                    <p className="text-[10px] text-farma-forest/60 font-bold uppercase tracking-widest mt-1 tabular-nums">
                                        Batch: #{selectedBatch.batchNumber}
                                    </p>
                                </div>
                                {editingLogId && (
                                    <button 
                                        type="button" 
                                        onClick={cancelEdit} 
                                        className="text-[10px] font-bold text-farma-terracotta bg-farma-terracotta/10 px-2.5 py-1.5 rounded-md cursor-pointer hover:bg-farma-terracotta/20 transition-colors uppercase tracking-widest"
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>

                            {errorMessage && (
                                <div className="mb-4 p-3 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/30 text-farma-terracotta text-xs font-bold shadow-sm flex items-center gap-2">
                                    <IconError />
                                    {errorMessage}
                                </div>
                            )}

                            {successMessage && (
                                <div className="mb-4 p-3 rounded-lg bg-farma-green/10 border border-farma-green/30 text-farma-green text-xs font-bold shadow-sm flex items-center gap-2">
                                    <IconCheck />
                                    {successMessage}
                                </div>
                            )}

                            <form onSubmit={handleCreateOrUpdateDailyLog} className="space-y-5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Log Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={logForm.logDate}
                                            onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Mortality (Lost) *</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={logForm.mortalityCount}
                                            onChange={(e) => setLogForm({ ...logForm, mortalityCount: Number(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-terracotta text-sm font-bold focus:outline-none focus:ring-2 focus:ring-farma-terracotta/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-farma-forest/10 space-y-4">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-green">Feed Used</label>
                                    <select
                                        value={logForm.feedInventoryId || ''}
                                        onChange={(e) => setLogForm({ ...logForm, feedInventoryId: e.target.value ? Number(e.target.value) : null })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm cursor-pointer"
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
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm tabular-nums"
                                    />
                                </div>

                                <div className="pt-4 border-t border-farma-forest/10 space-y-4">
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-terracotta">Medicine / Vaccine</label>
                                    <select
                                        value={logForm.medicineInventoryId || ''}
                                        onChange={(e) => setLogForm({ ...logForm, medicineInventoryId: e.target.value ? Number(e.target.value) : null })}
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-terracotta/30 transition-shadow shadow-sm cursor-pointer"
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
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm tabular-nums"
                                    />
                                </div>

                                {isEggBatch ? (
                                    <div className="grid grid-cols-2 gap-4 pt-4 border-t border-farma-forest/10">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-gold mb-2">Eggs Collected *</label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={logForm.eggsCollected || ''}
                                                onChange={(e) => setLogForm({ ...logForm, eggsCollected: Number(e.target.value) })}
                                                className="w-full px-4 py-3 rounded-lg bg-farma-gold/5 border border-farma-gold/30 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm tabular-nums"
                                                placeholder="Pieces"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Avg Bird Wt (kg)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={logForm.averageWeight || ''}
                                                onChange={(e) => setLogForm({ ...logForm, averageWeight: Number(e.target.value) })}
                                                className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm tabular-nums"
                                            />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="pt-4 border-t border-farma-forest/10">
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Avg Bird Weight (kg)</label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={logForm.averageWeight || ''}
                                            onChange={(e) => setLogForm({ ...logForm, averageWeight: Number(e.target.value) })}
                                            className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm tabular-nums"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-2">Notes / Observations</label>
                                    <textarea
                                        rows={2}
                                        maxLength={500}
                                        value={logForm.observations || ''}
                                        onChange={(e) => setLogForm({ ...logForm, observations: e.target.value })}
                                        placeholder="e.g. Normal feed intake. Temp normal."
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/15 text-farma-forest text-sm focus:outline-none focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className={`w-full py-4 rounded-lg text-white text-xs font-bold uppercase tracking-widest shadow-sm transition-colors cursor-pointer disabled:opacity-50 mt-2 ${
                                        editingLogId ? 'bg-farma-gold hover:bg-farma-gold-hover text-farma-forest' : 'bg-farma-forest hover:bg-farma-green-light'
                                    }`}
                                >
                                    {submitting ? 'Processing...' : editingLogId ? 'Update Data' : 'Save Daily Data'}
                                </button>
                            </form>
                        </div>

                        <div className="lg:col-span-7 xl:col-span-8 bg-farma-cream border border-farma-forest/10 rounded-xl overflow-hidden shadow-sm h-fit flex flex-col">
                            <div className="bg-farma-sand-dark border-b border-farma-forest/15 px-6 py-5 flex items-center justify-between">
                                <div>
                                    <h4 className="text-lg font-bold text-farma-forest tracking-tight">
                                        Past Daily Records
                                    </h4>
                                </div>
                                <span className="text-[10px] font-bold text-farma-forest/60 uppercase tracking-widest bg-white/50 px-3 py-1.5 rounded-md border border-farma-forest/10 tabular-nums">
                                    {batchLogs.length} Records
                                </span>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-farma-forest min-w-[700px]">
                                    <thead className="bg-farma-sand text-farma-forest/60 uppercase text-[10px] font-bold tracking-widest border-b border-farma-forest/10">
                                        <tr>
                                            <th className="px-5 py-4 w-12 text-center">Status</th>
                                            <th className="px-5 py-4">Date</th>
                                            {isEggBatch && (
                                                <th className="px-5 py-4 w-20 text-farma-gold">Eggs</th>
                                            )}
                                            <th className="px-5 py-4 w-40">Feed & Meds Used</th>
                                            <th className="px-5 py-4 w-32">Weight</th>
                                            <th className="px-5 py-4">Mortality (Lost)</th>
                                            <th className="px-5 py-4 text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-farma-forest/10 bg-white">
                                        {loading ? (
                                            <tr>
                                                <td colSpan={isEggBatch ? 7 : 6} className="px-5 py-16 text-center text-farma-forest/40 font-semibold text-xs uppercase tracking-widest">
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
                                                    <tr key={log.id} className={`hover:bg-farma-cream transition-colors ${editingLogId === log.id ? 'bg-farma-gold/10' : hasMortality ? 'bg-farma-terracotta/5' : ''}`}>
                                                        <td className="px-5 py-4 text-center">
                                                            <div className={`w-2 h-2 rounded-full mx-auto ${hasMortality ? 'bg-farma-terracotta' : 'bg-farma-green'}`}></div>
                                                        </td>
                                                        
                                                        <td className="px-5 py-4 font-bold text-farma-forest tabular-nums">
                                                            {log.logDate}
                                                            <div className="text-[10px] font-semibold text-farma-forest/40 mt-1 truncate max-w-[100px] uppercase tracking-wider">
                                                                by {log.recordedByName || 'System'}
                                                            </div>
                                                        </td>

                                                        {isEggBatch && (
                                                            <td className="px-5 py-4 font-bold text-farma-forest tabular-nums">
                                                                {log.eggsCollected && log.eggsCollected > 0 ? log.eggsCollected : '-'}
                                                            </td>
                                                        )}
                                                        
                                                        <td className="px-5 py-4">
                                                            <div className="flex flex-col gap-2">
                                                                {log.feedQuantityUsed && log.feedQuantityUsed > 0 ? (
                                                                    <div className="flex items-center gap-2" title={log.feedName || ''}>
                                                                        <span className="w-8 text-right font-bold text-farma-gold shrink-0 tabular-nums">
                                                                            {log.feedQuantityUsed}
                                                                        </span>
                                                                        <div className="flex-1 h-1.5 bg-farma-forest/5 rounded-full overflow-hidden">
                                                                            <div className="h-full bg-farma-gold rounded-full transition-all duration-500" style={{ width: `${feedPct}%` }}></div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] text-farma-forest/30 font-bold uppercase tracking-widest">No Feed</span>
                                                                )}

                                                                {log.medicineQuantityUsed && log.medicineQuantityUsed > 0 && (
                                                                    <div className="text-[10px] text-farma-terracotta font-bold truncate max-w-[120px] tabular-nums">
                                                                        + {log.medicineQuantityUsed} {log.medicineName || 'Medication'}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>

                                                        <td className="px-5 py-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="w-8 text-right font-bold text-farma-forest tabular-nums">
                                                                    {log.averageWeight || 0}
                                                                </span>
                                                                <div className="flex-1 h-1.5 bg-farma-forest/5 rounded-full overflow-hidden">
                                                                    <div className="h-full bg-farma-green rounded-full transition-all duration-500" style={{ width: `${weightPct}%` }}></div>
                                                                </div>
                                                            </div>
                                                        </td>

                                                        <td className={`px-5 py-4 font-bold tabular-nums ${hasMortality ? 'text-farma-terracotta' : 'text-farma-forest/30'}`}>
                                                            {log.mortalityCount > 0 ? `${log.mortalityCount} Head` : '-'}
                                                        </td>

                                                        <td className="px-5 py-4 text-right space-x-2">
                                                            <button 
                                                                onClick={() => handleEditClick(baseLog)}
                                                                className="p-1.5 rounded-md bg-farma-forest/5 text-farma-forest/60 hover:text-farma-gold hover:bg-farma-gold/10 transition-colors cursor-pointer"
                                                                title="Edit Log"
                                                            >
                                                                <IconEdit />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteClick(log.id)}
                                                                className="p-1.5 rounded-md bg-farma-forest/5 text-farma-forest/60 hover:text-farma-terracotta hover:bg-farma-terracotta/10 transition-colors cursor-pointer"
                                                                title="Delete Log"
                                                            >
                                                                <IconDelete />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={isEggBatch ? 7 : 6} className="px-5 py-16 text-center bg-farma-cream">
                                                    <div className="flex flex-col items-center justify-center space-y-3">
                                                        <div className="w-12 h-12 rounded-full bg-white border border-farma-forest/10 flex items-center justify-center text-farma-forest/20 shadow-sm">
                                                            <IconEmptyState />
                                                        </div>
                                                        <span className="text-farma-forest/60 font-semibold text-sm">
                                                            No daily records logged for this flock yet.
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
                <div className="bg-farma-cream border border-farma-forest/10 rounded-xl p-20 text-center flex flex-col items-center justify-center shadow-sm mt-6">
                    <div className="w-20 h-20 rounded-full bg-farma-sand flex items-center justify-center text-farma-forest/30 mb-5 shadow-inner">
                        <IconEmptyStateLarge />
                    </div>
                    <h3 className="text-xl font-bold text-farma-forest mb-2">
                        Waiting for Selection
                    </h3>
                    <p className="text-sm text-farma-forest/60 font-medium max-w-sm leading-relaxed">
                        {isProprietor ? 'Please select a farm and an active flock from the dropdowns above to begin.' : 'No assigned farm or active flock found for your manager account.'}
                    </p>
                </div>
            )}
        </div>
    );
};

// ==========================================
// Reusable SVG Components
// ==========================================

const IconCheck = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
);

const IconError = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const IconAverage = () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
);

const IconTrendUp = () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 10l7-7m0 0l7 7m-7-7v18" />
    </svg>
);

const IconTrendDown = () => (
    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
    </svg>
);

const IconEdit = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const IconDelete = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const IconEmptyState = () => (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const IconEmptyStateLarge = () => (
    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);