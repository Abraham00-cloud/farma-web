import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { batchService } from '../../services/batchService';
import { dailyLogService } from '../../services/dailyLogService';
import type { BatchResponseDto } from '../../types/batch';
import type { DailyLogResponseDto, DailyLogRequestDto } from '../../types/dailyLog';

interface BatchDetailViewProps {
    batchId: number;
    onBack: () => void;
}

export const BatchDetailView: React.FC<BatchDetailViewProps> = ({ batchId, onBack }) => {
    const [batch, setBatch] = useState<BatchResponseDto | null>(null);
    const [logs, setLogs] = useState<DailyLogResponseDto[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const [showLogModal, setShowLogModal] = useState<boolean>(false);
    const [showHarvestModal, setShowHarvestModal] = useState<boolean>(false);

    const [logForm, setLogForm] = useState<Omit<DailyLogRequestDto, 'batchId'>>({
        logDate: new Date().toISOString().split('T')[0],
        feedQuantityUsed: 0,
        medicineQuantityUsed: 0,
        administrationMethod: '',
        mortalityCount: 0,
        averageWeight: 0,
        eggsCollected: 0, 
        observations: '',
    });

    const [harvestForm, setHarvestForm] = useState({
        saleDate: new Date().toISOString().split('T')[0],
        birdsSold: 0,
        saleRevenue: 0,
        notes: '',
        isFinalHarvest: false, 
    });

    const loadData = async () => {
        try {
            const [batchData, logData] = await Promise.all([
                batchService.getBatchById(batchId),
                dailyLogService.getLogsForBatch(batchId).catch(() => []),
            ]);
            setBatch(batchData);
            setLogs(logData);
            
            setHarvestForm((prev) => ({
                ...prev,
                birdsSold: batchData.currentCount,
                saleRevenue: 0, 
            }));
        } catch {
            setErrorMessage("Failed to refresh batch data.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                const [batchData, logData] = await Promise.all([
                    batchService.getBatchById(batchId),
                    dailyLogService.getLogsForBatch(batchId).catch(() => []),
                ]);
                if (isMounted) {
                    setBatch(batchData);
                    setLogs(logData);
                    setHarvestForm((prev) => ({
                        ...prev,
                        birdsSold: batchData.currentCount,
                        saleRevenue: 0,
                    }));
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

        return () => {
            isMounted = false;
        };
    }, [batchId]);

    // --- THE BULLETPROOF EGG CHECK ---
    const isEggBatch = batch ? (
        String(batch.productionType || '').toUpperCase().includes('EGG') || 
        String(batch.sectionName || '').toUpperCase().includes('LAYER')
    ) : false;

    const handleCreateDailyLog = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batch) return;

        setSubmitting(true);
        setErrorMessage(null);

        const payload: DailyLogRequestDto = {
            batchId: batch.id,
            logDate: logForm.logDate,
            mortalityCount: Number(logForm.mortalityCount || 0),
            feedQuantityUsed: logForm.feedQuantityUsed ? Number(logForm.feedQuantityUsed) : undefined,
            medicineQuantityUsed: logForm.medicineQuantityUsed ? Number(logForm.medicineQuantityUsed) : undefined,
            administrationMethod: logForm.administrationMethod ? logForm.administrationMethod.trim() : undefined,
            averageWeight: logForm.averageWeight ? Number(logForm.averageWeight) : undefined,
            // Now safely uses the robust boolean
            eggsCollected: (isEggBatch && logForm.eggsCollected) ? Number(logForm.eggsCollected) : undefined,
            observations: logForm.observations ? logForm.observations.trim() : undefined,
        };

        try {
            await dailyLogService.createDailyLog(payload);
            setShowLogModal(false);
            setSuccessMessage("Daily log recorded successfully.");
            setLogForm({
                logDate: new Date().toISOString().split('T')[0],
                feedQuantityUsed: 0,
                medicineQuantityUsed: 0,
                administrationMethod: '',
                mortalityCount: 0,
                averageWeight: 0,
                eggsCollected: 0,
                observations: '',
            });
            await loadData();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || 'Failed to submit daily log.');
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleHarvestSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batch) return;

        if (harvestForm.birdsSold > batch.currentCount) {
            setErrorMessage(`You cannot sell more birds (${harvestForm.birdsSold}) than are currently alive in the pen (${batch.currentCount}).`);
            return;
        }

        setSubmitting(true);
        setErrorMessage(null);

        try {
            if (harvestForm.isFinalHarvest) {
                await batchService.closeBatch(batch.id, {
                    actualEndDate: harvestForm.saleDate,
                    totalBirdsSold: Number(harvestForm.birdsSold),
                    totalSaleRevenue: Number(harvestForm.saleRevenue),
                    harvestNotes: harvestForm.notes ? harvestForm.notes.trim() : undefined,
                });
                setSuccessMessage("Batch officially closed and harvest finalized!");
            } else {
                await batchService.recordPartialSale(batch.id, {
                    saleDate: harvestForm.saleDate,
                    birdsSold: Number(harvestForm.birdsSold),
                    saleRevenue: Number(harvestForm.saleRevenue),
                    notes: harvestForm.notes ? harvestForm.notes.trim() : undefined,
                });
                setSuccessMessage("Partial sale recorded successfully! Batch remains active.");
            }
            
            setShowHarvestModal(false);
            await loadData();
            setTimeout(() => setSuccessMessage(null), 4000);
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || 'Failed to process harvest transaction.');
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const inputClassesGold = "w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-gold focus:ring-2 focus:ring-farma-gold/30 transition-shadow shadow-sm";
    const inputClassesGreen = "w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm font-semibold focus:outline-none focus:border-farma-green focus:ring-2 focus:ring-farma-green/30 transition-shadow shadow-sm";
    const inputClassesRed = "w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-terracotta text-lg font-bold focus:outline-none focus:border-farma-terracotta focus:ring-2 focus:ring-farma-terracotta/30 transition-shadow shadow-sm tabular-nums";

    if (loading) {
        return (
            <div className="bg-farma-cream border border-farma-forest/10 p-24 rounded-xl text-center flex flex-col items-center justify-center shadow-sm max-w-7xl mx-auto">
                <div className="w-10 h-10 border-4 border-farma-green/20 border-t-farma-green rounded-full animate-spin mb-6"></div>
                <span className="text-farma-forest/60 text-xs font-bold uppercase tracking-widest">
                    Loading flock details...
                </span>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="bg-farma-cream border border-farma-terracotta/20 rounded-xl p-16 text-center shadow-sm flex flex-col items-center max-w-xl mx-auto mt-12">
                <div className="w-16 h-16 rounded-full bg-farma-terracotta/10 text-farma-terracotta flex items-center justify-center mb-6 shadow-inner border border-farma-terracotta/10">
                    <IconErrorLarge />
                </div>
                <h3 className="text-2xl font-bold text-farma-forest mb-2">Flock Not Found</h3>
                <p className="text-farma-forest/60 mb-8 text-sm font-medium leading-relaxed max-w-sm">This flock batch record could not be found or you do not have permission to view its telemetry.</p>
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-3 bg-farma-forest text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-farma-green-light transition-colors cursor-pointer"
                >
                    Return to All Flocks
                </button>
            </div>
        );
    }

    const survivalRate = batch.initialCount > 0
        ? (((batch.initialCount - batch.mortalityCount) / batch.initialCount) * 100).toFixed(1)
        : '100';

    const totalFeedConsumed = logs.reduce((acc, curr) => acc + (curr.feedQuantityUsed || 0), 0);
    const totalEggsCollected = logs.reduce((acc, curr) => acc + (curr.eggsCollected || 0), 0);

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-16">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-farma-forest/10 pb-6">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-[10px] font-bold text-farma-forest/50 hover:text-farma-forest uppercase tracking-widest flex items-center space-x-2 cursor-pointer transition-colors w-fit"
                >
                    <IconBack />
                    <span>Back to Previous View</span>
                </button>

                {batch.status === 'ACTIVE' && (
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowLogModal(true)}
                            className="px-5 py-2.5 rounded-lg bg-farma-gold hover:bg-farma-gold-hover text-farma-forest font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                        >
                            <IconPen />
                            <span>Record Daily Log</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setHarvestForm(prev => ({ ...prev, birdsSold: batch.currentCount, isFinalHarvest: false }));
                                setShowHarvestModal(true);
                            }}
                            className="px-5 py-2.5 rounded-lg bg-farma-forest hover:bg-farma-green-light text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer"
                        >
                            <IconHarvest />
                            <span>Record Bird Sale / Cull</span>
                        </button>
                    </div>
                )}
            </div>

            {successMessage && (
                <div className="p-4 rounded-lg bg-farma-green/10 border border-farma-green/20 text-farma-green text-sm font-semibold shadow-sm flex items-center gap-2">
                    <IconCheck />
                    {successMessage}
                </div>
            )}

            <div className="bg-farma-cream border border-farma-forest/10 rounded-xl p-8 shadow-sm relative overflow-hidden space-y-8">
                
                <div className={`absolute top-0 inset-x-0 h-1.5 ${batch.status === 'ACTIVE' ? 'bg-farma-green' : 'bg-farma-forest/20'}`}></div>

                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4 flex-wrap gap-y-2">
                            <h2 className="text-3xl sm:text-4xl font-bold text-farma-forest tracking-tight">
                                {batch.batchNumber}
                            </h2>
                            <span
                                className={`px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-widest border ${
                                    batch.status === 'ACTIVE'
                                        ? 'bg-farma-green/10 text-farma-green border-farma-green/20'
                                        : 'bg-white text-farma-forest/50 border-farma-forest/10 shadow-sm'
                                }`}
                            >
                                {batch.status}
                            </span>
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                            <div className="bg-white px-3 py-1.5 rounded-md border border-farma-forest/10 shadow-sm flex items-center gap-2">
                                <span className="text-farma-forest/40 font-bold uppercase tracking-widest text-[9px]">Housing Pen:</span>
                                <span className="text-farma-forest font-bold uppercase tracking-wider">{batch.sectionName}</span>
                            </div>
                            <div className="bg-white px-3 py-1.5 rounded-md border border-farma-forest/10 shadow-sm flex items-center gap-2">
                                <span className="text-farma-forest/40 font-bold uppercase tracking-widest text-[9px]">Type:</span>
                                <span className="text-farma-forest font-bold uppercase tracking-wider">{batch.animalCategory} ({batch.productionType})</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-6 bg-white p-5 rounded-xl border border-farma-forest/10 shadow-sm shrink-0">
                        <div>
                            <span className="text-farma-forest/40 block text-[10px] font-bold uppercase tracking-widest mb-1">
                                Batch ID
                            </span>
                            <span className="font-bold text-farma-forest text-lg tabular-nums">
                                #{batch.id}
                            </span>
                        </div>
                        <div className="h-10 w-px bg-farma-forest/10" />
                        <div>
                            <span className="text-farma-forest/40 block text-[10px] font-bold uppercase tracking-widest mb-1">
                                Started On
                            </span>
                            <span className="font-bold text-farma-forest text-lg tabular-nums">
                                {batch.startDate}
                            </span>
                        </div>
                    </div>
                </div>

                <div className={`grid grid-cols-2 gap-4 pt-4 border-t border-farma-forest/10 ${isEggBatch ? 'lg:grid-cols-5' : 'lg:grid-cols-4'}`}>
                    <div className="bg-white p-5 rounded-xl border border-farma-forest/5 shadow-sm">
                        <span className="text-farma-forest/50 text-[10px] font-bold uppercase tracking-widest block mb-1">
                            Current Live Birds
                        </span>
                        <div className="text-2xl font-bold text-farma-forest tabular-nums">
                            {batch.currentCount.toLocaleString()}
                        </div>
                    </div>

                    {isEggBatch && (
                        <div className="bg-white p-5 rounded-xl border border-farma-gold/30 shadow-sm">
                            <span className="text-farma-gold text-[10px] font-bold uppercase tracking-widest block mb-1">
                                Total Eggs Laid
                            </span>
                            <div className="text-2xl font-bold text-farma-forest tabular-nums">
                                {totalEggsCollected.toLocaleString()}
                            </div>
                        </div>
                    )}

                    <div className="bg-farma-terracotta/5 p-5 rounded-xl border border-farma-terracotta/10 shadow-sm">
                        <span className="text-farma-terracotta/70 text-[10px] font-bold uppercase tracking-widest block mb-1">
                            Total Mortality
                        </span>
                        <div className="text-2xl font-bold text-farma-terracotta tabular-nums">
                            {batch.mortalityCount.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-farma-forest/5 shadow-sm">
                        <span className="text-farma-forest/50 text-[10px] font-bold uppercase tracking-widest block mb-1">
                            Survival Rate
                        </span>
                        <div className="text-2xl font-bold text-farma-green tabular-nums">
                            {survivalRate}%
                        </div>
                    </div>
                    <div className="bg-white p-5 rounded-xl border border-farma-forest/5 shadow-sm">
                        <span className="text-farma-forest/50 text-[10px] font-bold uppercase tracking-widest block mb-1">
                            Total Feed Used
                        </span>
                        <div className="text-2xl font-bold text-farma-gold tabular-nums">
                            {totalFeedConsumed.toFixed(1)} <span className="text-xs font-semibold text-farma-forest/40 tracking-wider">Units</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 px-2">
                    <h3 className="text-xl font-bold text-farma-forest">
                        Daily Field Ledger
                    </h3>
                    <span className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest bg-white px-3 py-1.5 rounded-md border border-farma-forest/10 shadow-sm tabular-nums">
                        {logs.length} Recorded Entries
                    </span>
                </div>

                <div className="bg-white border border-farma-forest/10 rounded-xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-farma-forest min-w-[900px]">
                            <thead className="bg-farma-sand/50 border-b border-farma-forest/10 text-[10px] font-bold uppercase tracking-widest text-farma-forest/60">
                                <tr>
                                    <th className="px-6 py-4 whitespace-nowrap">Date</th>
                                    {isEggBatch && (
                                        <th className="px-6 py-4 whitespace-nowrap text-farma-gold">Eggs</th>
                                    )}
                                    <th className="px-6 py-4 whitespace-nowrap">Feed Used</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Meds Given</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Mortality</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Avg Weight</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Recorded By</th>
                                    <th className="px-6 py-4 whitespace-nowrap">Observations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-farma-forest/5 bg-transparent text-sm">
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-farma-cream transition-colors">
                                            <td className="px-6 py-4 font-bold text-farma-forest tabular-nums">
                                                {log.logDate}
                                            </td>
                                            {isEggBatch && (
                                                <td className="px-6 py-4 font-bold text-farma-forest tabular-nums">
                                                    {log.eggsCollected && log.eggsCollected > 0 ? log.eggsCollected : '-'}
                                                </td>
                                            )}
                                            <td className="px-6 py-4 font-bold text-farma-gold tabular-nums">
                                                {log.feedQuantityUsed ? `${log.feedQuantityUsed} units` : '-'}
                                            </td>
                                            <td className="px-6 py-4 font-medium text-farma-forest/80 tabular-nums">
                                                {log.medicineQuantityUsed ? `${log.medicineQuantityUsed} units` : '-'}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-farma-terracotta tabular-nums">
                                                {log.mortalityCount > 0 ? `${log.mortalityCount} birds` : '0'}
                                            </td>
                                            <td className="px-6 py-4 font-bold text-farma-forest tabular-nums">
                                                {log.averageWeight ? `${log.averageWeight} kg` : '-'}
                                            </td>
                                            <td className="px-6 py-4 text-farma-green font-semibold">
                                                {log.recordedByName}
                                            </td>
                                            <td className="px-6 py-4 text-farma-forest/60 font-medium max-w-xs truncate" title={log.observations || undefined}>
                                                {log.observations || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={isEggBatch ? 8 : 7} className="px-6 py-16 text-center bg-transparent">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <div className="w-14 h-14 rounded-full bg-farma-sand flex items-center justify-center text-farma-forest/30 shadow-inner border border-farma-forest/5">
                                                    <IconEmptyLedger />
                                                </div>
                                                <span className="text-farma-forest/60 font-semibold text-xs">
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

            {showLogModal && (
                <div className="fixed inset-0 bg-farma-forest/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-forest/10 rounded-xl max-w-lg w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
                        
                        <div className="h-1.5 w-full bg-farma-gold relative shrink-0"></div>

                        <div className="flex items-center justify-between border-b border-farma-forest/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest tracking-tight">Daily Field Log</h4>
                                <div className="mt-1.5 inline-flex items-center space-x-2 bg-farma-gold/10 px-2.5 py-1 rounded-md border border-farma-gold/20">
                                    <span className="text-[10px] font-bold text-farma-forest uppercase tracking-widest tabular-nums">
                                        Recording: {batch.batchNumber}
                                    </span>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowLogModal(false)}
                                className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer"
                            >
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/20 text-farma-terracotta text-xs font-semibold flex items-start space-x-3 shadow-sm">
                                    <IconWarning />
                                    <span className="leading-relaxed">{errorMessage}</span>
                                </div>
                            )}

                            <form id="daily-log-form" onSubmit={handleCreateDailyLog} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-1.5 pl-1">
                                        Log Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={logForm.logDate}
                                        onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })}
                                        className={`${inputClassesGold} tabular-nums cursor-pointer`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-1.5 pl-1">
                                            Feed Used (Units)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={logForm.feedQuantityUsed || ''}
                                            onChange={(e) => setLogForm({ ...logForm, feedQuantityUsed: Number(e.target.value) })}
                                            className={`${inputClassesGold} tabular-nums`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-terracotta mb-1.5 pl-1">
                                            Mortality (Lost) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            max={batch.currentCount}
                                            value={logForm.mortalityCount}
                                            onChange={(e) => setLogForm({ ...logForm, mortalityCount: Number(e.target.value) })}
                                            className={inputClassesRed}
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-1.5 pl-1">
                                            Meds Given (Units)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={logForm.medicineQuantityUsed || ''}
                                            onChange={(e) => setLogForm({ ...logForm, medicineQuantityUsed: Number(e.target.value) })}
                                            className={`${inputClassesGold} tabular-nums`}
                                        />
                                    </div>

                                    {!isEggBatch && (
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-1.5 pl-1">
                                                Avg Bird Wt (kg)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={logForm.averageWeight || ''}
                                                onChange={(e) => setLogForm({ ...logForm, averageWeight: Number(e.target.value) })}
                                                className={`${inputClassesGold} tabular-nums`}
                                            />
                                        </div>
                                    )}
                                </div>

                                {isEggBatch && (
                                    <div className="grid grid-cols-2 gap-5">
                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-gold mb-1.5 pl-1">
                                                Eggs Collected
                                            </label>
                                            <input
                                                type="number"
                                                min="0"
                                                value={logForm.eggsCollected || ''}
                                                onChange={(e) => setLogForm({ ...logForm, eggsCollected: Number(e.target.value) })}
                                                className={`${inputClassesGold} tabular-nums border-farma-gold/30 bg-farma-gold/5`}
                                                placeholder="Total Pieces"
                                            />
                                        </div>

                                        <div>
                                            <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-1.5 pl-1">
                                                Avg Bird Wt (kg)
                                            </label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={logForm.averageWeight || ''}
                                                onChange={(e) => setLogForm({ ...logForm, averageWeight: Number(e.target.value) })}
                                                className={`${inputClassesGold} tabular-nums`}
                                            />
                                        </div>
                                    </div>
                                )}

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/70 mb-1.5 pl-1">
                                        Observations / Notes
                                    </label>
                                    <textarea
                                        rows={3}
                                        maxLength={500}
                                        value={logForm.observations || ''}
                                        onChange={(e) => setLogForm({ ...logForm, observations: e.target.value })}
                                        placeholder="e.g. Normal feed intake today."
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm focus:outline-none focus:ring-2 focus:border-farma-gold focus:ring-farma-gold/30 transition-shadow shadow-sm resize-none"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-5 bg-farma-sand/50 border-t border-farma-forest/10 shrink-0 flex items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowLogModal(false)}
                                className="px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/70 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="daily-log-form"
                                disabled={submitting}
                                className="px-6 py-3 rounded-lg bg-farma-gold hover:bg-farma-gold-hover text-farma-forest font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : 'Save Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showHarvestModal && (
                <div className="fixed inset-0 bg-farma-forest/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-farma-cream border border-farma-green/40 rounded-xl max-w-md w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
                        
                        <div className="h-1.5 w-full bg-farma-green relative shrink-0 shadow-sm"></div>

                        <div className="flex items-center justify-between border-b border-farma-forest/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-xl font-bold text-farma-forest tracking-tight">Record Bird Sale / Cull</h4>
                                <p className="text-[10px] font-bold text-farma-forest/50 uppercase tracking-widest mt-1.5">
                                    Current Pen Balance: <strong className="text-farma-green tabular-nums">{batch.currentCount} birds</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowHarvestModal(false)}
                                className="text-farma-forest/40 hover:text-farma-terracotta hover:bg-farma-terracotta/10 bg-farma-forest/5 transition-colors p-2 rounded-lg cursor-pointer"
                            >
                                <IconClose />
                            </button>
                        </div>

                        <div className="p-6 sm:p-8 overflow-y-auto flex-1 custom-scrollbar">
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-lg bg-farma-terracotta/10 border border-farma-terracotta/20 text-farma-terracotta text-xs font-semibold flex items-start space-x-3 shadow-sm">
                                    <IconWarning />
                                    <span className="leading-relaxed">{errorMessage}</span>
                                </div>
                            )}

                            <form id="harvest-form" onSubmit={handleHarvestSubmit} className="space-y-6">
                                
                                <div className={`border rounded-xl p-5 flex items-center justify-between shadow-sm cursor-pointer transition-colors duration-300 ${harvestForm.isFinalHarvest ? 'bg-farma-green/5 border-farma-green/30' : 'bg-white border-farma-forest/10 hover:border-farma-green/40'}`} onClick={() => setHarvestForm(prev => ({ ...prev, isFinalHarvest: !prev.isFinalHarvest }))}>
                                    <div>
                                        <span className={`block text-sm font-bold transition-colors ${harvestForm.isFinalHarvest ? 'text-farma-green' : 'text-farma-forest'}`}>Final Batch Harvest?</span>
                                        <span className="block text-[10px] text-farma-forest/60 mt-1 font-semibold">
                                            {harvestForm.isFinalHarvest 
                                                ? 'Yes. This clears the pen (e.g. spent hens).' 
                                                : 'No. Just recording a partial bird sale.'}
                                        </span>
                                    </div>
                                    <div className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-300 ease-in-out focus:outline-none ${harvestForm.isFinalHarvest ? 'bg-farma-green' : 'bg-farma-forest/20'}`}>
                                        <span className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-300 ease-in-out ${harvestForm.isFinalHarvest ? 'translate-x-5' : 'translate-x-0'}`} />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">
                                        Date of Sale *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={harvestForm.saleDate}
                                        onChange={(e) => setHarvestForm({ ...harvestForm, saleDate: e.target.value })}
                                        className={`${inputClassesGreen} tabular-nums cursor-pointer`}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">
                                            Birds Sold *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            max={batch.currentCount}
                                            value={harvestForm.birdsSold || ''}
                                            onChange={(e) => setHarvestForm({ ...harvestForm, birdsSold: Number(e.target.value) })}
                                            className={`${inputClassesGreen} tabular-nums`}
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">
                                            Revenue (₦) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            value={harvestForm.saleRevenue || ''}
                                            onChange={(e) => setHarvestForm({ ...harvestForm, saleRevenue: Number(e.target.value) })}
                                            className={`${inputClassesGreen} tabular-nums`}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-[10px] font-bold uppercase tracking-widest text-farma-forest/60 mb-1.5 pl-1">
                                        Invoice Notes (Optional)
                                    </label>
                                    <textarea
                                        rows={2}
                                        value={harvestForm.notes}
                                        onChange={(e) => setHarvestForm({ ...harvestForm, notes: e.target.value })}
                                        placeholder="e.g. Sold spent hens to local vendor."
                                        className="w-full px-4 py-3 rounded-lg bg-white border border-farma-forest/20 text-farma-forest text-sm focus:outline-none focus:ring-2 focus:border-farma-green focus:ring-farma-green/30 transition-shadow shadow-sm resize-none"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-5 bg-farma-sand/50 border-t border-farma-forest/10 shrink-0 flex items-center justify-end gap-3 z-10">
                            <button
                                type="button"
                                onClick={() => setShowHarvestModal(false)}
                                className="px-5 py-3 rounded-lg bg-transparent hover:bg-farma-forest/5 text-farma-forest/70 font-bold text-xs uppercase tracking-wider transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="harvest-form"
                                disabled={submitting}
                                className={`px-6 py-3 rounded-lg text-white font-bold text-xs uppercase tracking-wider shadow-sm transition-colors flex items-center justify-center cursor-pointer disabled:opacity-50 ${harvestForm.isFinalHarvest ? 'bg-farma-terracotta hover:bg-[#c65e43]' : 'bg-farma-forest hover:bg-farma-green-light'}`}
                            >
                                {submitting ? 'Processing...' : harvestForm.isFinalHarvest ? 'Close Batch' : 'Record Bird Sale'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// ==========================================
// Reusable SVG Components
// ==========================================

const IconBack = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const IconPen = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const IconHarvest = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
);

const IconCheck = () => (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
);

const IconErrorLarge = () => (
    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);

const IconEmptyLedger = () => (
    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
);

const IconClose = () => (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const IconWarning = () => (
    <svg className="w-4 h-4 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
);