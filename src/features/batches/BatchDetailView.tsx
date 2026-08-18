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

    // Modals
    const [showLogModal, setShowLogModal] = useState<boolean>(false);
    const [showHarvestModal, setShowHarvestModal] = useState<boolean>(false);

    // Daily Log Form State
    const [logForm, setLogForm] = useState<Omit<DailyLogRequestDto, 'batchId'>>({
        logDate: new Date().toISOString().split('T')[0],
        feedQuantityUsed: 0,
        medicineQuantityUsed: 0,
        administrationMethod: '',
        mortalityCount: 0,
        averageWeight: 0,
        observations: '',
    });

    // Dynamic Harvest Form State (Handles both Partial & Final)
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
            
            // Auto-populate harvest form with remaining birds
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
            // STRICT TYPING FIX: Use explicit ternary operator instead of optional chaining for strings
            administrationMethod: logForm.administrationMethod ? logForm.administrationMethod.trim() : undefined,
            averageWeight: logForm.averageWeight ? Number(logForm.averageWeight) : undefined,
            // STRICT TYPING FIX: Use explicit ternary operator instead of optional chaining for strings
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
                // Route 1: Close the Batch completely
                await batchService.closeBatch(batch.id, {
                    actualEndDate: harvestForm.saleDate,
                    totalBirdsSold: Number(harvestForm.birdsSold),
                    totalSaleRevenue: Number(harvestForm.saleRevenue),
                    // STRICT TYPING FIX: Use explicit ternary
                    harvestNotes: harvestForm.notes ? harvestForm.notes.trim() : undefined,
                });
                setSuccessMessage("Batch officially closed and harvest finalized!");
            } else {
                // Route 2: Partial Sale (Keeps batch active)
                await batchService.recordPartialSale(batch.id, {
                    saleDate: harvestForm.saleDate,
                    birdsSold: Number(harvestForm.birdsSold),
                    saleRevenue: Number(harvestForm.saleRevenue),
                    // STRICT TYPING FIX: Use explicit ternary
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

    if (loading) {
        return (
            <div className="bg-[#FBF9F5] border border-[#101B14]/10 p-24 rounded-xl text-center flex flex-col items-center justify-center shadow-xs">
                <div className="w-12 h-12 border-4 border-[#3F6B47]/20 border-t-[#3F6B47] rounded-full animate-spin mb-6"></div>
                <span className="text-[#101B14]/60 text-sm font-bold uppercase tracking-widest font-mono">
                    Loading flock details...
                </span>
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="bg-[#FBF9F5] border border-[#E76F51]/20 rounded-xl p-16 text-center shadow-xs flex flex-col items-center max-w-2xl mx-auto mt-12">
                <div className="w-20 h-20 rounded-full bg-[#E76F51]/10 text-[#E76F51] flex items-center justify-center mb-6">
                    <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                </div>
                <h3 className="text-2xl font-extrabold text-[#101B14] mb-3 font-['Fraunces',serif]">Flock Not Found</h3>
                <p className="text-[#101B14]/60 mb-8 text-sm font-medium">This flock batch record could not be found.</p>
                <button
                    type="button"
                    onClick={onBack}
                    className="px-6 py-3 bg-[#3F6B47] text-white rounded-lg font-bold text-xs uppercase tracking-wider shadow-sm hover:bg-[#2d4f34] transition-colors cursor-pointer"
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

    return (
        <div className="space-y-6 lg:space-y-8 font-sans max-w-7xl mx-auto pb-16">
            
            {/* Top Navigation & Action Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b-2 border-[#101B14]/10 pb-5">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-xs font-bold text-[#101B14]/70 hover:text-[#101B14] flex items-center space-x-2 cursor-pointer transition-colors w-fit"
                >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    <span>Back to Previous View</span>
                </button>

                {batch.status === 'ACTIVE' && (
                    <div className="flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowLogModal(true)}
                            className="px-5 py-3 rounded-lg bg-[#D9A63E] hover:bg-[#c99834] text-[#101B14] font-extrabold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            <span>Record Daily Log</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setHarvestForm(prev => ({ ...prev, birdsSold: batch.currentCount, isFinalHarvest: false }));
                                setShowHarvestModal(true);
                            }}
                            className="px-5 py-3 rounded-lg bg-[#101B14] hover:bg-[#3F6B47] text-white font-bold text-xs uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            <span>Record Sale / Harvest</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Success Feedback Alert */}
            {successMessage && (
                <div className="p-4 rounded-xl bg-[#2A5C38]/10 border border-[#2A5C38]/30 text-[#2A5C38] text-xs font-bold shadow-sm flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    {successMessage}
                </div>
            )}

            {/* Hero Batch Banner */}
            <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl p-6 sm:p-8 shadow-xs relative overflow-hidden space-y-6">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-5 mt-1">
                    <div>
                        <div className="flex items-center space-x-3 flex-wrap gap-y-2">
                            <h2 className="text-2xl sm:text-3xl font-extrabold text-[#101B14] tracking-tight font-['Fraunces',serif]">
                                {batch.batchNumber}
                            </h2>
                            <span
                                className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-widest ${batch.status === 'ACTIVE'
                                        ? 'bg-[#3F6B47]/10 text-[#3F6B47] border border-[#3F6B47]/25'
                                        : 'bg-[#101B14]/5 text-[#101B14]/60 border border-[#101B14]/10'
                                    }`}
                            >
                                {batch.status}
                            </span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#101B14]/70 font-mono mt-3 flex items-center gap-2">
                            <span>Housing Pen: <strong className="text-[#101B14]">{batch.sectionName}</strong></span>
                            <span className="text-[#101B14]/30 mx-1">•</span>
                            <span>Type: <strong className="text-[#101B14]">{batch.animalCategory} ({batch.productionType})</strong></span>
                        </p>
                    </div>

                    <div className="flex items-center space-x-4 bg-white p-4 rounded-lg border border-[#101B14]/10 text-xs font-mono shadow-xs">
                        <div>
                            <span className="text-[#101B14]/50 block text-[9px] uppercase tracking-wider font-bold mb-1">Batch ID</span>
                            <span className="font-extrabold text-[#101B14] text-sm">#{batch.id}</span>
                        </div>
                        <div className="h-8 w-px bg-[#101B14]/10" />
                        <div>
                            <span className="text-[#101B14]/50 block text-[9px] uppercase tracking-wider font-bold mb-1">Started On</span>
                            <span className="font-extrabold text-[#101B14] text-sm">{batch.startDate}</span>
                        </div>
                    </div>
                </div>

                {/* Live Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-[#101B14]/10">
                    <div className="bg-white p-4 rounded-lg border border-[#101B14]/10 shadow-xs">
                        <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-wider block mb-1">
                            Current Live Birds
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#101B14] font-mono">
                            {batch.currentCount.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-[#101B14]/10 shadow-xs">
                        <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-wider block mb-1">
                            Total Mortality
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#E76F51] font-mono">
                            {batch.mortalityCount.toLocaleString()}
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-[#101B14]/10 shadow-xs">
                        <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-wider block mb-1">
                            Survival Rate
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#3F6B47] font-mono">
                            {survivalRate}%
                        </div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-[#101B14]/10 shadow-xs">
                        <span className="text-[10px] font-mono font-bold text-[#101B14]/60 uppercase tracking-wider block mb-1">
                            Total Feed Used
                        </span>
                        <div className="text-xl sm:text-2xl font-extrabold text-[#D9A63E] font-mono">
                            {totalFeedConsumed.toFixed(1)} <span className="text-xs font-sans font-normal text-[#101B14]/60">Units</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Log Ledger Table */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h3 className="text-xl font-bold text-[#101B14] font-['Fraunces',serif]">Daily Farm Log</h3>
                    <span className="text-xs font-mono font-bold text-[#101B14]/60">
                        {logs.length} Recorded Entries
                    </span>
                </div>

                <div className="bg-[#FBF9F5] border border-[#101B14]/10 rounded-xl overflow-hidden shadow-xs">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-[#101B14] min-w-[900px]">
                            {/* Darker Cream Header */}
                            <thead className="bg-[#DFD8C4] border-b-2 border-[#101B14]/15 text-[10px] font-extrabold uppercase tracking-widest text-[#101B14]/80 shadow-xs">
                                <tr>
                                    <th className="px-6 py-5 whitespace-nowrap">Date</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Feed Used</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Meds Given</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Mortality</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Avg Weight</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Recorded By</th>
                                    <th className="px-6 py-5 whitespace-nowrap">Observations</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#101B14]/10 bg-[#FBF9F5] font-mono text-xs">
                                {logs.length > 0 ? (
                                    logs.map((log) => (
                                        <tr key={log.id} className="group hover:bg-[#ECE6D6] hover:border-l-4 hover:border-l-[#3F6B47] transition-all">
                                            <td className="px-6 py-5 font-bold text-[#101B14]">
                                                {log.logDate}
                                            </td>
                                            <td className="px-6 py-5 font-bold text-[#D9A63E]">
                                                {log.feedQuantityUsed ? `${log.feedQuantityUsed} units` : '-'}
                                            </td>
                                            <td className="px-6 py-5 font-medium text-[#101B14]/80">
                                                {log.medicineQuantityUsed ? `${log.medicineQuantityUsed} units` : '-'}
                                            </td>
                                            <td className="px-6 py-5 font-bold text-[#E76F51]">
                                                {log.mortalityCount > 0 ? `${log.mortalityCount} birds` : '0'}
                                            </td>
                                            <td className="px-6 py-5 font-bold text-[#101B14]">
                                                {log.averageWeight ? `${log.averageWeight} kg` : '-'}
                                            </td>
                                            <td className="px-6 py-5 text-[#3F6B47] font-bold">
                                                {log.recordedByName}
                                            </td>
                                            <td className="px-6 py-5 text-[#101B14]/60 font-sans max-w-xs truncate" title={log.observations}>
                                                {log.observations || '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-16 text-center bg-[#FBF9F5]">
                                            <div className="flex flex-col items-center justify-center space-y-3">
                                                <svg className="w-10 h-10 text-[#101B14]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                </svg>
                                                <span className="text-[#101B14]/60 font-bold text-sm font-sans">
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

            {/* Record Daily Log Modal */}
            {showLogModal && (
                <div className="fixed inset-0 bg-[#101B14]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-[#FBF9F5] border border-[#D9A63E]/40 rounded-xl max-w-lg w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
                        
                        <div className="h-2 w-full bg-[#D9A63E] relative shrink-0 shadow-sm"></div>

                        <div className="flex items-center justify-between border-b border-[#101B14]/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight">Daily Farm Log</h4>
                                <p className="text-[10px] font-mono font-bold text-[#3F6B47] uppercase tracking-widest mt-1.5">
                                    Recording data for: {batch.batchNumber}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowLogModal(false)}
                                className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 transition-all p-2 rounded-full cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-lg bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-sm font-bold flex items-start space-x-3 shadow-sm">
                                    <span className="leading-relaxed">{errorMessage}</span>
                                </div>
                            )}

                            <form id="daily-log-form" onSubmit={handleCreateDailyLog} className="space-y-6">
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                        Log Date *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={logForm.logDate}
                                        onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })}
                                        className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                            Feed Used (Units)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={logForm.feedQuantityUsed || ''}
                                            onChange={(e) => setLogForm({ ...logForm, feedQuantityUsed: Number(e.target.value) })}
                                            className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                            Mortality (Lost Birds) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            max={batch.currentCount}
                                            value={logForm.mortalityCount}
                                            onChange={(e) => setLogForm({ ...logForm, mortalityCount: Number(e.target.value) })}
                                            className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#E76F51] text-sm font-bold focus:outline-none focus:border-[#E76F51] focus:ring-2 focus:ring-[#E76F51]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                            Meds Given (Units)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.1"
                                            min="0"
                                            value={logForm.medicineQuantityUsed || ''}
                                            onChange={(e) => setLogForm({ ...logForm, medicineQuantityUsed: Number(e.target.value) })}
                                            className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                            Avg Bird Weight (kg)
                                        </label>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0"
                                            value={logForm.averageWeight || ''}
                                            onChange={(e) => setLogForm({ ...logForm, averageWeight: Number(e.target.value) })}
                                            className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm font-mono"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                        Observations / Notes
                                    </label>
                                    <textarea
                                        rows={3}
                                        maxLength={500}
                                        value={logForm.observations || ''}
                                        onChange={(e) => setLogForm({ ...logForm, observations: e.target.value })}
                                        placeholder="e.g. Normal feed intake today. Weather was hot."
                                        className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-medium focus:outline-none focus:border-[#D9A63E] focus:ring-2 focus:ring-[#D9A63E]/50 transition-all shadow-sm"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 bg-[#ECE6D6] border-t border-[#101B14]/10 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-4 z-10">
                            <button
                                type="button"
                                onClick={() => setShowLogModal(false)}
                                className="w-full sm:w-auto px-6 py-4 rounded-lg bg-transparent hover:bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#101B14] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="daily-log-form"
                                disabled={submitting}
                                className="w-full sm:w-auto px-8 py-4 rounded-lg bg-[#D9A63E] hover:bg-[#c99834] text-[#101B14] font-extrabold text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
                            >
                                {submitting ? 'Saving...' : 'Save Daily Data'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Harvest / Sale Modal */}
            {showHarvestModal && (
                <div className="fixed inset-0 bg-[#101B14]/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 transition-all duration-300">
                    <div className="bg-[#FBF9F5] border border-[#3F6B47]/40 rounded-xl max-w-md w-full shadow-2xl flex flex-col max-h-[95vh] relative overflow-hidden">
                        
                        <div className="h-2 w-full bg-[#3F6B47] relative shrink-0 shadow-sm"></div>

                        <div className="flex items-center justify-between border-b border-[#101B14]/10 p-6 bg-white shrink-0">
                            <div>
                                <h4 className="text-2xl font-extrabold text-[#101B14] font-['Fraunces',serif] tracking-tight">Record Sale</h4>
                                <p className="text-[10px] font-mono font-bold text-[#101B14]/50 uppercase tracking-widest mt-1.5">
                                    Current Pen Balance: <strong className="text-[#3F6B47]">{batch.currentCount} birds</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowHarvestModal(false)}
                                className="text-[#101B14]/40 hover:text-[#E76F51] hover:bg-[#E76F51]/10 bg-[#101B14]/5 transition-all p-2 rounded-full cursor-pointer"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto flex-1 custom-scrollbar">
                            {errorMessage && (
                                <div className="mb-6 p-4 rounded-lg bg-[#E76F51]/10 border border-[#E76F51]/30 text-[#E76F51] text-sm font-bold flex items-start space-x-3 shadow-sm">
                                    <span className="leading-relaxed">{errorMessage}</span>
                                </div>
                            )}

                            <form id="harvest-form" onSubmit={handleHarvestSubmit} className="space-y-6">
                                
                                {/* Dynamic Toggle Switch */}
                                <div className="bg-white border border-[#101B14]/10 rounded-lg p-4 flex items-center justify-between shadow-sm cursor-pointer" onClick={() => setHarvestForm(prev => ({ ...prev, isFinalHarvest: !prev.isFinalHarvest }))}>
                                    <div>
                                        <span className="block text-sm font-extrabold text-[#101B14]">Final Batch Harvest?</span>
                                        <span className="block text-[10px] text-[#101B14]/60 mt-1 font-medium">
                                            {harvestForm.isFinalHarvest 
                                                ? 'Yes. This will clear the pen and unlock the facility.' 
                                                : 'No. Just recording a partial sale. Keep batch active.'}
                                        </span>
                                    </div>
                                    <div className={`w-12 h-6 rounded-full transition-colors relative flex items-center ${harvestForm.isFinalHarvest ? 'bg-[#3F6B47]' : 'bg-[#101B14]/20'}`}>
                                        <div className={`w-4 h-4 bg-white rounded-full shadow-md absolute transition-transform ${harvestForm.isFinalHarvest ? 'translate-x-7' : 'translate-x-1'}`}></div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                        Date of Sale *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={harvestForm.saleDate}
                                        onChange={(e) => setHarvestForm({ ...harvestForm, saleDate: e.target.value })}
                                        className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#3F6B47] focus:ring-2 focus:ring-[#3F6B47]/30 transition-all shadow-sm"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                            Birds Sold *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            max={batch.currentCount}
                                            value={harvestForm.birdsSold || ''}
                                            onChange={(e) => setHarvestForm({ ...harvestForm, birdsSold: Number(e.target.value) })}
                                            className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#3F6B47] focus:ring-2 focus:ring-[#3F6B47]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                            Revenue (₦) *
                                        </label>
                                        <input
                                            type="number"
                                            required
                                            min={1}
                                            value={harvestForm.saleRevenue || ''}
                                            onChange={(e) => setHarvestForm({ ...harvestForm, saleRevenue: Number(e.target.value) })}
                                            className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-bold focus:outline-none focus:border-[#3F6B47] focus:ring-2 focus:ring-[#3F6B47]/30 transition-all shadow-sm font-mono"
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <label className="block text-xs font-bold uppercase tracking-wider text-[#101B14]/70 mb-2">
                                        Invoice Notes (Optional)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={harvestForm.notes}
                                        onChange={(e) => setHarvestForm({ ...harvestForm, notes: e.target.value })}
                                        placeholder="e.g. Sold 500 birds to local vendor."
                                        className="w-full px-5 py-3.5 rounded-lg bg-white border border-[#101B14]/20 text-[#101B14] text-sm font-medium focus:outline-none focus:border-[#3F6B47] focus:ring-2 focus:ring-[#3F6B47]/30 transition-all shadow-sm"
                                    />
                                </div>
                            </form>
                        </div>

                        <div className="p-6 bg-[#ECE6D6] border-t border-[#101B14]/10 shrink-0 flex flex-col-reverse sm:flex-row sm:items-center justify-end gap-4 z-10">
                            <button
                                type="button"
                                onClick={() => setShowHarvestModal(false)}
                                className="w-full sm:w-auto px-6 py-4 rounded-lg bg-transparent hover:bg-[#101B14]/5 text-[#101B14]/60 hover:text-[#101B14] font-bold text-xs uppercase tracking-wider transition-all cursor-pointer text-center"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                form="harvest-form"
                                disabled={submitting}
                                className={`w-full sm:w-auto px-8 py-4 rounded-lg text-white font-extrabold text-sm uppercase tracking-wider shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50 ${harvestForm.isFinalHarvest ? 'bg-[#E76F51] hover:bg-[#c65e43]' : 'bg-[#101B14] hover:bg-[#3F6B47]'}`}
                            >
                                {submitting ? 'Processing...' : harvestForm.isFinalHarvest ? 'Close Batch' : 'Record Sale'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};