import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { batchService } from '../../services/batchService';
import { dailyLogService } from '../../services/dailyLogService';
import type { BatchResponseDto, BatchCloseRequestDto } from '../../types/batch';
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

    // Modals
    const [showLogModal, setShowLogModal] = useState<boolean>(false);
    const [showCloseModal, setShowCloseModal] = useState<boolean>(false);

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

    // Batch Closure Form State
    const [closeForm, setCloseForm] = useState<BatchCloseRequestDto>(() => ({
        actualEndDate: new Date().toISOString().split('T')[0],
        totalBirdsSold: 0,
        totalSaleRevenue: 0,
        harvestNotes: '',
    }));

    const loadData = async () => {
        try {
            const [batchData, logData] = await Promise.all([
                batchService.getBatchById(batchId),
                dailyLogService.getLogsForBatch(batchId).catch(() => []),
            ]);
            setBatch(batchData);
            setLogs(logData);
            setCloseForm((prev) => ({
                ...prev,
                totalBirdsSold: batchData.currentCount,
                totalSaleRevenue: batchData.currentCount * 2500,
            }));
        } catch {
            // Fallback
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
                    setCloseForm((prev) => ({
                        ...prev,
                        totalBirdsSold: batchData.currentCount,
                        totalSaleRevenue: batchData.currentCount * 2500,
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
            administrationMethod: logForm.administrationMethod?.trim() || undefined,
            averageWeight: logForm.averageWeight ? Number(logForm.averageWeight) : undefined,
            observations: logForm.observations?.trim() || undefined,
        };

        try {
            await dailyLogService.createDailyLog(payload);
            setShowLogModal(false);
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
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || 'Failed to submit daily telemetry log.');
            } else {
                setErrorMessage('An unexpected error occurred.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    const handleCloseBatch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!batch) return;

        setSubmitting(true);
        setErrorMessage(null);

        try {
            await batchService.closeBatch(batch.id, {
                actualEndDate: closeForm.actualEndDate,
                totalBirdsSold: Number(closeForm.totalBirdsSold),
                totalSaleRevenue: Number(closeForm.totalSaleRevenue),
                harvestNotes: closeForm.harvestNotes?.trim(),
            });
            setShowCloseModal(false);
            await loadData();
        } catch (err: unknown) {
            if (axios.isAxiosError(err)) {
                setErrorMessage(err.response?.data?.message || 'Failed to finalize harvest.');
            }
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-white p-12 rounded-2xl text-center text-xs font-mono text-slate-400">
                Loading operational batch dossier...
            </div>
        );
    }

    if (!batch) {
        return (
            <div className="bg-white p-12 rounded-2xl text-center text-xs font-mono text-slate-500 space-y-3">
                <p>Batch record not found.</p>
                <button
                    type="button"
                    onClick={onBack}
                    className="text-xs font-bold text-slate-700 underline cursor-pointer"
                >
                    ← Go Back
                </button>
            </div>
        );
    }

    const survivalRate = batch.initialCount > 0
        ? (((batch.initialCount - batch.mortalityCount) / batch.initialCount) * 100).toFixed(1)
        : '100';

    const totalFeedConsumed = logs.reduce((acc, curr) => acc + (curr.feedQuantityUsed || 0), 0);

    return (
        <div className="space-y-6">
            {/* Top Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <button
                    type="button"
                    onClick={onBack}
                    className="text-xs font-bold text-slate-500 hover:text-slate-900 flex items-center space-x-1 cursor-pointer"
                >
                    <span>← Back to Command Center</span>
                </button>

                {batch.status === 'ACTIVE' && (
                    <div className="flex items-center space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowLogModal(true)}
                            className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer"
                        >
                            📝 Record Daily Telemetry
                        </button>
                        <button
                            type="button"
                            onClick={() => setShowCloseModal(true)}
                            className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs uppercase tracking-wider shadow-xs cursor-pointer"
                        >
                            🌾 Harvest & Finalize Cycle
                        </button>
                    </div>
                )}
            </div>

            {/* Hero Batch Banner */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center space-x-3">
                            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                                {batch.batchNumber}
                            </h2>
                            <span
                                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold ${batch.status === 'ACTIVE'
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                                    }`}
                            >
                                {batch.status}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500 font-mono mt-1">
                            Housing Pen: <span className="font-bold text-slate-800">{batch.sectionName}</span> • Category: {batch.animalCategory} ({batch.productionType})
                        </p>
                    </div>

                    <div className="flex items-center space-x-4 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs font-mono">
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Batch ID</span>
                            <span className="font-bold text-slate-900">#{batch.id}</span>
                        </div>
                        <div className="h-6 w-px bg-slate-200" />
                        <div>
                            <span className="text-slate-400 block text-[10px] uppercase">Placement Date</span>
                            <span className="font-bold text-slate-800">{batch.startDate}</span>
                        </div>
                    </div>
                </div>

                {/* Live Metrics */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4 border-t border-slate-100">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            Current Population
                        </span>
                        <div className="text-xl font-extrabold text-slate-900 mt-1">
                            {batch.currentCount.toLocaleString()} Heads
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            Cumulative Mortality
                        </span>
                        <div className="text-xl font-extrabold text-rose-600 mt-1">
                            {batch.mortalityCount.toLocaleString()} Casualties
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            Flock Survival Index
                        </span>
                        <div className="text-xl font-extrabold text-emerald-600 mt-1">
                            {survivalRate}%
                        </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <span className="text-[10px] font-mono font-bold text-slate-400 uppercase">
                            Total Feed Consumed
                        </span>
                        <div className="text-xl font-extrabold text-[#C2410C] mt-1">
                            {totalFeedConsumed.toFixed(1)} Bags/kg
                        </div>
                    </div>
                </div>
            </div>

            {/* Daily Telemetry Timeline Ledger */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">Daily Telemetry & Growth Log</h3>
                    <span className="text-xs font-mono text-slate-400">{logs.length} Log Entries</span>
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs font-sans text-slate-700">
                        <thead className="bg-slate-50 text-slate-500 font-mono uppercase text-[10px] tracking-wider border-b border-slate-200">
                            <tr>
                                <th className="px-5 py-3.5">Log Date</th>
                                <th className="px-5 py-3.5">Feed Used</th>
                                <th className="px-5 py-3.5">Meds Administered</th>
                                <th className="px-5 py-3.5">Casualties</th>
                                <th className="px-5 py-3.5">Avg Weight (kg)</th>
                                <th className="px-5 py-3.5">Audited By</th>
                                <th className="px-5 py-3.5">Observations</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 font-mono">
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                                        <td className="px-5 py-4 font-bold text-slate-900">{log.logDate}</td>
                                        <td className="px-5 py-4 font-bold text-[#C2410C]">
                                            {log.feedQuantityUsed ? `${log.feedQuantityUsed} units` : '-'}
                                        </td>
                                        <td className="px-5 py-4 text-slate-700">
                                            {log.medicineQuantityUsed ? `${log.medicineQuantityUsed} units` : '-'}
                                        </td>
                                        <td className="px-5 py-4 font-bold text-rose-600">
                                            {log.mortalityCount > 0 ? `${log.mortalityCount} 💀` : '0'}
                                        </td>
                                        <td className="px-5 py-4 font-bold text-slate-900">
                                            {log.averageWeight ? `${log.averageWeight} kg` : '-'}
                                        </td>
                                        <td className="px-5 py-4 text-emerald-700 font-bold">{log.recordedByName}</td>
                                        <td className="px-5 py-4 text-slate-500 max-w-xs truncate">
                                            {log.observations || '-'}
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                                        No telemetry records logged for this batch cycle yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Record Telemetry Modal */}
            {showLogModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <div>
                                <h4 className="text-base font-bold text-slate-900">Record Daily Telemetry Log</h4>
                                <p className="text-xs text-slate-500">Batch: {batch.batchNumber}</p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowLogModal(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold text-sm cursor-pointer"
                            >
                                ✕
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                                🚨 {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handleCreateDailyLog} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Log Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={logForm.logDate}
                                    onChange={(e) => setLogForm({ ...logForm, logDate: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Feed Quantity Used (Units)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={logForm.feedQuantityUsed || ''}
                                        onChange={(e) => setLogForm({ ...logForm, feedQuantityUsed: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Casualties / Mortality *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max={batch.currentCount}
                                        value={logForm.mortalityCount}
                                        onChange={(e) => setLogForm({ ...logForm, mortalityCount: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-rose-500 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Medicine Quantity Used
                                    </label>
                                    <input
                                        type="number"
                                        step="0.1"
                                        min="0"
                                        value={logForm.medicineQuantityUsed || ''}
                                        onChange={(e) => setLogForm({ ...logForm, medicineQuantityUsed: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Avg Body Weight (kg)
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={logForm.averageWeight || ''}
                                        onChange={(e) => setLogForm({ ...logForm, averageWeight: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Observations / Biosecurity Notes
                                </label>
                                <textarea
                                    rows={2}
                                    maxLength={500}
                                    value={logForm.observations || ''}
                                    onChange={(e) => setLogForm({ ...logForm, observations: e.target.value })}
                                    placeholder="e.g. Normal feed intake. Vaccinated against Newcastle disease."
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white"
                                />
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowLogModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold cursor-pointer"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold uppercase tracking-wider cursor-pointer disabled:opacity-50"
                                >
                                    {submitting ? 'Submitting...' : 'Save Telemetry Log'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Harvest Modal */}
            {showCloseModal && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
                    <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                            <h4 className="text-base font-bold text-slate-900">Harvest & Close Batch</h4>
                            <button
                                type="button"
                                onClick={() => setShowCloseModal(false)}
                                className="text-slate-400 hover:text-slate-600 font-bold"
                            >
                                ✕
                            </button>
                        </div>

                        {errorMessage && (
                            <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-mono">
                                🚨 {errorMessage}
                            </div>
                        )}

                        <form onSubmit={handleCloseBatch} className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 mb-1">
                                    Actual Harvest End Date *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={closeForm.actualEndDate}
                                    onChange={(e) => setCloseForm({ ...closeForm, actualEndDate: e.target.value })}
                                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Total Sold *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={0}
                                        value={closeForm.totalBirdsSold}
                                        onChange={(e) => setCloseForm({ ...closeForm, totalBirdsSold: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-slate-700 mb-1">
                                        Total Revenue (₦) *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min={1}
                                        value={closeForm.totalSaleRevenue}
                                        onChange={(e) => setCloseForm({ ...closeForm, totalSaleRevenue: Number(e.target.value) })}
                                        className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-900 text-xs font-mono"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center justify-end space-x-3 pt-2 border-t border-slate-100">
                                <button
                                    type="button"
                                    onClick={() => setShowCloseModal(false)}
                                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold uppercase disabled:opacity-50"
                                >
                                    {submitting ? 'Finalizing...' : 'Finalize Harvest'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};